/**
 * Regression tests for widget deletion.
 *
 * These tests cover the three layers that were historically broken:
 *  1. Storage — saveDashboard correctly persists a widget removal
 *  2. WidgetWrapper UI — the delete button calls onDelete and stops propagation
 *  3. WidgetErrorBoundary UI — the "Remove widget" button calls onDelete in error state
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WidgetWrapper from '../components/widgets/WidgetWrapper'
import WidgetErrorBoundary from '../components/widgets/WidgetErrorBoundary'
import { saveDashboard, getDashboard, getDashboards } from '../services/storage'
import type { Dashboard, Widget } from '../types/dashboard'
import { DEFAULT_FILTER, DEFAULT_COMPARE_RANGE } from '../types/dashboard'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeWidget(id: string): Widget {
  return {
    id,
    type: 'kpi_card',
    title: `Widget ${id}`,
    layout: { x: 0, y: 0, w: 3, h: 2 },
    config: { metric: 'volume' },
  }
}

function makeDashboard(widgets: Widget[]): Dashboard {
  return {
    id: 'dash-1',
    name: 'Test Dashboard',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    filter: DEFAULT_FILTER,
    compare_range: DEFAULT_COMPARE_RANGE,
    group_by_product_line: false,
    widgets,
  }
}

// ─── 1. Storage layer ─────────────────────────────────────────────────────────

describe('storage: saveDashboard', () => {
  beforeEach(() => localStorage.clear())

  it('persists a dashboard with widgets', () => {
    const dash = makeDashboard([makeWidget('w1'), makeWidget('w2')])
    saveDashboard(dash)
    expect(getDashboard('dash-1')?.widgets).toHaveLength(2)
  })

  it('persists a widget removal when called with filtered widgets', () => {
    const dash = makeDashboard([makeWidget('w1'), makeWidget('w2'), makeWidget('w3')])
    saveDashboard(dash)

    const updated = { ...dash, widgets: dash.widgets.filter((w) => w.id !== 'w2') }
    saveDashboard(updated)

    const saved = getDashboard('dash-1')
    expect(saved?.widgets).toHaveLength(2)
    expect(saved?.widgets.map((w) => w.id)).toEqual(['w1', 'w3'])
  })

  it('replaces an existing dashboard rather than duplicating it', () => {
    const dash = makeDashboard([makeWidget('w1')])
    saveDashboard(dash)
    saveDashboard({ ...dash, name: 'Renamed' })
    expect(getDashboards()).toHaveLength(1)
    expect(getDashboards()[0].name).toBe('Renamed')
  })
})

// ─── 2. WidgetWrapper delete button ──────────────────────────────────────────

describe('WidgetWrapper: delete button', () => {
  it('does not render a delete button when onDelete is not provided', () => {
    render(<WidgetWrapper title="Test"><div>content</div></WidgetWrapper>)
    expect(screen.queryByTitle('Remove widget')).toBeNull()
  })

  it('renders the delete button when onDelete is provided', () => {
    render(
      <WidgetWrapper title="Test" onDelete={() => {}}>
        <div>content</div>
      </WidgetWrapper>,
    )
    expect(screen.getByTitle('Remove widget')).toBeInTheDocument()
  })

  it('calls onDelete when the delete button is clicked', async () => {
    const onDelete = vi.fn()
    render(
      <WidgetWrapper title="Test" onDelete={onDelete}>
        <div>content</div>
      </WidgetWrapper>,
    )
    await userEvent.click(screen.getByTitle('Remove widget'))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('stops mousedown propagation to prevent grid drag interference', () => {
    const parentMouseDown = vi.fn()
    const onDelete = vi.fn()
    render(
      <div onMouseDown={parentMouseDown}>
        <WidgetWrapper title="Test" onDelete={onDelete}>
          <div>content</div>
        </WidgetWrapper>
      </div>,
    )
    fireEvent.mouseDown(screen.getByTitle('Remove widget'))
    expect(parentMouseDown).not.toHaveBeenCalled()
  })

  it('stops click propagation to prevent grid handlers from swallowing the event', () => {
    const parentClick = vi.fn()
    const onDelete = vi.fn()
    render(
      <div onClick={parentClick}>
        <WidgetWrapper title="Test" onDelete={onDelete}>
          <div>content</div>
        </WidgetWrapper>
      </div>,
    )
    fireEvent.click(screen.getByTitle('Remove widget'))
    expect(parentClick).not.toHaveBeenCalled()
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})

// ─── 3. WidgetErrorBoundary delete button ─────────────────────────────────────

// A component that always throws so the error boundary activates
function Bomb(): never {
  throw new Error('Render failed')
}

describe('WidgetErrorBoundary: remove widget button', () => {
  // Silence the expected console.error from the error boundary
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}))

  it('shows "Remove widget" button in error state when onDelete is provided', () => {
    render(
      <WidgetErrorBoundary title="Broken" onDelete={() => {}}>
        <Bomb />
      </WidgetErrorBoundary>,
    )
    expect(screen.getByText('Remove widget')).toBeInTheDocument()
  })

  it('calls onDelete when "Remove widget" is clicked', async () => {
    const onDelete = vi.fn()
    render(
      <WidgetErrorBoundary title="Broken" onDelete={onDelete}>
        <Bomb />
      </WidgetErrorBoundary>,
    )
    await userEvent.click(screen.getByText('Remove widget'))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('stops mousedown propagation in error state', () => {
    const parentMouseDown = vi.fn()
    render(
      <div onMouseDown={parentMouseDown}>
        <WidgetErrorBoundary title="Broken" onDelete={() => {}}>
          <Bomb />
        </WidgetErrorBoundary>
      </div>,
    )
    fireEvent.mouseDown(screen.getByText('Remove widget'))
    expect(parentMouseDown).not.toHaveBeenCalled()
  })

  it('does not show a remove button without onDelete prop', () => {
    render(
      <WidgetErrorBoundary title="Broken">
        <Bomb />
      </WidgetErrorBoundary>,
    )
    expect(screen.queryByText('Remove widget')).toBeNull()
  })
})
