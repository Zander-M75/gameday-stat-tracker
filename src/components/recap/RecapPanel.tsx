import { useEffect, useRef, useState } from 'react'
import { RECAP_IMAGE_SIZE, renderRecapImage, type RecapImageInput } from '../../domain/recapImage'

interface RecapPanelProps {
  data: RecapImageInput
}

/**
 * Feature-detected once per mount rather than assumed — `navigator.share`
 * exists on some desktop browsers but rejects a `files` payload, and
 * `canShare` is the documented way to ask first instead of catching the
 * rejection. Wrapped in try/catch since constructing the probe `File` is
 * itself unnecessary risk on a browser that doesn't have either API.
 */
function supportsFileShare(): boolean {
  try {
    return (
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [new File([], 'recap.png', { type: 'image/png' })] })
    )
  } catch {
    return false
  }
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

/**
 * Renders the recap graphic to a live `<canvas>` preview with Download
 * (works everywhere — a Blob URL behind a normal `<a download>`) and Share
 * (Web Share API with a file attachment, mobile-only in practice) actions
 * below it. Nothing here is stored — a fresh render on every `data` change,
 * same derive-don't-store rule as the rest of the app.
 */
export function RecapPanel({ data }: RecapPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canShare] = useState(supportsFileShare)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    if (canvasRef.current) renderRecapImage(canvasRef.current, data)
  }, [data])

  async function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const blob = await canvasToBlob(canvas)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${data.game.opponentName.replace(/\s+/g, '-').toLowerCase() || 'game'}-recap.png`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function handleShare() {
    const canvas = canvasRef.current
    if (!canvas) return
    const blob = await canvasToBlob(canvas)
    if (!blob) return
    setSharing(true)
    try {
      const file = new File([blob], 'recap.png', { type: 'image/png' })
      await navigator.share({ files: [file], title: 'Game recap' })
    } catch {
      // Cancelling the native share sheet also rejects — not a real error,
      // and never worth surfacing as one.
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface-raised p-3">
      <canvas
        ref={canvasRef}
        width={RECAP_IMAGE_SIZE}
        height={RECAP_IMAGE_SIZE}
        className="w-full max-w-sm rounded-md border border-border"
      />
      <div className="flex w-full flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleDownload()}
          className="flex min-h-14 flex-1 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-text xl:min-h-10"
        >
          Download
        </button>
        {canShare && (
          <button
            type="button"
            disabled={sharing}
            onClick={() => void handleShare()}
            className="flex min-h-14 flex-1 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-accent-contrast disabled:opacity-40 xl:min-h-10"
          >
            {sharing ? 'Sharing…' : 'Share'}
          </button>
        )}
      </div>
    </div>
  )
}
