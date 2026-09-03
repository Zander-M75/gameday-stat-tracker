/**
 * Best-effort haptic feedback for recorded events. iOS Safari has no
 * Vibration API at all, and some browsers reject calls outside a direct user
 * gesture — feature-detect and swallow failures rather than let this ever
 * interrupt stat entry.
 */
export function vibrate(pattern: number | number[] = 15): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  } catch {
    // No-op — haptics are a nicety, never a requirement for recording to succeed.
  }
}
