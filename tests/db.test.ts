import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../src/lib/db';

describe('Database Connection & Seed Models', () => {
  it('should find store default settings', async () => {
    const settings = await prisma.storeSetting.findUnique({
      where: { id: 'default' },
    });
    expect(settings).toBeDefined();
    expect(settings?.storeName).toBe('La Marka');
    expect(settings?.defaultCashbackPercentage).toBe(5.0);
    expect(settings?.defaultExpirationDays).toBe(45);
    expect(settings?.birthdayBonusAmount).toBe(30.0);
  });

  it('should have default message templates seeded', async () => {
    const templates = await prisma.messageTemplate.findMany();
    expect(templates.length).toBeGreaterThanOrEqual(4);
    const earnTemplate = templates.find((t) => t.id === 'EARN_PURCHASE');
    expect(earnTemplate).toBeDefined();
    expect(earnTemplate?.content).toContain('{primeiro_nome}');
  });
});
