import Anthropic from '@anthropic-ai/sdk'

const LS_KEY = 'revuze_anthropic_key'

export const getApiKey = (): string =>
  localStorage.getItem(LS_KEY)?.trim() ||
  (import.meta.env.VITE_ANTHROPIC_API_KEY || '').trim()

export const setApiKey = (key: string) => {
  const trimmed = key.trim()
  if (trimmed) localStorage.setItem(LS_KEY, trimmed)
  else localStorage.removeItem(LS_KEY)
}

export const clearApiKey = () => localStorage.removeItem(LS_KEY)

export const testApiKey = async (key: string): Promise<{ ok: boolean; error?: string }> => {
  const trimmed = key.trim()
  if (!trimmed) return { ok: false, error: 'No API key provided.' }
  try {
    const client = new Anthropic({ apiKey: trimmed, dangerouslyAllowBrowser: true })
    await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 5,
      messages: [{ role: 'user', content: 'hi' }],
    })
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    // Simplify common error messages
    if (msg.includes('401') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('authentication'))
      return { ok: false, error: 'Invalid API key — check it in your Anthropic Console.' }
    if (msg.includes('403') || msg.toLowerCase().includes('permission'))
      return { ok: false, error: 'API key has no permissions or billing is not activated.' }
    if (msg.includes('429'))
      return { ok: false, error: 'Rate limit hit — but the key is valid!' }
    return { ok: false, error: msg }
  }
}
