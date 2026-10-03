import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding store settings and default templates...');

  // 1. Configurações padrão da loja
  await prisma.storeSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'La Marka',
      defaultCashbackPercentage: 5.0,
      defaultExpirationDays: 45,
      birthdayBonusAmount: 30.0,
      birthdayBonusValidityDays: 30,
      birthdayBonusDaysBefore: 7,
    },
  });

  // 2. Templates de mensagens padrão de WhatsApp
  const templates = [
    {
      id: 'EARN_PURCHASE',
      title: 'Compra com Cashback Ganho',
      content:
        'Olá, {primeiro_nome}! Que prazer ter você aqui na La Marka hoje! ✨\nNa sua compra de hoje você ganhou *{cashback_ganho} de cashback*.\nSeu saldo disponível agora é de *{saldo_total}*.\n\nAcompanhe sua carteira e extrato quando quiser:\n👉 {link_carteira}',
    },
    {
      id: 'REDEEM',
      title: 'Compra com Resgate de Saldo',
      content:
        'Olá, {primeiro_nome}! Adoramos sua visita à La Marka hoje! 💕\nVocê utilizou *{saldo_utilizado}* do seu cashback nesta compra.\nVocê ainda possui *{saldo_total}* de saldo disponível.\n\nConsulte seu extrato atualizado:\n👉 {link_carteira}',
    },
    {
      id: 'BIRTHDAY',
      title: 'Presente de Aniversário',
      content:
        'Parabéns, {primeiro_nome}! A La Marka comemora o seu dia com você! 🎁✨\nVocê acabou de ganhar um presente especial de *{cashback_ganho} de bônus* para escolher o seu look de aniversário!\n\nVeja seu presente na sua carteira digital:\n👉 {link_carteira}',
    },
    {
      id: 'EXPIRATION_ALERT',
      title: 'Aviso de Expiração Próxima',
      content:
        'Olá, {primeiro_nome}! Passando para lembrar que você tem *{saldo_total}* de cashback disponível na La Marka, e parte desse valor expira em breve (em {dias_para_expirar} dias)!\n\nQue tal nos visitar e garantir aquele look que você amou? 💕\nConfira seu saldo aqui: {link_carteira}',
    },
  ];

  for (const t of templates) {
    await prisma.messageTemplate.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        title: t.title,
        content: t.content,
        isCustomized: false,
      },
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
