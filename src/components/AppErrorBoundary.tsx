import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[App crash]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-4 p-8">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="text-center max-w-md">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Something went wrong</h2>
            <p className="text-sm text-slate-500 mb-1">{this.state.error.message}</p>
            <p className="text-xs text-slate-400">Check the browser console for details.</p>
          </div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload() }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reload app
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
