import React, { useEffect, useRef, useCallback, type ReactNode, type CSSProperties } from 'react'
import { X } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

/* ── Static dialog style ── */
const dialogStyle: CSSProperties = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  margin: 0,
  padding: 0,
  border: '1px solid var(--border-subtle)',
  minWidth: '400px',
  maxWidth: '90vw',
  maxHeight: '85vh',
  backgroundColor: 'var(--bg-panel)',
  color: 'var(--text-normal)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
  zIndex: 1000,
}

const backdropCss = `
  dialog.tw-modal::backdrop {
    background: rgba(0, 0, 0, 0.5) !important;
    position: fixed !important;
    inset: 0 !important;
  }
`

export const Modal = React.memo(function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  const handleCancel = useCallback(() => {
    onClose()
  }, [onClose])

  const handleClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose()
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <>
    <style>{backdropCss}</style>
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      onClick={handleClick}
      className={`tw-modal ${className ?? ''}`}
      style={dialogStyle}
    >
      <div className="flex flex-col max-h-[85vh]">
        {title && (
          <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
            <h2 className="text-lg font-semibold text-[var(--text-header-primary)]">{title}</h2>
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-normal)] transition-colors p-1 rounded hover:bg-[var(--bg-modifier-hover)]"
              aria-label="Close"
            >
              <X aria-hidden="true" width={24} height={24} />
            </button>
          </header>
        )}
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </dialog>
    </>
  )
})
