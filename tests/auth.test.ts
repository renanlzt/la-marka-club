import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/db';
import {
  hashPassword,
  verifyPassword,
  ensureDefaultAdminUser,
  authenticateAdmin,
  changeAdminCredentials,
  createSessionToken,
  verifySessionToken,
} from '../src/lib/auth';

describe('Admin Authentication & Security', () => {
  beforeEach(async () => {
    await prisma.adminUser.deleteMany();
    await ensureDefaultAdminUser();
  });

  it('should ensure default admin user exists with username "admin" and password "admin"', async () => {
    const admin = await prisma.adminUser.findUnique({
      where: { username: 'admin' },
    });
    expect(admin).toBeDefined();
    expect(admin?.username).toBe('admin');
    expect(verifyPassword('admin', admin!.password)).toBe(true);
    expect(verifyPassword('wrongpassword', admin!.password)).toBe(false);
  });

  it('should authenticate admin with valid credentials and reject invalid ones', async () => {
    const user = await authenticateAdmin('admin', 'admin');
    expect(user).toBeDefined();
    expect(user?.username).toBe('admin');

    await expect(authenticateAdmin('admin', 'wrong')).rejects.toThrow(/incorreta/i);
    await expect(authenticateAdmin('nonexistent', 'admin')).rejects.toThrow(/não encontrado/i);
  });

  it('should allow changing admin credentials (username and/or password)', async () => {
    const initial = await authenticateAdmin('admin', 'admin');
    expect(initial).toBeDefined();

    // Rejeita senha atual incorreta
    await expect(
      changeAdminCredentials(initial.id, 'errada', 'novasenha123', 'novoadmin')
    ).rejects.toThrow(/atual incorreta/i);

    // Altera com sucesso
    await changeAdminCredentials(initial.id, 'admin', 'novasenha123', 'gerente');

    // Antigo não funciona mais
    await expect(authenticateAdmin('admin', 'admin')).rejects.toThrow();

    // Novo login funciona
    const updated = await authenticateAdmin('gerente', 'novasenha123');
    expect(updated.username).toBe('gerente');
  });

  it('should generate and verify signed session tokens', () => {
    const token = createSessionToken('usr-123', 'admin');
    const session = verifySessionToken(token);
    expect(session).toBeDefined();
    expect(session?.adminId).toBe('usr-123');
    expect(session?.username).toBe('admin');

    // Token adulterado
    const tampered = token.slice(0, -4) + 'abcd';
    expect(verifySessionToken(tampered)).toBeNull();
  });
});
