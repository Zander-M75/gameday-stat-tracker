# Progress

Tracks phase-by-phase build status. Checked off as part of the commit that
completes each phase. If a session ends early, read the note at the bottom
before resuming.

- [x] Phase 0: Scaffold — Vite + React + TS + Tailwind, responsive app shell
      (bottom tab bar on phone, sidebar on iPad landscape+), dark/light theme
- [x] Phase 1: Data model + local database — Dexie schema, event-log source
      of truth, dev-only `/debug` screen, seed data
- [x] Phase 2: Roster management — add/edit/archive players, sort by number,
      bulk-add paste flow
- [x] Phase 3: Game setup — create game (opponent/date/home-away/dressed
      roster), games list split into in-progress/past, resume via
      `/games/:gameId`
- [x] Phase 4a: Stat entry core (recording logic, undo stack, toasts) — rough
      functional UI, no per-device layout yet
- [x] Phase 4b: Phone stat entry layout — jersey grid ↔ stat buttons swap,
      collapsible event feed strip
- [x] Phase 4c: iPad stat entry layout — persistent grid + buttons + feed,
      landscape adds feed as a third column, portrait stacks it below
- [x] Phase 4d: Desktop stat entry layout — three panes, jersey-number +
      letter-key keyboard entry, Cmd/Ctrl+Z undo, dismissible shortcut hints
- [x] Phase 5: Live box score — per-player table + team totals derived live
      from the event log, save %/faceoff % called out prominently, sortable
      columns, phone tab vs. always-visible on iPad/desktop
- [x] Phase 6: PWA and offline hardening — vite-plugin-pwa (autoUpdate),
      generated app icon set (manifest + maskable + apple-touch), offline
      indicator, app-shell precaching with SPA offline fallback
- [x] Phase 7: Supabase schema and auth — Postgres schema + RLS mirroring the
      local Dexie tables, magic-link auth via a non-gating `/account` screen.
      No sync yet.
- [x] Phase 8: Sync engine — local outbox queue, idempotent upserts by
      client-generated UUID, DB-level last-write-wins + monotonic-delete
      conflict resolution, unobtrusive pending/syncing indicator
- [x] Phase 9a: Season leaderboard — season-wide per-player aggregation
      derived from the full team event log, dense sortable table with
      column-visibility toggles and CSV export (desktop/iPad), stacked
      sort-by cards (phone)
- [x] Phase 9b: Per-player season detail view — season totals header plus a
      game-by-game splits table (desktop/iPad) / stacked cards (phone), each
      row linking back to its game
- [x] Phase 10: Shareable recap graphic — canvas-rendered PNG (final score,
      W/L badge, top 3 performers), Download everywhere, Web Share API
      share on devices that support file attachments
- [x] Phase 11: Cross-device pass — static audit at 390/768/1024/1440px
      (touch targets, overflow, keyboard-shortcut scoping, nav exclusivity);
      fixed 8 files with sub-56px touch targets on touch breakpoints
- [x] Phase 12: Polish and docs — error boundary (route-scoped, nav survives
      a crash), a "game not found" fix for a stale/bad URL, a full README
      (setup, architecture, event-log rationale); screenshots still
      outstanding, see notes below

## Session breaks

Per the working agreement, stop and tell the user to start a fresh session
after phase 3, after phase 4d, and after phase 8.

## Notes for resuming

**All twelve phases are done. There's no phase 13 — what's left is
verification, not more building.**

Before trusting this app for a real game, the things that could only be
checked by static review (not a running browser, per CLAUDE.md's command
rules) need a real pass:

- Actually resize/DevTools-test the app at 390/768/1024/1440px (phase 11
  was a code audit, not a visual one — see its notes below).
- Exercise a full game on a real phone: record a full four-quarter game,
  close the app, restart the device, confirm the data survived (phase 6
  asked for this explicitly and it was never done).
- ~~Set up a real Supabase project and confirm sync actually works end to
  end~~ — **done 2026-09-03**, against a live project. Found and fixed two
  real bugs in the process (see "Phase 8 live-verification" below). Still
  outstanding: a real *conflict* (two tabs/devices editing the same record)
  has not been forced yet — the sync path itself is now proven, but the
  conflict-resolution triggers in `0002_sync_conflict_resolution.sql` still
  haven't actually fired against live data.
- Open the recap graphic (phase 10) at real size and check for text overlap
  with a long opponent/player name.
- Capture the README's screenshots (see its own placeholder section).

### Phase 12 decisions worth knowing before touching polish/error-handling

