create table public.studio_creations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null check (kind in ('image','video')),
  prompt text not null,
  status text not null default 'pending' check (status in ('pending','extending','done','failed')),
  job_id text,
  storage_path text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.studio_creations to authenticated;
grant all on public.studio_creations to service_role;
alter table public.studio_creations enable row level security;
create policy "own select" on public.studio_creations for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "own insert" on public.studio_creations for insert to authenticated with check (auth.uid() = user_id);
create policy "own update" on public.studio_creations for update to authenticated using (auth.uid() = user_id);
create policy "own delete" on public.studio_creations for delete to authenticated using (auth.uid() = user_id);
create index on public.studio_creations (user_id, created_at desc);

create policy "studio own read" on storage.objects for select to authenticated using (bucket_id = 'studio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "studio own write" on storage.objects for insert to authenticated with check (bucket_id = 'studio' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "studio own delete" on storage.objects for delete to authenticated using (bucket_id = 'studio' and (storage.foldername(name))[1] = auth.uid()::text);