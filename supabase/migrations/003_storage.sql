-- Public bucket for invitation images. Paths: invitations/{invitation_id}/{cover|couple|gallery}/<file>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invitation-images', 'invitation-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "public read invitation images" on storage.objects for select to anon, authenticated
  using (bucket_id = 'invitation-images');
create policy "admin upload invitation images" on storage.objects for insert to authenticated
  with check (bucket_id = 'invitation-images' and is_admin());
create policy "admin update invitation images" on storage.objects for update to authenticated
  using (bucket_id = 'invitation-images' and is_admin());
create policy "admin delete invitation images" on storage.objects for delete to authenticated
  using (bucket_id = 'invitation-images' and is_admin());
