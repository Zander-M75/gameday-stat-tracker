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
- [ ] Phase 4a: Stat entry core (recording logic, undo stack, toasts)
- [ ] Phase 4b: Phone stat entry layout
- [ ] Phase 4c: iPad stat entry layout
- [ ] Phase 4d: Desktop stat entry layout (keyboard-driven)
- [ ] Phase 5: Live box score
- [ ] Phase 6: PWA and offline hardening
- [ ] Phase 7: Supabase schema and auth
- [ ] Phase 8: Sync engine
- [ ] Phase 9: Season aggregation
- [ ] Phase 10: Shareable recap graphic
- [ ] Phase 11: Cross-device pass
- [ ] Phase 12: Polish and docs

## Session breaks

Per the working agreement, stop and tell the user to start a fresh session
after phase 3, after phase 4d, and after phase 8.

## Notes for resuming

**Start a fresh session now — phase 3 is done, and the working agreement
calls for a session break here before starting phase 4a.**

- The app is single-coach/single-team: there's no team picker or "create
  team" flow anywhere in the spec, so `getOrCreateTeam()`
  (`src/db/queries.ts`) lazily creates one `Team` row named "My Team" the
  first time anything asks for it, and every page just uses that team's id.
  Phase 3 (game setup) followed the same pattern rather than adding team
  selection UI, and later phases should too.

- `GameDetailPage` (`/games/:gameId`) exists now as a placeholder — header,
  status, dressed-player list — with a "Live stat entry is coming in a later
  phase" line where phase 4a's recording UI will go. This is the route
  phase 4 builds its stat-entry screen into; it's also what "resume an
  in-progress game" resolves to (a game's route is the same whether it's
  in-progress or final, since there was nothing spec'd to resume into yet).

- One decision beyond the spec's literal text: `GameStatus` needed some way
  to reach `'final'` for "past games" to ever be reachable through the UI
  (not just via seed data), so `GameDetailPage` has a "Mark final" /
  "Reopen game" toggle (`setGameStatus` in `src/db/queries.ts`). Phase
  4/5 should treat this as the existing finalize mechanism rather than
  building a second one — e.g. a "Mark final" step at the end of live stat
  entry can just call `setGameStatus(id, 'final')`.

- Dressed-player picker in `NewGameForm` renders jersey-number buttons in a
  wrapping grid — a small preview of the phone stat-entry player grid phase
  4b will build for real. Not shared code yet, just a similar shape; only
  extract a shared component in phase 4b if the two actually end up
  needing the same behavior, not preemptively.

- `src/domain/` is a new top-level folder (alongside `db/`) for pure logic
  that isn't persistence and isn't a component: `positions.ts`,
  `parseRosterInput.ts`, `formatDate.ts` so far. Stat-derivation math in
  phase 5 (shooting %, save %, etc.) belongs here too.
