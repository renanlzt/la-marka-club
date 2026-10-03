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
 * Garante a existência do usuário administrador padrão 'admin' / 'admin'
 */
export async function ensureDefaultAdminUser() {
  const count = await prisma.adminUser.count();
  if (count === 0) {
    const hashedPassword = hashPassword('admin');
    await prisma.adminUser.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: 'Administrador',
      },
    });
  }
}

/**
 * Autentica o usuário pelo nome de usuário e senha
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
 * Cria token de sessão assinado
 */
export function createSessionToken(adminId: string, username: string): string {
  const timestamp = Date.now().toString();
  const payload = `${adminId}:${username}:${timestamp}`;
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
): { adminId: string; username: string } | null {
  if (!token) return null;

  const parts = token.split(':');
  if (parts.length !== 4) return null;

  const [adminId, username, timestamp, signature] = parts;
  const payload = `${adminId}:${username}:${timestamp}`;

  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  return { adminId, username };
}
