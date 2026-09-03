# Gameday Stat Tracker

## Project

Offline-first mobile web app for tracking high school lacrosse stats live during a game. The coach uses this on a phone on the sideline, standing up, one-handed, with no reliable wifi or cell signal at most fields. That constraint drives every design decision.

Progress against the phased build plan below is tracked in [PROGRESS.md](PROGRESS.md) — check that file for current status before starting work.

## Command execution rules

- Never run a command that does not exit on its own. This includes dev servers, watch modes, and preview servers. To verify a phase compiles, run `npm run build`, never `npm run dev`. The user starts the dev server themselves in their own terminal and keeps it running.
- Never run an interactive CLI that waits on stdin. Pass every flag up front. For scaffolding, use the non-interactive form, e.g. `npm create vite@latest . -- --template react-ts`.
- Same rule for git: always `git commit -m "message"`, never bare `git commit` (opens an editor and hangs). Do not run `git push` unless asked, since it may prompt for credentials.
- If something genuinely long-running is needed, say what to run and let the user run it and paste back the output.

## Working agreement

Do not build this in one pass, and do not squash it into one commit. Work through the phases in order. After each phase:

1. Run `npm run build` and make sure it compiles clean.
2. Make a single git commit for that phase with a clear conventional-commit message.
3. Print a one-line summary of what was built and what phase is starting next.
4. Keep going.

No approval is needed between phases. Run straight through unless one of these happens, in which case stop and ask:

- The build fails and the fix is not obvious.
- A phase turns out to require a decision that hasn't been specified.
- About to change something established in an earlier phase in a way that would break it.
- Disagreement with an instruction in this document — push back, don't silently comply or silently ignore it.

One logical change per commit, always — this history needs to be walkable in an interview. Never combine two phases into one commit, and never commit a broken build.

Commit message format: `feat: add roster management`, `feat: offline stat entry queue`, `chore: scaffold vite + ts + tailwind`, etc.

Git was initialized in phase 0. Commit after every phase without exception.

Maintain [PROGRESS.md](PROGRESS.md) listing every phase with a checkbox. Check off each phase as part of that phase's commit. If a session ends early, that file is how the next session knows where to resume.

### Session breaks

Running all twelve phases in one session exhausts context. Stop at the end of these phases and tell the user to start a fresh session:

- After phase 3
- After phase 4d
- After phase 8

At each of those points, make sure PROGRESS.md is current and committed, and add a short note about anything in progress or any decision made that isn't obvious from the code — that note is what gets read to pick up where things left off.

## Stack

- Vite + React + TypeScript
- Tailwind for styling
- Dexie.js over IndexedDB for local storage
- Supabase (Postgres + auth) for cloud sync
- vite-plugin-pwa for service worker and installability
- Deploy target: Vercel

Keep dependencies lean. If something can be done in 20 lines instead of a package, do that.

## Core design constraints

This runs on four device classes and they are not the same use case. Build for all four deliberately.

- **Phone (390px, portrait)**: the coach on the sideline, standing, one hand, glancing down between plays. The hardest constraint and the one that drives the core interaction model.
- **iPad (768–1024px, both orientations)**: an assistant coach or team manager sitting on the bench with it propped up. More screen, two hands available, still touch.
- **Laptop and desktop (1280px+)**: the coach at home entering stats from film, or reviewing the season. Keyboard available, mouse precision, no rush.

Rules that hold everywhere:

- Touch targets minimum 56px on phone and iPad. On desktop, not below 40px.
- The event log and data layer are identical across devices. Only the presentation layer branches.
- No modals or multi-step flows during live stat entry on any device. One interaction records one event.
- The app must be fully functional with the network completely off. Sync is a background nicety, never a blocker.
- Nothing should ever be lost. Every write goes to IndexedDB first, synchronously from the user's perspective.
- Dark UI by default (bright sun / stadium lights). Add a light mode toggle for desktop film-room use.

