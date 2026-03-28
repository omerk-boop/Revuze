import Anthropic from '@anthropic-ai/sdk'
import { v4 as uuidv4 } from 'uuid'
import type { Dashboard, Widget } from '../types/dashboard'
import { DEFAULT_FILTER, DEFAULT_COMPARE_RANGE } from '../types/dashboard'
import { getApiKey } from './apiKey'

// ─── Tool definitions ─────────────────────────────────────────────────────────
// Each tool maps directly to one widget type. Claude calls these instead of
// generating raw JSON — the API validates all inputs, so malformed configs
// are impossible by construction.

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'add_kpi_card',
    description: 'Add a single KPI metric card with trend vs prior period. Use for any single number, score, or count.',
    input_schema: {
      type: 'object',
      properties: {
        title:  { type: 'string' },
        metric: { type: 'string', enum: ['sentiment', 'volume', 'reviews_star_rating', 'pdp_star_rating', 'products', 'brands'] },
        x: { type: 'number', description: 'Grid column 0–9 (cards are 3 wide, place at 0,3,6,9)' },
        y: { type: 'number', description: 'Grid row' },
      },
      required: ['title', 'metric', 'x', 'y'],
    },
  },
  {
    name: 'add_time_series',
    description: 'Add a LINE chart showing metrics over time (weekly). Use for: "trend", "over time", "line chart", "how has X changed".',
    input_schema: {
      type: 'object',
      properties: {
        title:   { type: 'string' },
        metrics: {
          type: 'array',
          items: { type: 'string', enum: ['sentiment', 'volume', 'reviews_star_rating'] },
          description: 'Which metrics to plot as lines. Include all that are relevant.',
        },
        x: { type: 'number' }, y: { type: 'number' },
      },
      required: ['title', 'metrics', 'x', 'y'],
    },
  },
  {
    name: 'add_stacked_bar',
    description: 'Add a STACKED COLUMN BAR chart showing weekly review volume per brand stacked. Use for: "bar chart", "stacked bar", "column chart", "stacked column", "volume by brand", "brand share".',
    input_schema: {
      type: 'object',
      properties: {
        title:  { type: 'string' },
        brands: { type: 'array', items: { type: 'string' }, description: 'Brand names to compare. Leave empty [] to use dashboard filter.' },
        x: { type: 'number' }, y: { type: 'number' },
      },
      required: ['title', 'brands', 'x', 'y'],
    },
  },
  {
    name: 'add_brand_lines',
    description: 'Add a MULTI-LINE chart showing review volume per brand over time, one line per brand. Use for: "brand comparison", "brand trends", "compare brands over time".',
    input_schema: {
      type: 'object',
      properties: {
        title:  { type: 'string' },
        brands: { type: 'array', items: { type: 'string' }, description: 'Brand names. Leave empty [] to use dashboard filter.' },
        x: { type: 'number' }, y: { type: 'number' },
      },
      required: ['title', 'brands', 'x', 'y'],
    },
  },
  {
    name: 'add_topics_table',
    description: 'Add a ranked table of product topics (Ease of use, Comfort, Safety, etc.) showing volume, sentiment and trends.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        mode:  { type: 'string', enum: ['growing', 'decreasing', 'all'], description: '"growing" = gaining momentum, "decreasing" = losing, "all" = both sorted by volume' },
        limit: { type: 'number', description: 'Number of topics to show, default 10' },
        x: { type: 'number' }, y: { type: 'number' },
      },
      required: ['title', 'mode', 'x', 'y'],
    },
  },
  {
    name: 'add_topics_scatter',
    description: 'Add a scatter plot of topics: X=sentiment score, Y=review volume. Shows which topics are high-impact.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        limit: { type: 'number', description: 'Max topics to plot, default 20' },
        x: { type: 'number' }, y: { type: 'number' },
      },
      required: ['title', 'x', 'y'],
    },
  },
  {
    name: 'add_products_table',
    description: 'Add a product catalog table showing each product with review count, star rating, and sentiment score.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        size:  { type: 'number', description: 'Number of products to show, default 20' },
        x: { type: 'number' }, y: { type: 'number' },
      },
      required: ['title', 'x', 'y'],
    },
  },
  {
    name: 'add_custom_chart',
    description: `Add a fully custom chart for any visualization not covered by the other tools.
Use this for: area charts, mixed bar+line, dual-axis charts, custom groupings, pie-style data, any novel visual the user requests.
You write a small JS transform that converts raw API data into a chart spec. The renderer handles the rest.

ENDPOINT OPTIONS:
- "key_metrics_overtime" → { data: [{date, volume, sentiment, reviews_star_rating}] }
- "topics_trends"        → { growing: { data: [{name, volume, sentiment, volume_trend, sentiment_trend}] }, decreasing: { data: [...] } }
- "statistics_totals"    → { sentiment, volume, reviews_star_rating, pdp_star_rating, products, brands, ...trends }
- "products"             → { products: [{name, brand, sentiment_data:{sentiment}, reviews_data:{reviews}, reviews_star_rating:{avg}}] }

TRANSFORM CODE RULES:
- Receives two arguments: \`data\` (raw API response as above) and \`dateFns\` ({format, parseISO})
- Must return an object: { chartData, xKey, series, rightAxisKeys? }
- chartData: array of plain objects, one per x-axis point
- xKey: string — the property name used for the x-axis
- series: array of { kind, dataKey, name, color, stackId?, yAxisId? }
  - kind: "bar" | "line" | "area"
  - stackId: set same string on multiple bars to stack them
  - yAxisId: "left" (default) or "right" for dual-axis
- Do NOT use JSX, import statements, or require(). Plain ES6 only.

EXAMPLE — area chart of sentiment over time:
const pts = data.data.map(d => ({ week: dateFns.format(dateFns.parseISO(d.date), 'MMM d'), sentiment: Math.round(d.sentiment), volume: d.volume }))
return { chartData: pts, xKey: 'week', series: [{ kind: 'area', dataKey: 'sentiment', name: 'Sentiment', color: '#6366f1' }, { kind: 'bar', dataKey: 'volume', name: 'Volume', color: '#0ea5e9', yAxisId: 'right' }] }

EXAMPLE — topics bar chart (top 10 by volume):
const topics = [...data.growing.data, ...data.decreasing.data].sort((a,b) => b.volume - a.volume).slice(0, 10)
const chartData = topics.map(t => ({ topic: t.name.length > 16 ? t.name.slice(0,14)+'…' : t.name, volume: t.volume, sentiment: Math.round(t.sentiment) }))
return { chartData, xKey: 'topic', series: [{ kind: 'bar', dataKey: 'volume', name: 'Volume', color: '#6366f1' }, { kind: 'line', dataKey: 'sentiment', name: 'Sentiment %', color: '#f59e0b', yAxisId: 'right' }] }`,
    input_schema: {
      type: 'object',
      properties: {
        title:          { type: 'string', description: 'Widget title' },
        endpoint:       { type: 'string', enum: ['key_metrics_overtime', 'topics_trends', 'statistics_totals', 'products'], description: 'Which API to call for data' },
        transform_code: { type: 'string', description: 'JS function body (no JSX, no imports). Receives (data, dateFns). Must return {chartData, xKey, series}.' },
        x: { type: 'number' }, y: { type: 'number' },
      },
      required: ['title', 'endpoint', 'transform_code', 'x', 'y'],
    },
  },
  {
    name: 'add_star_rating_bar',
    description: 'Add a stacked bar chart showing review VOLUME broken down by star rating (1★–5★) over time. Each bar is a week; each segment is a star rating coloured red→green. Use for: "star rating distribution", "rating breakdown", "how many 1-star vs 5-star reviews", "review quality distribution".',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        x: { type: 'number' }, y: { type: 'number' },
      },
      required: ['title', 'x', 'y'],
    },
  },
]

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an AI dashboard builder for Revuze CI Hub, a consumer review analytics platform for baby and juvenile products (strollers, car seats, etc.).

