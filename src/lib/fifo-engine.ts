import { prisma } from './db';

export interface CustomerBalanceInfo {
  availableBalance: number;
  expiringAmount: number;
  expiringInDays: number | null;
  nextExpirationDate: Date | null;
}

/**
 * Expira créditos que atingiram a data limite e ainda possuem saldo remanescente.
 */
export async function expireOutdatedCredits(customerId?: string): Promise<number> {
  const now = new Date();
  const whereClause: any = {
    status: 'ACTIVE',
    expiresAt: { lt: now },
    currentBalance: { gt: 0 },
  };

  if (customerId) {
    whereClause.customerId = customerId;
  }

  const expiredLots = await prisma.cashbackCredit.findMany({
    where: whereClause,
  });

  if (expiredLots.length === 0) return 0;

  // Agrupa os lotes por customerId para garantir balanceAfter sequencial e preciso
  const lotsByCustomer = new Map<string, typeof expiredLots>();
  for (const lot of expiredLots) {
    const list = lotsByCustomer.get(lot.customerId) || [];
    list.push(lot);
    lotsByCustomer.set(lot.customerId, list);
  }

  for (const [cId, customerLots] of lotsByCustomer.entries()) {
    await prisma.$transaction(async (tx) => {
      // 1. Calcula saldo total atual antes das expirações
      const allActiveCredits = await tx.cashbackCredit.findMany({
        where: { customerId: cId, status: 'ACTIVE', currentBalance: { gt: 0 } },
      });
      let runningBalance = Number(
        allActiveCredits.reduce((acc, c) => acc + c.currentBalance, 0).toFixed(2)
      );

      for (const lot of customerLots) {
        const lostAmount = lot.currentBalance;
        if (lostAmount <= 0) continue;

        // Atualiza o lote para expirado e zera saldo
        await tx.cashbackCredit.update({
          where: { id: lot.id },
          data: {
            currentBalance: 0,
            status: 'EXPIRED',
          },
        });

        runningBalance = Number(Math.max(0, runningBalance - lostAmount).toFixed(2));

        // Registra evento de auditoria no extrato com balanceAfter matematicamente exato
        await tx.cashbackTransaction.create({
          data: {
            customerId: cId,
            type: 'EXPIRE',
            amount: -lostAmount,
            balanceAfter: runningBalance,
            description: `Cashback expirado (lote de R$ ${lot.initialAmount.toFixed(2)})`,
            operatorName: 'Sistema (Expiração Automática)',
            reason: 'Prazo de validade atingido',
          },
        });
      }
    });
  }

  return expiredLots.length;
}

/**
 * Consulta o saldo disponível e valores próximos ao vencimento da cliente.
 */
export async function getCustomerBalance(
  customerId: string
): Promise<CustomerBalanceInfo> {
  // Executa checagem de expiração primeiro
  await expireOutdatedCredits(customerId);

  const now = new Date();
  const activeCredits = await prisma.cashbackCredit.findMany({
    where: {
      customerId,
      status: 'ACTIVE',
      expiresAt: { gt: now },
      currentBalance: { gt: 0 },
    },
    orderBy: { expiresAt: 'asc' },
  });

  const availableBalance = Number(
    activeCredits
      .reduce((acc, credit) => acc + credit.currentBalance, 0)
      .toFixed(2)
  );

  if (activeCredits.length === 0) {
    return {
      availableBalance: 0,
      expiringAmount: 0,
      expiringInDays: null,
      nextExpirationDate: null,
    };
  }

  const firstExpiring = activeCredits[0];
  const diffTime = firstExpiring.expiresAt.getTime() - now.getTime();
  const expiringInDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    availableBalance,
    expiringAmount: Number(firstExpiring.currentBalance.toFixed(2)),
    expiringInDays,
    nextExpirationDate: firstExpiring.expiresAt,
  };
}

/**
 * Concede cashback sobre o valor líquido de uma compra.
 */
