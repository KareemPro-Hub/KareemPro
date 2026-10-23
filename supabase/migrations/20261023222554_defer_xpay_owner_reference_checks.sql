-- A client delete can clear both references through separate cascade paths.
-- Check their final state after all SET NULL actions, regardless of row order.
alter table public.xpay_orders
  alter constraint xpay_orders_stage_id_fkey deferrable initially deferred,
  alter constraint xpay_orders_client_id_fkey deferrable initially deferred;
