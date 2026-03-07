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
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  margin: 0,
  padding: 0,
  border: '1px solid var(--border-subtle)',
  width: 'min(560px, calc(100dvw - 32px))',
  minWidth: 0,
  maxWidth: 'calc(100dvw - 32px)',
  maxHeight: 'calc(100dvh - 24px)',
  boxSizing: 'border-box',
  overflow: 'hidden',
  backgroundColor: 'var(--bg-panel)',
  color: 'var(--text-normal)',
  borderRadius: '2px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
  zIndex: 1000,
}

const backdropCss = `
  dialog.tw-modal::backdrop {
    background: rgba(0, 0, 0, 0.5) !important;
    position: fixed !important;
    inset: 0 !important;
  }

  dialog.tw-modal {
    min-width: 0;
    overflow: hidden;
  }

  dialog.tw-modal .tw-modal__inner {
    width: 100%;
    min-width: 0;
    max-height: calc(100dvh - 24px);
  }

  dialog.tw-modal .tw-modal__body {
    flex: 1 1 auto;
    width: 100%;
    box-sizing: border-box;
    overflow-y: auto;
    overflow-x: hidden;
    min-width: 0;
    max-width: 100%;
  }

  dialog.tw-modal .tw-modal__body > * {
    min-width: 0;
    max-width: 100%;
  }

  @media (max-width: 640px) {
    dialog.tw-modal {
      left: calc(8px + env(safe-area-inset-left, 0px)) !important;
      right: auto !important;
      top: 50% !important;
      width: calc(100dvw - 16px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)) !important;
      min-width: 0 !important;
      max-width: calc(100dvw - 16px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)) !important;
      transform: translateY(-50%) !important;
      max-height: calc(100dvh - 16px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) !important;
      border-radius: 12px !important;
    }

    dialog.tw-modal .tw-modal__inner {
      max-height: calc(100dvh - 16px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px));
    }

    dialog.tw-modal .tw-modal__body {
      padding: 12px !important;
    }

    dialog.tw-modal header {
      padding-inline: 12px !important;
    }
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
      <div className="tw-modal__inner flex flex-col" style={{ maxHeight: 'calc(100dvh - 24px)', width: '100%', minWidth: 0 }}>
        {title && (
          <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
            <h2 className="text-lg font-semibold text-[var(--text-header-primary)]">{title}</h2>
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-normal)] transition-colors p-1 hover:bg-[var(--bg-modifier-hover)]"
              aria-label="Close"
            >
              <X aria-hidden="true" width={24} height={24} />
            </button>
          </header>
        )}
        <div className="tw-modal__body p-4">
          {children}
        </div>
      </div>
    </dialog>
    </>
  )
})
