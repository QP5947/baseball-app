begin;

create table if not exists penpen.line_notification_logs (
  id uuid primary key default gen_random_uuid(),
  scheduled_game_id uuid not null references penpen.scheduled_games(id) on delete cascade,
  notification_type text not null default 'result_input_reminder',
  posted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint line_notification_logs_unique_game_type unique (scheduled_game_id, notification_type)
);

create index if not exists idx_line_notification_logs_posted_at
  on penpen.line_notification_logs (posted_at desc);

alter table penpen.line_notification_logs enable row level security;

drop policy if exists penpen_line_notification_logs_read on penpen.line_notification_logs;
create policy penpen_line_notification_logs_read on penpen.line_notification_logs
for select
to authenticated
using (true);

drop policy if exists penpen_line_notification_logs_insert on penpen.line_notification_logs;
create policy penpen_line_notification_logs_insert on penpen.line_notification_logs
for insert
to authenticated
with check (true);

grant select, insert, update, delete on table penpen.line_notification_logs to service_role;

commit;
