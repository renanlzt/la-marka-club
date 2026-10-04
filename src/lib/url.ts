/**
 * Retorna a URL base canônica da aplicação.
 * Prioriza NEXT_PUBLIC_APP_URL ou utiliza o domínio oficial de produção lamarkaclub.vercel.app.
 */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://lamarkaclub.vercel.app';
  }
  return 'http://localhost:3000';
}
