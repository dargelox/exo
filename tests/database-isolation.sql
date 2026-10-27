begin;
select set_config('test.a',gen_random_uuid()::text,true),set_config('test.b',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('test.a')::uuid),(current_setting('test.b')::uuid);
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.a'),true);
do $$
declare p jsonb:='{"version":1,"people":2,"diet":"all","maxTime":30,"plan":[null,null,null,null,null,null,null],"locked":[false,false,false,false,false,false,false],"pantry":{},"checked":[]}'; id uuid; blocked boolean:=false;
begin
id:=public.save_meal_plan(null,'test',p);
perform public.save_meal_plan(id,'updated',p);
begin perform public.save_meal_plan(null,'over quota',p); exception when others then if sqlerrm='PLAN_QUOTA' then blocked:=true; else raise; end if; end;
if not blocked then raise exception 'Quota failed'; end if;
perform set_config('request.jwt.claim.sub',current_setting('test.b'),true);
if exists(select 1 from public.meal_plans) then raise exception 'RLS read failed'; end if;
blocked:=false;
begin perform public.save_meal_plan(id,'attack',p); exception when others then if sqlerrm='Plan not found' then blocked:=true; else raise; end if; end;
if not blocked then raise exception 'RLS update failed'; end if;
end $$;
select 'PASS' as isolation_and_quota;
rollback;
