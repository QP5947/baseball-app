alter table penpen.tournament_bindings
  add column if not exists season_year integer;

update penpen.tournament_bindings
set season_year = extract(year from (created_at at time zone 'Asia/Tokyo'))::integer
where season_year is null;

alter table penpen.tournament_bindings
  alter column season_year set not null;

alter table penpen.tournament_bindings
  alter column season_year set default (extract(year from (now() at time zone 'Asia/Tokyo'))::integer);

alter table penpen.tournament_bindings
  drop constraint if exists tournament_bindings_league_id_key;

alter table penpen.tournament_bindings
  add constraint tournament_bindings_league_year_key unique (league_id, season_year);

drop index if exists idx_penpen_tournament_bindings_league;
create index if not exists idx_penpen_tournament_bindings_season_league
  on penpen.tournament_bindings (season_year, league_id);
