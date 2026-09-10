import { supabase } from '@/lib/supabase';
import type { Device, DeviceInput, DeviceLocation, DeviceLocationInput, Geofence, GeofenceInput } from '@/types';

export async function registerDevice(input: DeviceInput): Promise<Device | null> {
  const { data, error } = await supabase
    .from('devices')
    .insert({
      user_id: input.user_id,
      name: input.name,
      device_type: input.device_type,
      unique_device_id: input.unique_device_id,
      status: input.status ?? 'online',
      battery_level: input.battery_level ?? null,
      last_seen_at: input.last_seen_at ?? new Date().toISOString(),
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      accuracy: input.accuracy ?? null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('registerDevice error:', error);
    return null;
  }

  return data as Device;
}

export async function getUserDevices(userId: string): Promise<Device[]> {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('getUserDevices error:', error);
    return [];
  }

  return (data as Device[]) ?? [];
}

export async function updateDeviceLocation(input: DeviceLocationInput): Promise<DeviceLocation | null> {
  const { data, error } = await supabase
    .from('device_locations')
    .insert({
      device_id: input.device_id,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy ?? null,
      battery_level: input.battery_level ?? null,
      recorded_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    console.error('updateDeviceLocation error:', error);
    return null;
  }

  const { error: updateError } = await supabase
    .from('devices')
    .update({
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy: input.accuracy ?? null,
      battery_level: input.battery_level ?? null,
      last_seen_at: new Date().toISOString(),
      status: 'tracking',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.device_id);

  if (updateError) {
    console.error('updateDeviceLocation device update error:', updateError);
  }

  return data as DeviceLocation;
}

export async function getDeviceLocationHistory(deviceId: string): Promise<DeviceLocation[]> {
  const { data, error } = await supabase
    .from('device_locations')
    .select('*')
    .eq('device_id', deviceId)
    .order('recorded_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('getDeviceLocationHistory error:', error);
    return [];
  }

  return (data as DeviceLocation[]) ?? [];
}

export async function createGeofence(input: GeofenceInput): Promise<Geofence | null> {
  const { data, error } = await supabase
    .from('geofences')
    .insert({
      user_id: input.user_id,
      device_id: input.device_id,
      name: input.name,
      latitude: input.latitude,
      longitude: input.longitude,
      radius_meters: input.radius_meters,
    })
    .select('*')
    .single();

  if (error) {
    console.error('createGeofence error:', error);
    return null;
  }

  return data as Geofence;
}

export async function getGeofencesByDevice(deviceId: string): Promise<Geofence[]> {
  const { data, error } = await supabase
    .from('geofences')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getGeofencesByDevice error:', error);
    return [];
  }

  return (data as Geofence[]) ?? [];
}

export function distanceBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c * 1000;
}
