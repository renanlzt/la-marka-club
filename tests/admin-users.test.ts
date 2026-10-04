import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/db';
import {
  getAllAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from '../src/lib/auth';
import { nanoid } from 'nanoid';

describe('Admin Users Management', () => {
  let gestaoUserId: string;
  let testBalcaoUsername: string;

  beforeEach(async () => {
    // Garante um gestor inicial
    testBalcaoUsername = `balcao_${nanoid(6).toLowerCase()}`;
    const gestao = await createAdminUser({
      username: `gestao_${nanoid(6).toLowerCase()}`,
      password: 'password123',
      name: 'Gestor Teste',
      role: 'GESTAO',
    });
    gestaoUserId = gestao.id;
  });

  it('should list all admin users with their roles', async () => {
    const users = await getAllAdminUsers();
    expect(users.length).toBeGreaterThan(0);
    const found = users.find((u) => u.id === gestaoUserId);
    expect(found).toBeDefined();
    expect(found?.role).toBe('GESTAO');
    expect((found as any).password).toBeUndefined(); // Senha não deve ser exposta
  });

  it('should create a balcao user successfully and prevent duplicate username', async () => {
    const balcao = await createAdminUser({
      username: testBalcaoUsername,
      password: 'caixa1234',
      name: 'Atendente Caixa 1',
      role: 'BALCAO',
    });

    expect(balcao.id).toBeDefined();
    expect(balcao.username).toBe(testBalcaoUsername);
    expect(balcao.role).toBe('BALCAO');

    // Tentativa com mesmo username deve falhar
    await expect(
      createAdminUser({
        username: testBalcaoUsername,
        password: 'outrasenha',
        name: 'Outro',
        role: 'BALCAO',
      })
    ).rejects.toThrow('Este nome de usuário já está em uso.');
  });

  it('should update user name, role and password', async () => {
    const user = await createAdminUser({
      username: `user_${nanoid(6)}`,
      password: 'initial123',
      name: 'Nome Inicial',
      role: 'BALCAO',
    });

    const updated = await updateAdminUser(user.id, {
      name: 'Nome Atualizado',
      role: 'GESTAO',
      newPassword: 'newpassword99',
    });

    expect(updated.name).toBe('Nome Atualizado');
    expect(updated.role).toBe('GESTAO');
  });

  it('should prevent deleting oneself and deleting the last GESTAO user', async () => {
    // Auto-exclusão
    await expect(deleteAdminUser(gestaoUserId, gestaoUserId)).rejects.toThrow(
      'Você não pode excluir o seu próprio usuário conectado.'
    );

    // Cria usuário balcão e exclui com sucesso
    const balcao = await createAdminUser({
      username: `balcao_del_${nanoid(6)}`,
      password: 'balcao123',
      name: 'Balcão Provisório',
      role: 'BALCAO',
    });

    const deleted = await deleteAdminUser(balcao.id, gestaoUserId);
    expect(deleted.id).toBe(balcao.id);
  });
});
