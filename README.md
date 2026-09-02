# Gameday Stat Tracker

Offline-first mobile web app for tracking high school lacrosse stats live from
the sideline. Built with Vite, React, TypeScript, and Tailwind, with Dexie
(IndexedDB) for local storage and Supabase for cloud sync.

Full setup instructions, architecture notes, and screenshots land in the docs
pass toward the end of the build. For now:

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and build for production
npm run lint     # eslint
npm run format   # prettier --write
```

## Status

Phase 0: responsive app shell (Roster / Games / Season nav, dark/light theme,
phone / iPad / desktop breakpoints). No functional features yet.
