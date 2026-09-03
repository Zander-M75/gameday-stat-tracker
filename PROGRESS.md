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

**Phase 4c is done. Continue straight into phase 4d (desktop layout) next —
that's the working agreement's next session break, so it should be the last
phase this session.**

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
  "two taps: tap player, tap stat" actually mean two taps *per event* instead
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
