import { useState, useRef, useEffect, useCallback } from 'react'
import type { KeyboardEvent, ChangeEvent } from 'react'
import { Sparkles, Send, Loader2, RefreshCw } from 'lucide-react'
import type { Dashboard } from '../../types/dashboard'
import { generateDashboard } from '../../services/ai'

interface AIPromptBarProps {
  dashboard?: Partial<Dashboard>
  onGenerated: (dashboard: Partial<Dashboard>, prompt: string, mode: 'replace' | 'append') => void
  isNewDashboard?: boolean
}

// ─── Slash-command definitions ────────────────────────────────────────────────

interface SlashOption {
  label: string
  description?: string
  insert: string
  emoji: string
}

interface SlashCommand {
  trigger: string      // e.g. 'visual'
  label: string        // header shown in dropdown
  options: SlashOption[]
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    trigger: 'visual',
    label: 'Choose a visual type',
    options: [
      { emoji: '🔢', label: 'KPI Card',               description: 'Single metric with trend vs prior period', insert: 'KPI card showing' },
      { emoji: '📈', label: 'Line Chart',              description: 'Metric trend over time',                  insert: 'line chart of' },
      { emoji: '📊', label: 'Stacked Bar by Brand',   description: 'Review volume per brand over time',       insert: 'stacked bar chart of review volume per brand' },
      { emoji: '⭐', label: 'Star Rating Bar',         description: 'Star rating distribution over time',      insert: 'stacked column bar showing star rating distribution over time, show this as monthly' },
      { emoji: '🥧', label: 'Pie Chart',               description: 'Share or distribution breakdown',         insert: 'pie chart showing distribution of' },
      { emoji: '📉', label: 'Area Chart',              description: 'Volume or sentiment area over time',      insert: 'area chart showing' },
      { emoji: '〰️', label: 'Multi-line by Brand',    description: 'One line per brand over time',            insert: 'multi-line chart comparing brands over time showing' },
      { emoji: '📋', label: 'Topics Table',            description: 'Growing or declining topics',             insert: 'table of growing and declining topics showing volume and sentiment' },
      { emoji: '🔵', label: 'Topics Scatter Plot',    description: 'Topics by sentiment vs volume',           insert: 'scatter plot of topics mapped by sentiment and review volume' },
      { emoji: '📦', label: 'Products Table',          description: 'Product catalog with review metrics',     insert: 'products table showing review count, star rating and sentiment' },
    ],
  },
  {
    trigger: 'metric',
    label: 'Choose a metric',
    options: [
      { emoji: '😊', label: 'Sentiment Score',    description: 'Positive review sentiment %',     insert: 'sentiment score' },
      { emoji: '📝', label: 'Review Volume',       description: 'Total number of reviews',         insert: 'review volume' },
      { emoji: '⭐', label: 'Star Rating',         description: 'Average star rating (1–5★)',      insert: 'average star rating' },
      { emoji: '🛒', label: 'PDP Star Rating',     description: 'Product page star rating',        insert: 'PDP star rating' },
      { emoji: '📦', label: 'Product Count',       description: 'Number of tracked products',      insert: 'product count' },
      { emoji: '🏷️', label: 'Brand Count',         description: 'Number of tracked brands',        insert: 'brand count' },
    ],
  },
  {
    trigger: 'timeframe',
    label: 'Choose a time period',
    options: [
      { emoji: '📅', label: 'Last 3 months',    insert: 'for the last 3 months' },
      { emoji: '📅', label: 'Last 6 months',    insert: 'for the last 6 months' },
      { emoji: '📅', label: 'Last 12 months',   insert: 'for the last 12 months' },
      { emoji: '📅', label: 'Last 24 months',   insert: 'for the last 24 months' },
      { emoji: '🗓️', label: 'Weekly view',      insert: 'shown weekly' },
      { emoji: '🗓️', label: 'Monthly view',     insert: 'shown monthly' },
      { emoji: '🗓️', label: 'Quarterly view',   insert: 'shown quarterly' },
    ],
  },
]

// ─── Slash-menu state ─────────────────────────────────────────────────────────

type MenuState =
  | { kind: 'root'; startIndex: number; selectedIndex: number }
  | { kind: 'command'; command: SlashCommand; startIndex: number; selectedIndex: number }
  | null

