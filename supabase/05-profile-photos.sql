-- Execute depois de 01-auth.sql, como postgres, no SQL Editor do Supabase.
-- Bucket privado: cada conta acessa somente seu próprio arquivo de avatar.
begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'profile-photos',
  'profile-photos',
  false,
  2097152,
  array['image/jpeg']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists lc_profile_photo_read on storage.objects;
drop policy if exists lc_profile_photo_insert on storage.objects;
drop policy if exists lc_profile_photo_update on storage.objects;
drop policy if exists lc_profile_photo_delete on storage.objects;

create policy lc_profile_photo_read
on storage.objects for select to authenticated
using (
  bucket_id = 'profile-photos'
  and name = (select auth.uid())::text || '/avatar.jpg'
);

create policy lc_profile_photo_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-photos'
  and name = (select auth.uid())::text || '/avatar.jpg'
);

create policy lc_profile_photo_update
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-photos'
  and name = (select auth.uid())::text || '/avatar.jpg'
)
with check (
  bucket_id = 'profile-photos'
  and name = (select auth.uid())::text || '/avatar.jpg'
);

create policy lc_profile_photo_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-photos'
  and name = (select auth.uid())::text || '/avatar.jpg'
);

commit;
