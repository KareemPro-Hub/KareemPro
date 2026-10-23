-- Keep the financial snapshot/events when their operational owner is deleted.
-- SET NULL breaks only the optional references, never the payment history.
alter table public.xpay_orders
  drop constraint xpay_orders_stage_id_fkey,
  add constraint xpay_orders_stage_id_fkey
    foreign key (stage_id) references public.stages(id) on delete set null,
  drop constraint xpay_orders_client_id_fkey,
  add constraint xpay_orders_client_id_fkey
    foreign key (client_id) references public.clients(id) on delete set null;
