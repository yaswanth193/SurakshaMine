-- ============================================================
-- Storage bucket for incident/inspection evidence + compliance
-- documents. Run after 0001_init.sql.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

-- Any authenticated user can upload evidence
create policy "authenticated upload evidence"
  on storage.objects for insert
  with check (bucket_id = 'evidence' and auth.role() = 'authenticated');

-- Any authenticated user can read evidence (tighten this to mine-scoped
-- if evidence is sensitive — would require storing mine_id in the
-- object path, e.g. `{mine_id}/{incident_id}/{filename}`, and checking
-- it against current_mine_id() the same way the table policies do)
create policy "authenticated read evidence"
  on storage.objects for select
  using (bucket_id = 'evidence' and auth.role() = 'authenticated');

create policy "uploader can delete own evidence"
  on storage.objects for delete
  using (bucket_id = 'evidence' and auth.uid() = owner);
