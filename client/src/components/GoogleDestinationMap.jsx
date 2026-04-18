import { useEffect, useMemo, useState } from 'react';
import { GoogleMap, MarkerF, PolylineF, useJsApiLoader, DirectionsRenderer } from '@react-google-maps/api';
import { api } from '../lib/api';

const containerStyle = { width: '100%', height: 280 };

export default function GoogleDestinationMap({ destination }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    id: 'tourai-google-maps',
    googleMapsApiKey: apiKey || '',
  });

  const [place, setPlace] = useState(null);
  const [source, setSource] = useState(null);
  const [directions, setDirections] = useState(null);

  useEffect(() => {
    if (!destination) return;
    (async () => {
      try {
        const geo = await api.geocode({ q: destination });
        setPlace(geo.place || null);
      } catch {
        setPlace(null);
      }
    })();
  }, [destination]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setSource({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 7000 }
    );
  }, []);

  const destLatLng = useMemo(() => {
    if (!place) return null;
    return { lat: Number(place.lat), lng: Number(place.lon) };
  }, [place]);

  const center = useMemo(() => destLatLng || { lat: 20.5937, lng: 78.9629 }, [destLatLng]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!source || !destLatLng) return;
    if (!window.google?.maps?.DirectionsService) return;

    const svc = new window.google.maps.DirectionsService();
    svc.route(
      {
        origin: source,
        destination: destLatLng,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) setDirections(result);
        else setDirections(null);
      }
    );
  }, [isLoaded, source, destLatLng]);

  if (!apiKey) {
    return (
      <div className="grid h-[280px] place-items-center rounded-3xl border border-black/10 bg-white/70 text-sm text-slate-700">
        Add <span className="mx-1 font-mono text-xs">VITE_GOOGLE_MAPS_API_KEY</span> in{' '}
        <span className="mx-1 font-mono text-xs">client/.env</span> to enable Google Maps.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="grid h-[280px] place-items-center rounded-3xl border border-black/10 bg-white/70 text-sm text-slate-700">
        Loading map…
      </div>
    );
  }

  const linePath = source && destLatLng ? [source, destLatLng] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-950">{destination}</p>
          <p className="text-xs text-slate-600">{place?.displayName || 'Locating…'}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-600">
            Google Maps
          </p>
          <p className="text-xs text-slate-700">{directions ? 'Route ready' : 'Route line (fallback)'}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-black/10 bg-white/80">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={destLatLng ? 11 : 4}
          options={{
            fullscreenControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            clickableIcons: false,
          }}
        >
          {destLatLng && <MarkerF position={destLatLng} />}
          {source && <MarkerF position={source} />}
          {directions ? (
            <DirectionsRenderer
              directions={directions}
              options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#22d3ee', strokeWeight: 5 } }}
            />
          ) : linePath ? (
            <PolylineF path={linePath} options={{ strokeColor: '#22d3ee', strokeOpacity: 0.95, strokeWeight: 5 }} />
          ) : null}
        </GoogleMap>
      </div>
    </div>
  );
}