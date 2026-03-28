import Anthropic from '@anthropic-ai/sdk'
import { getApiKey } from './apiKey'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = (context: string) => `\
You are an expert data analyst embedded in the Revuze consumer-review analytics platform.
The user is viewing a dashboard. Below is a snapshot of the dashboard's data — use it to answer questions precisely and concisely.
When citing numbers, be specific. If a question can't be answered from the data provided, say so honestly rather than guessing.
Keep answers conversational and focused — no lengthy preambles.

${context}`

export async function sendChatMessage(
  messages: ChatMessage[],
  context: string
): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('No Anthropic API key configured.')

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT(context),
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude.')
  return block.text
}
