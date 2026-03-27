import { useState, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { Sparkles, Send, Loader2, RefreshCw } from 'lucide-react'
import type { Dashboard } from '../../types/dashboard'
import { generateDashboard } from '../../services/ai'

interface AIPromptBarProps {
  dashboard?: Partial<Dashboard>
  onGenerated: (dashboard: Partial<Dashboard>, prompt: string) => void
  isNewDashboard?: boolean
}

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async () => {
    const trimmed = prompt.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError(null)

    try {
      const result = await generateDashboard(trimmed, isNewDashboard ? undefined : dashboard)
      setHistory((h) => [trimmed, ...h.slice(0, 4)])
      setPrompt('')
      onGenerated(result.dashboard, trimmed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-5 border border-slate-700">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-white">
          {isNewDashboard ? 'Describe your dashboard' : 'Refine with AI'}
        </span>
        {!isNewDashboard && dashboard?.name && (
          <span className="text-xs text-slate-400 ml-1">— modifying "{dashboard.name}"</span>
        )}
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isNewDashboard
              ? 'e.g. "Show me sentiment trends and top growing topics for Amazon over the last 6 months"'
              : 'e.g. "Add a topics scatter plot" or "Filter to Walmart only"'
          }
          rows={2}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
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
                className="text-xs px-3 py-1.5 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors border border-slate-600"
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
