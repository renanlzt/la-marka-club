import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/lib/db';
import {
  calculateCustomerVipTier,
  getActiveVipTierConfig,
  saveActiveVipTierConfig,
} from '../src/lib/vip-tier-service';

describe('Níveis VIP Configuráveis e Percentuais Fracionários (< 1%)', () => {
  beforeEach(async () => {
    await prisma.storeSetting.upsert({
      where: { id: 'default' },
      update: { defaultCashbackPercentage: 1.0 },
      create: {
        id: 'default',
        defaultCashbackPercentage: 1.0,
      },
    });

    await prisma.messageTemplate.deleteMany({
      where: { id: 'VIP_TIER_CONFIG' },
    });
  });

  it('deve carregar os padrões quando nenhuma configuração customizada existir', async () => {
    const config = await getActiveVipTierConfig();
    expect(config.silverPercentage).toBe(1.0);
    expect(config.goldMinSpent).toBe(500);
    expect(config.goldPercentage).toBe(1.5);
    expect(config.diamondMinSpent).toBe(1500);
    expect(config.diamondPercentage).toBe(2.0);
  });

  it('deve permitir configurar e salvar percentuais menores que 1% (ex: 0.5%, 0.05%, 0.01%)', async () => {
    const saved = await saveActiveVipTierConfig({
      silverPercentage: 0.05, // 0,05%
      goldMinSpent: 300,
      goldPercentage: 0.5,    // 0,5%
      diamondMinSpent: 1000,
      diamondPercentage: 0.8,  // 0,8%
    });

    expect(saved.silverPercentage).toBe(0.05);
    expect(saved.goldPercentage).toBe(0.5);
    expect(saved.diamondPercentage).toBe(0.8);

    const reloaded = await getActiveVipTierConfig();
    expect(reloaded.silverPercentage).toBe(0.05);
    expect(reloaded.goldMinSpent).toBe(300);
    expect(reloaded.goldPercentage).toBe(0.5);
    expect(reloaded.diamondMinSpent).toBe(1000);
    expect(reloaded.diamondPercentage).toBe(0.8);
  });

  it('deve sincronizar o cashback base da loja ao alterar o percentual do nível Prata', async () => {
    await saveActiveVipTierConfig({
      silverPercentage: 0.25,
    });

    const store = await prisma.storeSetting.findUnique({
      where: { id: 'default' },
    });
    expect(store?.defaultCashbackPercentage).toBe(0.25);
  });

  it('deve calcular corretamente as categorias VIP com a configuração fracionária ativa', async () => {
    const customConfig = {
      silverPercentage: 0.05,
      goldMinSpent: 400,
      goldPercentage: 0.5,
      diamondMinSpent: 1200,
      diamondPercentage: 0.9,
    };

    // 1. Cliente com compras abaixo de R$ 400 -> Prata com 0.05%
    const tierPrata = calculateCustomerVipTier(250, customConfig);
    expect(tierPrata.tier).toBe('PRATA');
    expect(tierPrata.percentage).toBe(0.05);
    expect(tierPrata.nextTierSpentRequired).toBe(150); // 400 - 250

    // 2. Cliente com R$ 500 de compras -> Ouro com 0.5%
    const tierOuro = calculateCustomerVipTier(500, customConfig);
    expect(tierOuro.tier).toBe('OURO');
    expect(tierOuro.percentage).toBe(0.5);
    expect(tierOuro.nextTierSpentRequired).toBe(700); // 1200 - 500

    // 3. Cliente com R$ 1.500 de compras -> Diamante com 0.9%
    const tierDiamante = calculateCustomerVipTier(1500, customConfig);
    expect(tierDiamante.tier).toBe('DIAMANTE');
    expect(tierDiamante.percentage).toBe(0.9);
    expect(tierDiamante.nextTierSpentRequired).toBeNull();
  });
});
