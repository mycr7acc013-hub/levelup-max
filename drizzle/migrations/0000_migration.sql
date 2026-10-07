create type public.app_role as enum ('admin','user');

create table public.profiles (
  id uuid primary key,
  email text,
  display_name text,
  avatar_url text,
  is_pro boolean not null default false,
  banned_until timestamptz,
  ban_reason text,
  photo_consent boolean not null default false,
  xp integer not null default 0,
  streak integer not null default 0,
  last_checkin date,
  created_at timestamptz not null default now(),
  last_seen timestamptz default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- prevent users from self-granting pro / unbanning
create or replace function public.protect_profile_fields() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not public.has_role(auth.uid(),'admin') and auth.role() <> 'service_role' then
    new.is_pro := old.is_pro;
    new.banned_until := old.banned_until;
    new.ban_reason := old.ban_reason;
  end if;
  return new;
end $$;
create trigger protect_profile before update on public.profiles for each row execute function public.protect_profile_fields();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,email,display_name,avatar_url)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'avatar_url');
  insert into public.user_roles(user_id, role) values (new.id,'user');
  if lower(new.email) in ('ammaralnasih@gmail.com','1bmin14@gmail.com') then
    insert into public.user_roles(user_id, role) values (new.id,'admin');
    update public.profiles set is_pro = true where id = new.id;
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event text not null,
  detail text,
  flagged boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert on public.activity_log to authenticated;
grant all on public.activity_log to service_role;
alter table public.activity_log enable row level security;
create policy "log insert own" on public.activity_log for insert to authenticated with check (user_id = auth.uid());
create policy "log admin read" on public.activity_log for select to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  method text not null,
  inputs jsonb not null default '{}',
  scores jsonb not null default '{}',
  overall integer not null default 0,
  tier text,
  summary text,
  created_at timestamptz not null default now()
);
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  day date not null default current_date,
  tasks_done jsonb not null default '[]',
  mood integer,
  notes text,
  created_at timestamptz not null default now()
);
create table public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  quiz text not null,
  score integer not null,
  total integer not null,
  created_at timestamptz not null default now()
);
create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null,
  role text not null,
  message jsonb not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.assessments, public.checkins, public.quiz_results, public.chat_threads, public.chat_messages to authenticated;
grant all on public.assessments, public.checkins, public.quiz_results, public.chat_threads, public.chat_messages to service_role;
alter table public.assessments enable row level security;
alter table public.checkins enable row level security;
alter table public.quiz_results enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
create policy "own" on public.assessments for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "admin read" on public.assessments for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "own" on public.checkins for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "admin read" on public.checkins for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "own" on public.quiz_results for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "admin read" on public.quiz_results for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "own" on public.chat_threads for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "admin read" on public.chat_threads for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "own" on public.chat_messages for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "admin read" on public.chat_messages for select to authenticated using (public.has_role(auth.uid(),'admin'));