/**
 * Retorna a URL base canônica da aplicação.
 * Prioriza NEXT_PUBLIC_APP_URL, depois o domínio de produção oficial da Vercel (sem hash aleatório),
 * depois VERCEL_URL e por fim o domínio padrão do La Marka Club.
 */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NODE_ENV === 'production'
    ? 'https://la-marka-club-lazzaretti.vercel.app'
    : 'http://localhost:3000';
}
