create table public.meal_plans (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 label text not null check (length(label) between 1 and 80),
 payload jsonb not null check (octet_length(payload::text) <= 50000),
 updated_at timestamptz not null default now()
);
create index on public.meal_plans(user_id);
alter table public.meal_plans enable row level security;
create policy own_plans_select on public.meal_plans for select to authenticated using (user_id = (select auth.uid()));
create policy own_plans_delete on public.meal_plans for delete to authenticated using (user_id = (select auth.uid()));
revoke all on public.meal_plans from anon, authenticated;
grant select, delete on public.meal_plans to authenticated;
create table public.billing_subscriptions (
 user_id uuid primary key references auth.users(id) on delete cascade,
 customer_id text unique not null,
 subscription_id text unique not null,
 status text not null,
 period_end timestamptz not null
);
alter table public.billing_subscriptions enable row level security;
revoke all on public.billing_subscriptions from anon, authenticated;
create function public.has_plus() returns boolean language sql stable security definer set search_path = public, pg_temp as $$
 select exists(select 1 from public.billing_subscriptions where user_id=auth.uid() and status in ('active','trialing') and period_end > now());
$$;
revoke all on function public.has_plus() from public;
grant execute on function public.has_plus() to authenticated;
create function public.save_meal_plan(p_id uuid, p_label text, p_payload jsonb) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); result uuid; quota integer;
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if p_label is null or length(trim(p_label)) not between 1 and 80 then raise exception 'Invalid label'; end if;
 if p_payload is null or jsonb_typeof(p_payload) <> 'object' or octet_length(p_payload::text)>50000 then raise exception 'Invalid payload'; end if;
 if not (p_payload ?& array['version','people','diet','maxTime','plan','locked','pantry','checked']) then raise exception 'Incomplete payload'; end if;
 if jsonb_typeof(p_payload->'version') is distinct from 'number' or jsonb_typeof(p_payload->'people') is distinct from 'number' or jsonb_typeof(p_payload->'diet') is distinct from 'string' or jsonb_typeof(p_payload->'maxTime') is distinct from 'number' then raise exception 'Invalid types'; end if;
 if p_payload->>'version' <> '1' or p_payload->>'people' not in ('1','2','3','4','5','6','7','8') or p_payload->>'diet' not in ('all','vegetarian') or p_payload->>'maxTime' not in ('15','20','25','30') then raise exception 'Invalid preferences'; end if;
 if jsonb_typeof(p_payload->'plan') is distinct from 'array' or jsonb_typeof(p_payload->'locked') is distinct from 'array' or jsonb_typeof(p_payload->'pantry') is distinct from 'object' or jsonb_typeof(p_payload->'checked') is distinct from 'array' then raise exception 'Invalid lists'; end if;
 if jsonb_array_length(p_payload->'plan')<>7 or jsonb_array_length(p_payload->'locked')<>7 then raise exception 'Invalid week'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 if p_id is not null then
  update public.meal_plans set label=trim(p_label), payload=p_payload, updated_at=now() where id=p_id and user_id=uid returning id into result;
  if result is null then raise exception 'Plan not found'; end if;
 else
  quota := case when public.has_plus() then 52 else 1 end;
  if (select count(*) from public.meal_plans where user_id=uid)>=quota then raise exception 'PLAN_QUOTA'; end if;
  insert into public.meal_plans(user_id,label,payload) values(uid,trim(p_label),p_payload) returning id into result;
 end if;
 return result;
end;
$$;
revoke all on function public.save_meal_plan(uuid,text,jsonb) from public;
grant execute on function public.save_meal_plan(uuid,text,jsonb) to authenticated;
-- Supabase can grant EXECUTE to anon directly through default privileges.
revoke all on function public.has_plus() from anon;
revoke all on function public.save_meal_plan(uuid,text,jsonb) from anon;
