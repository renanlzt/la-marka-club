import { createClient } from '@libsql/client';
import path from 'path';

async function main() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoAuthToken) {
    console.error('Defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN no ambiente para sincronizar.');
    process.exit(1);
  }

  console.log('Conectando ao Turso em São Paulo...');
  const turso = createClient({
    url: tursoUrl,
    authToken: tursoAuthToken,
  });

  const ping = await turso.execute('SELECT 1 as connected');
  console.log('✅ Conexão bem-sucedida ao Turso:', ping.rows);

  // Lê o schema das tabelas do dev.db local
  const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');
  console.log('Lendo schema local de:', dbPath);

  // Usando cliente local para ler sqlite_schema
  const localClient = createClient({
    url: `file:${dbPath.replace(/\\/g, '/')}`,
  });

  const schemaRows = await localClient.execute(
    "SELECT sql FROM sqlite_schema WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' AND sql IS NOT NULL"
  );

  console.log(`Encontradas ${schemaRows.rows.length} estruturas de tabelas/índices.`);

  for (const row of schemaRows.rows) {
    const sql = String(row.sql);
    if (!sql) continue;
    try {
      // Ajusta para CREATE TABLE IF NOT EXISTS
      const safeSql = sql.replace(/CREATE TABLE "?(\w+)"?/i, 'CREATE TABLE IF NOT EXISTS "$1"');
      await turso.execute(safeSql);
      console.log('✔ Estrutura sincronizada:', sql.slice(0, 40) + '...');
    } catch (err: any) {
      console.warn('Aviso ao sincronizar:', err.message);
    }
  }

  // Adicionar coluna role se ainda não existir
  try {
    await turso.execute('ALTER TABLE "AdminUser" ADD COLUMN "role" TEXT DEFAULT \'GESTAO\'');
    console.log('✔ Coluna role adicionada em AdminUser no Turso.');
  } catch {
    // Coluna já existe
  }

  // Inserir configurações padrão se não existirem
  await turso.execute(`
    INSERT OR IGNORE INTO "StoreSetting" ("id", "storeName", "defaultCashbackPercentage", "defaultExpirationDays", "birthdayBonusAmount", "birthdayBonusValidityDays", "birthdayBonusDaysBefore", "updatedAt")
    VALUES ('default', 'La Marka', 5.0, 45, 30.0, 30, 7, CURRENT_TIMESTAMP)
  `);

  // Inserir templates padrão
  const templates = [
    {
      id: 'EARN_PURCHASE',
      title: 'Compra com Cashback Ganho',
      content: 'Olá, {primeiro_nome}! Que prazer ter você aqui na La Marka hoje! ✨\nNa sua compra de hoje você ganhou *{cashback_ganho} de cashback*.\nSeu saldo disponível agora é de *{saldo_total}*.\n\nAcompanhe sua carteira e extrato quando quiser:\n👉 {link_carteira}',
    },
    {
      id: 'REDEEM',
      title: 'Compra com Resgate de Saldo',
      content: 'Olá, {primeiro_nome}! Adoramos sua visita à La Marka hoje! 💕\nVocê utilizou *{saldo_utilizado}* do seu cashback nesta compra.\nVocê ainda possui *{saldo_total}* de saldo disponível.\n\nConsulte seu extrato atualizado:\n👉 {link_carteira}',
    },
    {
      id: 'BIRTHDAY',
      title: 'Presente de Aniversário',
      content: 'Parabéns, {primeiro_nome}! A La Marka comemora o seu dia com você! 🎁✨\nVocê acabou de ganhar um presente especial de *{cashback_ganho} de bônus* para escolher o seu look de aniversário!\n\nVeja seu presente na sua carteira digital:\n👉 {link_carteira}',
    },
    {
      id: 'EXPIRATION_ALERT',
      title: 'Aviso de Expiração Próxima',
      content: 'Olá, {primeiro_nome}! Passando para lembrar que você tem *{saldo_total}* de cashback disponível na La Marka, e parte desse valor expira em breve (em {dias_para_expirar} dias)!\n\nQue tal nos visitar e garantir aquele look que você amou? 💕\nConfira seu saldo aqui: {link_carteira}',
    },
  ];

  for (const t of templates) {
    await turso.execute({
      sql: `INSERT OR IGNORE INTO "MessageTemplate" ("id", "title", "content", "isCustomized", "updatedAt")
            VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)`,
      args: [t.id, t.title, t.content],
    });
  }

  console.log('🎉 Turso 100% pronto, tabelas criadas e configurações iniciais semeadas!');
}

main().catch(console.error);
