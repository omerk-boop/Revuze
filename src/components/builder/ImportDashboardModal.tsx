import { useState } from 'react'
import { X, ClipboardPaste, CheckCircle, PlusCircle, RefreshCw } from 'lucide-react'
import type { Dashboard } from '../../types/dashboard'

interface ImportDashboardModalProps {
  hasExistingWidgets: boolean
  onImport: (config: Partial<Dashboard>, mode: 'replace' | 'append') => void
  onClose: () => void
}

export default function ImportDashboardModal({ hasExistingWidgets, onImport, onClose }: ImportDashboardModalProps) {
  const [json, setJson] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'replace' | 'append'>(hasExistingWidgets ? 'append' : 'replace')

  const handleImport = () => {
    try {
      const parsed = JSON.parse(json.trim())
      if (!parsed.widgets || !Array.isArray(parsed.widgets)) {
        setError('Invalid dashboard config — must have a "widgets" array.')
        return
      }
      onImport(parsed, mode)
      onClose()
    } catch {
      setError('Invalid JSON — please check the format and try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ClipboardPaste className="w-5 h-5 text-brand-600" />
            <h2 className="font-semibold text-slate-800">Paste Widget Config</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {hasExistingWidgets && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode('append')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  mode === 'append'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                Add to dashboard
              </button>
              <button
                onClick={() => setMode('replace')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  mode === 'replace'
                    ? 'bg-slate-700 text-white border-slate-700'
                    : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                Replace dashboard
              </button>
            </div>
          )}

          <p className="text-sm text-slate-500 mb-3">
            {mode === 'append'
              ? 'New widgets will be added below your existing ones.'
              : 'This will replace all current widgets with the pasted config.'}
          </p>

          <textarea
            value={json}
            onChange={(e) => { setJson(e.target.value); setError('') }}
            placeholder={'{\n  "widgets": [...]\n}'}
            rows={12}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 font-mono resize-none focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />

          {error && (
            <p className="mt-2 text-xs text-red-500">⚠ {error}</p>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleImport}
              disabled={!json.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-40 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              {mode === 'append' ? 'Add Widgets' : 'Apply Config'}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
