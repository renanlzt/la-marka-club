import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const TURSO_URL = 'libsql://la-marka-club-renanlzt.aws-sa-east-1.turso.io';
const TURSO_TOKEN =
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTEwNzQ4MDAsImlkIjoiMDFhMTA0NWYtYzEwMS03ZmUxLWI0YWEtMGEzZGFhOWQ0MmI4Iiwia2lkIjoicnBKamYxRkdEZG5mR3NiZXRrM0VjZzdQNGhMVzJfakFBUldtOTBKNXRwUSIsInJpZCI6ImYyYzk3OTcxLTUxMTAtNDQwNS1hZThjLTRmNTE2ZjI5MWI5ZiJ9.Usx9yKrFnbvarNdvwzKEWSLFIIN-K-SEzzj8ckHq14Cu4-TIambMvXBHz9oz3BTIRLqlCHPOA-yVave9jVScDQ';

interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  birthDay: number | null;
  birthMonth: number | null;
  magicToken: string;
}

function parseCSV(): CustomerRecord[] {
  const csvPath = path.resolve(process.cwd(), 'scripts/data/clientes.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');

  const customers: CustomerRecord[] = [];
  const seenPhones = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',');
    const name = parts[0]?.trim();
    const birthStr = parts[1]?.trim();
    const phoneRaw = parts[2]?.trim();
    const phone = phoneRaw ? phoneRaw.replace(/\D/g, '') : '';

    if (!name || !phone) continue;
    if (seenPhones.has(phone)) {
      console.warn(`Aviso: Telefone duplicado ignorado: ${phone} (${name})`);
      continue;
    }
    seenPhones.add(phone);

    let birthDay: number | null = null;
    let birthMonth: number | null = null;

    if (birthStr) {
      const dParts = birthStr.split('-');
      if (dParts.length === 3) {
        birthMonth = parseInt(dParts[1], 10) || null;
        birthDay = parseInt(dParts[2], 10) || null;
      }
    }

    customers.push({
      id: `c_${nanoid(20)}`,
      name,
      phone,
      birthDay,
      birthMonth,
      magicToken: `tk_${nanoid(24)}`,
    });
  }

  return customers;
}

async function syncTarget(client: any, targetName: string, customers: CustomerRecord[]) {
  console.log(`\n========================================`);
  console.log(`Iniciando limpeza e população de [${targetName}]...`);
  console.log(`========================================`);

  // 1. Limpa tabelas de transações, créditos e clientes
  console.log('Limpando transações anteriores...');
  await client.execute('DELETE FROM "CashbackTransaction"');

  console.log('Limpando lotes de créditos de cashback...');
  await client.execute('DELETE FROM "CashbackCredit"');

  console.log('Limpando conciliação de vendas...');
  try {
    await client.execute('DELETE FROM "SalesReconciliation"');
  } catch (e: any) {
    // Tabela pode não existir ou já estar limpa
  }

  console.log('Desvinculando vendedoras de clientes...');
  try {
    await client.execute('UPDATE "Seller" SET "customerId" = NULL');
  } catch (e: any) {
    // Ok
  }

  console.log('Limpando clientes antigos...');
  await client.execute('DELETE FROM "Customer"');

  console.log(`✅ Base limpa com sucesso. Inserindo ${customers.length} clientes reais...`);

  // 2. Insere clientes em lotes (batch)
  const chunkSize = 50;
  const now = new Date().toISOString();

  for (let i = 0; i < customers.length; i += chunkSize) {
    const chunk = customers.slice(i, i + chunkSize);
    const statements = chunk.map((c) => ({
      sql: `INSERT INTO "Customer" ("id", "name", "phone", "birthDay", "birthMonth", "magicToken", "isSeller", "createdAt", "updatedAt")
            VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      args: [c.id, c.name, c.phone, c.birthDay, c.birthMonth, c.magicToken, now, now],
    }));

    await client.batch(statements, 'write');
    process.stdout.write(`\rInseridos ${Math.min(i + chunkSize, customers.length)} / ${customers.length} clientes...`);
  }

  console.log('\n✔ Inserção de clientes concluída!');

  // 3. Verificação de contagem
  const countRes = await client.execute('SELECT COUNT(*) as total FROM "Customer"');
  console.log(`Total de clientes em [${targetName}]:`, countRes.rows[0].total);

  const creditsRes = await client.execute('SELECT COUNT(*) as total FROM "CashbackCredit"');
  console.log(`Total de créditos em [${targetName}]:`, creditsRes.rows[0].total);
}

async function main() {
  const customers = parseCSV();
  console.log(`Total de clientes válidos no CSV: ${customers.length}`);

  // 1. Executa no Turso (Online de Produção)
  console.log('\nConectando ao banco online Turso (Produção)...');
  const tursoClient = createClient({
    url: TURSO_URL,
    authToken: TURSO_TOKEN,
  });
  await syncTarget(tursoClient, 'Turso (Nuvem Produção)', customers);

  // 2. Executa no SQLite Local (dev.db)
  const localDbPath = path.resolve(process.cwd(), 'prisma/dev.db');
  console.log('\nConectando ao banco local SQLite...');
  const localClient = createClient({
    url: `file:${localDbPath.replace(/\\/g, '/')}`,
  });
  await syncTarget(localClient, 'SQLite Local (prisma/dev.db)', customers);

  console.log('\n🎉 SUCESSO: Banco online e local sincronizados com clientes reais!');
}

main().catch((err) => {
  console.error('Erro na execução:', err);
  process.exit(1);
});
