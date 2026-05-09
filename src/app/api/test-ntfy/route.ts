import { sendNotification } from '@/lib/ntfy'
import { NextResponse } from 'next/server'

export async function GET() {
  const topic = process.env.NTFY_TOPIC
  try {
    await sendNotification('Frisbee Golf', 'Test notification — if you see this, ntfy is working!')
    return NextResponse.json({ ok: true, topic })
  } catch (err: any) {
    return NextResponse.json({ ok: false, topic, error: err.message }, { status: 500 })
  }
}