- **New `src/components/ErrorBoundary.tsx`**, a class component (React has
  no hook-based error boundary API) mounted in `AppShell.tsx` around only
  `{children}` — the routed page — not the sidebar/bottom-tab chrome around
  it. That placement is deliberate: if one screen throws, the coach can
  still tap to a different tab and keep working instead of the whole app
  going blank. It's keyed by `useLocation().pathname`, which matters more
  than it looks — without the key, navigating away from a crashed screen
  would keep showing the frozen fallback UI forever (the boundary's local
  `error` state doesn't know or care that `children` changed underneath it
  once it's caught something), since React only re-runs
  `getDerivedStateFromError` on a genuinely new component instance, not on
  a prop change to an existing one. Keying by path forces a fresh instance
  on every navigation.

- **Found and fixed a real gap while auditing loading states**:
  `GameDetailPage` couldn't tell "the game query is still loading" apart
  from "this game id doesn't exist" — both cases made `useLiveQuery` return
  `undefined`, so a stale bookmark or a game deleted on another device
  before this one's sync caught up would spin on "Loading…" forever with no
  way out. Fixed using `useLiveQuery`'s (underdocumented but real) third
  argument — a default value distinct from `undefined` — so `'loading'`
  and "resolved to nothing" are now different states, and the latter
  redirects to `/games`. `PlayerSeasonDetailPage` never had this bug,
  because it loads the full player array and does `.find()` locally, where
  "loaded but not found" and "still loading" were already naturally
  distinguishable (`undefined` array vs. an array that just doesn't contain
  a match).

- **Empty and loading states elsewhere were audited, not rewritten** — every
  list-driven screen already had a real empty-state message from the phase
  that built it (`RosterPage`, `GamesPage`, `SeasonPage`,
  `PlayerSeasonDetailPage`, `BoxScoreTable`, `EventFeed`, the player
  pickers), and every data-dependent page already gated on `undefined` with
  a "Loading…" fallback before this phase touched anything. No gaps found
  there beyond the one above.

- **Screenshots were not captured** — this session never had a browser
  available (CLAUDE.md's command-execution rules block `npm run dev`), so
  the README's screenshots section is a placeholder with instructions
  instead of actual images. This is the one sub-item of phase 12 that
  couldn't be done from here at all, not a corner that was cut.

### Phase 11 decisions worth knowing before touching layout/breakpoints

- **This was a static code audit, not a visual one — CLAUDE.md's command
  execution rules block `npm run dev`, so nothing here was actually looked
  at in a browser at any width.** What was done instead: traced every
  `useBreakpoint()`/`isAtLeast()` call site against the four spec'd widths
  (390 phone, 768 iPad portrait, 1024 iPad landscape, 1440 desktop) by hand
  to confirm which layout branch each one resolves to at each width; grepped
  every `min-h-*` utility in the app and classified each as a real
  interactive touch target vs. decorative (e.g. `PlayerRow`'s jersey-number
  badge `<span>` isn't a button, so it's exempt) vs. already
  breakpoint-gated correctly; checked every `truncate` usage's containing
  flex/grid context against the actual CSS spec rule that governs it (see
  below); confirmed there's exactly one `keydown` listener in the whole app
  (`DesktopStatEntryLayout`) and that the component mounting it is gated to
  `isAtLeast('xl')`; confirmed `AppShell` is a clean if/else with no path
  where both `Sidebar` and `BottomTabBar` render. Before trusting this
  phase, actually resize a real browser window through all four widths (or
  DevTools device toolbar) and look for what static analysis can't catch —
  visual crowding, awkward wrapping, anything that reads wrong despite
  being technically within spec.

- **Fixed eight files where a real control was sized below the 56px
  touch-target minimum on phone/iPad** (`min-h-10` = 40px or `min-h-12` =
  48px used unconditionally, instead of gated to shrink only at `xl` like
  the rest of the app already does elsewhere): `AssistPicker.tsx` ("No
  assist" + candidate buttons — these render *during live stat entry*,
  arguably the worst place in the app for an undersized target),
  `PenaltyPicker.tsx` (same, "Cancel" + duration/releasable buttons),
  `ThemeToggle.tsx` and `Sidebar.tsx`'s Account link (both render starting
  at `lg`/1024px, which is iPad-landscape — still a touch device per
  CLAUDE.md's own device bucket, not "desktop" until `xl`/1280), `RosterPage.tsx`'s
  jersey-sort toggle and "Show archived" label, `SeasonPage.tsx`'s "Show
  archived" label (copied the same undersized pattern when phase 9a was
  written — caught by this same audit), `SeasonTable.tsx`'s column-toggle
  chips and Export CSV button (inconsistent with that same file's own sort-header
  buttons, which already had the correct responsive sizing), and
  `NewGameForm.tsx`'s "All"/"None" dressed-roster shortcuts (had no height
  class at all — true tap target was just the text line-height). All fixed
  to the same pattern used everywhere else in the app for this exact
  tradeoff: `min-h-14 xl:min-h-10` (56px through iPad landscape, 40px only
  once truly desktop). **Deliberately left alone**: `DebugPage.tsx` (explicitly
  a dev-only screen per its own phase 1 comment, not part of the coach-facing
  nav this phase is auditing) and plain breadcrumb-style back links like "←
  Games"/"← Season" (industry-standard exception for low-frequency inline
  text navigation, not the accidental-mis-tap-during-live-entry problem the
  56px rule exists to prevent — flagging this judgment call explicitly in
  case it's wrong).