// ─── Component ────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'Show me sentiment and volume trends for the last 6 months',
  'Create an overview with all key metrics and trending topics',
  'Analyze Amazon vs Walmart performance',
  'Show growing topics with sentiment breakdown',
  'Build a stroller category performance dashboard',
]

export default function AIPromptBar({ dashboard, onGenerated, isNewDashboard = false }: AIPromptBarProps) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [menu, setMenu] = useState<MenuState>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const trimmed = prompt.trim()
    if (!trimmed || loading) return
    setMenu(null)
    setLoading(true)
    setError(null)
    try {
      const result = await generateDashboard(trimmed, isNewDashboard ? undefined : dashboard)
      setHistory((h) => [trimmed, ...h.slice(0, 4)])
      setPrompt('')
      onGenerated(result.dashboard, trimmed, result.mode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate dashboard')
    } finally {
      setLoading(false)
    }
  }

  // ── Slash-command detection ────────────────────────────────────────────────

  const detectMenu = useCallback((text: string, cursor: number): MenuState => {
    // Look backwards from cursor for a slash token
    const before = text.slice(0, cursor)
    const match = before.match(/\/(\w*)$/)
    if (!match) return null

    const typed = match[1].toLowerCase()
    const startIndex = before.length - match[0].length

    // Exact match → show options for that command
    const exact = SLASH_COMMANDS.find(c => c.trigger === typed)
    if (exact) return { kind: 'command', command: exact, startIndex, selectedIndex: 0 }

    // Partial / empty → show root command picker (filtered)
    const filtered = typed === '' ? SLASH_COMMANDS : SLASH_COMMANDS.filter(c => c.trigger.startsWith(typed))
    if (filtered.length === 0) return null

    // If only one matches and user typed it fully (but no trailing space yet), show its options
    if (filtered.length === 1 && filtered[0].trigger.startsWith(typed)) {
      if (typed === filtered[0].trigger) return { kind: 'command', command: filtered[0], startIndex, selectedIndex: 0 }
    }

    return { kind: 'root', startIndex, selectedIndex: 0 }
  }, [])

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setPrompt(val)
    const cursor = e.target.selectionStart ?? val.length
    setMenu(detectMenu(val, cursor))
  }

  // ── Apply selected option ──────────────────────────────────────────────────

  const applyOption = useCallback((insert: string, startIndex: number) => {
    const cursor = textareaRef.current?.selectionStart ?? prompt.length
    const after = prompt.slice(cursor)
    const newPrompt = prompt.slice(0, startIndex) + insert + (after.startsWith(' ') ? '' : ' ') + after
    setPrompt(newPrompt)
    setMenu(null)
    // Restore focus + move cursor to end of inserted text
    setTimeout(() => {
      const ta = textareaRef.current
      if (!ta) return
      ta.focus()
      const pos = startIndex + insert.length + 1
      ta.setSelectionRange(pos, pos)
    }, 0)
  }, [prompt])

  const applyRootOption = useCallback((command: SlashCommand, startIndex: number) => {
    // Replace the slash token with /trigger so user can see the command options
    const cursor = textareaRef.current?.selectionStart ?? prompt.length
    const after = prompt.slice(cursor)
    const partial = prompt.slice(0, startIndex) + '/' + command.trigger
    setPrompt(partial + after)
    setMenu({ kind: 'command', command, startIndex, selectedIndex: 0 })
    setTimeout(() => {
      const ta = textareaRef.current
      if (!ta) return
      ta.focus()
      const pos = partial.length
      ta.setSelectionRange(pos, pos)
    }, 0)
  }, [prompt])

  // ── Keyboard navigation ────────────────────────────────────────────────────

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (menu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMenu(m => {
          if (!m) return m
          const count = m.kind === 'root' ? SLASH_COMMANDS.length : m.command.options.length
          return { ...m, selectedIndex: (m.selectedIndex + 1) % count }
        })
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMenu(m => {
          if (!m) return m
          const count = m.kind === 'root' ? SLASH_COMMANDS.length : m.command.options.length
          return { ...m, selectedIndex: (m.selectedIndex - 1 + count) % count }
        })
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        if (menu.kind === 'root') {
          applyRootOption(SLASH_COMMANDS[menu.selectedIndex], menu.startIndex)
        } else {
          const opt = menu.command.options[menu.selectedIndex] as SlashOption
          applyOption(opt.insert, menu.startIndex)
        }
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setMenu(null)
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // ── Close menu on outside click ────────────────────────────────────────────

  useEffect(() => {
    if (!menu) return
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        textareaRef.current && !textareaRef.current.contains(e.target as Node)
      ) setMenu(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menu])

  // ── Render ─────────────────────────────────────────────────────────────────

  const rootCommands = SLASH_COMMANDS  // for root menu

  return (
    <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 bg-brand-600 rounded flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs font-bold text-white uppercase tracking-wider">
          {isNewDashboard ? 'Describe your dashboard' : 'Add or modify with AI'}
        </span>
        {!isNewDashboard && dashboard?.widgets && dashboard.widgets.length > 0 && (
          <span className="text-[11px] text-slate-500 ml-1">· new widgets will be added below existing ones</span>
        )}
      </div>

      {/* Textarea + slash-command dropdown */}
      <div className="relative">

        {/* Slash-command dropdown (floats above the textarea) */}
        {menu && (
          <div
            ref={menuRef}
            className="absolute top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {menu.kind === 'root' ? (
              <>
                <div className="px-3 py-2 border-b border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Slash commands</span>
                </div>
                {rootCommands.map((cmd, i) => (
                  <button
                    key={cmd.trigger}
                    onMouseDown={(e) => { e.preventDefault(); applyRootOption(cmd, menu.startIndex) }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      menu.selectedIndex === i ? 'bg-brand-600/20 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-sm font-mono text-brand-400 w-24 shrink-0">/{cmd.trigger}</span>
                    <span className="text-xs text-slate-400">{cmd.label}</span>
                  </button>
                ))}
              </>
            ) : (
              <>
                <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-2">
                  <span className="text-[10px] font-mono text-brand-400">/{menu.command.trigger}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">— {menu.command.label}</span>
                </div>
                {menu.command.options.map((opt, i) => (
                  <button
                    key={opt.label}
                    onMouseDown={(e) => { e.preventDefault(); applyOption(opt.insert, menu.startIndex) }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      menu.selectedIndex === i ? 'bg-brand-600/20 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-base leading-none shrink-0">{opt.emoji}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold">{opt.label}</span>
                      {opt.description && (
                        <span className="block text-[10px] text-slate-500 truncate">{opt.description}</span>
                      )}
                    </span>
                    {menu.selectedIndex === i && (
                      <kbd className="text-[9px] text-slate-500 border border-slate-700 rounded px-1 py-0.5 shrink-0">↵</kbd>
                    )}
                  </button>
                ))}
              </>
            )}

            <div className="px-3 py-1.5 border-t border-slate-800 flex items-center gap-3">
              <span className="text-[9px] text-slate-600">↑↓ navigate</span>
              <span className="text-[9px] text-slate-600">↵ / Tab select</span>
              <span className="text-[9px] text-slate-600">Esc close</span>
            </div>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isNewDashboard
              ? 'e.g. "Show me sentiment trends and top growing topics for Amazon" — type / for quick options'
              : 'e.g. "Add a topics scatter plot" — type / for quick options'
          }
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pr-12 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40 transition-colors"
          disabled={loading}
        />
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim() || loading}
          className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center rounded-md bg-brand-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-700 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Slash-command hint */}
      {!menu && (
        <p className="mt-1.5 text-[10px] text-slate-600">
          Type{' '}
          <code className="text-brand-500 font-mono">/visual</code>,{' '}
          <code className="text-brand-500 font-mono">/metric</code>{' '}
          or{' '}
          <code className="text-brand-500 font-mono">/timeframe</code>
          {' '}for quick selectors
        </p>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}

      {/* Suggestions */}
      {isNewDashboard && !prompt && !loading && (
        <div className="mt-3">
          <p className="text-xs text-slate-500 mb-2">Try one of these:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {!isNewDashboard && history.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-slate-500 mb-1.5">Recent prompts:</p>
          <div className="flex flex-col gap-1">
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => setPrompt(h)}
                className="flex items-center gap-2 text-xs text-left text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RefreshCw className="w-3 h-3 shrink-0" />
                <span className="truncate">{h}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
