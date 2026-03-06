import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Drag-to-resize hook for the call/chat split panel.
 * Returns the current height, a mousedown handler for the drag bar,
 * and a containerRef to attach to the resizable parent so the max-ratio
 * calculation can reference its parent's height.
 */
export function useResizable(initialHeight: number, minH: number, maxRatio: number) {
  const [height, setHeight] = useState(initialHeight)
  const dragging = useRef(false)
  const startY = useRef(0)
  const startH = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dragging.current = true
      startY.current = e.clientY
      startH.current = height
      document.body.style.cursor = 'row-resize'
      document.body.style.userSelect = 'none'
    },
    [height],
  )

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const parentH = containerRef.current?.parentElement?.clientHeight ?? 800
      const maxH = parentH * maxRatio
      const delta = e.clientY - startY.current
      setHeight(Math.max(minH, Math.min(maxH, startH.current + delta)))
    }
    const onMouseUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      // Reset body styles in case the effect re-runs mid-drag (deps change)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [minH, maxRatio])

  return { height, onMouseDown, containerRef }
}
