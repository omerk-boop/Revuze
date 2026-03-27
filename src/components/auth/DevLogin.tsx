import { useState } from 'react'
import { Sparkles, Key, ExternalLink } from 'lucide-react'

interface DevLoginProps {
  onToken: (token: string) => void
}

export default function DevLogin({ onToken }: DevLoginProps) {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    const t = token.trim().replace(/^Bearer\s+/i, '')
    if (!t) {
      setError('Please paste a token')
      return
    }
    onToken(t)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-lg">Revuze</div>
            <div className="text-slate-400 text-xs">Dashboard Builder</div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-4 h-4 text-brand-400" />
            <h2 className="text-white font-semibold">Paste your API token</h2>
          </div>
          <p className="text-slate-400 text-sm mb-5">
            Copy your bearer token from the existing platform and paste it below.
          </p>

          <div className="bg-slate-900 rounded-lg p-4 mb-4 text-xs text-slate-400 space-y-1.5 border border-slate-700">
            <p className="text-slate-300 font-medium mb-2">How to get your token:</p>
            <p>1. Open <span className="text-brand-400">cihub.stg.revuze.it</span> and log in</p>
            <p>2. Press <kbd className="bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded text-xs">F12</kbd> to open DevTools</p>
            <p>3. Go to the <span className="text-white">Network</span> tab</p>
            <p>4. Click any request → find <span className="text-white">Authorization</span> header</p>
            <p>5. Copy everything after <span className="text-brand-400">"Bearer "</span></p>
          </div>

          <textarea
            value={token}
            onChange={(e) => { setToken(e.target.value); setError('') }}
            placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
            rows={4}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-xs text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-brand-500 font-mono"
          />

          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}

          <button
            onClick={handleSubmit}
            className="w-full mt-3 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Continue →
          </button>

          <a
            href="https://cihub.stg.revuze.it"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Open Revuze platform to get token
          </a>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          Tokens expire after ~12 hours. Paste a fresh one if data stops loading.
        </p>
      </div>
    </div>
  )
}
