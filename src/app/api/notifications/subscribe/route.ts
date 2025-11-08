import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // En producción deberías validar y almacenar esta subscription (ej. en Supabase)
    console.log('New push subscription:', JSON.stringify(body.subscription));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error receiving subscription', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
