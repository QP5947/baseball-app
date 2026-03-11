begin;

create schema if not exists penpen;

create or replace function penpen.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists penpen.settings (
  id boolean primary key default true,
  site_title text not null default 'PENPEN LEAGUE',
  site_subtitle text not null default 'ペンペンリーグ公式サイト',
  header_image_url text,
  admin_password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settings_singleton check (id = true)
);

create table if not exists penpen.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leagues_name_uniq unique (name)
);

create table if not exists penpen.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_name_uniq unique (name)
);

create table if not exists penpen.stadiums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  google_map_url text,
  note text,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stadiums_name_uniq unique (name)
);

create table if not exists penpen.tournaments (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references penpen.leagues(id) on delete restrict,
  image_path text not null,
  image_file_name text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists penpen.rule_blocks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  sort_order integer not null default 0,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists penpen.schedule_days (
  id uuid primary key default gen_random_uuid(),
  match_date date not null,
  stadium_id uuid references penpen.stadiums(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_days_match_date_uniq unique (match_date)
);

create table if not exists penpen.scheduled_games (
  id uuid primary key default gen_random_uuid(),
  schedule_day_id uuid not null references penpen.schedule_days(id) on delete cascade,
  display_order integer not null,
  start_time time not null,
  end_time time not null,
  away_team_id uuid not null references penpen.teams(id) on delete restrict,
  home_team_id uuid not null references penpen.teams(id) on delete restrict,
  game_type text not null default 'league',
  league_id uuid references penpen.leagues(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scheduled_games_order_uniq unique (schedule_day_id, display_order),
  constraint scheduled_games_team_check check (away_team_id <> home_team_id),
  constraint scheduled_games_game_type_check check (game_type in ('league', 'tournament'))
);

create table if not exists penpen.schedule_day_rest_teams (
  schedule_day_id uuid not null references penpen.schedule_days(id) on delete cascade,
  team_id uuid not null references penpen.teams(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (schedule_day_id, team_id)
);

create table if not exists penpen.game_results (
  scheduled_game_id uuid primary key references penpen.scheduled_games(id) on delete cascade,
  away_score integer,
  home_score integer,
  is_canceled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_results_score_non_negative check (
    (away_score is null or away_score >= 0)
    and (home_score is null or home_score >= 0)
  )
);

create table if not exists penpen.schedule_day_results (
  schedule_day_id uuid primary key references penpen.schedule_days(id) on delete cascade,
  note text,
  is_finalized boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists idx_penpen_leagues_sort on penpen.leagues (is_enabled desc, sort_order asc, name asc);
create index if not exists idx_penpen_teams_sort on penpen.teams (is_enabled desc, sort_order asc, name asc);
create index if not exists idx_penpen_stadiums_sort on penpen.stadiums (is_enabled desc, sort_order asc, name asc);
create index if not exists idx_penpen_tournaments_league_sort on penpen.tournaments (league_id, sort_order asc);
create index if not exists idx_penpen_schedule_days_date on penpen.schedule_days (match_date asc);
create index if not exists idx_penpen_scheduled_games_day_sort on penpen.scheduled_games (schedule_day_id, display_order asc);
create index if not exists idx_penpen_scheduled_games_teams on penpen.scheduled_games (away_team_id, home_team_id);

drop trigger if exists trg_penpen_settings_updated_at on penpen.settings;
create trigger trg_penpen_settings_updated_at
before update on penpen.settings
for each row execute function penpen.set_updated_at();

drop trigger if exists trg_penpen_leagues_updated_at on penpen.leagues;
create trigger trg_penpen_leagues_updated_at
before update on penpen.leagues
for each row execute function penpen.set_updated_at();

drop trigger if exists trg_penpen_teams_updated_at on penpen.teams;
create trigger trg_penpen_teams_updated_at
before update on penpen.teams
for each row execute function penpen.set_updated_at();

drop trigger if exists trg_penpen_stadiums_updated_at on penpen.stadiums;
create trigger trg_penpen_stadiums_updated_at
before update on penpen.stadiums
for each row execute function penpen.set_updated_at();

drop trigger if exists trg_penpen_tournaments_updated_at on penpen.tournaments;
create trigger trg_penpen_tournaments_updated_at
before update on penpen.tournaments
for each row execute function penpen.set_updated_at();

drop trigger if exists trg_penpen_rule_blocks_updated_at on penpen.rule_blocks;
create trigger trg_penpen_rule_blocks_updated_at
before update on penpen.rule_blocks
for each row execute function penpen.set_updated_at();

drop trigger if exists trg_penpen_schedule_days_updated_at on penpen.schedule_days;
create trigger trg_penpen_schedule_days_updated_at
before update on penpen.schedule_days
for each row execute function penpen.set_updated_at();

drop trigger if exists trg_penpen_scheduled_games_updated_at on penpen.scheduled_games;
create trigger trg_penpen_scheduled_games_updated_at
before update on penpen.scheduled_games
for each row execute function penpen.set_updated_at();

drop trigger if exists trg_penpen_game_results_updated_at on penpen.game_results;
create trigger trg_penpen_game_results_updated_at
before update on penpen.game_results
for each row execute function penpen.set_updated_at();

drop trigger if exists trg_penpen_schedule_day_results_updated_at on penpen.schedule_day_results;
create trigger trg_penpen_schedule_day_results_updated_at
before update on penpen.schedule_day_results
for each row execute function penpen.set_updated_at();

alter table penpen.settings enable row level security;
alter table penpen.leagues enable row level security;
alter table penpen.teams enable row level security;
alter table penpen.stadiums enable row level security;
alter table penpen.tournaments enable row level security;
alter table penpen.rule_blocks enable row level security;
alter table penpen.schedule_days enable row level security;
alter table penpen.scheduled_games enable row level security;
alter table penpen.schedule_day_rest_teams enable row level security;
alter table penpen.game_results enable row level security;
alter table penpen.schedule_day_results enable row level security;

drop policy if exists penpen_settings_read on penpen.settings;
create policy penpen_settings_read on penpen.settings
for select
to anon, authenticated
using (true);

drop policy if exists penpen_settings_insert on penpen.settings;
create policy penpen_settings_insert on penpen.settings
for insert
to authenticated
with check (true);

drop policy if exists penpen_settings_update on penpen.settings;
create policy penpen_settings_update on penpen.settings
for update
to authenticated
using (true)
with check (true);

drop policy if exists penpen_settings_delete on penpen.settings;
create policy penpen_settings_delete on penpen.settings
for delete
to authenticated
using (true);

drop policy if exists penpen_leagues_read on penpen.leagues;
create policy penpen_leagues_read on penpen.leagues
for select
to anon, authenticated
using (true);

drop policy if exists penpen_leagues_insert on penpen.leagues;
create policy penpen_leagues_insert on penpen.leagues
for insert
to authenticated
with check (true);

drop policy if exists penpen_leagues_update on penpen.leagues;
create policy penpen_leagues_update on penpen.leagues
for update
to authenticated
using (true)
with check (true);

drop policy if exists penpen_leagues_delete on penpen.leagues;
create policy penpen_leagues_delete on penpen.leagues
for delete
to authenticated
using (true);

drop policy if exists penpen_teams_read on penpen.teams;
create policy penpen_teams_read on penpen.teams
for select
to anon, authenticated
using (true);

drop policy if exists penpen_teams_insert on penpen.teams;
create policy penpen_teams_insert on penpen.teams
for insert
to authenticated
with check (true);

drop policy if exists penpen_teams_update on penpen.teams;
create policy penpen_teams_update on penpen.teams
for update
to authenticated
using (true)
with check (true);

drop policy if exists penpen_teams_delete on penpen.teams;
create policy penpen_teams_delete on penpen.teams
for delete
to authenticated
using (true);

drop policy if exists penpen_stadiums_read on penpen.stadiums;
create policy penpen_stadiums_read on penpen.stadiums
for select
to anon, authenticated
using (true);

drop policy if exists penpen_stadiums_insert on penpen.stadiums;
create policy penpen_stadiums_insert on penpen.stadiums
for insert
to authenticated
with check (true);

drop policy if exists penpen_stadiums_update on penpen.stadiums;
create policy penpen_stadiums_update on penpen.stadiums
for update
to authenticated
using (true)
with check (true);

drop policy if exists penpen_stadiums_delete on penpen.stadiums;
create policy penpen_stadiums_delete on penpen.stadiums
for delete
to authenticated
using (true);

drop policy if exists penpen_tournaments_read on penpen.tournaments;
create policy penpen_tournaments_read on penpen.tournaments
for select
to anon, authenticated
using (true);

drop policy if exists penpen_tournaments_insert on penpen.tournaments;
create policy penpen_tournaments_insert on penpen.tournaments
for insert
to authenticated
with check (true);

drop policy if exists penpen_tournaments_update on penpen.tournaments;
create policy penpen_tournaments_update on penpen.tournaments
for update
to authenticated
using (true)
with check (true);

drop policy if exists penpen_tournaments_delete on penpen.tournaments;
create policy penpen_tournaments_delete on penpen.tournaments
for delete
to authenticated
using (true);

drop policy if exists penpen_rule_blocks_read on penpen.rule_blocks;
create policy penpen_rule_blocks_read on penpen.rule_blocks
for select
to anon, authenticated
using (true);

drop policy if exists penpen_rule_blocks_insert on penpen.rule_blocks;
create policy penpen_rule_blocks_insert on penpen.rule_blocks
for insert
to authenticated
with check (true);

drop policy if exists penpen_rule_blocks_update on penpen.rule_blocks;
create policy penpen_rule_blocks_update on penpen.rule_blocks
for update
to authenticated
using (true)
with check (true);

drop policy if exists penpen_rule_blocks_delete on penpen.rule_blocks;
create policy penpen_rule_blocks_delete on penpen.rule_blocks
for delete
to authenticated
using (true);

drop policy if exists penpen_schedule_days_read on penpen.schedule_days;
create policy penpen_schedule_days_read on penpen.schedule_days
for select
to anon, authenticated
using (true);

drop policy if exists penpen_schedule_days_insert on penpen.schedule_days;
create policy penpen_schedule_days_insert on penpen.schedule_days
for insert
to authenticated
with check (true);

drop policy if exists penpen_schedule_days_update on penpen.schedule_days;
create policy penpen_schedule_days_update on penpen.schedule_days
for update
to authenticated
using (true)
with check (true);

drop policy if exists penpen_schedule_days_delete on penpen.schedule_days;
create policy penpen_schedule_days_delete on penpen.schedule_days
for delete
to authenticated
using (true);

drop policy if exists penpen_scheduled_games_read on penpen.scheduled_games;
create policy penpen_scheduled_games_read on penpen.scheduled_games
for select
to anon, authenticated
using (true);

drop policy if exists penpen_scheduled_games_insert on penpen.scheduled_games;
create policy penpen_scheduled_games_insert on penpen.scheduled_games
for insert
to authenticated
with check (true);

drop policy if exists penpen_scheduled_games_update on penpen.scheduled_games;
create policy penpen_scheduled_games_update on penpen.scheduled_games
for update
to authenticated
using (true)
with check (true);

drop policy if exists penpen_scheduled_games_delete on penpen.scheduled_games;
create policy penpen_scheduled_games_delete on penpen.scheduled_games
for delete
to authenticated
using (true);

drop policy if exists penpen_schedule_day_rest_teams_read on penpen.schedule_day_rest_teams;
create policy penpen_schedule_day_rest_teams_read on penpen.schedule_day_rest_teams
for select
to anon, authenticated
using (true);

drop policy if exists penpen_schedule_day_rest_teams_insert on penpen.schedule_day_rest_teams;
create policy penpen_schedule_day_rest_teams_insert on penpen.schedule_day_rest_teams
for insert
to authenticated
with check (true);

drop policy if exists penpen_schedule_day_rest_teams_update on penpen.schedule_day_rest_teams;
create policy penpen_schedule_day_rest_teams_update on penpen.schedule_day_rest_teams
for update
to authenticated
using (true)
with check (true);

drop policy if exists penpen_schedule_day_rest_teams_delete on penpen.schedule_day_rest_teams;
create policy penpen_schedule_day_rest_teams_delete on penpen.schedule_day_rest_teams
for delete
to authenticated
using (true);

drop policy if exists penpen_game_results_read on penpen.game_results;
create policy penpen_game_results_read on penpen.game_results
for select
to anon, authenticated
using (true);

drop policy if exists penpen_game_results_insert on penpen.game_results;
create policy penpen_game_results_insert on penpen.game_results
for insert
to authenticated
with check (true);

drop policy if exists penpen_game_results_update on penpen.game_results;
create policy penpen_game_results_update on penpen.game_results
for update
to authenticated
using (true)
with check (true);

drop policy if exists penpen_game_results_delete on penpen.game_results;
create policy penpen_game_results_delete on penpen.game_results
for delete
to authenticated
using (true);

drop policy if exists penpen_schedule_day_results_read on penpen.schedule_day_results;
create policy penpen_schedule_day_results_read on penpen.schedule_day_results
for select
to anon, authenticated
using (true);

drop policy if exists penpen_schedule_day_results_insert on penpen.schedule_day_results;
create policy penpen_schedule_day_results_insert on penpen.schedule_day_results
for insert
to authenticated
with check (true);

drop policy if exists penpen_schedule_day_results_update on penpen.schedule_day_results;
create policy penpen_schedule_day_results_update on penpen.schedule_day_results
for update
to authenticated
using (true)
with check (true);

drop policy if exists penpen_schedule_day_results_delete on penpen.schedule_day_results;
create policy penpen_schedule_day_results_delete on penpen.schedule_day_results
for delete
to authenticated
using (true);

grant usage on schema penpen to anon, authenticated;
grant select on all tables in schema penpen to anon, authenticated;
grant insert, update, delete on all tables in schema penpen to authenticated;

create or replace view penpen.v_schedule_day_overview as
select
  sd.id as schedule_day_id,
  sd.match_date,
  sd.note as schedule_note,
  st.id as stadium_id,
  st.name as stadium_name,
  coalesce(
    (
      select array_agg(t.name order by t.sort_order asc, t.name asc)
      from penpen.schedule_day_rest_teams rt
      join penpen.teams t on t.id = rt.team_id
      where rt.schedule_day_id = sd.id
    ),
    '{}'::text[]
  ) as rest_team_names,
  coalesce((
    select count(*)
    from penpen.scheduled_games sg
    where sg.schedule_day_id = sd.id
  ), 0)::integer as game_count
from penpen.schedule_days sd
left join penpen.stadiums st on st.id = sd.stadium_id;

create or replace view penpen.v_schedule_games as
with ordered as (
  select
    sd.id as schedule_day_id,
    sd.match_date,
    sd.note as schedule_note,
    sdr.note as result_note,
    st.id as stadium_id,
    st.name as stadium_name,
    sg.id as scheduled_game_id,
    sg.display_order,
    sg.start_time,
    sg.end_time,
    sg.game_type,
    lg.id as league_id,
    lg.name as league_name,
    sg.away_team_id,
    away.name as away_team_name,
    sg.home_team_id,
    home.name as home_team_name,
    gr.away_score,
    gr.home_score,
    coalesce(gr.is_canceled, false) as is_canceled,
    first_value(sg.away_team_id) over (
      partition by sd.id
      order by sg.display_order asc
    ) as setup_team_id,
    first_value(sg.home_team_id) over (
      partition by sd.id
      order by sg.display_order desc
    ) as cleanup_team_id
  from penpen.schedule_days sd
  left join penpen.schedule_day_results sdr
    on sdr.schedule_day_id = sd.id
  left join penpen.stadiums st
    on st.id = sd.stadium_id
  join penpen.scheduled_games sg
    on sg.schedule_day_id = sd.id
  join penpen.teams away
    on away.id = sg.away_team_id
  join penpen.teams home
    on home.id = sg.home_team_id
  left join penpen.leagues lg
    on lg.id = sg.league_id
  left join penpen.game_results gr
    on gr.scheduled_game_id = sg.id
)
select
  schedule_day_id,
  match_date,
  schedule_note,
  result_note,
  stadium_id,
  stadium_name,
  scheduled_game_id,
  display_order,
  start_time,
  end_time,
  game_type,
  league_id,
  league_name,
  away_team_id,
  away_team_name,
  home_team_id,
  home_team_name,
  away_score,
  home_score,
  is_canceled,
  (away_team_id = setup_team_id) as away_is_setup_duty,
  (home_team_id = cleanup_team_id) as home_is_cleanup_duty
from ordered;

insert into penpen.settings (id)
values (true)
on conflict (id) do nothing;

commit;