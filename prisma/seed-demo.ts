import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.customer.findUnique({
    where: { magicToken: 'tk_exemplo_mariana' },
  });

  if (existing) {
    console.log('Customer with tk_exemplo_mariana already exists:', existing.id);
    return;
  }

  // Se o telefone 11987654321 já existir com outro token, remove ou atualiza
  const existingPhone = await prisma.customer.findUnique({
    where: { phone: '11987654321' },
  });
  if (existingPhone) {
    await prisma.customer.delete({ where: { id: existingPhone.id } });
  }

  const customer = await prisma.customer.create({
    data: {
      name: 'Mariana Silva',
      phone: '11987654321',
      cpf: '12345678900',
      birthDay: 15,
      birthMonth: 5,
      notes: 'Cliente VIP La Marka',
      magicToken: 'tk_exemplo_mariana',
    },
  });

  const expiresDate1 = new Date();
  expiresDate1.setDate(expiresDate1.getDate() + 35);

  const expiresDate2 = new Date();
  expiresDate2.setDate(expiresDate2.getDate() + 8); // Vence em 8 dias para mostrar o badge de urgência!

  // Lote 1: Compra
  await prisma.cashbackCredit.create({
    data: {
      customerId: customer.id,
      initialAmount: 25.0,
      currentBalance: 25.0,
      expiresAt: expiresDate1,
      status: 'ACTIVE',
      origin: 'PURCHASE',
      purchaseValue: 500.0,
    },
  });

  // Lote 2: Presente de aniversário (expira em 8 dias)
  await prisma.cashbackCredit.create({
    data: {
      customerId: customer.id,
      initialAmount: 30.0,
      currentBalance: 30.0,
      expiresAt: expiresDate2,
      status: 'ACTIVE',
      origin: 'BIRTHDAY',
    },
  });

  // Transações no extrato
  await prisma.cashbackTransaction.create({
    data: {
      customerId: customer.id,
      type: 'EARN',
      amount: 25.0,
      balanceAfter: 25.0,
      description: 'Cashback recebido na compra (R$ 500,00)',
      operatorName: 'Balcão',
    },
  });

  await prisma.cashbackTransaction.create({
    data: {
      customerId: customer.id,
      type: 'BIRTHDAY',
      amount: 30.0,
      balanceAfter: 55.0,
      description: 'Presente de Aniversário La Marka 🎁',
      operatorName: 'Dieizy',
    },
  });

  await prisma.cashbackTransaction.create({
    data: {
      customerId: customer.id,
      type: 'REDEEM',
      amount: -15.0,
      balanceAfter: 40.0,
      description: 'Resgate de cashback em compra na loja',
      operatorName: 'Balcão',
    },
  });

  // Ajusta o saldo do primeiro lote para refletir o resgate
  const creditToAdjust = await prisma.cashbackCredit.findFirst({
    where: { customerId: customer.id, origin: 'PURCHASE' },
  });
  if (creditToAdjust) {
    await prisma.cashbackCredit.update({
      where: { id: creditToAdjust.id },
      data: { currentBalance: 10.0 },
    });
  }

  console.log('Mariana Silva seeded successfully with token tk_exemplo_mariana!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
