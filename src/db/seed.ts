import { db } from './db'
import { createId } from './id'
import type {
  Game,
  PenaltyDurationSeconds,
  Player,
  PlayerEventType,
  StatEvent,
  Team,
  TeamEventType,
} from './types'

/** Dev-only fake data so the app (and the debug screen) has something to look at. */
export async function seedDatabase(options: { force?: boolean } = {}): Promise<void> {
  const existingTeams = await db.teams.count()
  if (existingTeams > 0 && !options.force) return

  await clearDatabase()

  const now = Date.now()
  const team: Team = { id: createId(), name: 'Ridgefield Varsity', createdAt: now }

  const rosterSeed: Array<
    Pick<Player, 'jerseyNumber' | 'firstName' | 'lastName' | 'position' | 'isActive'>
  > = [
    {
      jerseyNumber: 1,
      firstName: 'Jake',
      lastName: 'Sullivan',
      position: 'Goalie',
      isActive: true,
    },
    { jerseyNumber: 3, firstName: 'Ryan', lastName: 'Doyle', position: 'Attack', isActive: true },
    { jerseyNumber: 4, firstName: 'Mike', lastName: 'Chen', position: 'Attack', isActive: true },
    { jerseyNumber: 7, firstName: 'Dylan', lastName: 'Ford', position: 'Attack', isActive: true },
    {
      jerseyNumber: 9,
      firstName: 'Tommy',
      lastName: 'Reyes',
      position: 'Midfield',
      isActive: true,
    },
    {
      jerseyNumber: 10,
      firstName: 'Chris',
      lastName: 'Walsh',
      position: 'Midfield',
      isActive: true,
    },
    {
      jerseyNumber: 11,
      firstName: 'Owen',
      lastName: 'Brady',
      position: 'Midfield',
      isActive: true,
    },
    {
      jerseyNumber: 12,
      firstName: 'Nick',
      lastName: 'Russo',
      position: 'Midfield',
      isActive: true,
    },
    { jerseyNumber: 14, firstName: 'Ethan', lastName: 'Marsh', position: 'FOGO', isActive: true },
    { jerseyNumber: 15, firstName: 'Sam', lastName: 'Ito', position: 'Defense', isActive: true },
    { jerseyNumber: 17, firstName: 'Jack', lastName: 'Nolan', position: 'Defense', isActive: true },
    {
      jerseyNumber: 19,
      firstName: 'Luke',
      lastName: 'Palmer',
      position: 'Defense',
      isActive: true,
    },
    { jerseyNumber: 21, firstName: 'Cole', lastName: 'Barrett', position: 'LSM', isActive: true },
    {
      jerseyNumber: 22,
      firstName: 'Ben',
      lastName: 'Foster',
      position: 'Midfield',
      isActive: true,
    },
    { jerseyNumber: 23, firstName: 'Danny', lastName: 'Keane', position: 'Attack', isActive: true },
    {
      jerseyNumber: 24,
      firstName: 'Will',
      lastName: 'Hughes',
      position: 'Defense',
      isActive: true,
    },
    {
      jerseyNumber: 27,
      firstName: 'Max',
      lastName: 'Delgado',
      position: 'Midfield',
      isActive: true,
    },
    { jerseyNumber: 30, firstName: 'Aiden', lastName: 'Cruz', position: 'Goalie', isActive: true },
    {
      jerseyNumber: 2,
      firstName: 'Graham',
      lastName: 'Ortiz',
      position: 'Midfield',
      isActive: false,
    },
  ]

  const players: Player[] = rosterSeed.map((p) => ({
    id: createId(),
    teamId: team.id,
    createdAt: now,
    updatedAt: now,
    ...p,
  }))

  const byNumber = (jerseyNumber: number): Player => {
    const player = players.find((p) => p.jerseyNumber === jerseyNumber)
    if (!player) throw new Error(`seed: no player with jersey number ${jerseyNumber}`)
    return player
  }

  const dressedIds = players.filter((p) => p.isActive).map((p) => p.id)
  const sixDaysAgo = now - 1000 * 60 * 60 * 24 * 6

  const finishedGame: Game = {
    id: createId(),
    teamId: team.id,
    opponentName: 'Lakeview',
    date: sixDaysAgo,
    isHome: true,
    dressedPlayerIds: dressedIds,
    status: 'final',
    createdAt: sixDaysAgo,
    updatedAt: sixDaysAgo,
  }

  const liveGame: Game = {
    id: createId(),
    teamId: team.id,
    opponentName: 'Northfield',
    date: now,
    isHome: false,
    dressedPlayerIds: dressedIds,
    status: 'in_progress',
    createdAt: now,
    updatedAt: now,
  }

  const finishedEvents = buildFinishedGameEvents(finishedGame.id, sixDaysAgo, byNumber)
  // Started 10 fake minutes before "now" (not at "now") so every synthetic
  // event timestamp lands in the past — buildLiveGameEvents advances up to 7
  // fake minutes forward from its start, and a real event recorded moments
  // after seeding must sort *after* all of them, not before. Getting this
  // wrong doesn't corrupt anything, but it makes "undo the last event" and
  // the event feed's ordering look wrong against the seeded live game for
  // several minutes after seeding, which is confusing enough to fix here.
  const liveEvents = buildLiveGameEvents(liveGame.id, now - 10 * 60_000, byNumber)

  await db.transaction('rw', db.teams, db.players, db.games, db.statEvents, async () => {
    await db.teams.add(team)
    await db.players.bulkAdd(players)
    await db.games.bulkAdd([finishedGame, liveGame])
    await db.statEvents.bulkAdd([...finishedEvents, ...liveEvents])
  })
}

