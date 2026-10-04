import crypto from 'crypto';
import { prisma } from './db';

const SECRET_KEY =
  process.env.SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'la-marka-club-super-secret-key-2026';

/**
 * Cria hash de senha seguro usando scrypt com salt
 */
export function hashPassword(password: string, customSalt?: string): string {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifica se a senha fornecida confere com a hash armazenada
 */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;

  // Suporte a transição caso tenha sido salvo texto puro
  if (!stored.includes(':')) {
    return password === stored;
  }

  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;

  const derivedKey = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, 'hex');
  return crypto.timingSafeEqual(derivedKey, keyBuffer);
}

/**
 * Garante a existência dos usuários padrão de Gestão ('admin') e Balcão ('balcao')
 */
export async function ensureDefaultAdminUser() {
  const adminExists = await prisma.adminUser.findUnique({
    where: { username: 'admin' },
  });
  if (!adminExists) {
    await prisma.adminUser.create({
      data: {
        username: 'admin',
        password: hashPassword('admin'),
        name: 'Gestão La Marka',
        role: 'GESTAO',
      },
    });
  }

  const balcaoExists = await prisma.adminUser.findUnique({
    where: { username: 'balcao' },
  });
  if (!balcaoExists) {
    await prisma.adminUser.create({
      data: {
        username: 'balcao',
        password: hashPassword('balcao'),
        name: 'Atendimento Balcão',
        role: 'BALCAO',
      },
    });
  }
}

/**
 * Autentica o usuário pelo nome de usuário e senha, retornando perfil de acesso
 */
export async function authenticateAdmin(username: string, password: string) {
  const cleanUsername = username.trim();
  const user = await prisma.adminUser.findUnique({
    where: { username: cleanUsername },
  });

  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  if (!verifyPassword(password, user.password)) {
    throw new Error('Senha incorreta.');
  }

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role || 'GESTAO',
  };
}

/**
 * Altera as credenciais do administrador (usuário e/ou senha)
 */
export async function changeAdminCredentials(
  adminId: string,
  currentPassword: string,
  newPassword?: string,
  newUsername?: string
) {
  const user = await prisma.adminUser.findUnique({
    where: { id: adminId },
  });

  if (!user) {
    throw new Error('Administrador não encontrado.');
  }

  if (!verifyPassword(currentPassword, user.password)) {
    throw new Error('Senha atual incorreta.');
  }

  const dataToUpdate: any = {};

  if (newUsername && newUsername.trim()) {
    const cleanUsername = newUsername.trim();
    if (cleanUsername !== user.username) {
      const existing = await prisma.adminUser.findUnique({
        where: { username: cleanUsername },
      });
      if (existing) {
        throw new Error('Este nome de usuário já está em uso.');
      }
      dataToUpdate.username = cleanUsername;
    }
  }

  if (newPassword && newPassword.trim()) {
    if (newPassword.trim().length < 4) {
      throw new Error('A nova senha deve ter no mínimo 4 caracteres.');
    }
    dataToUpdate.password = hashPassword(newPassword.trim());
  }

  return await prisma.adminUser.update({
    where: { id: adminId },
    data: dataToUpdate,
  });
}

/**
 * Cria token de sessão assinado incluindo o perfil do usuário
 */
