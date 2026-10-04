/**
 * Utilitário de sanitização de strings para proteção contra XSS armazenado
 * e caracteres de injeção em formulários do La Marka Club.
 */

export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '') // Remove tags HTML completas
    .replace(/[<>'"]/g, '')   // Remove caracteres de escape perigosos
    .trim();
}

export function sanitizeName(name: unknown): string {
  if (typeof name !== 'string') return '';
  return sanitizeText(name).slice(0, 100);
}

export function sanitizePhone(phone: unknown): string {
  if (typeof phone !== 'string') return '';
  return phone.replace(/\D/g, '').slice(0, 15);
}

export function sanitizeNotes(notes: unknown): string {
  if (typeof notes !== 'string') return '';
  return sanitizeText(notes).slice(0, 500);
}
