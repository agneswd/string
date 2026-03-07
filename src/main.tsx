import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App.tsx'
import { stringStore } from './lib/stringStore'
import { runAllCleanups, closeAllTrackedResources } from './lib/connection'

type StringRuntimeFlags = typeof globalThis & {
  __stringCleanupBound?: boolean
  __stringLifecycleCleanupDone?: boolean
  CLERK_PUBLISHABLE_KEY?: string
}

const runtimeFlags = globalThis as StringRuntimeFlags

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim()
const currentOrigin = window.location.origin
const currentHostname = window.location.hostname
const afterSignOutUrl = new URL(import.meta.env.BASE_URL, window.location.href).toString()
const hasClerkPublishableKey = Boolean(
  clerkPublishableKey && clerkPublishableKey !== 'YOUR_PUBLISHABLE_KEY',
)
const isLocalDevelopmentHost = currentHostname === 'localhost' || currentHostname === '127.0.0.1'
const isLiveClerkKey = Boolean(clerkPublishableKey?.startsWith('pk_live_'))
const hasIncompatibleLocalClerkKey = isLocalDevelopmentHost && isLiveClerkKey

if (hasClerkPublishableKey && clerkPublishableKey) {
  runtimeFlags.CLERK_PUBLISHABLE_KEY = clerkPublishableKey
}

/**
 * Kill all media tracks on <audio>/<video> elements to release mic/cam/screen.
 * Best-effort — errors are swallowed.
 */
const stopAllMediaElements = (): void => {
  try {
    document.querySelectorAll('audio, video').forEach((el) => {
      const mediaEl = el as HTMLMediaElement
      if (mediaEl.srcObject instanceof MediaStream) {
        mediaEl.srcObject.getTracks().forEach(t => t.stop())
        mediaEl.srcObject = null
      }
      mediaEl.pause()
      mediaEl.src = ''
    })
  } catch { /* ignore */ }
}

/**
 * Primary cleanup — guarded so it runs at most once per page lifecycle.
 *
 * Order matters: disconnect the WebSocket FIRST (most time-critical during
 * unload — the browser only gives a short synchronous window), THEN run
 * the heavier cleanup (WebRTC, media elements).
 *
 * SpacetimeDB SDK's `disconnect()` internally does
 *   `this.wsPromise.then(ws => ws.close())`
 * Since the wsPromise is already resolved when connected, the `.then()`
 * callback runs as a microtask within the same event-loop task, so `ws.close()`
 * fires a close frame synchronously enough for `beforeunload`.
 */
const cleanupConnection = (): void => {
  if (runtimeFlags.__stringLifecycleCleanupDone) return
  runtimeFlags.__stringLifecycleCleanupDone = true

  // 1. Disconnect SpacetimeDB FIRST — sends WebSocket close frame
  //    Uses dispose() for full teardown (listeners + connection) on hard unload.
  stringStore.dispose()

  // 2. Registered cleanup functions (WebRTC dispose, etc.)
  runAllCleanups()

  // 3. Close ALL tracked browser resources (AudioContext, MediaStream, RTCPeerConnection)
  closeAllTrackedResources()

  // 4. Kill leftover media elements
  stopAllMediaElements()
}

/**
 * Last-chance fallback on the `unload` event.
 * `unload` fires AFTER `beforeunload`/`pagehide` and is the final opportunity
 * to run code before the page is destroyed.  We intentionally skip the
 * "already done" guard so that if `beforeunload` ran but the WebSocket close
 * frame wasn't actually sent (microtask didn't flush), we retry.
 */
const onUnload = (): void => {
  // Retry disconnect unconditionally — idempotent in both stringStore and
  // disconnectConnection (they null-check the conn reference).
  try { stringStore.dispose() } catch { /* ignore */ }
  try { runAllCleanups() } catch { /* ignore */ }
  try { closeAllTrackedResources() } catch { /* ignore */ }
  try { stopAllMediaElements() } catch { /* ignore */ }
}

