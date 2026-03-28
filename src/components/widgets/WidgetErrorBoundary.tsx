import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface Props {
  children: ReactNode
  title?: string
  onDelete?: () => void
}

interface State {
  error: Error | null
}

export default class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Widget crash]', this.props.title, error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <p className="text-xs font-medium text-slate-500 text-center">Widget failed to render</p>
          <p className="text-[11px] text-slate-400 text-center break-all max-w-xs">
            {this.state.error.message}
          </p>
          {this.props.onDelete && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); this.props.onDelete!() }}
              className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-50 border border-red-200 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Remove widget
            </button>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
