import { NextResponse } from 'next/server';

// Endpoint sencillo que devuelve la clave pública VAPID desde una variable de entorno
export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY || '';
  return NextResponse.json({ publicKey });
}
