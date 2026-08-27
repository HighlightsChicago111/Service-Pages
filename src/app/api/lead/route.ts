import {NextResponse} from 'next/server'

const allowedFields = ['name', 'phone', 'address', 'buildingType', 'issue', 'service', 'area'] as const

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null
  if (!payload || payload.website) return NextResponse.json({ok: true})
  if (!payload.name || !payload.phone) return NextResponse.json({message: 'Name and phone are required'}, {status: 400})
  const webhookUrl = process.env.LEAD_WEBHOOK_URL
  if (!webhookUrl) return NextResponse.json({message: 'Lead delivery is not configured'}, {status: 503})
  const clean = Object.fromEntries(allowedFields.map((field) => [field, String(payload[field] || '').slice(0, 1000)]))
  const headers: Record<string, string> = {'content-type': 'application/json'}
  if (process.env.LEAD_WEBHOOK_BEARER_TOKEN) headers.authorization = `Bearer ${process.env.LEAD_WEBHOOK_BEARER_TOKEN}`
  const response = await fetch(webhookUrl, {method: 'POST', headers, body: JSON.stringify(clean), cache: 'no-store'})
  if (!response.ok) return NextResponse.json({message: 'Lead delivery failed'}, {status: 502})
  return NextResponse.json({ok: true})
}
