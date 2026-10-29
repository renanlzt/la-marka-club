import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '../src/lib/db';
import { grantCashback } from '../src/lib/fifo-engine';
import { generatePassData, formatPassExpiration } from '../src/lib/wallet-pass-service';
import { GET as getAppleWalletPass } from '../src/app/api/wallet/apple/[token]/route';
import { GET as getGoogleWalletPass } from '../src/app/api/wallet/google/[token]/route';
import { nanoid } from 'nanoid';

describe('PassKit & Apple Wallet Service - Unit Tests', () => {
  let magicToken: string;
  let customerId: string;
  const customerName = 'Helena Rostand';

  beforeEach(async () => {
    magicToken = `tk_pass_${nanoid(20)}`;
    const randomPhone = `4999${Math.floor(1000000 + Math.random() * 9000000)}`;

    const customer = await prisma.customer.create({
      data: {
        name: customerName,
        phone: randomPhone,
        cpf: '98765432100',
        magicToken,
      },
    });

    customerId = customer.id;
    // Compra de R$ 900 -> 5% = R$ 45,00 de cashback
    await grantCashback(customerId, 900.0, 'Balcão La Marka');
  });

  it('should generate valid Apple Wallet PassKit data with mandatory fields', async () => {
    const pass = await generatePassData(magicToken);

    expect(pass).not.toBeNull();
    if (!pass) return;

    // 1. Identificadores e versão
    expect(pass.formatVersion).toBe(1);
    expect(pass.passTypeIdentifier).toBe('pass.br.com.lamarka.privilege');
    expect(pass.passType).toBe('storeCard');
    expect(pass.teamIdentifier).toBeDefined();
    expect(pass.serialNumber).toBe(magicToken);

    // 2. Organização e descrição
    expect(pass.organizationName).toBe('La Marka');
    expect(pass.description).toBe('Cartão La Marka Privilège - Clube de Cashback');

    // 3. Cores oficiais da identidade visual
    expect(pass.backgroundColor).toBe('rgb(95, 58, 54)'); // Terracota oficial
    expect(pass.labelColor).toBe('rgb(223, 183, 108)'); // Champagne dourado
    expect(pass.foregroundColor).toBe('rgb(250, 246, 245)'); // Marfim

    // 4. PrimaryFields de saldo atual em R$
    expect(pass.primaryFields).toBeDefined();
    expect(pass.primaryFields.length).toBeGreaterThanOrEqual(1);
    const balanceField = pass.primaryFields.find((f) => f.key === 'balance');
    expect(balanceField).toBeDefined();
    expect(balanceField?.label).toBe('SALDO DISPONÍVEL');
    expect(balanceField?.value).toBe('R$ 45,00');

    // Também no objeto estruturado storeCard
    expect(pass.storeCard.primaryFields[0].value).toBe('R$ 45,00');

    // 5. SecondaryFields com Nome da Cliente e Categoria VIP
    expect(pass.secondaryFields).toBeDefined();
    const nameField = pass.secondaryFields.find((f) => f.key === 'customerName');
    expect(nameField?.value).toBe(customerName);

    const vipField = pass.secondaryFields.find((f) => f.key === 'vipTier');
    expect(vipField?.value).toContain('Membro');

    // 6. AuxiliaryFields com Validade do Saldo e Telefone
    expect(pass.auxiliaryFields).toBeDefined();
    const expField = pass.auxiliaryFields.find((f) => f.key === 'expiration');
    expect(expField?.label).toBe('VALIDADE DO SALDO');
    expect(expField?.value).toBeDefined();

    const phoneField = pass.auxiliaryFields.find((f) => f.key === 'phone');
    expect(phoneField?.label).toBe('TELEFONE');
    expect(phoneField?.value).toContain('****');

    // 7. QR Code apontando para o Magic Link da cliente
    expect(pass.barcode).toBeDefined();
    expect(pass.barcode.format).toBe('PKBarcodeFormatQR');
    expect(pass.barcode.message).toContain(`/c/${magicToken}`);
    expect(pass.barcode.messageEncoding).toBe('iso-8859-1');

    expect(pass.barcodes).toBeDefined();
    expect(pass.barcodes[0].message).toContain(`/c/${magicToken}`);
  });

  it('should generate Google Wallet compatible pass data with JWT save link', async () => {
    const pass = await generatePassData(magicToken);

    expect(pass?.googleWallet).toBeDefined();
    const gw = pass?.googleWallet;

    expect(gw?.issuerName).toBe('La Marka');
    expect(gw?.programName).toBe('La Marka Privilège');
    expect(gw?.accountName).toBe(customerName);
    expect(gw?.balanceText).toBe('R$ 45,00');
    expect(gw?.saveUrl).toContain('https://pay.google.com/gp/v/save/');
    expect(gw?.jwt).toBeDefined();
    expect(gw?.hexBackgroundColor).toBe('#5F3A36');
    expect(gw?.qrCodeUrl).toContain(`/c/${magicToken}`);
  });

  it('should return null when generating pass for non-existent token', async () => {
    const pass = await generatePassData('token_inexistente_12345');
    expect(pass).toBeNull();
  });

  it('should return null when token is empty or whitespace', async () => {
    const pass = await generatePassData('   ');
    expect(pass).toBeNull();
  });

  it('should format pass expiration correctly with and without active balance', () => {
    const noBalance = formatPassExpiration({
      availableBalance: 0,
      expiringInDays: null,
      nextExpirationDate: null,
    });
    expect(noBalance).toBe('Sem saldo acumulado');

    const withDays = formatPassExpiration({
      availableBalance: 50,
      expiringInDays: 15,
      nextExpirationDate: new Date('2026-11-15T00:00:00Z'),
    });
    expect(withDays).toContain('em 15d');
  });
});

