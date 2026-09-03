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

**Phase 4a is done. Continue straight into phase 4b (phone layout) next —
the working agreement's next session break is after phase 4d, not here.**

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
