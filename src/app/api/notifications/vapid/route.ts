import { NextResponse } from 'next/server';

// Endpoint sencillo que devuelve la clave pública VAPID desde una variable de entorno
// Usa NEXT_PUBLIC_VAPID_PUBLIC_KEY para que esté disponible en el cliente
export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  return NextResponse.json({ publicKey });
}
