import React, { useRef, useEffect, useState } from 'react'

export interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x, y })

  useEffect(() => {
    // Adjust position to stay on screen
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      let newX = x
      let newY = y
      if (x + rect.width > window.innerWidth) newX = window.innerWidth - rect.width - 8
      if (y + rect.height > window.innerHeight) newY = window.innerHeight - rect.height - 8
      if (newX < 0) newX = 8
      if (newY < 0) newY = 8
      if (newX !== x || newY !== y) setPos({ x: newX, y: newY })
    }
  }, [x, y])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    // Use setTimeout to avoid immediately closing from the right-click event
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
      document.addEventListener('keydown', handleKey)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <div ref={ref} style={{
      position: 'fixed', top: pos.y, left: pos.x, zIndex: 10001,
      background: '#111214', borderRadius: 4, padding: '6px 8px',
      minWidth: 180, boxShadow: '0 8px 16px rgba(0,0,0,0.24)',
      border: '1px solid #1e1f22',
    }}>
      {items.map((item, i) => (
        <button key={i} onClick={() => { if (!item.disabled) { item.onClick(); onClose() } }} disabled={item.disabled} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', padding: '6px 8px', border: 'none',
          borderRadius: 2, background: 'transparent',
          color: item.danger ? '#ed4245' : '#b5bac1',
          fontSize: 14, cursor: item.disabled ? 'not-allowed' : 'pointer', textAlign: 'left',
          opacity: item.disabled ? 0.5 : 1,
        }}
        onMouseEnter={e => {
          if (item.disabled) return
          (e.target as HTMLElement).style.background = item.danger ? 'rgba(237,66,69,0.1)' : '#4752c4'
          (e.target as HTMLElement).style.color = '#fff'
        }}
        onMouseLeave={e => {
          (e.target as HTMLElement).style.background = 'transparent'
          (e.target as HTMLElement).style.color = item.danger ? '#ed4245' : '#b5bac1'
        }}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  )
}