export async function clearDatabase(): Promise<void> {
  await db.transaction(
    'rw',
    db.teams,
    db.players,
    db.games,
    db.statEvents,
    db.syncQueue,
    async () => {
      await Promise.all([
        db.teams.clear(),
        db.players.clear(),
        db.games.clear(),
        db.statEvents.clear(),
        db.syncQueue.clear(),
      ])
    },
  )
}

function playerEvent(
  gameId: string,
  type: PlayerEventType,
  playerId: string,
  quarter: number,
  timestamp: number,
  gameClock: string | null = null,
): StatEvent {
  return {
    id: createId(),
    gameId,
    type,
    playerId,
    quarter,
    gameClock,
    timestamp,
    relatedEventId: null,
    deleted: false,
  }
}

function assistEvent(
  gameId: string,
  playerId: string,
  relatedEventId: string,
  quarter: number,
  timestamp: number,
  gameClock: string | null = null,
): StatEvent {
  return {
    id: createId(),
    gameId,
    type: 'assist',
    playerId,
    quarter,
    gameClock,
    timestamp,
    relatedEventId,
    deleted: false,
  }
}

function teamEvent(
  gameId: string,
  type: TeamEventType,
  quarter: number,
  timestamp: number,
  gameClock: string | null = null,
): StatEvent {
  return {
    id: createId(),
    gameId,
    type,
    playerId: null,
    quarter,
    gameClock,
    timestamp,
    relatedEventId: null,
    deleted: false,
  }
}

function penaltyEvent(
  gameId: string,
  playerId: string,
  quarter: number,
  timestamp: number,
  penaltyDurationSeconds: PenaltyDurationSeconds,
  penaltyReleasable: boolean,
  gameClock: string | null = null,
): StatEvent {
  return {
    id: createId(),
    gameId,
    type: 'penalty',
    playerId,
    quarter,
    gameClock,
    timestamp,
    relatedEventId: null,
    deleted: false,
    penaltyDurationSeconds,
    penaltyReleasable,
  }
}

