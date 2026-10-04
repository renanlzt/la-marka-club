/**
 * Limitador de Taxa em Memória (Sliding Window Rate Limiter)
 * Protege endpoints críticos (como login e criação de contas) contra ataques de força bruta.
 */

interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Limpeza periódica de entradas expiradas a cada 10 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now - record.lastAttempt > 30 * 60 * 1000) {
        rateLimitMap.delete(key);
      }
    }
  }, 10 * 60 * 1000).unref?.();
}

/**
 * Verifica se a chave excedeu o limite de requisições na janela de tempo especificada.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutos
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record) {
    return {
      allowed: true,
      remaining: maxAttempts,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  // Se a janela expirou, reseta o contador
  if (now - record.firstAttempt > windowMs) {
    rateLimitMap.delete(key);
    return {
      allowed: true,
      remaining: maxAttempts,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  const remaining = Math.max(0, maxAttempts - record.attempts);
  const resetInSeconds = Math.ceil((record.firstAttempt + windowMs - now) / 1000);

  return {
    allowed: record.attempts < maxAttempts,
    remaining,
    resetInSeconds,
  };
}

/**
 * Registra uma tentativa falha para a chave.
 */
export function recordFailedAttempt(
  key: string,
  windowMs: number = 15 * 60 * 1000
): { remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now - record.firstAttempt > windowMs) {
    rateLimitMap.set(key, {
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
    return {
      remaining: 4,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  record.attempts += 1;
  record.lastAttempt = now;

  const resetInSeconds = Math.ceil((record.firstAttempt + windowMs - now) / 1000);
  return {
    remaining: Math.max(0, 5 - record.attempts),
    resetInSeconds,
  };
}

/**
 * Reseta o contador de tentativas após sucesso na autenticação.
 */
export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}
