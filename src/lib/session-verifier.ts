/**
 * Verificador de Sessão Criptográfica baseado em Web Crypto API
 * Compatível nativamente com o Edge Runtime do Next.js Middleware e Node.js
 */

const SECRET_KEY =
  process.env.SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'la-marka-club-super-secret-key-2026';

// Sessões expiram em 7 dias (em milissegundos)
export const MAX_SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface VerifiedSession {
  adminId: string;
  username: string;
  role: 'GESTAO' | 'BALCAO';
  createdAt: number;
}

/**
 * Valida criptograficamente a assinatura HMAC-SHA256 do token de sessão
 * e confere se a sessão não ultrapassou o tempo limite de expiração.
 */
export async function verifySessionTokenEdge(
  token: string | undefined | null,
  secretKey: string = SECRET_KEY
): Promise<VerifiedSession | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split(':');
  if (parts.length !== 5 && parts.length !== 4) {
    return null;
  }

  let adminId = '';
  let username = '';
  let role: 'GESTAO' | 'BALCAO' = 'GESTAO';
  let timestampStr = '';
  let signature = '';
  let payload = '';

  if (parts.length === 5) {
    [adminId, username, , timestampStr, signature] = parts;
    const rawRole = parts[2].toUpperCase();
    role = rawRole === 'BALCAO' ? 'BALCAO' : 'GESTAO';
    payload = `${adminId}:${username}:${parts[2]}:${timestampStr}`;
  } else {
    [adminId, username, timestampStr, signature] = parts;
    payload = `${adminId}:${username}:${timestampStr}`;
    role = 'GESTAO';
  }

  if (!adminId || !username || !timestampStr || !signature) {
    return null;
  }

  // 1. Verificação de Expiração Temporal
  const createdAt = parseInt(timestampStr, 10);
  if (isNaN(createdAt) || createdAt <= 0) {
    return null;
  }

  const now = Date.now();
  if (now - createdAt > MAX_SESSION_AGE_MS) {
    return null; // Sessão expirada
  }

  // Previne timestamps futuros fraudulentos (tolerância máxima de 5 minutos para drift)
  if (createdAt - now > 5 * 60 * 1000) {
    return null;
  }

  // 2. Verificação Criptográfica de Assinatura HMAC-SHA256
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Converte a assinatura hexadecimal em Uint8Array
    const hexMatches = signature.match(/.{1,2}/g);
    if (!hexMatches || hexMatches.length !== 32) {
      return null; // Assinatura SHA-256 inválida (deve ter 32 bytes)
    }

    const sigBytes = new Uint8Array(hexMatches.map((b) => parseInt(b, 16)));
    const payloadBytes = encoder.encode(payload);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      payloadBytes
    );

    if (!isValid) {
      return null; // Assinatura forjada ou adulterada
    }

    return {
      adminId,
      username,
      role,
      createdAt,
    };
  } catch (error) {
    return null;
  }
}
