import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { stringStore } from './lib/stringStore'
import { runAllCleanups, closeAllTrackedResources } from './lib/connection'

type StringRuntimeFlags = typeof globalThis & {
  __stringBootstrapped?: boolean
  __stringCleanupBound?: boolean
  __stringLifecycleCleanupDone?: boolean
}

const runtimeFlags = globalThis as StringRuntimeFlags

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

const onPageHide = (): void => {
  // Soft disconnect only — preserve store listeners for bfcache restore
  runtimeFlags.__stringLifecycleCleanupDone = true
  stringStore.disconnect()
  runAllCleanups()
  closeAllTrackedResources()
  stopAllMediaElements()
}

const onPageShow = (): void => {
  const shouldReconnect = runtimeFlags.__stringLifecycleCleanupDone === true
  runtimeFlags.__stringLifecycleCleanupDone = false
  if (shouldReconnect) {
    stringStore.connect()
  }
}

if (!runtimeFlags.__stringBootstrapped) {
  runtimeFlags.__stringBootstrapped = true
  stringStore.connect()
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
    runtimeFlags.__stringBootstrapped = false
    runtimeFlags.__stringLifecycleCleanupDone = false
  })
}

const root = createRoot(document.getElementById('root')!)
;(runtimeFlags as Record<string, unknown>).__stringReactRoot = root
root.render(<App />)
