export type ItemType = 'lost' | 'found';
export type ItemStatus = 'active' | 'resolved';

export interface Item {
  id: string;
  user_id: string;
  type: ItemType;
  title: string;
  category: string;
  color: string;
  brand: string | null;
  date_event: string;
  location: string;
  building: string | null;
  description: string;
  photo_urls: string[];
  image_hash: string | null;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
}

export interface ItemInput {
  type: ItemType;
  title: string;
  category: string;
  color: string;
  brand: string | null;
  date_event: string;
  location: string;
  building: string | null;
  description: string;
  photo_urls: string[];
  image_hash: string | null;
}

export interface MatchResult {
  item: Item;
  score: number;
  breakdown: {
    category: number;
    color: number;
    brand: number;
    keywords: number;
    date: number;
    location: number;
    image: number;
  };
}

export interface ScoreLabel {
  label: string;
  badgeClass: string;
}

export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface Claim {
  id: string;
  item_id: string;
  claimer_id: string;
  status: ClaimStatus;
  verification_answers: Record<string, string>;
  proof_url: string | null;
  admin_id: string | null;
  admin_note: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface ClaimWithDetails extends Claim {
  item?: Item;
  claimer_email?: string;
}

export type NotificationType = 'match' | 'claim' | 'system';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  notify_email: boolean;
  notify_sms: boolean;
  notify_inapp: boolean;
  created_at: string;
}

export type DeviceType = 'phone';
export type DeviceStatus = 'online' | 'offline' | 'tracking' | 'lost';

export interface Device {
  id: string;
  user_id: string;
  name: string;
  device_type: DeviceType;
  unique_device_id: string;
  status: DeviceStatus;
  battery_level: number | null;
  last_seen_at: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceInput {
  user_id: string;
  name: string;
  device_type: DeviceType;
  unique_device_id: string;
  status?: DeviceStatus;
  battery_level?: number | null;
  last_seen_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
}

export interface DeviceLocation {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  battery_level: number | null;
  recorded_at: string;
}

export interface DeviceLocationInput {
  device_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  battery_level?: number | null;
}

export interface Geofence {
  id: string;
  user_id: string;
  device_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  created_at: string;
}

export interface GeofenceInput {
  user_id: string;
  device_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Bags',
  'Jewelry',
  'Keys',
  'Wallets',
  'Documents',
  'Pets',
  'Sports Equipment',
  'Other',
] as const;

export const COLORS = [
  'Black',
  'White',
  'Gray',
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Orange',
  'Purple',
  'Pink',
  'Brown',
  'Navy',
  'Beige',
  'Silver',
  'Gold',
  'Multicolor',
] as const;

export const VERIFICATION_QUESTIONS = [
  { id: 'distinguishing', question: 'Describe a distinguishing feature of the item not visible in photos' },
  { id: 'contents', question: 'What was inside or attached to the item when you lost it?' },
  { id: 'purchase', question: 'When and where did you originally acquire this item?' },
  { id: 'serial', question: 'Do you know the serial number or any identifying marks? (optional)' },
] as const;
