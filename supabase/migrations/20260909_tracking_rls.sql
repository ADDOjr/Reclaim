alter table public.devices enable row level security;
alter table public.device_locations enable row level security;
alter table public.geofences enable row level security;

create policy "Users can view their own devices"
on public.devices
for select
using (auth.uid() = user_id);

create policy "Users can insert their own devices"
on public.devices
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own devices"
on public.devices
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own devices"
on public.devices
for delete
using (auth.uid() = user_id);

create policy "Users can view locations for their own devices"
on public.device_locations
for select
using (
  exists (
    select 1
    from public.devices d
    where d.id = device_locations.device_id
      and d.user_id = auth.uid()
  )
);

create policy "Users can insert locations for their own devices"
on public.device_locations
for insert
with check (
  exists (
    select 1
    from public.devices d
    where d.id = device_locations.device_id
      and d.user_id = auth.uid()
  )
);

create policy "Users can view their own geofences"
on public.geofences
for select
using (auth.uid() = user_id);

create policy "Users can insert their own geofences"
on public.geofences
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own geofences"
on public.geofences
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own geofences"
on public.geofences
for delete
using (auth.uid() = user_id);
