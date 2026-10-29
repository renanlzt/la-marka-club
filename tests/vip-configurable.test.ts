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
      update: { defaultCashbackPercentage: 0.5 },
      create: {
        id: 'default',
        defaultCashbackPercentage: 0.5,
      },
    });

    await prisma.messageTemplate.deleteMany({
      where: { id: 'VIP_TIER_CONFIG' },
    });
  });

  it('deve carregar os padrões das 4 categorias quando nenhuma configuração customizada existir', async () => {
    const config = await getActiveVipTierConfig();
    expect(config.bronzePercentage).toBe(0.5);
    expect(config.silverMinSpent).toBe(300);
    expect(config.silverPercentage).toBe(1.0);
    expect(config.goldMinSpent).toBe(800);
    expect(config.goldPercentage).toBe(1.5);
    expect(config.diamondMinSpent).toBe(1500);
    expect(config.diamondPercentage).toBe(2.0);
  });

  it('deve permitir configurar e salvar percentuais menores que 1% (ex: 0.5%, 0.05%, 0.01%)', async () => {
    const saved = await saveActiveVipTierConfig({
      bronzePercentage: 0.05, // 0,05%
      silverMinSpent: 200,
      silverPercentage: 0.25, // 0,25%
      goldMinSpent: 600,
      goldPercentage: 0.5,    // 0,5%
      diamondMinSpent: 1200,
      diamondPercentage: 0.8,  // 0,8%
    });

    expect(saved.bronzePercentage).toBe(0.05);
    expect(saved.silverPercentage).toBe(0.25);
    expect(saved.goldPercentage).toBe(0.5);
    expect(saved.diamondPercentage).toBe(0.8);

    const reloaded = await getActiveVipTierConfig();
    expect(reloaded.bronzePercentage).toBe(0.05);
    expect(reloaded.silverMinSpent).toBe(200);
    expect(reloaded.silverPercentage).toBe(0.25);
    expect(reloaded.goldMinSpent).toBe(600);
    expect(reloaded.goldPercentage).toBe(0.5);
    expect(reloaded.diamondMinSpent).toBe(1200);
    expect(reloaded.diamondPercentage).toBe(0.8);
  });

  it('deve sincronizar o cashback base da loja ao alterar o percentual do nível Bronze', async () => {
    await saveActiveVipTierConfig({
      bronzePercentage: 0.25,
    });

    const store = await prisma.storeSetting.findUnique({
      where: { id: 'default' },
    });
    expect(store?.defaultCashbackPercentage).toBe(0.25);
  });

  it('deve calcular corretamente as 4 categorias VIP com a configuração fracionária ativa', async () => {
    const customConfig = {
      bronzePercentage: 0.05,
      silverMinSpent: 200,
      silverPercentage: 0.25,
      goldMinSpent: 600,
      goldPercentage: 0.5,
      diamondMinSpent: 1200,
      diamondPercentage: 0.9,
    };

    // 1. Cliente com compras abaixo de R$ 200 -> Bronze com 0.05%
    const tierBronze = calculateCustomerVipTier(150, customConfig);
    expect(tierBronze.tier).toBe('BRONZE');
    expect(tierBronze.percentage).toBe(0.05);
    expect(tierBronze.nextTierSpentRequired).toBe(50); // 200 - 150

    // 2. Cliente com R$ 350 de compras -> Prata com 0.25%
    const tierPrata = calculateCustomerVipTier(350, customConfig);
    expect(tierPrata.tier).toBe('PRATA');
    expect(tierPrata.percentage).toBe(0.25);
    expect(tierPrata.nextTierSpentRequired).toBe(250); // 600 - 350

    // 3. Cliente com R$ 800 de compras -> Ouro com 0.5%
    const tierOuro = calculateCustomerVipTier(800, customConfig);
    expect(tierOuro.tier).toBe('OURO');
    expect(tierOuro.percentage).toBe(0.5);
    expect(tierOuro.nextTierSpentRequired).toBe(400); // 1200 - 800

    // 4. Cliente com R$ 1.500 de compras -> Diamante com 0.9%
    const tierDiamante = calculateCustomerVipTier(1500, customConfig);
    expect(tierDiamante.tier).toBe('DIAMANTE');
    expect(tierDiamante.percentage).toBe(0.9);
    expect(tierDiamante.nextTierSpentRequired).toBeNull();
  });
});
