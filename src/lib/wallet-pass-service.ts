import crypto from 'crypto';
import { getCustomerWalletByToken, formatBRL } from './customer-service';
import { getAppBaseUrl } from './url';
import { getVipTierInfo } from '@/components/carteira/VipProgressCard';

export interface PassKitField {
  key: string;
  label: string;
  value: string;
  changeMessage?: string;
  currencyCode?: string;
}

export interface PassKitBarcode {
  format: string;
  message: string;
  messageEncoding: string;
  altText?: string;
}

export interface PassKitStructure {
  headerFields?: PassKitField[];
  primaryFields: PassKitField[];
  secondaryFields: PassKitField[];
  auxiliaryFields: PassKitField[];
  backFields?: PassKitField[];
}

export interface GoogleWalletPassData {
  id: string;
  classId: string;
  issuerName: string;
  programName: string;
  accountName: string;
  balanceText: string;
  tier: string;
  expirationText: string;
  phone: string;
  qrCodeUrl: string;
  saveUrl: string;
  jwt: string;
  hexBackgroundColor: string;
  hexForegroundColor: string;
  loyaltyObject: Record<string, unknown>;
}

export interface PassKitData {
  formatVersion: number;
  passTypeIdentifier: string;
  passType: string;
  teamIdentifier: string;
  serialNumber: string;
  organizationName: string;
  description: string;
  backgroundColor: string;
  labelColor: string;
  foregroundColor: string;
  logoText: string;
  storeCard: PassKitStructure;
  // Campos de primeiro nível para compatibilidade e asserções diretas de testes
  primaryFields: PassKitField[];
  secondaryFields: PassKitField[];
  auxiliaryFields: PassKitField[];
  backFields?: PassKitField[];
  barcode: PassKitBarcode;
  barcodes: PassKitBarcode[];
  googleWallet?: GoogleWalletPassData;
  magicUrl: string;
}

/**
 * Utilitário para codificação Base64URL
 */
