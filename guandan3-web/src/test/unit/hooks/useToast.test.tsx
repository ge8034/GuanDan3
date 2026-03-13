import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { useToast } from '@/lib/hooks/useToast'

const Harness = () => {
  const { showToast, toastView } = useToast()
  return (
    <div>
      <button
        onClick={() => showToast({ message: 'A', kind: 'info', timeoutMs: 10000 })}
      >
        add-a
      </button>
      <button
        onClick={() => showToast({ message: 'B', kind: 'success', timeoutMs: 10000 })}
      >
        add-b
      </button>
      <button
        onClick={() => showToast({ message: 'C', kind: 'error', timeoutMs: 10000 })}
      >
        add-c
      </button>
      <button
        onClick={() => showToast({ message: 'D', kind: 'error', timeoutMs: 10000 })}
      >
        add-d
      </button>
      <button
        onClick={() =>
          showToast({
            message: 'X',
            kind: 'error',
            timeoutMs: 10000,
            action: { label: '重试', onClick: () => {} }
          })
        }
      >
        add-action
      </button>
      {toastView}
    </div>
  )
}

describe('useToast', () => {
  it('keeps at most 3 toasts', () => {
    render(<Harness />)
    fireEvent.click(screen.getByText('add-a'))
    fireEvent.click(screen.getByText('add-b'))
    fireEvent.click(screen.getByText('add-c'))
    fireEvent.click(screen.getByText('add-d'))

    expect(screen.getAllByTestId('toast-item').length).toBe(3)
    expect(screen.queryByText('A')).toBeNull()
    expect(screen.getByText('B')).toBeVisible()
    expect(screen.getByText('C')).toBeVisible()
    expect(screen.getByText('D')).toBeVisible()
  })

  it('action click triggers callback and hides that toast', () => {
    const spy = vi.fn()

    const ActionHarness = () => {
      const { showToast, toastView } = useToast()
      return (
        <div>
          <button
            onClick={() =>
              showToast({
                message: 'X',
                kind: 'error',
                timeoutMs: 10000,
                action: { label: '重试', onClick: spy }
              })
            }
          >
            add
          </button>
          {toastView}
        </div>
      )
    }

    render(<ActionHarness />)
    fireEvent.click(screen.getByText('add'))
    expect(screen.getByText('X')).toBeVisible()
    fireEvent.click(screen.getByTestId('toast-action'))
    expect(spy).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('X')).toBeNull()
  })

  it('throttles action clicks across toasts within 1s', () => {
    const spy1 = vi.fn()
    const spy2 = vi.fn()

    const ThrottleHarness = () => {
      const { showToast, toastView } = useToast()
      return (
        <div>
          <button
            onClick={() => {
              showToast({
                message: 'T1',
                kind: 'error',
                timeoutMs: 10000,
                action: { label: '重试', onClick: spy1 }
              })
              showToast({
                message: 'T2',
                kind: 'error',
                timeoutMs: 10000,
                action: { label: '重试', onClick: spy2 }
              })
            }}
          >
            add-two
          </button>
          {toastView}
        </div>
      )
    }

    render(<ThrottleHarness />)
    fireEvent.click(screen.getByText('add-two'))

    const nowSpy = vi.spyOn(Date, 'now')
    let nowValue = 1000
    nowSpy.mockImplementation(() => nowValue)

    const actions = screen.getAllByTestId('toast-action')
    expect(actions.length).toBe(2)

    fireEvent.click(actions[0])
    expect(spy1).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getAllByTestId('toast-action')[0])
    expect(spy2).toHaveBeenCalledTimes(0)

    nowValue = 2001
    fireEvent.click(screen.getAllByTestId('toast-action')[0])
    expect(spy2).toHaveBeenCalledTimes(1)

    nowSpy.mockRestore()
  })

  it('auto hides after timeout', () => {
    vi.useFakeTimers()
    render(<Harness />)
    fireEvent.click(screen.getByText('add-a'))
    expect(screen.getByText('A')).toBeVisible()
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(screen.queryByText('A')).toBeNull()
    vi.useRealTimers()
  })
})