Use Tailwind breakpoints honestly. Do not build one layout and let it stretch. Where layouts genuinely differ, write them as separate components and switch on breakpoint rather than piling up conditional classes.

## Domain rules (lacrosse specifics — get these right)

- Game is 4 quarters. HS quarters are typically 12 minutes.
- Faceoff happens at the start of each quarter and after every goal.
- Tracked events, each attributed to a player:
  - Goal (with optional assist attribution to a second player)
  - Shot (a goal is also a shot; a shot on goal is a subset of shots)
  - Shot on goal
  - Save (goalie)
  - Goal against (goalie)
  - Ground ball
  - Faceoff win / faceoff loss
  - Turnover
  - Caused turnover
  - Penalty (with duration: 30s, 1:00, 3:00, and releasable vs non-releasable)
  - Clear attempt / clear success (team-level, not player-level)
- Derived stats the app should compute, never store: shooting percentage, save percentage, faceoff win percentage, points (goals + assists), clear percentage.
- Two teams per game: the coach's team (full roster, per-player stats) and the opponent (team-level only, plus goals against for the goalie). Do not require entering an opponent roster.

## Phases

### Phase 0: Scaffold
Vite + React + TS + Tailwind. Git init. Prettier + ESLint configured. Build the responsive app shell now, not later. Dark theme. Navigation is Roster, Games, Season — bottom tab bar on phone, persistent left sidebar on iPad landscape and up. Establish a `useBreakpoint` hook or equivalent that the rest of the app will use to branch layouts. Nothing functional yet, but resizing the browser should show the shell adapt correctly at every breakpoint.

### Phase 1: Data model + local database
Define TypeScript types for Team, Player, Game, StatEvent, and SyncQueueItem. Set up Dexie schema with proper indexes. StatEvent is an append-only event log with: `id` (uuid generated client-side), `gameId`, `playerId` (nullable for team events), `type`, `quarter`, `gameClock` (optional), `timestamp`, and a soft-delete flag. Write a small seed script to develop against fake data. No UI yet beyond a dev-only debug screen that dumps the DB.

Important: the event log is the source of truth. Box scores are computed from it, never stored. This is what makes undo and sync tractable.

### Phase 2: Roster management
Add, edit, archive players. Fields: jersey number, first name, last name, position (Attack, Midfield, Defense, LSM, FOGO, Goalie), and an active flag. Sortable by number. Bulk-add flow to paste in a roster fast at the start of the season.

### Phase 3: Game setup
Create a game: opponent name, date, home/away, and which players are dressed for this game. Games list showing past and in-progress games. Ability to resume an in-progress game.

**— session break after this phase —**

### Phase 4a: Stat entry core
Shared logic and event recording, no polished layout yet. Build the recording functions, the undo stack, the toast system, and a rough functional UI good enough to prove events land in the database correctly.

Shared behavior every layout will inherit:
- Persistent header: score, quarter, and a quarter advance control.
- Stat buttons contextual to position where sensible (goalie gets Save / Goal Against prominently, FOGO gets faceoff buttons prominently) but everything reachable for everyone.
- Goal flow: select player, hit Goal, then an optional inline assist picker dismissible in one interaction. Never block.
- Every recorded event shows a brief toast naming what was recorded. On touch devices, also fire haptic feedback via `navigator.vibrate`.
- A prominent Undo reversing the last event, reachable at all times without leaving the screen.
- An event feed showing recent events, each with delete.
- Optimistic writes only. No animation that delays input.

### Phase 4b: Phone layout (the sideline case)
Player selection is a grid of jersey numbers, big and readable, filtered to dressed players. Two taps total: tap player, tap stat. The stat buttons replace or overlay the player grid after selection so the thumb doesn't travel. Event feed is a collapsed strip at the bottom, expandable.

### Phase 4c: iPad layout
Enough room to skip the mode switch entirely. Player grid on the left, stat buttons persistent on the right, event feed as a live column. Still two taps, but nothing swaps out from under you, which cuts mis-taps. Handle both orientations: portrait stacks the feed below, landscape puts it in a third column.

