begin;

alter table if exists penpen.scheduled_games
drop constraint if exists scheduled_games_team_check;

commit;