- **The `truncate` audit surfaced no bugs, but is worth recording since the
  reasoning isn't obvious**: several spans use `flex-1 truncate` (or just
  `truncate`) with no `min-w-0` alongside them (`EventFeed.tsx`,
  `DesktopPlayerList.tsx`, `EventFeedStrip.tsx`). That pattern usually *is*
  a bug — a flex item's default automatic minimum width is its content size,
  which fights `flex-1` and can push the row wider than its container
  instead of truncating. But per the CSS Flexbox spec, an item's automatic
  minimum size becomes `0` (not content-based) when its own computed
  `overflow` isn't `visible` — and Tailwind's `truncate` utility bundles
  `overflow: hidden` directly onto the element it's applied to. So wherever
  `truncate` sits on the *same* element as `flex-1` (not a parent), it's
  already safe with no `min-w-0` needed. Grid usages (`BoxScoreSummary`,
  `SeasonPlayerCards`, `PlayerSeasonDetailPage`'s stat grids) are safe for a
  related reason: Tailwind's `grid-cols-N` utilities already emit
  `minmax(0, 1fr)` tracks, not `auto`-sized ones. Don't "fix" any of these
  by reflexively adding `min-w-0` — it's already correct, and the note is
  here so the next person doesn't waste time on it.

- **The dense tables' `overflow-x-auto` + `min-w-[...]` wrappers
  (`BoxScoreTable`, `SeasonTable`, `PlayerGameSplitsTable`) are intentional
  contained horizontal scroll, not a violation of "nothing should
  horizontally scroll."** That phrase in the phase 11 spec is read as
  scoped to the page/body level (an accidental layout overflow), not a
  mandate to rip out phase 5's already-established "the table scrolls
  sideways within its own box on a narrow phone" design — the two aren't in
  tension once "nothing" is read as "no unintentional page-level scroll."

### Phase 10 decisions worth knowing before touching the recap graphic

- **Nothing here has been visually verified in a real browser.** CLAUDE.md's
  command execution rules block `npm run dev`, so the canvas layout in
  `domain/recapImage.ts` was hand-computed (row heights, baseline offsets,
  the gap between the score row and the name row above it) and checked for
  arithmetic consistency, not eyeballed. `npm run build`/lint/format all
  pass, which only proves it compiles — before trusting this phase, open a
  game with some recorded stats, click "Share recap," and actually look at
  the rendered canvas at real size for overlap or clipping, especially with
  a long opponent name or a player with a long last name (the
  `fitFontSize` shrink-to-fit helper is exercised there, but capped at a
  22px floor with no wrapping, so a truly long name will still visually
  crowd its row).

- **Split into three files on purpose**: `domain/recap.ts` (pure data —
  `computeRecapData` derives score + top-3-by-points performers from the
  event log, same derive-don't-store rule as everything else),
  `domain/recapImage.ts` (pure canvas drawing, no React, no DOM beyond the
  `HTMLCanvasElement` it's handed), `components/recap/RecapPanel.tsx` (the
  React wrapper — owns the `<canvas>` ref, re-renders it in a `useEffect` on
  `data` change, and adds Download/Share buttons below it). Keeping the
  canvas math out of the component means it could be unit-tested standalone
  later without a DOM, if that ever becomes worth doing.

- **Top performers are the top 3 dressed players by points (goals +
  assists), zero-point players excluded** — not configurable, not
  positional (a shutdown defenseman with a goal and no other offensive
  stats would show up ahead of a goalie with a great save percentage, since
  "top performers" reads as points-based in the spec's own wording, not
  "one per category"). If a coach wants goalie/FOGO performance called out
  too, that's a real feature request to take back to the user, not
  something to guess at.

- **The share button is gated by feature detection
  (`RecapPanel.tsx`'s `supportsFileShare`), not by device/breakpoint** —
  `navigator.canShare({ files: [...] })` is the documented way to check
  whether the Web Share API on this browser accepts a file attachment
  before offering the button, since `navigator.share` exists on some
  desktop browsers but rejects files there. This will naturally hide the
  Share button on desktop Chrome/Firefox and show it on iOS/Android/Safari,
  without hand-coding a user-agent or breakpoint check — the phase spec's
  "via the Web Share API on mobile" is satisfied by feature detection
  doing the right thing, not by gating on `useBreakpoint()`.

- **Download works everywhere, including desktop** — `canvas.toBlob` +
  `URL.createObjectURL` + a synthetic `<a download>` click, same technique
  `domain/csv.ts` already uses for season CSV export (phase 9a). No new
  pattern introduced.

- **"Share recap" is not gated on `game.status === 'final'`** — the button
  is always available on `GameDetailPage`, even mid-game, despite the phase
  spec's framing ("after a game, generate..."). A coach wanting to text a
  halftime score to the group chat is a real use case this app already
  supports for the live box score, and gating the recap button on status
  would be an arbitrary restriction the spec didn't actually ask for.

- **`RecapPanel` is toggled open/closed the same way `NewGameForm`/
  `PlayerForm`/`BulkAddPanel` are elsewhere in the app** (a plain
  `useState<boolean>` + inline panel, not a modal/dialog) — CLAUDE.md's "no
  modals" rule is scoped to live stat entry specifically, so a modal
  would've been permissible here, but the toggle-panel pattern is already
  established throughout the app and there was no reason to introduce a
  second UI convention for showing/hiding a panel.

### Phase 9b decisions worth knowing before touching per-player season detail

- **`computePlayerGameSplits` (added to `domain/season.ts`) reuses
  `computePlayerBoxScore` per game**, same pattern as `computeSeasonBoxScore`
  reusing it across the whole log — call it with `[player]` and just that
  game's events (bucketed by `gameId` in one pass over the team's event log)
  to get one `StatTotals` line per game. A game counts as "relevant" if the
  player has any event in it OR was in `dressedPlayerIds`, so a
  dressed-but-scoreless game still shows up as a zeroed row instead of
  silently vanishing from the log.

- **The splits table has no click-to-sort** (`PlayerGameSplitsTable`,
  unlike `SeasonTable`/`BoxScoreTable`) — it's a chronological log by
  design, always most-recent-first, and re-sortable game history isn't
  something the phase spec asked for. Don't add sorting here reflexively
  just because the other two tables have it.

- **`PlayerSeasonDetailPage` fetches the same three queries as
  `SeasonPage`** (`allPlayersForTeam` / `gamesForTeam` / `liveEventsForTeam`)
  rather than something scoped to one player — there's no per-player Dexie
  query, and at this app's scale (one team, a season's worth of games)
  filtering in JS after an unscoped fetch is the same tradeoff `db/queries.ts`
  already makes elsewhere (see the `isActive`/`deleted` filtering note in
  `db.ts`). If a future phase needs a real per-player query, add one there,
  not here.

- **Row/card links use `/games/:gameId`, the existing route from phase 3/4**
  — there's no new "past game read-only view," clicking through to a game
  the coach already finished just opens `GameDetailPage` in its normal
  "Reopen game" state. That was a deliberate non-decision: building a
  separate read-only recap view wasn't asked for by this phase (phase 10's
  shareable recap graphic is the actual "look back at a finished game"
  feature), so this reuses what already exists instead of inventing a
  parallel screen.

### Phase 9a decisions worth knowing before touching season stats

- **New `src/domain/season.ts`** is the season-wide derivation layer, same
  philosophy as `boxScore.ts`: nothing stored, everything recomputed from
  the live event log. `computeSeasonBoxScore(players, games, events)` calls
  `computePlayerBoxScore` (phase 5) directly with the *entire* team event
  log instead of one game's — that function already tallies by `playerId`
  with no game scoping, so season totals fall out for free. The only thing
  it can't answer is `gamesPlayed` (a player can be dressed and record zero
  events), which is counted separately off every `Game.dressedPlayerIds`.

- **New `liveEventsForTeam(teamId)` in `db/queries.ts`** — looks up every
  game for the team, then `db.statEvents.where('gameId').anyOf(gameIds)`.
  Not indexed as a compound query since there's no `[teamId+...]` index on
  `statEvents` (it only has `gameId`, see `db.ts`) — this is a small
  single-coach app, so an extra games lookup plus an `anyOf` is cheap. If a
  future phase needs this at real scale, that's the place to reconsider, not
  here.

- **Season view reuses the whole roster (`allPlayersForTeam`), not just
  active players**, with a `showArchived` toggle defaulted off — same
  pattern as `RosterPage`. An archived player's season stats are real
  history; hiding them by default (not deleting them from the computation)
  matches the roster page's own "archived, not gone" semantics.

- **The three "leaderboards" the phase spec names (goals, assists, points,
  ground balls, caused turnovers, faceoff%, save%) are one sortable table**,
  not seven separate ranked widgets — `SeasonTable`'s click-to-sort columns
  already let any of those stats become "the leaderboard" by sorting on it,
  same as `BoxScoreTable`'s pattern from phase 5. Default sort is `points`
  desc so the table opens already reading as a leaderboard. This was a
  scope call, not a literal reading of "leaderboards" (plural) — revisit
  only if the user specifically wants separate top-N widgets.

- **Column visibility is a `useState<Set<string>>` of hidden keys, not
  persisted** — same "revisit only if a real user finds it annoying" call
  phase 4d made for its shortcut-hint dismiss state. `#` and `Player` are
  hard-coded non-toggleable (`Column.toggleable`) since a table with no
  identity column is useless.

- **CSV export (`domain/csv.ts`) always exports every column, ignoring the
  current visibility toggles** — visibility is a display convenience, the
  export is meant to be the full data dump for the coach to actually
  analyze in a spreadsheet. No CSV library — a 10-line RFC 4180 quoting
  function plus a Blob/`<a download>` trick, per CLAUDE.md's "20 lines
  instead of a package" rule. Only wired up on `SeasonTable` (desktop/iPad),
  not `SeasonPlayerCards` — the phase spec ties CSV export to "wide screens"
  specifically.

