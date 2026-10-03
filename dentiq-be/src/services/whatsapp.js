import { config } from '../config.js'

const GRAPH = 'https://graph.facebook.com/v25.0'

// Business-initiated messages must use a template approved in WhatsApp Manager.
export async function sendTemplate(phone10, template, params) {
  const { token, phoneNumberId, lang } = config.whatsapp
  const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: `91${phone10}`,
      type: 'template',
      template: { name: template, language: { code: lang }, components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text: String(text) })) }] },
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message || `WhatsApp API ${res.status}`)
  }
  return res.json()
}

// Free fallback: a link that opens WhatsApp with the message typed in, doctor taps Send.
export const waLink = (phone10, text) => `https://wa.me/91${phone10}?text=${encodeURIComponent(text)}`