You build dashboards by calling tools — one tool call per widget. Do NOT output any text or JSON, only tool calls.

## Layout Rules (12-column grid, row-height = 80px)
- KPI cards: always w=3, h=2. Place up to 4 per row at x=0,3,6,9. Start at y=0.
- Full-width charts/tables: w=12, h=5. Place below KPI row (y=2 or higher).
- Never overlap: increment y after each row. KPI row takes 2 rows, chart rows take 5.

## Available Retailers (domains)
amazon.com→"www.amazon.com", walmart→"www.walmart.com", target→"www.target.com",
babylist→"www.babylist.com", kohls→"www.kohls.com", buybuy baby→"buybuybaby.com"

## Tool Selection Guide
- "sentiment score / rating / volume / brands / products" → add_kpi_card
- "trend" / "over time" / "line" / "how has X changed" → add_time_series
- "star rating distribution" / "rating breakdown" / "1-star vs 5-star" / "review quality" → add_star_rating_bar
- "bar chart by brand" / "stacked bar" / "brand volume column" → add_stacked_bar
- "brand comparison" / "compare brands" / "brand lines" → add_brand_lines
- "topics table" / "growing topics" / "declining topics" → add_topics_table
- ANY other chart (area, mixed, dual-axis, custom grouping, novel visual) → add_custom_chart
- "scatter" / "topic map" / "sentiment vs volume" → add_topics_scatter
- "products" / "product list" / "catalog" → add_products_table