const onPageHide = (event: PageTransitionEvent): void => {
  if (!event.persisted) {
    // Normal refresh/navigation: fully tear everything down so the previous
    // page instance can be collected instead of accumulating across reloads.
    cleanupConnection()
    return
  }

  // True bfcache path: disconnect live resources, but keep the store object so
  // the page can reconnect on `pageshow` when restored from cache.
  runtimeFlags.__stringLifecycleCleanupDone = true
  stringStore.disconnect()
  runAllCleanups()
  closeAllTrackedResources()
  stopAllMediaElements()
}

const onPageShow = (event: PageTransitionEvent): void => {
  if (!event.persisted) {
    runtimeFlags.__stringLifecycleCleanupDone = false
    return
  }

  const shouldReconnect = runtimeFlags.__stringLifecycleCleanupDone === true
  runtimeFlags.__stringLifecycleCleanupDone = false
  if (shouldReconnect) {
    stringStore.connect()
  }
}

if (!runtimeFlags.__stringCleanupBound) {
  runtimeFlags.__stringCleanupBound = true

  window.addEventListener('beforeunload', cleanupConnection)
  window.addEventListener('pagehide', onPageHide)
  window.addEventListener('unload', onUnload)
  window.addEventListener('pageshow', onPageShow)
}

// HMR cleanup: remove event listeners and disconnect on hot module disposal
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // Remove page-lifecycle listeners so the re-executed module can re-register
    window.removeEventListener('beforeunload', cleanupConnection)
    window.removeEventListener('pagehide', onPageHide)
    window.removeEventListener('unload', onUnload)
    window.removeEventListener('pageshow', onPageShow)

    // Reset lifecycle guard so cleanupConnection actually runs
    runtimeFlags.__stringLifecycleCleanupDone = false

    // Run the SAME cleanup as page unload — single source of truth
    // (disconnect, runAllCleanups, closeAllTrackedResources, stopAllMediaElements)
    cleanupConnection()

    // Unmount React root to prevent leaked component trees on HMR
    if ((runtimeFlags as Record<string, unknown>).__stringReactRoot) {
      ;((runtimeFlags as Record<string, unknown>).__stringReactRoot as ReturnType<typeof createRoot>).unmount()
    }

    // Reset runtime flags so re-execution of this module re-registers everything
    runtimeFlags.__stringCleanupBound = false
    runtimeFlags.__stringLifecycleCleanupDone = false
  })
}

const root = createRoot(document.getElementById('root')!)
;(runtimeFlags as Record<string, unknown>).__stringReactRoot = root
if (!hasClerkPublishableKey || hasIncompatibleLocalClerkKey) {
  root.render(
    <StrictMode>
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '24px',
          background: '#0f0f10',
          color: '#f2f3f5',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            width: 'min(560px, 100%)',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #2a2a2a',
            background: '#17181a',
            lineHeight: 1.6,
          }}
        >
          {hasIncompatibleLocalClerkKey ? (
            <>
              <h1 style={{ marginTop: 0, marginBottom: '12px', fontSize: '1.1rem' }}>Live Clerk keys do not work on localhost</h1>
              <p style={{ margin: 0 }}>
                Your current <strong>VITE_CLERK_PUBLISHABLE_KEY</strong> is a live key, and Clerk is rejecting requests from <strong>{currentHostname}</strong>. Use a development Clerk key for local work, or open the app through your allowed production domain instead.
              </p>
            </>
          ) : (
            <>
              <h1 style={{ marginTop: 0, marginBottom: '12px', fontSize: '1.1rem' }}>Clerk is not configured yet</h1>
              <p style={{ margin: 0 }}>
                Add <strong>VITE_CLERK_PUBLISHABLE_KEY</strong> to <strong>.env.local</strong>, then restart the Vite dev server.
              </p>
            </>
          )}
        </div>
      </div>
    </StrictMode>,
  )
} else {
  root.render(
    <StrictMode>
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        afterSignOutUrl={afterSignOutUrl}
        signInUrl={afterSignOutUrl}
        signUpUrl={afterSignOutUrl}
        signInFallbackRedirectUrl={afterSignOutUrl}
        signUpFallbackRedirectUrl={afterSignOutUrl}
        allowedRedirectOrigins={[
          currentOrigin,
          /^https:\/\/[^/]+\.github\.io$/,
          /^https:\/\/piggii\.agne\.uk$/,
        ]}
      >
        <App />
      </ClerkProvider>
    </StrictMode>,
  )
}
