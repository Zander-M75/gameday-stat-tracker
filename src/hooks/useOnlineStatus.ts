import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

function getSnapshot() {
  return navigator.onLine
}

/**
 * Reports the device's network interface state, not whether Supabase sync
 * (phase 8) can actually reach the server — `navigator.onLine` is a cheap,
 * synchronous signal for "is there obviously no connection," which is
 * enough for a passive header indicator. It can't detect a captive portal
 * or a dead upstream; sync's own status indicator will be the source of
 * truth for that once phase 8 exists.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot)
}
