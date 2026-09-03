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
- [ ] Phase 3: Game setup
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

- The app is single-coach/single-team: there's no team picker or "create
  team" flow anywhere in the spec, so `getOrCreateTeam()`
  (`src/db/queries.ts`) lazily creates one `Team` row named "My Team" the
  first time anything asks for it, and every page just uses that team's id.
  Phase 3 (game setup) should follow the same pattern rather than adding
  team selection UI.
