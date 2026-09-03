-- Phase 7: schema + auth only. No sync engine reads or writes these tables
-- yet (that's phase 8) — this migration just gets the shape and the row
-- level security right ahead of time.
--
-- Mirrors src/db/types.ts one table per Dexie table (teams, players, games,
-- statEvents), field-for-field, in snake_case. The one addition beyond the
-- local schema is `teams.owner_id`: the local app is inherently single-user
-- (one IndexedDB per device), so it has nothing like it, but the cloud
-- schema has to support many coaches and RLS needs something to check
-- against. Every other table's RLS just follows the ownership chain down
-- through team_id / game_id rather than duplicating owner_id everywhere.
--
-- `sync_queue` (src/db/types.ts's SyncQueueItem) has no cloud counterpart —
-- it's a local-only outbox of pending pushes and never itself needs to be
-- synced.
--
-- Column naming is intentionally snake_case (Postgres convention) even
-- though the local store is camelCase — phase 8's sync engine is where that
-- mapping gets written, not here.
create extension if not exists pgcrypto;

create table teams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id) on delete cascade,
  jersey_number integer not null,
  first_name text not null,
  last_name text not null,
  position text not null
    check (position in ('Attack', 'Midfield', 'Defense', 'LSM', 'FOGO', 'Goalie')),
  -- Archived, not deleted — mirrors the local `isActive` flag.
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table games (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id) on delete cascade,
  -- The opponent is never rostered (CLAUDE.md's domain rules) — team-level
  -- stats plus goals-against on our goalie are enough to reconstruct their
  -- side of the box score, so there's no opponent_team_id here.
  opponent_name text not null,
  date timestamptz not null,
  is_home boolean not null,
  dressed_player_ids uuid[] not null default '{}',
  status text not null check (status in ('in_progress', 'final')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table stat_events (
  -- Client-generated (see src/db/id.ts) — the upsert key that will make
  -- phase 8's sync idempotent. Not server-generated like the tables above.
  id uuid primary key,
  game_id uuid not null references games (id) on delete cascade,
  -- Null for team-level events (clear_attempt/clear_success/quarter_end).
  player_id uuid references players (id) on delete set null,
  type text not null check (
    type in (
      'goal', 'assist', 'shot', 'shot_on_goal', 'save', 'goal_against',
      'ground_ball', 'faceoff_win', 'faceoff_loss', 'turnover', 'caused_turnover',
      'penalty', 'clear_attempt', 'clear_success', 'quarter_end'
    )
  ),
  quarter integer not null,
  game_clock text,
  timestamp timestamptz not null,
  related_event_id uuid references stat_events (id) on delete set null,
  -- Only meaningful when type = 'penalty' — see the StatEvent union in
  -- src/db/types.ts. Left nullable rather than a separate penalties table;
  -- the event log stays one table, same as locally.
  penalty_duration_seconds integer check (penalty_duration_seconds in (30, 60, 180)),
  penalty_releasable boolean,
  -- Soft-delete: undo and manual delete both flip this, same as locally.
  -- This is also what makes phase 8's conflict resolution close to trivial —
  -- the log is append-only and a delete is just another field flip, not a
  -- row removal to reconcile.
  deleted boolean not null default false
);

-- Mirrors the local Dexie indexes in src/db/db.ts.
create index players_team_id_idx on players (team_id);
create index players_jersey_number_idx on players (jersey_number);
create index games_team_id_idx on games (team_id);
create index games_status_idx on games (status);
create index games_date_idx on games (date);
create index stat_events_game_id_idx on stat_events (game_id);
create index stat_events_player_id_idx on stat_events (player_id);
create index stat_events_type_idx on stat_events (type);
create index stat_events_quarter_idx on stat_events (quarter);
-- Serves the live event feed and undo (most recent for this game, in order),
-- same as the local [gameId+timestamp] compound index.
create index stat_events_game_id_timestamp_idx on stat_events (game_id, timestamp);

alter table teams enable row level security;
alter table players enable row level security;
alter table games enable row level security;
alter table stat_events enable row level security;

-- A coach only ever sees their own team's data (CLAUDE.md's phase 7 spec).
-- players/games/stat_events all check ownership by walking back up to teams
-- rather than duplicating owner_id on every table.
create policy "Coaches manage their own team" on teams
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Coaches manage their own players" on players
  for all
  using (team_id in (select id from teams where owner_id = auth.uid()))
  with check (team_id in (select id from teams where owner_id = auth.uid()));

create policy "Coaches manage their own games" on games
  for all
  using (team_id in (select id from teams where owner_id = auth.uid()))
  with check (team_id in (select id from teams where owner_id = auth.uid()));

create policy "Coaches manage their own stat events" on stat_events
  for all
  using (
    game_id in (
      select g.id from games g
      join teams t on t.id = g.team_id
      where t.owner_id = auth.uid()
    )
  )
  with check (
    game_id in (
      select g.id from games g
      join teams t on t.id = g.team_id
      where t.owner_id = auth.uid()
    )
  );
