-- Admin passkeys (الدخول بالبصمة) — see src/lib/passkeys.js.
-- Public keys only; the private key never leaves the admin's device.
create table if not exists public.admin_passkeys (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null references public.admins (email) on delete cascade on update cascade,
  credential_id text not null unique,
  public_key text not null,
  counter bigint not null default 0,
  transports text[] not null default '{}',
  device_label text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists admin_passkeys_admin_email_idx on public.admin_passkeys (admin_email);

-- RLS on with NO policies: only the service-role key (server routes) can
-- read or write this table.
alter table public.admin_passkeys enable row level security;
