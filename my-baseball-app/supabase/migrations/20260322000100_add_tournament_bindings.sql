-- Create tournament_bindings table to store tournament bracket configurations
create table if not exists penpen.tournament_bindings (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references penpen.leagues(id) on delete cascade,
  final_code text,
  third_place_code text,
  bindings jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(league_id)
);

-- Create index for efficient lookups
create index if not exists idx_penpen_tournament_bindings_league on penpen.tournament_bindings (league_id);

-- Enable RLS
alter table penpen.tournament_bindings enable row level security;

-- Create policies
drop policy if exists penpen_tournament_bindings_read on penpen.tournament_bindings;
create policy penpen_tournament_bindings_read on penpen.tournament_bindings
for select
to anon, authenticated
using (true);

drop policy if exists penpen_tournament_bindings_insert on penpen.tournament_bindings;
create policy penpen_tournament_bindings_insert on penpen.tournament_bindings
for insert
to authenticated
with check (true);

drop policy if exists penpen_tournament_bindings_update on penpen.tournament_bindings;
create policy penpen_tournament_bindings_update on penpen.tournament_bindings
for update
to authenticated
using (true)
with check (true);

drop policy if exists penpen_tournament_bindings_delete on penpen.tournament_bindings;
create policy penpen_tournament_bindings_delete on penpen.tournament_bindings
for delete
to authenticated
using (true);

-- Create trigger for updated_at
drop trigger if exists trg_penpen_tournament_bindings_updated_at on penpen.tournament_bindings;
create trigger trg_penpen_tournament_bindings_updated_at
before update on penpen.tournament_bindings
for each row execute function penpen.set_updated_at();
