-- Administrator acknowledgement; opening a WhatsApp draft is not proof of send.
alter table public.stages add column if not exists payment_confirmation_sent_at timestamptz;
comment on column public.stages.payment_confirmation_sent_at is
  'Time administrator recorded sending the payment confirmation; not a provider delivery receipt.';
