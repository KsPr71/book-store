import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Unsubscribe push endpoint called for:', body.endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error in unsubscribe', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