- **Phone gets real stacked cards, not a squeezed reuse of `SeasonTable`** —
  unlike the phase 5 box score table (which just scrolls horizontally at any
  width), phase 9's spec explicitly calls for cards on phone. `SeasonPlayerCards`
  has its own "sort by" `<select>` standing in for click-to-sort headers,
  since a full 18-column table has nowhere to go at 390px.

- **Routing to a per-player detail view (`/season/:playerId`) was wired from
  both `SeasonTable`'s player-name cell and `SeasonPlayerCards`' whole-card
  link before the destination page existed** — phase 9b (below) added
  `PlayerSeasonDetailPage` to complete it.

### Phase 8 live-verification (2026-09-03) — two real bugs found and fixed

The user created a real Supabase project, ran both migrations, and signed
in via magic link — the first time any of this ran against a live backend.
Recording real stat events immediately surfaced persistent 403s on
`players`/`games`/`stat_events`, then 409s once the first bug was fixed.
Both turned out to be real bugs, not RLS policy mistakes — the policies
themselves were correct throughout. All 46 local entities now show a
non-null `syncedAt` with no `lastError` in `/debug`'s syncQueue table.

1. **The dev seed script bypassed the sync queue entirely.**
   `src/db/seed.ts` writes team/players/games/statEvents straight to Dexie
   via `add`/`bulkAdd`, never calling `enqueueSync`. This app is
   single-team, so *every* real player/game/stat_event ever created
   references that one team's id as a foreign key — and since the team
   itself had no `syncQueue` row, it could never sync, so Supabase's RLS
   check (`team_id in (select id from teams where owner_id = auth.uid())`)
   always resolved to nothing and rejected every dependent insert with a
   403. A first fix patched only `getOrCreateTeam()`; a second pass found
   the same gap applied to seeded players/games/statEvents too (a coach
   using the seeded roster for a real game hit `stat_events_player_id_fkey`
   violations the same way). **Fixed generally**: `syncEngine.ts` now has
   `backfillMissingSyncQueueEntries()`, run at the top of every
   `flushSyncQueue()` — it scans all four local tables for any id with no
   `syncQueue` row at all (not "failed to sync," genuinely never enqueued)
   and enqueues it. This closes the whole class of bug, not just the one
   instance of it: any future code path that writes to Dexie without going
   through `db/queries.ts`'s mutation functions would hit the same gap
   otherwise. Cheap at this app's scale (full four-table scan on every
   flush, fine for a season's worth of rows) and a no-op once every id has
   a row.

2. **`SyncQueueItem.lastError` was silently discarding every real error
   message.** `flushSyncQueue`'s catch block did
   `error instanceof Error ? error.message : String(error)` — but
   supabase-js throws `PostgrestError`, a plain object
   (`message`/`details`/`hint`/`code`), not a native `Error`. `error
   instanceof Error` was always `false` for it, so every failure's
   `lastError` was the literal string `"[object Object]"`, useless for
   diagnosing anything. This bug is *why* the first bug took several rounds
   to pin down — the actual Postgres error text (e.g. `23503 | insert or
   update on table "stat_events" violates foreign key constraint
   "stat_events_player_id_fkey" | Key is not present in table "players".`)
   was there the whole time, just discarded before it ever reached
   `/debug`. Fixed with a `describeError()` helper in `syncEngine.ts` that
   checks for a `message` property on any thrown object, not just
   `instanceof Error`, and joins `code`/`message`/`details`/`hint` into one
   readable string.

Both bugs existed since phase 8 was written and could only have been found
by running against a live backend — exactly the risk this file's "notes for
resuming" section had been flagging since phase 8's commit.

### Phase 8 decisions worth knowing before touching sync

- **Update, 2026-09-03: this has now run against a live Supabase project** —
  see "Phase 8 live-verification" above for the two real bugs that surfaced
  and were fixed. The push path (queue → flush → RLS → land in Postgres) is
  now proven end to end, not just compiled. What's *still* unverified: the
  two conflict-resolution triggers (`reject_stale_update`,
  `merge_stat_event_delete`) have never actually fired against live data —
  nothing so far has exercised two writers touching the same row. To close
  that out: reproduce a conflict for real (edit the same player from two
  tabs, or flip offline/online mid-game) and confirm the triggers behave as
  documented rather than just trusting the SQL reads correctly.

- **The queue is a local outbox keyed by entity, not by write.** `enqueueSync`
  (`src/sync/queue.ts`) upserts one `syncQueue` row per `(entityType,
entityId)` pair using a deterministic id (`` `${entityType}:${entityId}` ``)
  rather than a fresh uuid per call — so ten edits to the same player before
  it ever syncs collapse into one pending row, and the row reopens
  (`syncedAt` reset to `null`) if a synced entity changes again later. Every
  mutation in `db/queries.ts` (the "high-risk" data layer per CLAUDE.md's own
  warning) now ends with an `await enqueueSync(...)` call — if a new mutation
  function gets added there later, it needs one too, or its writes will
  silently never reach the cloud.

