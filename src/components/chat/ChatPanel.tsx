import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import type { Dashboard } from '../../types/dashboard'
import { buildDashboardContext } from '../../services/chatContext'
import { sendChatMessage } from '../../services/chat'
import type { ChatMessage } from '../../services/chat'

interface Props {
  dashboard: Dashboard
  onClose: () => void
}

type ContextState = 'idle' | 'loading' | 'ready' | 'error'

export default function ChatPanel({ dashboard, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [contextState, setContextState] = useState<ContextState>('idle')
  const [contextError, setContextError] = useState('')
  const contextRef = useRef<string>('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Build context on open
  useEffect(() => {
    setContextState('loading')
    buildDashboardContext(dashboard)
      .then((ctx) => { contextRef.current = ctx; setContextState('ready') })
      .catch((err) => { setContextError(err.message); setContextState('error') })
  }, [dashboard])

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // Focus input when ready
  useEffect(() => {
    if (contextState === 'ready') inputRef.current?.focus()
  }, [contextState])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending || contextState !== 'ready') return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setSending(true)

    try {
      const reply = await sendChatMessage(newMessages, contextRef.current)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const errText = err instanceof Error ? err.message : 'Something went wrong.'
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${errText}` }])
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const retryContext = () => {
    setContextState('loading')
    setContextError('')
    buildDashboardContext(dashboard)
      .then((ctx) => { contextRef.current = ctx; setContextState('ready') })
      .catch((err) => { setContextError(err.message); setContextState('error') })
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 w-[400px] shrink-0 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-brand-600 to-indigo-600">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">Data Assistant</p>
            <p className="text-[10px] text-white/70 mt-0.5">Ask anything about this dashboard</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Context loading banner */}
      {contextState === 'loading' && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-50 border-b border-brand-100 text-brand-700 text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          Analyzing dashboard data…
        </div>
      )}
      {contextState === 'error' && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-red-50 border-b border-red-100 text-red-700 text-xs">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {contextError || 'Failed to load dashboard data.'}
          </div>
          <button onClick={retryContext} className="flex items-center gap-1 font-medium hover:underline shrink-0">
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}
      {contextState === 'ready' && messages.length === 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border-b border-emerald-100 text-emerald-700 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          Dashboard data loaded — ask me anything
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && contextState === 'ready' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 text-center font-medium">Try asking:</p>
            {[
              'Which brand has the highest sentiment?',
              'What are the top declining topics?',
              'How has review volume trended this period?',
              'Which product has the most reviews?',
            ].map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); inputRef.current?.focus() }}
                className="w-full text-left text-xs px-3 py-2 rounded-lg bg-slate-50 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 hover:border-brand-200 text-slate-600 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'user' ? 'bg-brand-600' : 'bg-slate-100 border border-slate-200'}`}>
              {msg.role === 'user'
                ? <User className="w-3.5 h-3.5 text-white" />
                : <Bot className="w-3.5 h-3.5 text-slate-500" />}
            </div>
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-brand-600 text-white rounded-tr-sm'
                : 'bg-slate-100 text-slate-800 rounded-tl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm bg-slate-100">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={contextState === 'ready' ? 'Ask about your data…' : 'Loading dashboard data…'}
            disabled={contextState !== 'ready' || sending}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 disabled:text-slate-400 transition-all max-h-32 overflow-y-auto"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || contextState !== 'ready'}
            className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
