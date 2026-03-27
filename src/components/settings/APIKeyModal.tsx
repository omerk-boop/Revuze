import { useState, useEffect } from 'react'
import { X, Key, Eye, EyeOff, CheckCircle2, XCircle, Loader2, ExternalLink, Trash2 } from 'lucide-react'
import { getApiKey, setApiKey, clearApiKey, testApiKey } from '../../services/apiKey'

interface APIKeyModalProps {
  onClose: () => void
}

export default function APIKeyModal({ onClose }: APIKeyModalProps) {
  const [key, setKey] = useState('')
  const [show, setShow] = useState(false)
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const existing = getApiKey()
    if (existing) setKey(existing)
  }, [])

  const handleTest = async () => {
    setTesting(true)
    setStatus('idle')
    const result = await testApiKey(key)
    setTesting(false)
    if (result.ok) {
      setStatus('ok')
    } else {
      setStatus('error')
      setErrorMsg(result.error ?? 'Unknown error')
    }
  }

  const handleSave = () => {
    setApiKey(key)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClear = () => {
    clearApiKey()
    setKey('')
    setStatus('idle')
  }

  const masked = key.length > 8 ? key.slice(0, 12) + '…' + key.slice(-4) : key

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center">
              <Key className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Anthropic API Key</h2>
              <p className="text-xs text-slate-500">Required for AI dashboard generation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* Instructions */}
          <div className="bg-brand-50 border border-brand-100 rounded-lg p-4">
            <p className="text-xs font-semibold text-brand-800 mb-2">How to get your API key:</p>
            <ol className="text-xs text-brand-700 space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="underline font-medium inline-flex items-center gap-0.5">console.anthropic.com <ExternalLink className="w-2.5 h-2.5" /></a></li>
              <li>Sign up or log in, then go to <strong>Settings → API Keys</strong></li>
              <li>Click <strong>Create Key</strong>, copy the key (starts with <code className="bg-brand-100 px-1 rounded">sk-ant-api03-</code>)</li>
              <li>Make sure <strong>billing is activated</strong> — add a payment method and at least $5 credit</li>
            </ol>
          </div>

          {/* Key input */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">API Key</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={key}
                onChange={(e) => { setKey(e.target.value); setStatus('idle') }}
                placeholder="sk-ant-api03-…"
                className="w-full pr-10 pl-3 py-2.5 text-sm border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40 text-slate-800 placeholder-slate-400"
              />
              <button
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {key && !show && (
              <p className="mt-1 text-[10px] text-slate-400 font-mono">{masked}</p>
            )}
          </div>

          {/* Status feedback */}
          {status === 'ok' && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-emerald-700">Key is valid and working.</span>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200">
              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700">Key validation failed</p>
                <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              disabled={!key.trim() || testing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Test Key
            </button>
            <button
              onClick={handleSave}
              disabled={!key.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:opacity-40 transition-colors shadow-sm"
            >
              {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
              {saved ? 'Saved!' : 'Save Key'}
            </button>
            {key && (
              <button
                onClick={handleClear}
                className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 pt-4">
            Your key is stored in your browser's localStorage and never sent anywhere except directly to the Anthropic API.
            It persists across page reloads but is cleared if you clear browser data.
          </p>
        </div>
      </div>
    </div>
  )
}
