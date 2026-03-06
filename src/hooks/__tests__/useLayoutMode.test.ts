import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLayoutMode } from '../useLayoutMode'

const STORAGE_KEY = 'string.settings.layoutMode'

// Minimal localStorage mock that supports get/set/remove/clear
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
  clear: () => { for (const k in store) delete store[k] },
}

beforeEach(() => {
  localStorageMock.clear()
  vi.stubGlobal('localStorage', localStorageMock)
})

describe('useLayoutMode', () => {
  it('defaults to classic mode', () => {
    const { result } = renderHook(() => useLayoutMode())
    expect(result.current.layoutMode).toBe('classic')
  })

  it('restores persisted mode from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'workspace')
    const { result } = renderHook(() => useLayoutMode())
    expect(result.current.layoutMode).toBe('workspace')
  })

  it('falls back to classic for unknown persisted values', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid-mode')
    const { result } = renderHook(() => useLayoutMode())
    expect(result.current.layoutMode).toBe('classic')
  })

  it('can toggle to workspace mode', () => {
    const { result } = renderHook(() => useLayoutMode())
    act(() => {
      result.current.setLayoutMode('workspace')
    })
    expect(result.current.layoutMode).toBe('workspace')
  })

  it('persists changed mode to localStorage', () => {
    const { result } = renderHook(() => useLayoutMode())
    act(() => {
      result.current.setLayoutMode('workspace')
    })
    expect(localStorage.getItem(STORAGE_KEY)).toBe('workspace')
  })

  it('can toggle back to classic', () => {
    localStorage.setItem(STORAGE_KEY, 'workspace')
    const { result } = renderHook(() => useLayoutMode())
    act(() => {
      result.current.setLayoutMode('classic')
    })
    expect(result.current.layoutMode).toBe('classic')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('classic')
  })

  it('defaults to classic when localStorage.getItem throws', () => {
    vi.stubGlobal('localStorage', {
      ...localStorageMock,
      getItem: () => { throw new DOMException('SecurityError') },
    })
    const { result } = renderHook(() => useLayoutMode())
    expect(result.current.layoutMode).toBe('classic')
  })

  it('keeps in-memory state when localStorage.setItem throws', () => {
    vi.stubGlobal('localStorage', {
      ...localStorageMock,
      setItem: () => { throw new DOMException('QuotaExceededError') },
    })
    const { result } = renderHook(() => useLayoutMode())
    act(() => {
      result.current.setLayoutMode('workspace')
    })
    // State update must succeed despite storage failure
    expect(result.current.layoutMode).toBe('workspace')
  })
})
