import type { Position } from '../db/types'

export interface ParsedRosterRow {
  line: string
  lineNumber: number
  jerseyNumber: number | null
  firstName: string
  lastName: string
  position: Position | null
  /** Empty iff jerseyNumber, position, firstName, and lastName are all present. */
  errors: string[]
}

const POSITION_ALIASES: Record<string, Position> = {
  a: 'Attack',
  att: 'Attack',
  attack: 'Attack',
  m: 'Midfield',
  mf: 'Midfield',
  mid: 'Midfield',
  midfield: 'Midfield',
  midfielder: 'Midfield',
  d: 'Defense',
  def: 'Defense',
  defense: 'Defense',
  defence: 'Defense',
  defender: 'Defense',
  lsm: 'LSM',
  fo: 'FOGO',
  fogo: 'FOGO',
  faceoff: 'FOGO',
  g: 'Goalie',
  gk: 'Goalie',
  goalie: 'Goalie',
  goalkeeper: 'Goalie',
  keeper: 'Goalie',
}

function matchPosition(token: string): Position | null {
  return POSITION_ALIASES[token.toLowerCase()] ?? null
}

/**
 * Accepts one player per line, tokens separated by whitespace and/or commas —
 * e.g. "23 Danny Keane Attack" or "23, Danny, Keane, A". The jersey number
 * and position can appear anywhere in the line (matched by shape: digits, or
 * a known position word/abbreviation); whatever tokens are left become the
 * name, first token as first name and the rest joined as last name. This
 * lets a coach paste a roster from wherever it already lives without
 * reformatting it to match one exact column order.
 */
export function parseRosterInput(raw: string): ParsedRosterRow[] {
  return raw
    .split('\n')
    .map((line, i) => ({ line, lineNumber: i + 1 }))
    .filter(({ line }) => line.trim().length > 0)
    .map(({ line, lineNumber }) => parseLine(line, lineNumber))
}

function parseLine(line: string, lineNumber: number): ParsedRosterRow {
  const tokens = line
    .split(/[,\t]+/)
    .flatMap((chunk) => chunk.trim().split(/\s+/))
    .filter(Boolean)

  let jerseyNumber: number | null = null
  let position: Position | null = null
  const nameTokens: string[] = []

  for (const token of tokens) {
    if (jerseyNumber === null && /^\d+$/.test(token)) {
      jerseyNumber = Number(token)
      continue
    }
    const maybePosition: Position | null = position === null ? matchPosition(token) : null
    if (maybePosition) {
      position = maybePosition
      continue
    }
    nameTokens.push(token)
  }

  const firstName = nameTokens[0] ?? ''
  const lastName = nameTokens.slice(1).join(' ')

  const errors: string[] = []
  if (jerseyNumber === null) errors.push('missing jersey number')
  if (position === null) errors.push('missing/unrecognized position')
  if (firstName.length === 0) errors.push('missing name')
  else if (lastName.length === 0) errors.push('missing last name')

  return { line, lineNumber, jerseyNumber, firstName, lastName, position, errors }
}