export function createSessionToken(
  adminId: string,
  username: string,
  role: string = 'GESTAO'
): string {
  const timestamp = Date.now().toString();
  const payload = `${adminId}:${username}:${role}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return `${payload}:${signature}`;
}

/**
 * Valida o token de sessão assinado
 */
export function verifySessionToken(
  token: string
): { adminId: string; username: string; role: string } | null {
  if (!token) return null;

  const parts = token.split(':');
  let adminId = '';
  let username = '';
  let role = 'GESTAO';
  let timestamp = '';
  let signature = '';
  let payload = '';

  if (parts.length === 5) {
    [adminId, username, role, timestamp, signature] = parts;
    payload = `${adminId}:${username}:${role}:${timestamp}`;
  } else if (parts.length === 4) {
    [adminId, username, timestamp, signature] = parts;
    payload = `${adminId}:${username}:${timestamp}`;
    role = 'GESTAO';
  } else {
    return null;
  }

  // Validação de expiração (7 dias)
  const createdAt = parseInt(timestamp, 10);
  if (isNaN(createdAt) || createdAt <= 0 || Date.now() - createdAt > 7 * 24 * 60 * 60 * 1000) {
    return null;
  }

  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  return { adminId, username, role };
}

/**
 * Retorna todos os usuários administrativos com seus papéis (sem expor senhas)
 */
export async function getAllAdminUsers() {
  return await prisma.adminUser.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [
      { role: 'asc' }, // GESTAO antes de BALCAO
      { name: 'asc' },
    ],
  });
}

/**
 * Cadastra um novo usuário de sistema (Gestão ou Balcão)
 */
export async function createAdminUser(data: {
  username: string;
  password: string;
  name?: string;
  role?: string;
}) {
  const cleanUsername = data.username.trim().toLowerCase();
  if (!cleanUsername) {
    throw new Error('O nome de usuário é obrigatório.');
  }

  if (!data.password || data.password.trim().length < 4) {
    throw new Error('A senha deve ter no mínimo 4 caracteres.');
  }

  const existing = await prisma.adminUser.findUnique({
    where: { username: cleanUsername },
  });
  if (existing) {
    throw new Error('Este nome de usuário já está em uso.');
  }

  const role = data.role === 'BALCAO' ? 'BALCAO' : 'GESTAO';

  return await prisma.adminUser.create({
    data: {
      username: cleanUsername,
      password: hashPassword(data.password.trim()),
      name: data.name?.trim() || cleanUsername,
      role,
    },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Atualiza dados de um usuário (nome, usuário, perfil, ou redefinição de senha)
 */
export async function updateAdminUser(
  id: string,
  data: {
    name?: string;
    username?: string;
    role?: string;
    newPassword?: string;
  }
) {
  const user = await prisma.adminUser.findUnique({
    where: { id },
  });
  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  const dataToUpdate: any = {};

  if (data.name !== undefined) {
    dataToUpdate.name = data.name.trim();
  }

  if (data.username !== undefined && data.username.trim()) {
    const cleanUsername = data.username.trim().toLowerCase();
    if (cleanUsername !== user.username) {
      const existing = await prisma.adminUser.findUnique({
        where: { username: cleanUsername },
      });
      if (existing && existing.id !== id) {
        throw new Error('Este nome de usuário já está em uso.');
      }
      dataToUpdate.username = cleanUsername;
    }
  }

  if (data.role !== undefined) {
    const newRole = data.role === 'BALCAO' ? 'BALCAO' : 'GESTAO';
    // Se estiver rebaixando de GESTAO para BALCAO, certificar que não é o único GESTAO
    if (user.role === 'GESTAO' && newRole === 'BALCAO') {
      const totalGestao = await prisma.adminUser.count({
        where: { role: 'GESTAO' },
      });
      if (totalGestao <= 1) {
        throw new Error('Não é possível alterar o perfil do único gestor do sistema.');
      }
    }
    dataToUpdate.role = newRole;
  }

  if (data.newPassword !== undefined && data.newPassword.trim()) {
    if (data.newPassword.trim().length < 4) {
      throw new Error('A nova senha deve ter no mínimo 4 caracteres.');
    }
    dataToUpdate.password = hashPassword(data.newPassword.trim());
  }

  return await prisma.adminUser.update({
    where: { id },
    data: dataToUpdate,
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Exclui um usuário do sistema (com proteção de segurança)
 */
export async function deleteAdminUser(id: string, currentAdminId?: string) {
  if (currentAdminId && id === currentAdminId) {
    throw new Error('Você não pode excluir o seu próprio usuário conectado.');
  }

  const user = await prisma.adminUser.findUnique({
    where: { id },
  });
  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  if (user.role === 'GESTAO') {
    const totalGestao = await prisma.adminUser.count({
      where: { role: 'GESTAO' },
    });
    if (totalGestao <= 1) {
      throw new Error('Não é possível excluir o único gestor do sistema.');
    }
  }

  return await prisma.adminUser.delete({
    where: { id },
  });
}

