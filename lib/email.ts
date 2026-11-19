import 'server-only'

const DEFAULT_RECIPIENT = 'kailodgemv@gmail.com'
const DEFAULT_SENDER = 'Kai Lodge Website <onboarding@resend.dev>'

export type EmailDelivery =
  | { ok: true }
  | { ok: false; reason: 'not_configured' | 'delivery_failed' }

export async function sendWebsiteEmail({
  subject,
  text,
  replyTo,
}: {
  subject: string
  text: string
  replyTo?: string
}): Promise<EmailDelivery> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: 'not_configured' }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM?.trim() || DEFAULT_SENDER,
        to: [process.env.CONTACT_EMAIL_TO?.trim() || DEFAULT_RECIPIENT],
        subject,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('[kai-lodge] email delivery failed', response.status, await response.text())
      return { ok: false, reason: 'delivery_failed' }
    }
    return { ok: true }
  } catch (error) {
    console.error('[kai-lodge] email delivery failed', error)
    return { ok: false, reason: 'delivery_failed' }
  }
}
