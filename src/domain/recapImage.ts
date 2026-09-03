import { formatGameDate } from './formatDate'
import type { RecapData } from './recap'

export interface RecapImageInput extends RecapData {
  teamName: string
}

/** Square — the one aspect ratio that renders sanely everywhere a coach might paste it (iMessage, WhatsApp, a team group chat). */
export const RECAP_IMAGE_SIZE = 1080

/** Mirrors index.css's dark theme tokens exactly, so the graphic reads as part of the app rather than a generic export. */
const COLORS = {
  surface: '#0a0e14',
  surfaceRaised: '#121822',
  border: '#262f3d',
  text: '#e8edf5',
  textMuted: '#8b96a8',
  accent: '#f2b705',
  accentContrast: '#14110a',
  danger: '#ef4444',
}

const FONT = 'system-ui, -apple-system, sans-serif'

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Shrinks the font until `text` fits `maxWidth` on one line — team/opponent names have no length limit in the data model. */
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  weight: number,
  maxSize: number,
  minSize: number,
): number {
  let size = maxSize
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${FONT}`
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 2
  }
  return size
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, 0, RECAP_IMAGE_SIZE)
  gradient.addColorStop(0, COLORS.surfaceRaised)
  gradient.addColorStop(1, COLORS.surface)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, RECAP_IMAGE_SIZE, RECAP_IMAGE_SIZE)

  const glow = ctx.createRadialGradient(540, 420, 40, 540, 420, 560)
  glow.addColorStop(0, 'rgba(242, 183, 5, 0.16)')
  glow.addColorStop(1, 'rgba(242, 183, 5, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, RECAP_IMAGE_SIZE, RECAP_IMAGE_SIZE)
}

function drawHeader(ctx: CanvasRenderingContext2D, data: RecapImageInput) {
  ctx.textAlign = 'center'
  ctx.fillStyle = COLORS.accent
  ctx.font = `700 30px ${FONT}`
  ctx.fillText(data.game.status === 'final' ? 'FINAL' : 'IN PROGRESS', RECAP_IMAGE_SIZE / 2, 96)

  ctx.fillStyle = COLORS.textMuted
  ctx.font = `500 26px ${FONT}`
  ctx.fillText(formatGameDate(data.game.date), RECAP_IMAGE_SIZE / 2, 134)
}

function drawScore(ctx: CanvasRenderingContext2D, data: RecapImageInput) {
  const { game, score, teamName } = data
  const [leftLabel, leftScore, rightLabel, rightScore] = game.isHome
    ? [teamName, score.us, game.opponentName, score.opponent]
    : [game.opponentName, score.opponent, teamName, score.us]

  const leftX = RECAP_IMAGE_SIZE * 0.27
  const rightX = RECAP_IMAGE_SIZE * 0.73
  const maxNameWidth = 380

  ctx.textAlign = 'center'
  ctx.fillStyle = COLORS.text
  const leftNameSize = fitFontSize(ctx, leftLabel, maxNameWidth, 600, 40, 22)
  ctx.font = `600 ${leftNameSize}px ${FONT}`
  ctx.fillText(leftLabel, leftX, 240)
  const rightNameSize = fitFontSize(ctx, rightLabel, maxNameWidth, 600, 40, 22)
  ctx.font = `600 ${rightNameSize}px ${FONT}`
  ctx.fillText(rightLabel, rightX, 240)

  ctx.fillStyle = COLORS.text
  ctx.font = `800 160px ${FONT}`
  ctx.fillText(String(leftScore), leftX, 400)
  ctx.fillText(String(rightScore), rightX, 400)

  ctx.fillStyle = COLORS.textMuted
  ctx.font = `700 56px ${FONT}`
  ctx.fillText('–', RECAP_IMAGE_SIZE / 2, 370)

  const diff = leftScore - rightScore
  const result = diff === 0 ? 'TIE' : diff > 0 === game.isHome ? 'WIN' : 'LOSS'
  const badgeColor =
    result === 'WIN' ? COLORS.accent : result === 'LOSS' ? COLORS.danger : COLORS.textMuted
  ctx.font = `700 28px ${FONT}`
  const badgeWidth = ctx.measureText(result).width + 48
  roundedRect(ctx, RECAP_IMAGE_SIZE / 2 - badgeWidth / 2, 430, badgeWidth, 52, 26)
  ctx.strokeStyle = badgeColor
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = badgeColor
  ctx.fillText(result, RECAP_IMAGE_SIZE / 2, 465)
}

function drawPerformers(ctx: CanvasRenderingContext2D, data: RecapImageInput) {
  const top = 560
  ctx.textAlign = 'left'
  ctx.fillStyle = COLORS.textMuted
  ctx.font = `700 26px ${FONT}`
  ctx.fillText('TOP PERFORMERS', 80, top)

  if (data.topPerformers.length === 0) {
    ctx.fillStyle = COLORS.textMuted
    ctx.font = `500 26px ${FONT}`
    ctx.textAlign = 'center'
    ctx.fillText('No stats recorded yet', RECAP_IMAGE_SIZE / 2, top + 90)
    return
  }

  const rowHeight = 110
  const rowWidth = RECAP_IMAGE_SIZE - 160
  data.topPerformers.forEach((performer, i) => {
    const rowY = top + 36 + i * (rowHeight + 16)

    roundedRect(ctx, 80, rowY, rowWidth, rowHeight, 16)
    ctx.fillStyle = COLORS.surfaceRaised
    ctx.fill()
    ctx.strokeStyle = COLORS.border
    ctx.lineWidth = 1
    ctx.stroke()

    const badgeCx = 80 + 70
    const badgeCy = rowY + rowHeight / 2
    ctx.beginPath()
    ctx.arc(badgeCx, badgeCy, 42, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.accent
    ctx.fill()
    ctx.fillStyle = COLORS.accentContrast
    ctx.textAlign = 'center'
    ctx.font = `800 32px ${FONT}`
    ctx.fillText(String(performer.player.jerseyNumber), badgeCx, badgeCy + 11)

    ctx.textAlign = 'left'
    ctx.fillStyle = COLORS.text
    const nameSize = fitFontSize(
      ctx,
      `${performer.player.firstName} ${performer.player.lastName}`,
      rowWidth - 260,
      600,
      36,
      22,
    )
    ctx.font = `600 ${nameSize}px ${FONT}`
    ctx.fillText(
      `${performer.player.firstName} ${performer.player.lastName}`,
      80 + 140,
      rowY + rowHeight / 2 - 6,
    )
    ctx.fillStyle = COLORS.textMuted
    ctx.font = `500 24px ${FONT}`
    ctx.fillText(performer.player.position, 80 + 140, rowY + rowHeight / 2 + 26)

    ctx.textAlign = 'right'
    ctx.fillStyle = COLORS.accent
    ctx.font = `700 32px ${FONT}`
    ctx.fillText(
      `${performer.goals}G ${performer.assists}A · ${performer.points}PTS`,
      80 + rowWidth - 24,
      rowY + rowHeight / 2 + 10,
    )
  })
}

function drawFooter(ctx: CanvasRenderingContext2D) {
  ctx.textAlign = 'center'
  ctx.fillStyle = COLORS.border
  ctx.fillRect(RECAP_IMAGE_SIZE / 2 - 30, 1000, 60, 4)
  ctx.fillStyle = COLORS.textMuted
  ctx.font = `600 22px ${FONT}`
  ctx.fillText('GAMEDAY STAT TRACKER', RECAP_IMAGE_SIZE / 2, 1040)
}

/** Draws the full recap onto `canvas`, sizing it to `RECAP_IMAGE_SIZE` first. */
export function renderRecapImage(canvas: HTMLCanvasElement, data: RecapImageInput): void {
  canvas.width = RECAP_IMAGE_SIZE
  canvas.height = RECAP_IMAGE_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  drawBackground(ctx)
  drawHeader(ctx, data)
  drawScore(ctx, data)
  drawPerformers(ctx, data)
  drawFooter(ctx)
}
