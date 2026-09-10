create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  device_type text not null check (device_type in ('phone', 'laptop', 'tablet', 'other')),
  unique_device_id text not null unique,
  status text not null default 'online' check (status in ('online', 'offline', 'tracking', 'lost')),
  battery_level integer,
  last_seen_at timestamptz,
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.device_locations (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision,
  battery_level integer,
  recorded_at timestamptz not null default now()
);

create table if not exists public.geofences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters integer not null default 100,
  created_at timestamptz not null default now()
);

create index if not exists idx_devices_user_id on public.devices(user_id);
create index if not exists idx_devices_status on public.devices(status);
create index if not exists idx_device_locations_device_id on public.device_locations(device_id);
create index if not exists idx_geofences_device_id on public.geofences(device_id);

create or replace function public.update_devices_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_update_devices_updated_at on public.devices;
create trigger trg_update_devices_updated_at
before update on public.devices
for each row
execute function public.update_devices_updated_at();