/** A full four-quarter game touching every event type at least once. */
function buildFinishedGameEvents(
  gameId: string,
  startedAt: number,
  byNumber: (jerseyNumber: number) => Player,
): StatEvent[] {
  const goalie = byNumber(1)
  const oppGoalie = byNumber(30)
  const fogo = byNumber(14)
  const doyle = byNumber(3)
  const chen = byNumber(4)
  const ford = byNumber(7)
  const reyes = byNumber(9)
  const walsh = byNumber(10)
  const ito = byNumber(15)
  const nolan = byNumber(17)
  const barrett = byNumber(21)

  let t = startedAt
  const minute = 60_000
  const events: StatEvent[] = []
  const add = (e: StatEvent) => events.push(e)

  for (let quarter = 1; quarter <= 4; quarter++) {
    add(playerEvent(gameId, 'faceoff_win', fogo.id, quarter, (t += minute), '12:00'))

    const goal1 = playerEvent(gameId, 'shot', doyle.id, quarter, (t += minute), '10:41')
    add(goal1)
    add(playerEvent(gameId, 'shot_on_goal', chen.id, quarter, (t += minute), '9:55'))
    add(playerEvent(gameId, 'save', goalie.id, quarter, (t += minute), '9:20'))

    const goal = playerEvent(gameId, 'goal', chen.id, quarter, (t += minute), '8:12')
    add(goal)
    add(assistEvent(gameId, doyle.id, goal.id, quarter, (t += minute), '8:12'))

    add(playerEvent(gameId, 'ground_ball', barrett.id, quarter, (t += minute), '6:47'))
    add(playerEvent(gameId, 'faceoff_loss', fogo.id, quarter, (t += minute), '6:00'))
    add(playerEvent(gameId, 'turnover', walsh.id, quarter, (t += minute), '5:15'))
    add(playerEvent(gameId, 'caused_turnover', nolan.id, quarter, (t += minute), '4:50'))
    add(teamEvent(gameId, 'clear_attempt', quarter, (t += minute), '4:10'))
    add(teamEvent(gameId, 'clear_success', quarter, (t += minute), '4:10'))

    add(playerEvent(gameId, 'goal_against', goalie.id, quarter, (t += minute), '3:02'))

    const secondGoal = playerEvent(gameId, 'goal', ford.id, quarter, (t += minute), '1:30')
    add(secondGoal)
    add(assistEvent(gameId, reyes.id, secondGoal.id, quarter, (t += minute), '1:30'))

    add(playerEvent(gameId, 'save', oppGoalie.id, quarter, (t += minute), '0:45'))

    if (quarter === 2) {
      add(penaltyEvent(gameId, ito.id, quarter, (t += minute), 60, true, '0:20'))
    }
    if (quarter === 3) {
      add(penaltyEvent(gameId, nolan.id, quarter, (t += minute), 180, false, '0:10'))
    }

    if (quarter < 4) {
      add(teamEvent(gameId, 'quarter_end', quarter, (t += minute)))
    }
  }

  return events
}

/** A game in progress, partway through the second quarter — for exercising "resume in-progress game". */
function buildLiveGameEvents(
  gameId: string,
  startedAt: number,
  byNumber: (jerseyNumber: number) => Player,
): StatEvent[] {
  const goalie = byNumber(1)
  const fogo = byNumber(14)
  const doyle = byNumber(3)
  const chen = byNumber(4)

  let t = startedAt
  const minute = 60_000
  const events: StatEvent[] = []
  const add = (e: StatEvent) => events.push(e)

  add(playerEvent(gameId, 'faceoff_win', fogo.id, 1, (t += minute), '12:00'))
  const goal = playerEvent(gameId, 'goal', doyle.id, 1, (t += minute), '9:14')
  add(goal)
  add(assistEvent(gameId, chen.id, goal.id, 1, (t += minute), '9:14'))
  add(playerEvent(gameId, 'save', goalie.id, 1, (t += minute), '6:02'))
  add(teamEvent(gameId, 'quarter_end', 1, (t += minute)))
  add(playerEvent(gameId, 'faceoff_loss', fogo.id, 2, (t += minute), '12:00'))
  add(playerEvent(gameId, 'ground_ball', chen.id, 2, t + minute, '10:30'))

  return events
}
