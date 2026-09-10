import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { BatteryCharging, BellRing, LocateFixed, MapPin, ShieldCheck, Wifi, Zap } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

type DeviceStatus = 'tracking' | 'online' | 'offline';
type DeviceType = 'phone' | 'desktop';
type LocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

type TrackedDevice = {
  id: string;
  name: string;
  model: string;
  deviceType: DeviceType;
  status: DeviceStatus;
  battery: number;
  latitude: number;
  longitude: number;
  lastSeen: string;
  accuracy: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function distanceBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

function formatDateTime(value: string) {
  if (value === 'just now') return value;
  return value;
}

export default function TrackingPage() {
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [position, setPosition] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState('My Device');
  const [deviceModel, setDeviceModel] = useState('Browser device');
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [locationPermission, setLocationPermission] = useState<LocationPermissionState>('prompt');
  const [lastUpdated, setLastUpdated] = useState('Waiting for location');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [batteryCharging, setBatteryCharging] = useState<boolean | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const geofenceRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationPermission('unsupported');
      return;
    }

    if ('permissions' in navigator && navigator.permissions && 'query' in navigator.permissions) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setLocationPermission(result.state as LocationPermissionState);
          result.addEventListener('change', () => {
            setLocationPermission(result.state as LocationPermissionState);
          });
        })
        .catch(() => {
          setLocationPermission('prompt');
        });
    } else {
      setLocationPermission('prompt');
    }
  }, []);

  useEffect(() => {
    const userAgent = navigator.userAgent || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const hasTouch = 'matchMedia' in window && window.matchMedia('(pointer: coarse)').matches;
    setDeviceType(isMobile || hasTouch ? 'phone' : 'desktop');

    const getBattery = navigator.getBattery;
    if (typeof getBattery !== 'function') {
      setBatteryLevel(null);
      setBatteryCharging(null);
      return;
    }

    const updateBatteryStatus = async () => {
      const battery = await getBattery.call(navigator);
      setBatteryLevel(battery.level);
      setBatteryCharging(battery.charging);

      battery.addEventListener('levelchange', () => {
        setBatteryLevel(battery.level);
      });

      battery.addEventListener('chargingchange', () => {
        setBatteryCharging(battery.charging);
      });
    };

    updateBatteryStatus();
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (geoPosition) => {
        setPosition({
          latitude: geoPosition.coords.latitude,
          longitude: geoPosition.coords.longitude,
          accuracy: geoPosition.coords.accuracy,
        });
        setError(null);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      },
      (geoError) => {
        setError(geoError.message || 'Unable to access GPS location.');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
      },
    );
  }, []);

  useEffect(() => {
    if (!trackingEnabled || !('geolocation' in navigator)) {
      if (trackingEnabled) {
        setError('This browser does not support geolocation.');
      }
      return;
    }

    setIsLoadingLocation(true);
    const watchId = navigator.geolocation.watchPosition(
      (geoPosition) => {
        const nextPosition = {
          latitude: geoPosition.coords.latitude,
          longitude: geoPosition.coords.longitude,
          accuracy: geoPosition.coords.accuracy,
        };
        setPosition(nextPosition);
        setError(null);
        setAlertMessage(null);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
        setIsLoadingLocation(false);
      },
      (geoError) => {
        setError(geoError.message || 'Unable to access GPS location.');
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 15000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [trackingEnabled]);

  const currentLocation = useMemo(() => {
    if (position) return position;
    return { latitude: 5.6037, longitude: -0.187, accuracy: 500 };
  }, [position]);

  const permissionMeta = {
    prompt: {
      label: 'Permission needed',
      className: 'bg-amber-100 text-amber-700',
      description: 'Allow location access when your browser asks.',
    },
    granted: {
      label: 'Location enabled',
      className: 'bg-emerald-100 text-emerald-700',
      description: 'Your browser is sharing your live location.',
    },
    denied: {
      label: 'Location blocked',
      className: 'bg-rose-100 text-rose-700',
      description: 'Enable location in browser settings to continue.',
    },
    unsupported: {
      label: 'Not supported',
      className: 'bg-slate-200 text-slate-700',
      description: 'This browser cannot read GPS data.',
    },
  }[locationPermission];

  const batteryPercent = batteryLevel !== null ? Math.round(batteryLevel * 100) : 82;
  const batteryStatusLabel = batteryCharging === true ? 'Charging' : batteryCharging === false ? 'On battery' : 'Unknown';

  const trackedDevice: TrackedDevice = {
    id: 'browser-device',
    name: deviceName,
    model: deviceModel,
    deviceType: deviceType,
    status: trackingEnabled ? 'tracking' : 'online',
    battery: batteryPercent,
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    lastSeen: trackingEnabled ? 'just now' : 'waiting',
    accuracy: Math.round(currentLocation.accuracy),
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: true,
    });

    map.setView([currentLocation.latitude, currentLocation.longitude], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      geofenceRef.current = null;
    };
  }, [currentLocation.latitude, currentLocation.longitude]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo([currentLocation.latitude, currentLocation.longitude], 16, {
      duration: 1.4,
      animate: true,
    });

    const markerIcon = L.divIcon({
      className: 'gps-map-custom-icon',
      html: '<div class="gps-map-marker"><span></span></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    if (!markerRef.current) {
      markerRef.current = L.marker([currentLocation.latitude, currentLocation.longitude], {
        icon: markerIcon,
      }).addTo(map);
    } else {
      markerRef.current.setLatLng([currentLocation.latitude, currentLocation.longitude]);
    }

  }, [currentLocation.latitude, currentLocation.longitude]);

  const handleRefresh = () => {
    if (!('geolocation' in navigator)) {
      setError('This browser does not support geolocation.');
      return;
    }

    setTrackingEnabled(true);
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (geoPosition) => {
        setPosition({
          latitude: geoPosition.coords.latitude,
          longitude: geoPosition.coords.longitude,
          accuracy: geoPosition.coords.accuracy,
        });
        setError(null);
        setAlertMessage('Location refreshed successfully.');
        setLastUpdated(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
        setIsLoadingLocation(false);
      },
      (geoError) => {
        setError(geoError.message || 'Unable to refresh your GPS location.');
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const handleToggleTracking = () => {
    setTrackingEnabled((prev) => !prev);
    if (!trackingEnabled) {
      setAlertMessage('GPS tracking enabled. Waiting for browser location.');
    } else {
      setAlertMessage('Tracking paused.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-7 h-7 text-brand-600" />
            <h1 className="text-3xl font-bold text-slate-900">Device Tracker</h1>
          </div>
          <p className="text-slate-500">Track your device, monitor battery life, and keep tabs on real-time location.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleTracking}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              trackingEnabled
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/30 hover:shadow-brand-500/40'
            }`}
          >
            {trackingEnabled ? 'Pause tracking' : 'Enable GPS tracking'}
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-slate-700 hover:bg-gray-50 font-medium text-sm"
          >
            Refresh location
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${trackingEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              <span className={`h-3 w-3 rounded-full ${trackingEnabled ? 'bg-emerald-500 animate-pulse-dot' : 'bg-slate-400'}`} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Location status</p>
              <p className="text-lg font-bold text-slate-900">{trackingEnabled ? 'Tracking live' : 'Standby mode'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${permissionMeta.className}`}>
              {permissionMeta.label}
            </span>
            <span className="text-sm text-slate-500">Updated {lastUpdated}</span>
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-600">{permissionMeta.description}</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {alertMessage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {alertMessage}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <form className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wide">Device setup</p>
                <h2 className="text-xl font-bold text-slate-900">Register your device</h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Device name</label>
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Model</label>
                <input
                  type="text"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  placeholder={deviceType === 'phone' ? 'Mobile device' : 'Desktop computer'}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setAlertMessage('Device registration saved.')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium text-sm shadow-lg shadow-brand-500/30"
              >
                Save device
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wide">Live map</p>
                <h2 className="text-xl font-bold text-slate-900">Primary Device</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {trackingEnabled ? 'Tracking live' : 'Standby'}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-gray-200 h-72">
              <div ref={mapContainerRef} className="h-full w-full" />

              <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Map lock</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{trackingEnabled ? 'Live GPS' : 'Waiting for signal'}</p>
              </div>

              <div className="pointer-events-none absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Coordinates</p>
                  <p className="font-semibold text-slate-900">
                    {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Accuracy</p>
                  <p className="font-semibold text-slate-900">±{Math.round(currentLocation.accuracy)}m</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wide mb-2">
                  <LocateFixed className="w-4 h-4" />
                  Last seen
                </div>
                <p className="text-lg font-bold text-slate-900">{trackingEnabled ? lastUpdated : 'Waiting'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wide mb-2">
                  <BatteryCharging className="w-4 h-4" />
                  Battery
                </div>
                <p className="text-lg font-bold text-slate-900">{batteryLevel !== null ? `${batteryPercent}%` : 'Unknown'}</p>
                <p className="mt-1 text-xs text-slate-500">{batteryStatusLabel}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wide mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  Status
                </div>
                <p className="text-lg font-bold text-slate-900">{trackingEnabled ? 'Live' : 'Standby'}</p>
              </div>
            </div>
          </div>

        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Security status</h3>
              <BellRing className="w-5 h-5 text-brand-500" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-3 py-2.5">
                <span className="text-sm text-emerald-700">GPS signal</span>
                <span className="text-sm font-semibold text-emerald-700">
                  {position ? `Strong · ±${Math.round(currentLocation.accuracy)}m` : 'Waiting'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-brand-50 px-3 py-2.5">
                <span className="text-sm text-brand-700">Location access</span>
                <span className="text-sm font-semibold text-brand-700">{permissionMeta.label}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
                <span className="text-sm text-slate-600">Battery status</span>
                <span className="text-sm font-semibold text-slate-700">{batteryLevel !== null ? `${batteryPercent}%` : 'Unavailable'}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
                <span className="text-sm text-slate-600">Location history</span>
                <span className="text-sm font-semibold text-slate-700">{isLoadingLocation ? 'Refreshing...' : 'Saved'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Nearby devices</h3>
              <Wifi className="w-5 h-5 text-slate-400" />
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{trackedDevice.name}</p>
                    <p className="text-xs text-slate-500">{trackedDevice.model} • {trackedDevice.deviceType}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    trackedDevice.status === 'tracking'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-brand-100 text-brand-700'
                  }`}>
                    {trackedDevice.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                  <span>Current device</span>
                  <span>{trackedDevice.lastSeen}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{trackedDevice.latitude.toFixed(4)}, {trackedDevice.longitude.toFixed(4)}</span>
                  <span>{trackedDevice.battery}% battery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-brand-500" />
          <h3 className="text-lg font-bold text-slate-900">Tracking activity</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Movement</p>
            <p className="text-xl font-bold text-slate-900">{position ? 'Live' : 'Waiting'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Last alert</p>
            <p className="text-xl font-bold text-slate-900">No alert</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Updated</p>
            <p className="text-xl font-bold text-slate-900">{formatDateTime(trackedDevice.lastSeen)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
