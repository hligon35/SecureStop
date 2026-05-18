create table if not exists public.domain_event_receipts (
  event_id text primary key,
  event_name text not null,
  tenant_id text,
  source text not null,
  occurred_at bigint not null,
  processed_at timestamptz not null default timezone('utc', now())
);

create index if not exists domain_event_receipts_tenant_id_idx
  on public.domain_event_receipts (tenant_id);

create index if not exists domain_event_receipts_processed_at_idx
  on public.domain_event_receipts (processed_at desc);