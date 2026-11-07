-- Run once in the Supabase SQL editor (safe to re-run).

-- Event/day folders: a date to sort by and an optional chosen cover photo.
alter table folders
  add column if not exists event_date date,
  add column if not exists cover_media_id uuid references media_items(id) on delete set null;

-- Videos hosted on a cloud drive: the link to open plus a custom thumbnail.
alter table media_items
  add column if not exists external_url text,
  add column if not exists thumbnail_url text;
