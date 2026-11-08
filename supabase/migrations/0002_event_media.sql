-- Stage 1: storage for invitation media (image or GIF, up to 10MB).
-- The bucket is public so invitation pages can show the media without
-- signing URLs; only staff can upload, replace or delete files.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-media',
  'event-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "staff read event media"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'event-media' and public.is_staff());

create policy "staff upload event media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'event-media' and public.is_staff());

create policy "staff update event media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'event-media' and public.is_staff())
  with check (bucket_id = 'event-media' and public.is_staff());

create policy "staff delete event media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'event-media' and public.is_staff());
