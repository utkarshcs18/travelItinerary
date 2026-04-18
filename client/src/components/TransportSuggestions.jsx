import { useEffect, useMemo, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { api } from '../lib/api';

const GOOGLE_MAP_ID = 'tourai-google-maps';

function GoogleDirectionsBridge({ apiKey, source, destPlace, onResult }) {
  const { isLoaded } = useJsApiLoader({
    id: GOOGLE_MAP_ID,
    googleMapsApiKey: apiKey,
  });

  useEffect(() => {
    if (!isLoaded || !source || !destPlace || !window.google?.maps?.DirectionsService) return;

    let cancelled = false;
    onResult((prev) => ({ ...prev, loading: true }));

    const svc = new window.google.maps.DirectionsService();
    const origin = { lat: source.lat, lng: source.lon };
    const end = { lat: destPlace.lat, lng: destPlace.lon };

    svc.route(
      {
        origin,
        destination: end,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (!cancelled) {
          if (status === 'OK') {
            onResult({ driveDir: result, transitDir: null, loading: false });
          } else {
            onResult((prev) => ({ ...prev, loading: false }));
          }
        }
      }
    );

    return () => { cancelled = true; };
  }, [isLoaded, source, destPlace, onResult]);

  return null;
}

export default function TransportSuggestions({ destination }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const [source, setSource] = useState(null);
  const [destPlace, setDestPlace] = useState(null);
  const [googlePack, setGooglePack] = useState({
    driveDir: null,
    transitDir: null,
    loading: false,
  });

  const destQuery = useMemo(() => String(destination || '').trim(), [destination]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setSource({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setSource(null),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (destQuery.length < 2) { 
      queueMicrotask(() => {
        setDestPlace(null);
      });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const geo = await api.geocode({ q: destQuery });
        if (cancelled) return;
        setDestPlace(geo.place || null);
      } catch {
        if (!cancelled) setDestPlace(null);
      }
    })();

    return () => { cancelled = true; };
  }, [destQuery]);

  if (destQuery.length < 2) {
    return <p className="text-sm text-slate-600">Enter a destination to see route details.</p>;
  }

  if (!destPlace) {
    return <p className="text-sm text-slate-600 animate-pulse">Locating destination…</p>;
  }

  return (
    <div className="space-y-4">
      {googlePack.loading && (
        <p className="text-xs font-medium text-slate-500 animate-pulse">
          Calculating travel times from your location…
        </p>
      )}

      {apiKey && source && destPlace && (
        <GoogleDirectionsBridge
          apiKey={apiKey}
          source={source}
          destPlace={destPlace}
          onResult={setGooglePack}
        />
      )}

      {!apiKey && (
        <p className="text-[10px] text-slate-400 italic">
          Tip: Add a Google Maps API key to see live driving times.
        </p>
      )}
    </div>
  );
}