- **`flushSyncQueue` (`src/sync/syncEngine.ts`) has no per-write trigger** —
  nothing in `db/queries.ts` calls it. It's driven entirely by
  `useSyncEngine()` (mounted once in `App.tsx`: flush on mount, on the
  browser's `online` event, and on a 20s interval fallback) plus one extra
  nudge from `AuthProvider` right after a session appears. This was a
  deliberate simplification — CLAUDE.md's spec only asks for "background"
  sync that flushes "when connectivity returns," not low-latency delivery,
  so a short interval was simpler than threading a flush call through every
  write in the already-sensitive data layer. If a coach ever needs
  near-real-time cross-device visibility mid-game, that's the thing to
  revisit, not the queue design itself.

- **Re-entrancy: `isSyncing` is set synchronously, before the first
  `await`.** Multiple triggers (mount + an `online` event, say) can fire in
  the same tick; setting the flag before any `await` is what actually makes
  the guard work — setting it after the first `await` (an earlier draft of
  this file did exactly that) lets two overlapping calls both read `false`
  and both proceed. Idempotent upserts would have made that merely wasteful
  rather than incorrect, but there was no reason to leave the race in once
  spotted.

- **Ownership is resolved at flush time, not stored locally.** `teamToRow`
  (`src/sync/mapping.ts`) takes an `ownerId` parameter that `flushSyncQueue`
  supplies from `supabase.auth.getSession()` — there's no `ownerId` field
  anywhere in `db/types.ts`, since the local app has no concept of "who owns
  this team" (see the phase 7 note on `teams.owner_id`). A flush is a no-op
  whenever there's no active session, both because there's nothing valid to
  stamp a new team with and because every RLS policy would reject it anyway.

- **Conflict resolution lives in the database, not the client** —
  `supabase/migrations/0002_sync_conflict_resolution.sql`. Two trigger-based
  rules, chosen because `players`/`games` and `stat_events` are different
  shapes of "conflict": (1) `players`/`games` get a `BEFORE UPDATE` trigger
  that returns `OLD` (keeping the existing row, no error) whenever the
  incoming `updated_at` isn't strictly newer — real last-write-wins, immune
  to whatever order two devices' flushes happen to race in; (2) `stat_events`
  get a trigger that ORs incoming and existing `deleted` instead of
  overwriting it, because `deleted` is monotonic locally (`db/queries.ts`
  never flips it back to `false`) — a delete can never be lost to a
  later-arriving flush of the pre-delete state. `teams` gets neither trigger:
  no `updated_at` column (mirrors the local `Team` type, which has none) and
  nothing in the app updates a team after creation, so there's nothing to
  conflict over.

- **A per-item failure never throws past `flushSyncQueue`** — `syncOne`'s
  errors are caught inside the loop in `flushSyncQueue`, recorded onto that
  item's `attempts`/`lastError`, and the loop continues to the next item.
  There's no backoff/retry cap; a permanently-broken row just gets retried
  on every flush forever, at whatever cadence `useSyncEngine`'s interval
  runs. That was a deliberate scope call, not an oversight — CLAUDE.md asks
  for conflict-resolution edge cases to be handled and documented, not a
  general retry/backoff policy, and one was easy to add later if a real
  failure mode ever shows up needing it.

- **`SyncStatusIndicator` and `OfflineIndicator` now share one positioned
  wrapper, `StatusBadges`** (`src/components/layout/`) — both indicators lost
  their own `fixed`/positioning classes and became plain pills;
  `StatusBadges` owns the `fixed right-2` placement and stacks whichever of
  the two are actually rendering via flex `gap` (which only applies between
  real children, so zero/one/two visible badges all self-arrange with no
  manual offset math). `AppShell` now mounts `<StatusBadges />` where it used
  to mount `<OfflineIndicator />` directly — this was anticipated in the
  phase 6 note ("if a later phase adds more always-present chrome, put it
  here too"). If a future phase adds a third always-present badge, extend
  `StatusBadges`, don't give it its own separate fixed-position mount point.

- **Sync status rewrites `SyncQueueItem.syncedAt`/`attempts`/`lastError` in
  place rather than deleting rows once synced** — the queue doubles as a
  light sync log (matches the fields the phase 1 type already had), not a
  transient buffer. Over a full season this means one permanent `syncQueue`
  row per distinct entity ever created (not per write, thanks to the
  dedup-by-id upsert above) — thousands of rows across a season is still
  trivial for IndexedDB, so no pruning was added. Revisit only if that
  assumption turns out wrong.

### Phase 7 decisions worth knowing before touching Supabase/auth

- **There is no live Supabase project behind any of this yet, and I can't
  create one.** That requires an account/dashboard the user owns. Everything
  in this phase was written and verified as far as `npm run build` can verify
  it (compiles, `supabase-js` client constructs correctly when env vars are
  present); the actual schema was never run against a real database. Before
  phase 8 starts touching sync, the user needs to: create a Supabase project,
  run `supabase/migrations/0001_init.sql` against it (SQL editor or
  `supabase db push`), copy the project's URL + anon key from Settings > API
  into a local `.env` (from `.env.example`, which is committed;
  `.env` itself is gitignored), and in Auth settings add whatever URL(s) the
  app will actually run on (`http://localhost:5173` for dev, the Vercel
  domain once deployed) to the redirect allow-list — magic-link emails will
  silently fail to log the user in if that's not configured, since
  `emailRedirectTo` in `AuthProvider.tsx` is set to `window.location.origin`
  and Supabase rejects redirects not on that list.

- **Auth is additive, never a gate.** `AuthProvider` (`src/auth/`) wraps the
  whole app in `main.tsx` (outermost, alongside `ThemeProvider`/
  `ToastProvider`), but nothing downstream checks `status` to block
  rendering — `/account` is the only screen that reads it. This matches
  CLAUDE.md's offline-first rule taken to its logical conclusion: the app
  must work with no network _and_ with no cloud project configured at all.
  `supabase` (`src/supabase/client.ts`) is `null` in that unconfigured case
  rather than throwing, and `AuthProvider`/`AccountPage` both branch on that
  (`status: 'unconfigured'`) instead of assuming credentials exist. Phase 8
  should keep this shape — sync being unavailable should degrade the same
  way, never crash a screen that doesn't care about sync.

- **`/account` is a real route but deliberately not in `NAV_ITEMS`** — phase
  0 fixed the primary nav to exactly Roster/Games/Season, and account/auth
  doesn't belong there. It's reachable via a small "Account" link at the
  bottom of `Sidebar` (next to `ThemeToggle`) on iPad-landscape+, and via a
  new floating `AccountButton` (`src/components/layout/AccountButton.tsx`,
  fixed top-left, 56px per the touch target rule) on phone/iPad-portrait,
  where there's no sidebar to tuck a link into. `AccountButton` only renders
  in `AppShell`'s non-`isDesktopNav` branch — don't render both at once, or
  there'd be two entry points on some breakpoint.

- **The cloud schema isn't a literal type-for-type mirror of
  `src/db/types.ts`**, just a structural/relationship one, per the phase
  spec's own wording ("mirroring the local schema"). Two deliberate
  deviations, both explained in comments at the top of
  `supabase/migrations/0001_init.sql`: (1) `teams.owner_id` — the local app
  has nothing like it (one IndexedDB per device, inherently single-user),
  but RLS needs something to check `auth.uid()` against, so every other
  table's policy walks the ownership chain back up through `team_id`/
  `game_id` instead of duplicating `owner_id` everywhere; (2) epoch-ms
  numbers (`date`, `createdAt`, `updatedAt`, `timestamp`) became `timestamptz`
  columns — storing raw epoch-ms in Postgres would be unidiomatic and lose
  proper date functions/timezone handling, and phase 8's sync engine is
  already going to need a camelCase-local ↔ snake_case-cloud field mapping
  layer, so converting epoch-ms ↔ timestamptz belongs in that same layer, not
  here.

- **`stat_events.id` has no default** (unlike `teams`/`players`/`games`,
  which use `gen_random_uuid()`) — it's client-generated locally
  (`src/db/id.ts`) specifically so phase 8's upserts are idempotent by id;
  don't add a server-side default here, that would defeat the point.

- **`sync_queue` (the local `SyncQueueItem` table) has no cloud
  counterpart** — it's a local-only outbox of pending pushes, and syncing
  _it_ was never the goal; only the four data tables it points at get mirrored.

### Phase 6 decisions worth knowing before touching PWA/offline

- **Manual device verification is still outstanding and can't be done from
  here.** CLAUDE.md's command execution rules block running `npm run dev` or
  any long-lived server, so nothing in this phase could be exercised in an
  actual browser. What's been verified is everything checkable from a one-shot
  `npm run build`: the service worker and manifest generate, the precache list
  (`dist/sw.js`) includes the JS/CSS bundles, `index.html`, all icon PNGs, and
  a `NavigationRoute` SPA fallback to `index.html`. Still needed from the
  user, by hand, before trusting this phase: iOS Safari add-to-home-screen,
  iPadOS add-to-home-screen, desktop Chrome's install prompt, devtools
  "offline" with a hard reload from cold start, and the phone/iPad
  restart-and-reopen data-persistence check the phase spec calls for
  separately on each. Don't mark those sub-items done from code review alone.

- **Icons are generated, not hand-designed** — `public/icons/*.png` came from
  a one-off pure-Node PNG encoder (no image library, no native deps) that was
  run once and discarded; it's not part of the repo. The mark is a gold ring
  of gauge ticks around a ball on the app's own dark/gold palette
  (`--color-surface`/`--color-accent` from `index.css`), sized for: `icon-192`
  - `icon-512` (manifest, `purpose: any`), `maskable-icon-512` (manifest,
    `purpose: maskable`, content padded inside the safe-zone circle since
    Android crops these), and three `apple-touch-icon-*` (152/167/180 — iOS/
    iPadOS Safari ignores the manifest entirely for add-to-home-screen and only
    reads `<link rel="apple-touch-icon">` tags in `index.html`, added by hand
    since `vite-plugin-pwa` doesn't inject those). If the app ever gets a real
    designed logo, regenerate all six sizes from it rather than hand-editing
    the generated set — the maskable one in particular needs the safe-zone
    padding preserved or Android's circular crop will clip it.

- **`registerType: 'autoUpdate'`** (`vite.config.ts`), not `'prompt'` — a new
  service worker activates silently on next load instead of interrupting the
  coach with an update dialog mid-game. This is the same "never let
  infrastructure interrupt stat entry" principle CLAUDE.md states explicitly
  for phase 8's sync engine; applying it here now means phase 8 doesn't have
  to re-litigate it.

- **`workbox.globPatterns` only covers the built app shell**
  (`**/*.{js,css,html,svg,png,ico,woff2}` in `dist/`) — there's no
  `runtimeCaching` config yet because there's no network API to call yet.
  Phase 7/8 adding Supabase means real network requests will exist; if any of
  those need offline fallback behavior beyond "the write already landed in
  IndexedDB and syncs later" (e.g. an image, a remote font), that's the point
  to add `runtimeCaching` entries — don't assume precaching alone will still
  be enough once there's a backend.

- **`OfflineIndicator` (`src/components/layout/OfflineIndicator.tsx`) reads
  `navigator.onLine` via a new `useOnlineStatus` hook**
  (`src/hooks/useOnlineStatus.ts`, same `useSyncExternalStore` shape as
  `useBreakpoint`) — this is device network-interface state, _not_ whether
  Supabase is actually reachable. Phase 8's sync status indicator is a
  separate, more meaningful signal ("is my data getting to the cloud") and
  should not be merged into this component or hook; they answer different
  questions and CLAUDE.md asks for both independently (offline indicator here
  in phase 6, sync status "visible but not intrusive" in phase 8).

- **`OfflineIndicator` mounts once in `AppShell`, above the sidebar/bottom-tab
  branch**, not duplicated inside both — it's `fixed`-positioned and renders
  `null` while online, so it doesn't care which nav branch is active.
  `AppShell`'s return became a fragment wrapping the existing branch rather
  than two full copies of the indicator. If a later phase adds more
  always-present chrome (phase 8's sync indicator is the obvious next one),
  put it here too rather than threading it into both branches separately.

### Phase 5 decisions worth knowing before touching the box score

- **New `src/domain/boxScore.ts`** is the derivation layer, same philosophy
  as `score.ts`/`quarter.ts` — nothing is stored, everything is recomputed
  from the live event log on every call. `computePlayerBoxScore(players,
events)` returns one `PlayerBoxScoreLine` per player (roster fields +
  `StatTotals`); `computeTeamBoxScore(lines, events)` sums those lines and
  adds the team-level clear stats (which have no per-player attribution).

- **`shot` / `shot_on_goal` / `goal` roll back up into a hierarchy at read
  time**, per the phase 4a note on `PlayerEventType`: the coach taps whichever
  outcome they actually saw (missed / saved-or-blocked / scored) as one
  event, never three. So `totalsFromTally` in `boxScore.ts` computes
  `shotsOnGoal = shot_on_goal + goal` and `shots = shot + shotsOnGoal` —
  don't add separate recording buttons for "every shot is also on goal," the
  math already accounts for it.

- **Percentage fields are `number | null`, never `0` for a zero-attempt
  denominator** — `pct()` returns `null` and `formatPct()` renders that as
  "–". Any new stat card or column should reuse `formatPct`, not
  `Math.round(x * 100)` inline, or a goalie with 0 shots faced will show a
  misleading 0% instead of a dash.

- **Box score is computed against `dressedPlayers` only**, same roster
  GameDetailPage already derives for `StatEntryPanel` — not `allPlayers`.
  Matches the existing convention rather than inventing a second filter.

- **New components, all in `src/components/box-score/`**: `BoxScorePanel`
  (composes the two below, takes `dressedPlayers` + `events` as props — no
  query of its own), `BoxScoreSummary` (the two large Save %/Faceoff % cards
  the spec calls out as "asked about between quarters," plus a compact
  strip of the remaining team totals), `BoxScoreTable` (sortable, click a
  header to sort/flip direction, `overflow-x-auto` wrapper so a phone
  scrolls the table horizontally instead of squeezing 15 columns into
  390px — deliberately not a card-list rewrite for narrow widths, since the
  spec's "not a stretched mobile card list" line is about not reusing a
  cramped layout at desktop width, not a mandate to build a second
  card-based presentation for phone).

- **`GameDetailPage` now runs its own `liveEventsForGame` query** in
  addition to the one already inside `StatEntryPanel` — a second live
  subscription to the same table rather than threading events down as a
  prop, so `StatEntryPanel`'s internals (flagged high-risk-ish by how central
  it is) didn't need to change at all. Slight query duplication, no
  correctness cost.

- **Phone gets a tab switcher (`GameTabButton`, local to
  `GameDetailPage.tsx`) between "Stat entry" and "Box score"; `md` and up
  render both unconditionally, stacked** (box score below stat entry, full
  width) rather than squeezed into a side column — the existing iPad/desktop
  stat-entry layouts already use all available horizontal space for their
  own panes (grid+buttons+feed), so a box score table that actually needs
  width to be "genuinely readable" belongs below, not wedged into what would
  become a fourth cramped column. The page-level scroll this relies on is
  the same pattern phase 4c already established for iPad ("the whole page
  scrolls together in `main`"), so this isn't a new assumption.

### Phase 4d decisions worth knowing before touching stat entry

- **Phase 4a's "rough" fallback layout is gone.** `StatEntryPanel` is now a
  clean three-way branch — `isPhone` (`< md`) → `PhoneStatEntryLayout`,
  `isIpad` (`md` to `< xl`) → `IpadStatEntryLayout`, else →
  `DesktopStatEntryLayout` — with no placeholder branch left. The original
  4a components `PlayerSelectList.tsx` and `StatButtonGrid.tsx` were deleted
  (nothing else referenced them); `EventFeed.tsx` survived because the iPad
  and desktop layouts both still use it directly.

- **Keyboard entry reuses `selectedPlayerId`, it doesn't add a parallel
  selection concept.** `DesktopStatEntryLayout` keeps a local
  `jerseyBuffer` string (sliding last-2-digits-typed window, no Enter
  needed); on every digit keystroke it looks up a dressed player whose
  `jerseyNumber` matches the buffer and calls a _new_ `onMatchPlayer`
  handler (`handleMatchPlayer` in `StatEntryPanel` — direct-set, not
  toggle) to update the exact same `selectedPlayerId` state phone/iPad use.
  A letter keypress that matches a `PLAYER_STAT_BUTTONS` key then just calls
  the existing shared `onStat`, which already clears selection on record —
  so mouse clicks and keyboard both flow through identical handlers with no
  desktop-specific recording logic.

- **The keydown listener lives inside `DesktopStatEntryLayout` itself**
  (mounted via `useEffect` on `window`), not in `StatEntryPanel` or
  somewhere global — since this component only mounts at the desktop
  breakpoint, the listener mounts/unmounts with it, which is what keeps
  shortcuts from leaking into phone/iPad (the concern phase 11's
  cross-device pass explicitly calls out). It ignores all key events while
  `document.activeElement` is a text input/textarea/contenteditable, and
  bails out on any other Cmd/Ctrl/Alt combo before touching digit/letter
  handling so it doesn't hijack real browser shortcuts — only Cmd/Ctrl+Z is
  special-cased (for undo, via `e.preventDefault()`).

- **Team-event and penalty keys (`r`, `y`, `p` in `domain/statButtons.ts`)
  work with no player selected**, same as their on-screen buttons; a
  player-stat letter with no `selectedPlayerId` is a no-op (mirrors the
  disabled state of those buttons on screen).

- **New desktop-only components**, all in `components/stat-entry/`:
  `DesktopPlayerList` (a compact clickable list, not a grid — density over
  touch-target size since desktop's minimum is 40px, and the primary
  selection path is the keyboard anyway), `DesktopStatButtons` (same
  primary/rest/penalty/team structure as `IpadStatButtons`, but every button
  also renders a `<Kbd>` badge with its shortcut letter), and
  `DesktopStatEntryLayout` (the three-column grid, the jersey-buffer state
  and readout, the dismissible shortcut-hint banner, and the keydown
  listener described above).

- **The shortcut-hint banner dismiss state is a plain `useState`**, not
  persisted anywhere — "until dismissed" was read as "for this
  visit/session," not "permanently across reloads." Revisit with
  `localStorage` only if a real user finds it reappearing annoying.

### Phase 4c decisions worth knowing before touching stat entry

- **`StatEntryPanel` now has a three-way branch**: `isPhone` (`< md`),
  `isIpad` (`md` to `< xl`), and desktop as the `else` — which for now is
  still phase 4a's original "rough" layout (`PlayerSelectList` /
  `StatButtonGrid` / `EventFeed`), a placeholder until phase 4d replaces it.
  The `xl` (1280px) cut for "desktop" matches CLAUDE.md's device buckets
  directly; don't reuse `useBreakpoint`'s `DESKTOP_NAV_MIN`/`lg` constant
  here, it answers a different question (sidebar-vs-bottom-tab chrome), see
  the phase 4b note above.

- **New iPad-only components**, all in `components/stat-entry/`:
  `IpadPlayerGrid` (like the phone grid, but shows a persistent selected
  highlight since it never gets swapped away), `IpadStatButtons` (persistent
  column — player buttons disable with no selection, team buttons don't need
  one so stay enabled), `IpadStatEntryLayout` (composes them, reading
  `useBreakpoint().orientation` to decide whether the event feed renders as a
  third column (landscape) or a stacked block below the grid/buttons row
  (portrait)).

- **No per-column internal scrolling was built for iPad** — deliberately
  simpler than that: the whole page scrolls together in `main` (same as
  phone/rough), rather than giving the grid/buttons/feed each their own
  `overflow-y-auto` pane. The spec ("player grid on the left, stat buttons
  persistent on the right, event feed as a live column") only requires they
  render simultaneously without swapping, not that the page itself stop
  scrolling — a fully pinned app-shell layout would need `min-h-0`
  propagated through `GameDetailPage` → `StatEntryPanel` →
  `IpadStatEntryLayout`, which isn't there today. Revisit only if a real iPad
  test shows the whole-page-scroll behavior actually feels wrong.

- **`selectedPlayerId` still auto-clears after a stat/penalty records** (the
  phase 4b behavior in `StatEntryPanel`'s `handleStat`/`handlePenaltyConfirm`)
  — on iPad this just resets `IpadPlayerGrid`'s highlight and
  `IpadStatButtons` back to "Select a player" rather than swapping a screen,
  which is what makes iPad's "still two taps" claim true without needing any
  iPad-specific logic in the shared handlers.

### Phase 4b decisions worth knowing before touching stat entry

- **`StatEntryPanel` now clears `selectedPlayerId` right after a stat or
  penalty is recorded** (`handleStat`, `handlePenaltyConfirm` in
  `StatEntryPanel.tsx`), not just on explicit deselect. This is what makes
  "two taps: tap player, tap stat" actually mean two taps _per event_ instead
  of leaving a player pinned — phase 4c's spec text ("still two taps, but
  nothing swaps out from under you") assumes the same reset-after-record
  behavior, just without the screen swap, so don't special-case this to
  phone-only.

- **`StatEntryPanel` branches on `useBreakpoint().isAtLeast('md')`** to pick
  phone vs. everything else — phone is `< md` (768px), matching the spec's
  device buckets. The non-phone branch is still phase 4a's "rough" layout
  (`PlayerSelectList` / `StatButtonGrid` / `EventFeed`) — phase 4c should
  replace that branch (not add a third parallel branch) once the iPad-vs-
  desktop split matters, likely switching on `isAtLeast('xl')` (1280px) for
  the desktop cut given the nav sidebar already switches at `lg` (1024) for
  unrelated chrome reasons (see `useBreakpoint.ts`'s `DESKTOP_NAV_MIN`
  comment) — don't reuse that constant for stat-entry layout, it answers a
  different question (does the sidebar fit) than "is this a touchscreen or a
  keyboard+mouse device."

- **New phone-only components**, all in `components/stat-entry/`:
  `PlayerJerseyGrid` (the grid), `PhoneStatButtons` (replaces the grid once a
  player is picked), `PhoneStatEntryLayout` (composes team-event row + the
  grid/buttons swap + the feed strip), `EventFeedStrip` (collapsed-by-default,
  wraps the existing `EventFeed` when expanded). Team-level buttons
  (clear attempt/success) live in a row above the swap since they don't need
  a player selected — don't bury them behind player selection.

- **Bumped `EventFeed`'s delete button from 32px to 56px**
  (`min-h-14 min-w-14`) — it's reused inside `EventFeedStrip`'s expanded view
  on phone, and CLAUDE.md's 56px-minimum touch target rule applies there too.
  This makes the shared `EventFeed` compliant everywhere it's used (including
  the still-rough iPad/desktop fallback), so phase 4c doesn't need to revisit
  it for this reason.

- **`EventFeedStrip` is `sticky bottom-0`** inside the flex column, relying
  on `AppShell`'s `<main>` being the nearest `overflow-y-auto` ancestor and
  nothing in between (`GameDetailPage`, `StatEntryPanel`,
  `PhoneStatEntryLayout`) setting its own `overflow`. `StatEntryPanel`'s root
  is now `flex-1` so the strip sits pinned at the visual bottom of the screen
  even when there isn't enough content to fill the viewport (e.g. an empty
  event feed) — if a future phase adds an intermediate scrolling container,
  the strip will need to move with it.

- **`EventFeedStrip` uses `-mx-4` to bleed to the screen edges**, which
  assumes its ancestor padding is `GameDetailPage`'s `p-4` (only true below
  `md`, which is exactly when this component renders). Not a general-purpose
  component as written — fine for now since it's phone-only, but don't reuse
  it verbatim at a wider breakpoint without checking that assumption.

- The app is single-coach/single-team: there's no team picker or "create
  team" flow anywhere in the spec, so `getOrCreateTeam()`
  (`src/db/queries.ts`) lazily creates one `Team` row named "My Team" the
  first time anything asks for it, and every page just uses that team's id.
  Phase 3 (game setup) followed the same pattern rather than adding team
  selection UI, and later phases should too.

- One decision beyond the spec's literal text: `GameStatus` needed some way
  to reach `'final'` for "past games" to ever be reachable through the UI
  (not just via seed data), so `GameDetailPage` has a "Mark final" /
  "Reopen game" toggle (`setGameStatus` in `src/db/queries.ts`). Phase 5
  should treat this as the existing finalize mechanism rather than building
  a second one.

- `src/domain/` is the folder for pure logic that isn't persistence and
  isn't a component: `positions.ts`, `parseRosterInput.ts`, `formatDate.ts`,
  and now `quarter.ts`, `score.ts`, `statButtons.ts`, `eventDescription.ts`,
  `haptics.ts`. Stat-derivation math in phase 5 (shooting %, save %, etc.)
  belongs here too.

### Phase 4a decisions worth knowing before touching stat entry

- **No separate undo stack.** `undoLastEvent` (`src/db/queries.ts`)
  soft-deletes the highest-`timestamp` live event for the game — the event
  log _is_ the undo stack, so there's nothing else to keep in sync. Manual
  delete from the event feed uses the same `deleteEvent` soft-delete.

- **`Game.currentQuarter` doesn't exist.** The current quarter is derived
  from the count of live `quarter_end` events (`domain/quarter.ts`,
  `currentQuarter(events)`), same philosophy as score
  (`domain/score.ts`). Ending a quarter just records a `quarter_end` event
  (`advanceQuarter` in `db/queries.ts`); undo naturally reverts it. Don't
  add a stored quarter field to `Game` — derive, don't duplicate.

- **`assist` is a normal, always-reachable stat button**, not just the
  inline picker that opens after a goal. The picker
  (`components/stat-entry/AssistPicker.tsx`) is a touch-flow convenience for
  the common case; phase 4d's keyboard spec explicitly wants a standalone
  `a` key too, so both paths call the same `recordAssist`.

- **Position-contextual stat buttons**: only Goalie and FOGO get a
  specialized "primary" set (`domain/statButtons.ts`,
  `primaryStatTypes`), per the spec's own examples. Every other position
  shares one reasonable default (`goal`, `ground_ball`, `caused_turnover`)
  rather than inventing per-position tuning nobody asked for — revisit if
  that turns out wrong once real games get recorded.

- **Keyboard shortcut letters already exist** on every button definition in
  `domain/statButtons.ts` (`key` field) so phase 4d doesn't have to invent
  them, but no keyboard listener is wired up yet — that's still 4d's job,
  including the "must not fire while focus is in a text input" rule.

- **`StatEntryPanel`** (`components/stat-entry/StatEntryPanel.tsx`) is the
  shared orchestrator — all the recording/undo/toast/haptic handlers live
  there. Phone/iPad/desktop layouts should reuse those handlers (pass in
  different child components / arrangements) rather than re-deriving them;
  only the player-picker, stat-grid, and event-feed presentation are
  expected to change per layout.

- **Toasts are mounted app-wide**, not scoped to the stat-entry screen —
  `ToastProvider` wraps `<App />` in `main.tsx` (same pattern as
  `ThemeProvider`) since later phases (phase 8's sync status, for one) are
  expected to want the same non-blocking notification.

- **Fixed a latent seed-data bug while testing this phase**: the seeded
  in-progress game's synthetic event timestamps in `db/seed.ts`
  (`buildLiveGameEvents`) used real "now" as their base and then walked
  _forward_ up to 7 fake minutes to simulate in-game clock spacing — so for
  several real minutes after reseeding, those synthetic timestamps sat in
  the _future_ relative to a real click, making "undo the last event" (and
  the event feed's ordering) pick the wrong thing when testing against
  seeded data. Now anchored 10 fake-minutes _before_ "now" instead. Doesn't
  affect real gameplay (real events are never mixed with seed data), but
  matters for anyone testing against `/debug`'s seed.
