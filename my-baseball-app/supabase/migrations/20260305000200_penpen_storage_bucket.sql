begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'penpen-assets',
  'penpen-assets',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists penpen_assets_public_read on storage.objects;
create policy penpen_assets_public_read on storage.objects
for select
to anon, authenticated
using (bucket_id = 'penpen-assets');

drop policy if exists penpen_assets_auth_insert on storage.objects;
create policy penpen_assets_auth_insert on storage.objects
for insert
to authenticated
with check (bucket_id = 'penpen-assets');

drop policy if exists penpen_assets_auth_update on storage.objects;
create policy penpen_assets_auth_update on storage.objects
for update
to authenticated
using (bucket_id = 'penpen-assets')
with check (bucket_id = 'penpen-assets');

drop policy if exists penpen_assets_auth_delete on storage.objects;
create policy penpen_assets_auth_delete on storage.objects
for delete
to authenticated
using (bucket_id = 'penpen-assets');

commit;
