-- Payment snapshots are server-only. No public/authenticated access to secrets or orders.
create table public.xpay_orders (
 id uuid primary key,
 service_id text,
 tier integer,
 stage_id uuid references public.stages(id),
 client_id uuid references public.clients(id),
 title text not null,
 amount_sar numeric(12,2) not null check(amount_sar>0),
 amount_egp_minor bigint not null check(amount_egp_minor>0),
 exchange_rate numeric not null check(exchange_rate>0),
 rate_updated_at timestamptz not null,
 livemode boolean not null,
 session_id text unique,
 checkout_url text,
 status text not null default 'pending' check(status in ('pending','paid','expired','failed')),
 created_at timestamptz not null default now(),
 paid_at timestamptz,
 stage_applied boolean not null default false
);
create unique index xpay_one_active_stage on public.xpay_orders(stage_id) where stage_id is not null and status in ('pending','paid');
alter table public.xpay_orders enable row level security;
revoke all on public.xpay_orders from anon, authenticated;
grant all on public.xpay_orders to service_role;
create table public.xpay_events (id text primary key, order_id uuid not null references public.xpay_orders(id), created_at timestamptz not null default now());
alter table public.xpay_events enable row level security;
revoke all on public.xpay_events from anon, authenticated;
grant all on public.xpay_events to service_role;
create or replace function public.confirm_xpay_payment(p_order_id uuid,p_session_id text,p_amount bigint,p_live boolean,p_event_id text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.xpay_orders; applied boolean:=false;
begin
 select * into o from public.xpay_orders where id=p_order_id for update;
 if not found or o.session_id is distinct from p_session_id or o.amount_egp_minor<>p_amount or o.livemode<>p_live then
  raise exception 'Payment snapshot mismatch';
 end if;
 if o.status='paid' then return false; end if;
 insert into public.xpay_events(id,order_id) values(p_event_id,o.id) on conflict do nothing;
 if not found then return false; end if;
 if o.stage_id is not null then
  update public.stages set status='paid',paid_at=now() where id=o.stage_id and status='awaiting_payment' and amount=o.amount_sar;
  applied:=found;
 end if;
 update public.xpay_orders set status='paid',paid_at=now(),stage_applied=applied where id=o.id;
 insert into public.notifications(client_id,type,message,for_admin,link)
 values(o.client_id,'payment','تم تأكيد سداد عبر Xpay: '||o.title||case when o.stage_id is not null and not applied then ' — يرجى مراجعة ربط مرحلة السداد يدويًا' else '' end,true,'/admin/payments');
 return true;
end; $$;
revoke all on function public.confirm_xpay_payment(uuid,text,bigint,boolean,text) from public,anon,authenticated;
grant execute on function public.confirm_xpay_payment(uuid,text,bigint,boolean,text) to service_role;
