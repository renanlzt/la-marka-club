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

  if (!passData) {
    return NextResponse.json(
      { error: 'Carteira não localizada para este token' },
      { status: 404 }
    );
  }

  const jsonBody = JSON.stringify(passData, null, 2);

  return new NextResponse(jsonBody, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename="lamarka-privilege-${token}.pkpass"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Apple-Pass-Type': passData.passTypeIdentifier,
    },
  });
}