## Workflow
1. Add only what the user explicitly asks for — do not add extra widgets
2. If the user asks for a chart, add that chart only
3. If the user asks for a full dashboard overview, then add KPI cards + charts
4. KPI cards go in the first row (y=0, x=0/3/6/9); charts/tables below (y=2+)`

// ─── Tool-call → Widget mapping ───────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toolCallToWidget(name: string, input: Record<string, any>): Widget | null {
  const layout = {
    x: input.x ?? 0,
    y: input.y ?? 0,
    w: 12,
    h: 5,
  }

  switch (name) {
    case 'add_kpi_card':
      return { id: uuidv4(), type: 'kpi_card', title: input.title, config: { metric: input.metric }, layout: { ...layout, w: 3, h: 2 } }
    case 'add_time_series':
      return { id: uuidv4(), type: 'time_series', title: input.title, config: { metrics: input.metrics ?? ['sentiment', 'volume'] }, layout }
    case 'add_stacked_bar':
      return { id: uuidv4(), type: 'stacked_bar', title: input.title, config: { brands: input.brands ?? [] }, layout }
    case 'add_brand_lines':
      return { id: uuidv4(), type: 'brand_reviews_overtime', title: input.title, config: { brands: input.brands ?? [] }, layout }
    case 'add_topics_table':
      return { id: uuidv4(), type: 'topics_table', title: input.title, config: { mode: input.mode ?? 'all', limit: input.limit ?? 10 }, layout }
    case 'add_topics_scatter':
      return { id: uuidv4(), type: 'topics_scatter', title: input.title, config: { limit: input.limit ?? 20 }, layout }
    case 'add_products_table':
      return { id: uuidv4(), type: 'products_table', title: input.title, config: { size: input.size ?? 20 }, layout }
    case 'add_star_rating_bar':
      return { id: uuidv4(), type: 'star_rating_bar', title: input.title, config: {}, layout }
    case 'add_custom_chart':
      return { id: uuidv4(), type: 'custom_chart', title: input.title, config: { endpoint: input.endpoint, transformCode: input.transform_code }, layout }
    default:
      return null
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface AIGenerateResult {
  dashboard: Partial<Dashboard>
  mode: 'replace' | 'append'
}

export const generateDashboard = async (
  prompt: string,
  existingDashboard?: Partial<Dashboard>
): Promise<AIGenerateResult> => {
  const apiKey = getApiKey()
  if (!apiKey || apiKey === 'sk-ant-...') {
    throw new Error('No Anthropic API key set. Click the key button (🔑) in the header to add your key.')
  }

  const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const isAdding = existingDashboard && (existingDashboard.widgets?.length ?? 0) > 0

  const userMessage = isAdding
    ? `The dashboard already has these widgets:\n${existingDashboard!.widgets!.map(w => `- ${w.type}: "${w.title}" at y=${w.layout?.y}`).join('\n')}\n\nUser request: ${prompt}\n\nAdd NEW widgets below the existing ones. The highest existing y is ${existingDashboard!.widgets!.reduce((m, w) => Math.max(m, (w.layout?.y ?? 0) + (w.layout?.h ?? 3)), 0)}. Start new widgets at that y or higher.`
    : prompt

  let response: Anthropic.Message
  try {
    response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      // 'any' forces Claude to call at least one tool — prevents it returning plain text
      tool_choice: { type: 'any' },
      messages: [{ role: 'user', content: userMessage }],
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const preview = apiKey.substring(0, 12) + '...'
    throw new Error(`API call failed (key: ${preview}). ${msg}`)
  }

  console.log('[AI] stop_reason:', response.stop_reason)
  console.log('[AI] tool calls:', response.content.filter(c => c.type === 'tool_use').map(c => c.type === 'tool_use' ? `${c.name}(${JSON.stringify(c.input)})` : ''))

  // Extract tool calls from response
  const toolUses = response.content.filter((c): c is Anthropic.ToolUseBlock => c.type === 'tool_use')

  if (toolUses.length === 0) {
    const text = response.content.find(c => c.type === 'text')
    throw new Error((text as Anthropic.TextBlock | undefined)?.text || 'AI did not return any widgets. Try rephrasing your request.')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const widgets = toolUses
    .map(t => toolCallToWidget(t.name, t.input as Record<string, any>))
    .filter((w): w is Widget => w !== null)

  if (widgets.length === 0) {
    throw new Error('AI returned no recognised widget tools. Try rephrasing your request.')
  }

  return {
    mode: isAdding ? 'append' : 'replace',
    dashboard: {
      // Derive a name from the prompt (truncated) — user can rename in the toolbar
      name: prompt.length > 50 ? prompt.slice(0, 47) + '…' : prompt,
      filter: existingDashboard?.filter ?? DEFAULT_FILTER,
      compare_range: existingDashboard?.compare_range ?? DEFAULT_COMPARE_RANGE,
      widgets,
    },
  }
}