### Phase 4d: Desktop layout
Three panes, keyboard-driven since that's the real advantage here. Type a jersey number to select a player, then a single letter key for the stat (`g` goal, `a` assist, `s` shot, `v` save, `b` ground ball, `f` faceoff win, etc.). Cmd/Ctrl+Z for undo. Show shortcut hints inline until dismissed. Mouse still works for everything, but someone entering a full game from film should be able to do it without touching the trackpad.

Keyboard shortcuts must not fire while focus is in a text input.

**— session break after this phase —**

### Phase 5: Live box score
The computed box score: per-player line items and team totals, updating live off the event log. Show goalie save percentage and team faceoff percentage prominently since those are the numbers asked about between quarters.

On phone this is a separate tab within the game screen. On iPad and desktop there's room to show it alongside stat entry instead of behind a tab, so do that. The table should be genuinely readable at desktop width with sortable columns, not a stretched-out mobile card list.

### Phase 6: PWA and offline hardening
Service worker, manifest, installable. App shell cached. Verify with devtools that the entire app works with network disabled from cold start.

Test installability on all three: iOS Safari add-to-home-screen, iPadOS, and desktop Chrome install. Provide the icon sizes each one needs, and make sure the manifest handles both portrait and landscape. Add an offline indicator in the header.

Confirm a full game can be recorded, the app closed, the device restarted, and the data is still there. Do this on phone and iPad separately, since iOS Safari has bitten people on IndexedDB eviction before.

### Phase 7: Supabase schema and auth
Postgres tables mirroring the local schema. Row-level security so a coach only sees their own team's data. Magic link auth. Do not sync yet, just get the schema and auth working.

### Phase 8: Sync engine
Background sync of the event log. Requirements:
- Events queue locally and flush when connectivity returns.
- Client-generated UUIDs mean upserts are idempotent. Re-syncing the same event is a no-op.
- Since the event log is append-only with soft deletes, conflict resolution is mostly trivial. Handle the edge cases anyway and document the approach in a comment.
- Sync status visible but not intrusive. A small indicator, not a blocking spinner.
- Never let a sync failure surface as an error that interrupts stat entry.

**— session break after this phase —**

### Phase 9: Season aggregation
Season view rolling up all games: leaderboards for goals, assists, points, ground balls, caused turnovers, faceoff percentage, save percentage. Sortable. Per-player detail view showing game-by-game splits.

This is the one screen where desktop is the primary target, not an afterthought. Nobody analyzes a season on a phone. Build a real dense data table for wide screens with sorting, column visibility toggles, and CSV export. Collapse to stacked cards on phone.

### Phase 10: Shareable recap graphic
After a game, generate a shareable image (canvas or SVG rendered to PNG) with the final score, top performers, and a clean layout. Downloadable and shareable via the Web Share API on mobile. This is what actually gets sent to the team group chat, so make it look good, not like a spreadsheet screenshot.

### Phase 11: Cross-device pass
Walk every screen at 390px, 768px portrait, 1024px landscape, and 1440px. Fix what breaks. Check that nothing horizontally scrolls, no text truncates badly, and no touch target shrinks below spec on the touch breakpoints. Verify keyboard shortcuts do not leak into the touch layouts and that the sidebar and bottom nav never both render.

### Phase 12: Polish and docs
Empty states, loading states, error boundaries. A README with setup instructions, architecture notes, and a short section explaining the offline-first event log design and why it was chosen. Include screenshots at phone, tablet, and desktop widths.

## Ground rules

- TypeScript strict mode on. No `any`.
- The type definitions and data layer from phase 1 were written carefully — everything downstream depends on them; treat changes there as high-risk.
- If a phase turns out bigger than expected, say so and propose splitting it into two commits rather than shipping one huge one.
- Push back on a decision above if it looks wrong. Better to hear it now than debug it on a Saturday morning at a field in Toms River.
