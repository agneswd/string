import { useEffect, memo, type CSSProperties } from 'react'

// Inject CSS keyframes for progress bar animation
if (typeof document !== 'undefined') {
  const styleId = 'notification-toast-keyframes'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      @keyframes shrinkWidth { from { transform: scaleX(1); } to { transform: scaleX(0); } }
      @keyframes toastSlideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    `
    document.head.appendChild(style)
  }
}

export interface NotificationItem {
  id: string
  message: string
  type: 'info' | 'success' | 'error' | 'message'
  /** Optional click handler (e.g. navigate to DM channel) */
  onClick?: () => void
  /** Duration in ms before auto-dismiss. Default 5000 */
  duration?: number
  /** Subtitle (e.g. message preview) */
  subtitle?: string
}

interface NotificationToastProps {
  notifications: NotificationItem[]
  onDismiss: (id: string) => void
}

const CONTAINER: CSSProperties = {
  position: 'fixed',
  top: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 10000,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  alignItems: 'center',
  pointerEvents: 'none',
  maxWidth: '90vw',
  width: 420,
}

const toastStyle = (type: NotificationItem['type']): CSSProperties => ({
  position: 'relative',
  background: type === 'error' ? 'var(--bg-danger, #7f1d1d)' : 'var(--bg-hover)',
  color: 'var(--text-primary)',
  borderRadius: 'var(--radius-lg, 8px)',
  padding: '12px 16px',
  fontSize: 14,
  fontWeight: 500,
  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
  cursor: type === 'message' ? 'pointer' : 'default',
  pointerEvents: 'auto',
  overflow: 'hidden',
  width: '100%',
  border: type === 'error' ? '1px solid rgba(248,113,113,0.3)' : '1px solid var(--border-subtle)',
  animation: 'toastSlideIn 0.2s ease-out',
})

const subtitleStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--text-secondary)',
  marginTop: 4,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const closeBtn: CSSProperties = {
  position: 'absolute',
  top: 4,
  right: 8,
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  fontSize: 16,
  fontWeight: 700,
  padding: '2px 6px',
  lineHeight: 1,
}

const SingleToast = memo(function SingleToast({
  notification,
  onDismiss,
}: {
  notification: NotificationItem
  onDismiss: (id: string) => void
}) {
  const duration = notification.duration ?? 5000

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), duration)
    return () => clearTimeout(timer)
  }, [duration, notification.id, onDismiss])

  return (
    <div
      style={toastStyle(notification.type)}
      onClick={() => {
        notification.onClick?.()
        onDismiss(notification.id)
      }}
      role={notification.type === 'message' ? 'button' : 'alert'}
    >
      <button style={closeBtn} onClick={(e) => { e.stopPropagation(); onDismiss(notification.id) }} aria-label="Dismiss">×</button>
      <div>{notification.message}</div>
      {notification.subtitle && <div style={subtitleStyle}>{notification.subtitle}</div>}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 3,
          width: '100%',
          background: notification.type === 'error' ? 'rgba(255,255,255,0.4)' : 'var(--accent-primary)',
          borderRadius: '0 0 0 8px',
          animation: `shrinkWidth ${duration}ms linear forwards`,
          transformOrigin: 'left',
        }}
      />
    </div>
  )
})

export const NotificationToast = memo(function NotificationToast({
  notifications,
  onDismiss,
}: NotificationToastProps) {
  if (notifications.length === 0) return null
  return (
    <div style={CONTAINER}>
      {notifications.map((n) => (
        <SingleToast key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  )
})