function base64UrlEncode(data: string | Buffer): string {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Cria o JWT assinado para adicionar o passe ao Google Wallet
 */
function generateGoogleWalletJwt(
  payloadObj: Record<string, unknown>,
  appBaseUrl: string
): string {
  const secretKey =
    process.env.GOOGLE_WALLET_SECRET ||
    'lamarka-privilege-google-wallet-secret-dev-key';

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const nowSec = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    iss:
      process.env.GOOGLE_WALLET_ISSUER_EMAIL ||
      'wallet-service@lamarka-club.iam.gserviceaccount.com',
    aud: 'google',
    typ: 'savetowallet',
    iat: nowSec,
    origins: [appBaseUrl],
    payload: payloadObj,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(dataToSign);
  const signature = base64UrlEncode(hmac.digest());

  return `${dataToSign}.${signature}`;
}

/**
 * Formata o texto de expiração do saldo para exibição no passe
 */
export function formatPassExpiration(balanceInfo: {
  availableBalance: number;
  expiringInDays: number | null;
  nextExpirationDate: Date | null;
  expiringAmount?: number;
}): string {
  if (balanceInfo.availableBalance <= 0) {
    return 'Sem saldo acumulado';
  }

  if (
    balanceInfo.expiringInDays !== null &&
    balanceInfo.expiringInDays !== undefined &&
    balanceInfo.expiringInDays > 0
  ) {
    if (balanceInfo.nextExpirationDate) {
      const d = new Date(balanceInfo.nextExpirationDate);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year} (em ${balanceInfo.expiringInDays}d)`;
    }
    return `Em ${balanceInfo.expiringInDays} dias`;
  }

  return 'Sem vencimento próximo';
}

/**
 * Gera a estrutura completa de dados do Passe para Apple Wallet (PassKit) e Google Wallet
 */
export async function generatePassData(
  magicToken: string
): Promise<PassKitData | null> {
  if (!magicToken || !magicToken.trim()) {
    return null;
  }

  const cleanToken = magicToken.trim();
  const wallet = await getCustomerWalletByToken(cleanToken);

  if (!wallet) {
    return null;
  }

  const { customer, balanceInfo, storeSettings, transactions } = wallet;
  const appBaseUrl = getAppBaseUrl();
  const magicUrl = `${appBaseUrl}/c/${cleanToken}`;

  // Calcula total acumulado e categoria VIP
  const totalAccumulated = transactions
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const effectiveAccumulated = Math.max(
    balanceInfo.availableBalance,
    totalAccumulated
  );
  const tierInfo = getVipTierInfo(effectiveAccumulated);
  const vipTierName = `Membro ${tierInfo.currentTier}`;

  const formattedBalance = `R$ ${formatBRL(balanceInfo.availableBalance)}`;
  const expirationText = formatPassExpiration(balanceInfo);

  // Campos primários da Apple Wallet (Saldo destacado)
  const primaryFields: PassKitField[] = [
    {
      key: 'balance',
      label: 'SALDO DISPONÍVEL',
      value: formattedBalance,
      currencyCode: 'BRL',
    },
  ];

  // Campos secundários da Apple Wallet (Nome da Cliente e Categoria VIP)
  const secondaryFields: PassKitField[] = [
    {
      key: 'customerName',
      label: 'CLIENTE',
      value: customer.name,
    },
    {
      key: 'vipTier',
      label: 'CATEGORIA',
      value: vipTierName,
    },
  ];

  // Campos auxiliares da Apple Wallet (Validade do Saldo e Telefone)
  const auxiliaryFields: PassKitField[] = [
    {
      key: 'expiration',
      label: 'VALIDADE DO SALDO',
      value: expirationText,
    },
    {
      key: 'phone',
      label: 'TELEFONE',
      value: customer.maskedPhone,
    },
  ];

  // Informações no verso do passe da Apple
  const backFields: PassKitField[] = [
    {
      key: 'program',
      label: 'CLUBE LA MARKA PRIVILÈGE',
      value:
        'Programa exclusivo de benefícios, estilo e cashback da La Marka Moda Feminina.',
    },
    {
      key: 'cashbackRule',
      label: 'REGULAMENTO DO SALDO',
      value: `${storeSettings.defaultCashbackPercentage}% de cashback acumulado a cada compra com validade de ${storeSettings.defaultExpirationDays} dias.`,
    },
    {
      key: 'howToUse',
      label: 'COMO RESGATAR SEU CASHBACK',
      value:
        'Basta informar seu telefone cadastrado ou apresentar o QR Code deste cartão no balcão da loja ao finalizar suas compras.',
    },
    {
      key: 'storeInfo',
      label: 'LOJA LA MARKA',
      value: 'Moda feminina sofisticada e curadoria de luxo.',
    },
    {
      key: 'support',
      label: 'ATENDIMENTO WHATSAPP',
      value: '(49) 99926-6069',
    },
    {
      key: 'magicLink',
      label: 'CARTEIRA DIGITAL COMPLETA',
      value: magicUrl,
    },
  ];

  const barcode: PassKitBarcode = {
    format: 'PKBarcodeFormatQR',
    message: magicUrl,
    messageEncoding: 'iso-8859-1',
    altText: customer.maskedPhone,
  };

  const storeCard: PassKitStructure = {
    headerFields: [
      {
        key: 'club',
        label: 'CLUBE VIP',
        value: 'Privilège',
      },
    ],
    primaryFields,
    secondaryFields,
    auxiliaryFields,
    backFields,
  };

  // Google Wallet Loyalty Object & Save URL
  const issuerId =
    process.env.GOOGLE_WALLET_ISSUER_ID || '3388000000022316413';
  const sanitizedToken = cleanToken.replace(/[^a-zA-Z0-9_-]/g, '_');
  const googleWalletObjectId = `${issuerId}.${sanitizedToken}`;
  const googleWalletClassId = `${issuerId}.lamarka_privilege_club`;

  const loyaltyObject = {
    id: googleWalletObjectId,
    classId: googleWalletClassId,
    state: 'ACTIVE',
    accountId: cleanToken,
    accountName: customer.name,
    loyaltyPoints: {
      label: 'Saldo Disponível',
      balance: {
        string: formattedBalance,
      },
    },
    secondaryLoyaltyPoints: {
      label: 'Categoria VIP',
      balance: {
        string: vipTierName,
      },
    },
    barcode: {
      type: 'QR_CODE',
      value: magicUrl,
      alternateText: customer.maskedPhone,
    },
    textModulesData: [
      {
        id: 'expiration',
        header: 'Validade do Saldo',
        body: expirationText,
      },
      {
        id: 'phone',
        header: 'Telefone',
        body: customer.maskedPhone,
      },
      {
        id: 'terms',
        header: 'Benefício La Marka',
        body: `${storeSettings.defaultCashbackPercentage}% de volta com prazo de ${storeSettings.defaultExpirationDays} dias para usar.`,
      },
    ],
    linksModuleData: {
      uris: [
        {
          kind: 'walletobjects#uri',
          uri: magicUrl,
          description: 'Acessar Carteira Digital Completa',
        },
      ],
    },
    hexBackgroundColor: '#5F3A36',
    hexForegroundColor: '#FAF6F5',
  };

  const googleJwt = generateGoogleWalletJwt(
    { loyaltyObjects: [loyaltyObject] },
    appBaseUrl
  );
  const googleSaveUrl = `https://pay.google.com/gp/v/save/${googleJwt}`;

  const googleWalletData: GoogleWalletPassData = {
    id: googleWalletObjectId,
    classId: googleWalletClassId,
    issuerName: 'La Marka',
    programName: 'La Marka Privilège',
    accountName: customer.name,
    balanceText: formattedBalance,
    tier: vipTierName,
    expirationText,
    phone: customer.maskedPhone,
    qrCodeUrl: magicUrl,
    saveUrl: googleSaveUrl,
    jwt: googleJwt,
    hexBackgroundColor: '#5F3A36',
    hexForegroundColor: '#FAF6F5',
    loyaltyObject,
  };

  return {
    formatVersion: 1,
    passTypeIdentifier:
      process.env.APPLE_PASS_TYPE_IDENTIFIER ||
      'pass.br.com.lamarka.privilege',
    passType: 'storeCard',
    teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER || 'LAMARKA99',
    serialNumber: cleanToken,
    organizationName: 'La Marka',
    description: 'Cartão La Marka Privilège - Clube de Cashback',
    logoText: 'La Marka Privilège',
    backgroundColor: 'rgb(95, 58, 54)',
    labelColor: 'rgb(223, 183, 108)',
    foregroundColor: 'rgb(250, 246, 245)',
    storeCard,
    primaryFields,
    secondaryFields,
    auxiliaryFields,
    backFields,
    barcode,
    barcodes: [barcode],
    googleWallet: googleWalletData,
    magicUrl,
  };
}
