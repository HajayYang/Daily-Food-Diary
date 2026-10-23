-- Only the owner-bound RPC writes snapshots; clients cannot bypass revision checks.
-- Run once in your own Supabase SQL editor. Enable email confirmation in Auth.
begin;
create table if not exists public.diary_snapshots (
 user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
 revision bigint not null default 1 check (revision > 0),
 payload jsonb not null check (jsonb_typeof(payload)='object' and octet_length(payload::text)<=2097152),
 updated_at timestamptz not null default now()
);
alter table public.diary_snapshots enable row level security;
revoke all on public.diary_snapshots from anon,authenticated;
grant select on public.diary_snapshots to authenticated;
drop policy if exists diary_owner_read on public.diary_snapshots;
create policy diary_owner_read on public.diary_snapshots for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists diary_owner_insert on public.diary_snapshots;
create policy diary_owner_insert on public.diary_snapshots for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists diary_owner_update on public.diary_snapshots;
create policy diary_owner_update on public.diary_snapshots for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create or replace function public.put_diary_snapshot(expected_revision bigint,new_payload jsonb)
returns bigint language plpgsql security definer set search_path='' as $$
declare saved_revision bigint;
begin
 if auth.uid() is null then raise exception 'unauthorized'; end if;
 if expected_revision=0 then
  insert into public.diary_snapshots(user_id,revision,payload) values(auth.uid(),1,new_payload)
  on conflict(user_id) do nothing returning revision into saved_revision;
 else
  update public.diary_snapshots set payload=new_payload,revision=revision+1,updated_at=now()
   where user_id=auth.uid() and revision=expected_revision returning revision into saved_revision;
 end if;
 if saved_revision is null then raise exception 'sync_conflict'; end if;
 return saved_revision;
end $$;
revoke all on function public.put_diary_snapshot(bigint,jsonb) from public,anon;
grant execute on function public.put_diary_snapshot(bigint,jsonb) to authenticated;
commit;
