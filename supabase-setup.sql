-- Run once in your Supabase project's SQL Editor. Safe to rerun.
begin;
create table if not exists public.study_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workspace jsonb not null default '{}'::jsonb,
  revision bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint workspace_object check (jsonb_typeof(workspace) = 'object'),
  constraint workspace_size check (octet_length(workspace::text) <= 2097152)
);
alter table public.study_workspaces enable row level security;
revoke all on public.study_workspaces from anon;
grant usage on schema public to authenticated;
grant select, insert, update on public.study_workspaces to authenticated;
drop policy if exists own_workspace_select on public.study_workspaces;
create policy own_workspace_select on public.study_workspaces for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists own_workspace_insert on public.study_workspaces;
create policy own_workspace_insert on public.study_workspaces for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists own_workspace_update on public.study_workspaces;
create policy own_workspace_update on public.study_workspaces for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Compare-and-save prevents another device silently overwriting newer work.
create or replace function public.save_study_workspace(payload jsonb, expected_revision bigint)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare next_revision bigint;
begin
  if auth.uid() is null then raise exception 'Sign in first' using errcode = '42501'; end if;
  if expected_revision = 0 then
    insert into public.study_workspaces(user_id, workspace, revision)
      values (auth.uid(), payload, 1) on conflict (user_id) do nothing
      returning revision into next_revision;
  else
    update public.study_workspaces set workspace = payload, revision = revision + 1, updated_at = now()
      where user_id = auth.uid() and revision = expected_revision
      returning revision into next_revision;
  end if;
  if next_revision is null then raise exception 'Workspace changed on another device' using errcode = '40001'; end if;
  return next_revision;
end;
$$;
revoke all on function public.save_study_workspace(jsonb, bigint) from public, anon;
grant execute on function public.save_study_workspace(jsonb, bigint) to authenticated;
commit;
