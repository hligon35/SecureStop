create table if not exists public.alert_inbox (
  id text primary key,
  tenant_id text not null,
  title text not null,
  body text not null,
  recipients text not null,
  severity text,
  template_id text,
  vehicle_id text,
  created_at bigint not null,
  created_by_role text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.incident_read_models (
  id text primary key,
  tenant_id text not null,
  alert_id text,
  title text not null,
  description text not null,
  severity text not null,
  status text not null,
  created_at bigint not null,
  updated_at bigint not null,
  vehicle_id text,
  created_by_role text not null,
  events jsonb not null default '[]'::jsonb,
  synced_at timestamptz not null default timezone('utc', now())
);

create index if not exists alert_inbox_tenant_created_at_idx
  on public.alert_inbox (tenant_id, created_at desc);

create index if not exists incident_read_models_tenant_updated_at_idx
  on public.incident_read_models (tenant_id, updated_at desc);