export async function grantCashback(
  customerId: string,
  purchaseAmount: number,
  operatorName = 'Balcão',
  campaignId?: string
) {
  const settings = await prisma.storeSetting.findUnique({
    where: { id: 'default' },
  });

  let percentage = settings?.defaultCashbackPercentage ?? 5.0;
  const validityDays = settings?.defaultExpirationDays ?? 45;

  // Verifica se há campanha ativa aplicável
  if (campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (campaign && campaign.isActive) {
      if (campaign.type === 'PERCENTAGE_OVERRIDE') {
        percentage = campaign.value;
      } else if (campaign.type === 'MULTIPLIER') {
        percentage = percentage * campaign.value;
      }
    }
  }

  const cashbackEarned = Number(
    ((purchaseAmount * percentage) / 100).toFixed(2)
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + validityDays);

  return await prisma.$transaction(async (tx) => {
    // 1. Cria o lote de crédito
    const credit = await tx.cashbackCredit.create({
      data: {
        customerId,
        initialAmount: cashbackEarned,
        currentBalance: cashbackEarned,
        expiresAt,
        status: 'ACTIVE',
        origin: 'PURCHASE',
        purchaseValue: purchaseAmount,
        campaignId,
      },
    });

    // 2. Calcula novo saldo
    const activeCredits = await tx.cashbackCredit.findMany({
      where: {
        customerId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
    });
    const newBalance = Number(
      activeCredits
        .reduce((acc, c) => acc + c.currentBalance, 0)
        .toFixed(2)
    );

    // 3. Registra a transação no extrato
    const transaction = await tx.cashbackTransaction.create({
      data: {
        customerId,
        type: 'EARN',
        amount: cashbackEarned,
        balanceAfter: newBalance,
        description: `Compra de R$ ${purchaseAmount.toFixed(2)} (${percentage}% cashback)`,
        operatorName,
      },
    });

    return { credit, transaction, newBalance };
  });
}

/**
 * Resgata saldo de cashback utilizando o método FIFO (consome primeiro os lotes mais antigos).
 */
export async function redeemCashback(
  customerId: string,
  redeemAmount: number,
  operatorName = 'Balcão',
  options?: {
    type?: string;
    description?: string;
    reason?: string;
  }
) {
  if (redeemAmount <= 0) {
    throw new Error('O valor de resgate deve ser maior que zero.');
  }

  await expireOutdatedCredits(customerId);

  return await prisma.$transaction(async (tx) => {
    const now = new Date();
    // Busca e bloqueio atômico dos lotes ativos dentro da transação
    const activeCredits = await tx.cashbackCredit.findMany({
      where: {
        customerId,
        status: 'ACTIVE',
        expiresAt: { gt: now },
        currentBalance: { gt: 0 },
      },
      orderBy: { expiresAt: 'asc' }, // FIFO
    });

    const availableBalance = Number(
      activeCredits
        .reduce((acc, c) => acc + c.currentBalance, 0)
        .toFixed(2)
    );

    if (redeemAmount > availableBalance) {
      throw new Error(
        `Saldo insuficiente para resgate. Disponível: R$ ${availableBalance.toFixed(
          2
        )}`
      );
    }

    let remainingToDeduct = Number(redeemAmount.toFixed(2));

    for (const lot of activeCredits) {
      if (remainingToDeduct <= 0) break;

      const deduction = Math.min(lot.currentBalance, remainingToDeduct);
      const newLotBalance = Number((lot.currentBalance - deduction).toFixed(2));
      const newStatus = newLotBalance === 0 ? 'FULLY_USED' : 'ACTIVE';

      await tx.cashbackCredit.update({
        where: { id: lot.id },
        data: {
          currentBalance: newLotBalance,
          status: newStatus,
        },
      });

      remainingToDeduct = Number((remainingToDeduct - deduction).toFixed(2));
    }

    // Calcula novo saldo consolidado
    const updatedCredits = await tx.cashbackCredit.findMany({
      where: {
        customerId,
        status: 'ACTIVE',
        expiresAt: { gt: now },
      },
    });
    const newBalance = Number(
      updatedCredits
        .reduce((acc, c) => acc + c.currentBalance, 0)
        .toFixed(2)
    );

    // Registra a transação no extrato
    await tx.cashbackTransaction.create({
      data: {
        customerId,
        type: options?.type || 'REDEEM',
        amount: -redeemAmount,
        balanceAfter: newBalance,
        description:
          options?.description ||
          `Resgate de saldo na compra (R$ ${redeemAmount.toFixed(2)})`,
        operatorName,
        reason: options?.reason,
      },
    });

    return { redeemed: redeemAmount, newBalance };
  });
}

/**
 * Concede bônus de aniversário à cliente.
 */
export async function grantBirthdayGift(
  customerId: string,
  amount?: number,
  validityDays?: number,
  operatorName = 'Dieizy (Presente de Aniversário)'
) {
  const settings = await prisma.storeSetting.findUnique({
    where: { id: 'default' },
  });

  const giftAmount = amount ?? settings?.birthdayBonusAmount ?? 30.0;
  const days = validityDays ?? settings?.birthdayBonusValidityDays ?? 30;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  return await prisma.$transaction(async (tx) => {
    const credit = await tx.cashbackCredit.create({
      data: {
        customerId,
        initialAmount: giftAmount,
        currentBalance: giftAmount,
        expiresAt,
        status: 'ACTIVE',
        origin: 'BIRTHDAY',
      },
    });

    const activeCredits = await tx.cashbackCredit.findMany({
      where: {
        customerId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
    });
    const newBalance = Number(
      activeCredits
        .reduce((acc, c) => acc + c.currentBalance, 0)
        .toFixed(2)
    );

    await tx.cashbackTransaction.create({
      data: {
        customerId,
        type: 'BIRTHDAY_GIFT',
        amount: giftAmount,
        balanceAfter: newBalance,
        description: `Presente de Aniversário La Marka (R$ ${giftAmount.toFixed(2)})`,
        operatorName,
      },
    });

    return credit;
  });
}

/**
 * Realiza ajuste manual de saldo pela Dieizy com justificativa obrigatória.
 */
export async function manualAdjustBalance(
  customerId: string,
  amount: number,
  reason: string,
  operatorName: string
) {
  if (!reason || reason.trim().length === 0) {
    throw new Error('A justificativa é obrigatória para ajustes manuais.');
  }

  if (amount === 0) {
    throw new Error('O valor do ajuste não pode ser zero.');
  }

  if (amount > 0) {
    // Crédito manual
    const settings = await prisma.storeSetting.findUnique({
      where: { id: 'default' },
    });
    const validityDays = settings?.defaultExpirationDays ?? 45;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    return await prisma.$transaction(async (tx) => {
      await tx.cashbackCredit.create({
        data: {
          customerId,
          initialAmount: amount,
          currentBalance: amount,
          expiresAt,
          status: 'ACTIVE',
          origin: 'MANUAL_BONUS',
        },
      });

      const activeCredits = await tx.cashbackCredit.findMany({
        where: { customerId, status: 'ACTIVE', expiresAt: { gt: new Date() } },
      });
      const newBalance = Number(
        activeCredits.reduce((acc, c) => acc + c.currentBalance, 0).toFixed(2)
      );

      await tx.cashbackTransaction.create({
        data: {
          customerId,
          type: 'MANUAL_ADD',
          amount,
          balanceAfter: newBalance,
          description: `Ajuste manual (+ R$ ${amount.toFixed(2)})`,
          operatorName,
          reason,
        },
      });

      return { amount, newBalance };
    });
  } else {
    // Débito manual: registra como MANUAL_SUBTRACT com reason preservado
    return await redeemCashback(
      customerId,
      Math.abs(amount),
      operatorName,
      {
        type: 'MANUAL_SUBTRACT',
        description: `Ajuste manual (- R$ ${Math.abs(amount).toFixed(2)})`,
        reason,
      }
    );
  }
}