describe('Apple Wallet Pass API Endpoint - Integration Tests', () => {
  let validToken: string;
  let customerId: string;

  beforeEach(async () => {
    validToken = `tk_endpoint_${nanoid(20)}`;
    const randomPhone = `4998${Math.floor(1000000 + Math.random() * 9000000)}`;

    const customer = await prisma.customer.create({
      data: {
        name: 'Isadora Castanho',
        phone: randomPhone,
        cpf: '11122233344',
        magicToken: validToken,
      },
    });

    customerId = customer.id;
    await grantCashback(customerId, 600.0, 'Balcão La Marka');
  });

  it('GET /api/wallet/apple/[token] should return 200 with pass payload for valid token', async () => {
    const request = new NextRequest(`http://localhost:3000/api/wallet/apple/${validToken}`);
    const context = { params: Promise.resolve({ token: validToken }) };

    const response = await getAppleWalletPass(request, context);

    expect(response.status).toBe(200);

    // Valida cabeçalhos oficiais da Apple Wallet
    expect(response.headers.get('content-type')).toContain('application/vnd.apple.pkpass');
    expect(response.headers.get('content-disposition')).toContain('attachment');
    expect(response.headers.get('content-disposition')).toContain('lamarka-privilege');
    expect(response.headers.get('x-apple-pass-type')).toBe('pass.br.com.lamarka.privilege');

    // Valida dados JSON do passe
    const data = await response.json();
    expect(data.organizationName).toBe('La Marka');
    expect(data.serialNumber).toBe(validToken);
    expect(data.storeCard.primaryFields[0].value).toBe('R$ 30,00'); // 5% de 600 = 30
    expect(data.barcode.message).toContain(validToken);
  });

  it('GET /api/wallet/apple/[token] should return 404 for invalid token', async () => {
    const invalidToken = 'token_fantasma_99999';
    const request = new NextRequest(`http://localhost:3000/api/wallet/apple/${invalidToken}`);
    const context = { params: Promise.resolve({ token: invalidToken }) };

    const response = await getAppleWalletPass(request, context);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});

describe('Google Wallet Pass API Endpoint - Integration Tests', () => {
  let validToken: string;

  beforeEach(async () => {
    validToken = `tk_google_${nanoid(20)}`;
    const randomPhone = `4997${Math.floor(1000000 + Math.random() * 9000000)}`;

    const customer = await prisma.customer.create({
      data: {
        name: 'Beatriz Silveira',
        phone: randomPhone,
        magicToken: validToken,
      },
    });

    await grantCashback(customer.id, 400.0, 'Balcão La Marka');
  });

  it('GET /api/wallet/google/[token] should return 200 with saveUrl and pass metadata', async () => {
    const request = new NextRequest(`http://localhost:3000/api/wallet/google/${validToken}`);
    const context = { params: Promise.resolve({ token: validToken }) };

    const response = await getGoogleWalletPass(request, context);

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.saveUrl).toContain('https://pay.google.com/gp/v/save/');
    expect(body.googleWallet.accountName).toBe('Beatriz Silveira');
    expect(body.googleWallet.balanceText).toBe('R$ 20,00'); // 5% de 400 = 20
  });

  it('GET /api/wallet/google/[token] should return 404 for non-existent token', async () => {
    const request = new NextRequest('http://localhost:3000/api/wallet/google/invalid_token');
    const context = { params: Promise.resolve({ token: 'invalid_token' }) };

    const response = await getGoogleWalletPass(request, context);
    expect(response.status).toBe(404);
  });
});
