import { NextResponse, NextRequest } from 'next/server';
import { generatePassData } from '@/lib/wallet-pass-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  if (!token || !token.trim()) {
    return NextResponse.json(
      { error: 'Token não fornecido ou inválido' },
      { status: 404 }
    );
  }

  const passData = await generatePassData(token.trim());

  if (!passData || !passData.googleWallet) {
    return NextResponse.json(
      { error: 'Carteira não localizada para este token' },
      { status: 404 }
    );
  }

  const url = new URL(request.url);
  const shouldRedirect = url.searchParams.get('redirect') === 'true';

  if (shouldRedirect) {
    return NextResponse.redirect(passData.googleWallet.saveUrl);
  }

  return NextResponse.json(
    {
      success: true,
      saveUrl: passData.googleWallet.saveUrl,
      jwt: passData.googleWallet.jwt,
      googleWallet: passData.googleWallet,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
