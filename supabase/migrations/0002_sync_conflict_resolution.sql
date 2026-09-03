-- Phase 8: conflict resolution for sync. CLAUDE.md predicts this is "mostly
-- trivial" because the event log is append-only with soft deletes — these
-- triggers make that concrete at the database layer instead of relying on
-- client discipline alone, so a stale or out-of-order flush (two devices,
-- a retried request, a flush that races a newer local edit) can never
-- silently regress data.
--
-- Two different rules, because players/games and stat_events have
-- different shapes of "conflict":
--
-- 1. players/games have real mutable fields plus an `updated_at` the local
--    app already bumps on every write (src/db/queries.ts) — classic
--    last-write-wins by that timestamp. Returning OLD from a BEFORE UPDATE
--    trigger makes Postgres silently keep the existing row instead of
--    applying a stale incoming one; the client's upsert still reports
--    success, it just didn't move anything. `teams` gets no such trigger —
--    it has no `updated_at` (mirrors the local Team type, which has none)
--    and nothing in the app ever updates a team after creation.
--
-- 2. stat_events are immutable after creation except for `deleted`, which is
--    monotonic locally (src/db/queries.ts never flips it back to false) —
--    so there's no "newer version" to compare, just "has anyone, anywhere,
--    ever marked this deleted." The merge trigger ORs incoming and existing
--    `deleted` rather than overwriting, so a delete can never be lost to a
--    later out-of-order flush of the pre-delete state.
create function reject_stale_update()
returns trigger
language plpgsql
as $$
begin
  if new.updated_at <= old.updated_at then
    return old;
  end if;
  return new;
end;
$$;

create trigger players_reject_stale_update
  before update on players
  for each row
  execute function reject_stale_update();

create trigger games_reject_stale_update
  before update on games
  for each row
  execute function reject_stale_update();

create function merge_stat_event_delete()
returns trigger
language plpgsql
as $$
begin
  new.deleted := old.deleted or new.deleted;
  return new;
end;
$$;

create trigger stat_events_merge_delete
  before update on stat_events
  for each row
  execute function merge_stat_event_delete();
