create table if not exists public.user_profiles (
  user_id text primary key,
  role text not null,
  tenant_id text,
  school_id text,
  email text not null,
  home_address text not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_membership_contexts (
  user_id text primary key,
  active_tenant_id text,
  memberships jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_profiles_tenant_id_idx
  on public.user_profiles (tenant_id);

create index if not exists user_membership_contexts_active_tenant_id_idx
  on public.user_membership_contexts (active_tenant_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists user_membership_contexts_set_updated_at on public.user_membership_contexts;
create trigger user_membership_contexts_set_updated_at
before update on public.user_membership_contexts
for each row
execute function public.set_updated_at();