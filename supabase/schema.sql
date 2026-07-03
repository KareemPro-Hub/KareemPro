-- ═══════════════════════════════════════════════════════════════
-- Kareem Pro — Client Portal schema
-- Run this once in the Supabase project: SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════════

-- 1) Admin allowlist — emails that may access /admin.
-- Add your own email(s) here before deploying.
create table if not exists admins (
  email text primary key
);

-- 2) Clients — one row per client company/person.
-- id matches auth.users.id once they sign up / are invited.
create table if not exists clients (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now()
);

-- 3) Projects — one client can have multiple projects over time.
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  title text not null,                 -- e.g. "منصة إدارة العيادات"
  package_name text not null,          -- e.g. "الباقة الاحترافية"
  package_price numeric(10,2) not null,-- e.g. 4500.00
  currency text not null default 'SAR',
  status text not null default 'active' check (status in ('active','completed','on_hold','cancelled')),
  created_at timestamptz not null default now()
);

-- 4) Stages — ordered milestones per project, each with its own payment slice.
create table if not exists stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  stage_number int not null,           -- 1, 2, 3 ...
  title text not null,                 -- e.g. "التصميم وواجهات المستخدم"
  description text,
  amount numeric(10,2) not null,       -- e.g. 1500.00
  status text not null default 'upcoming'
    check (status in ('upcoming','awaiting_payment','paid','in_progress','completed')),
  payment_requested_at timestamptz,
  paid_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  unique (project_id, stage_number)
);

-- 5) Payment reminder log — every email we send, for an audit trail.
create table if not exists payment_reminders (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references stages (id) on delete cascade,
  sent_at timestamptz not null default now(),
  email_to text not null,
  resend_message_id text
);

-- ═══════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════
alter table clients enable row level security;
alter table projects enable row level security;
alter table stages enable row level security;
alter table payment_reminders enable row level security;
alter table admins enable row level security;

-- Helper: is the current logged-in user an admin?
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from admins where email = auth.jwt() ->> 'email'
  );
$$;

-- Clients: a client can read only their own row; admin can read/write all.
create policy "clients read own" on clients
  for select using (id = auth.uid() or is_admin());
create policy "admin write clients" on clients
  for all using (is_admin()) with check (is_admin());

-- Projects: client can read only their own projects; admin can read/write all.
create policy "projects read own" on projects
  for select using (client_id = auth.uid() or is_admin());
create policy "admin write projects" on projects
  for all using (is_admin()) with check (is_admin());

-- Stages: client can read stages of their own projects; admin can read/write all.
create policy "stages read own" on stages
  for select using (
    is_admin() or
    exists (select 1 from projects p where p.id = stages.project_id and p.client_id = auth.uid())
  );
create policy "admin write stages" on stages
  for all using (is_admin()) with check (is_admin());

-- Payment reminders: admin only (internal audit log).
create policy "admin only reminders" on payment_reminders
  for all using (is_admin()) with check (is_admin());

-- Admins table: only readable/writable via the Supabase dashboard (service role),
-- not exposed to any client — no policy = no access via anon/authenticated roles.
