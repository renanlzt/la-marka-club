import { describe, it, expect } from 'vitest';
import { prisma } from '../src/lib/db';
import {
  registerQuickCustomer,
  processCounterSale,
  searchCustomerForCounter,
} from '../src/lib/counter-service';
import { getCustomerWalletByToken } from '../src/lib/customer-service';
import { getAdminDashboardStats } from '../src/lib/admin-service';

describe('E2E Full Lifecycle Flow', () => {
  it('should execute full cycle: register -> earn -> wallet view -> redeem -> statement audit -> dashboard KPI', async () => {
    const phone = `1192${Math.floor(1000000 + Math.random() * 9000000)}`;

    // 1. Atendente cadastra nova cliente no balcão
    const customer = await registerQuickCustomer({
      name: 'Vanessa Prado',
      phone,
      birthDay: 12,
      birthMonth: 5,
    });
    expect(customer.id).toBeDefined();
    expect(customer.magicToken).toBeDefined();

    // 2. Primeira compra: R$ 400,00 sem resgate
    const firstSale = await processCounterSale({
      customerId: customer.id,
      purchaseAmount: 400.0,
      redeemAmount: 0,
      operatorName: 'Atendente Carol',
    });
    expect(firstSale.cashbackEarned).toBe(20.0); // 5% de 400
    expect(firstSale.newBalance).toBe(20.0);
    expect(firstSale.whatsAppLink).toContain('https://wa.me/55');

    // 3. Cliente acessa carteira digital via link do WhatsApp
    const wallet1 = await getCustomerWalletByToken(customer.magicToken);
    expect(wallet1).not.toBeNull();
    expect(wallet1?.customer.firstName).toBe('Vanessa');
    expect(wallet1?.balanceInfo.availableBalance).toBe(20.0);
    expect(wallet1?.transactions.length).toBe(1);
    expect(wallet1?.transactions[0].type).toBe('EARN');

    // 4. Cliente retorna à loja para segunda compra: R$ 250,00 utilizando R$ 15,00 de cashback
    const secondSale = await processCounterSale({
      customerId: customer.id,
      purchaseAmount: 250.0,
      redeemAmount: 15.0,
      operatorName: 'Atendente Carol',
    });
    expect(secondSale.redeemed).toBe(15.0);
    expect(secondSale.netAmountToPay).toBe(235.0);
    // Cashback sobre valor líquido: 235 * 5% = 11.75
    expect(secondSale.cashbackEarned).toBe(11.75);
    // Saldo final: 20 - 15 + 11.75 = 16.75
    expect(secondSale.newBalance).toBe(16.75);

    // 5. Cliente confere extrato atualizado na carteira digital
    const wallet2 = await getCustomerWalletByToken(customer.magicToken);
    expect(wallet2?.balanceInfo.availableBalance).toBe(16.75);
    // Deve conter: 1 EARN original, 1 REDEEM, 1 EARN da segunda compra
    expect(wallet2?.transactions.length).toBe(3);

    // 6. Painel da Dieizy contabiliza Vanessa como cliente que retornou (recompra)
    const stats = await getAdminDashboardStats();
    expect(stats.totalPurchasingCustomers).toBeGreaterThanOrEqual(1);
    expect(stats.customersWithRepeatPurchase).toBeGreaterThanOrEqual(1);
  });
});
