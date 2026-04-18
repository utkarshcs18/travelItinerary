import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { api } from '../lib/api';

const iconStart = L.divIcon({ className: 'tourai-leaflet-divicon', html: '<div class="tourai-pin tourai-pin--start"></div>', iconSize: [22, 22], iconAnchor: [11, 11] });
const iconDest = L.divIcon({ className: 'tourai-leaflet-divicon', html: '<div class="tourai-pin tourai-pin--dest"></div>', iconSize: [22, 22], iconAnchor: [11, 11] });
const iconStop = L.divIcon({ className: 'tourai-leaflet-divicon', html: '<div class="tourai-pin tourai-pin--stop"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });

function MapResizeFix() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 500);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function FitRouteBounds({ dest, source, stops }) {
  const map = useMap();
  useEffect(() => {
    const pts = [];
    if (dest) pts.push(L.latLng(dest[0], dest[1]));
    if (source) pts.push(L.latLng(source[0], source[1]));
    stops?.forEach(s => s.lat && pts.push(L.latLng(s.lat, s.lon)));
    if (pts.length === 1) {
      map.setView(pts[0], 12);
    } else if (pts.length >= 2) {
      map.fitBounds(L.latLngBounds(pts), { padding: [50, 50], animate: true });
    }
  }, [map, dest, source, stops]);
  return null;
}

export default function DestinationMap({ destination, onWeather, suggestedStops = [], mapHeightPx = 350 }) {
  const [place, setPlace] = useState(null);
  const [weather, setWeather] = useState(null);
  const [source, setSource] = useState(null);
  const [osrmRoute, setOsrmRoute] = useState(null);
  const [stopPlaces, setStopPlaces] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const query = String(destination || '').trim();
    if (query.length < 2) return;
    
    let cancel = false;
    queueMicrotask(() => {
      setError(null);
      setPlace(null); // Reset place while loading new one
    });

    api.geocode({ q: query })
      .then(res => {
        if (cancel) return;
        if (res && res.place && res.place.lat && res.place.lon) {
          const p = {
            ...res.place,
            lat: Number(res.place.lat),
            lon: Number(res.place.lon)
          };
          setPlace(p);
          
          api.weather({ lat: p.lat, lon: p.lon })
            .then(w => {
              if (cancel) return;
              const cur = w.current || null;
              setWeather(cur);
              if (onWeather) onWeather(cur);
            })
            .catch(err => console.error("Weather failed:", err));
        } else {
          console.error("Geocode returned no results for:", query);
          setError(`Could not find "${query}"`);
        }
      })
      .catch(err => {
        console.error("Geocoding API Error:", err);
        setError("Map service unavailable.");
      });
    
    return () => { cancel = true; };
  }, [destination, onWeather]);

  useEffect(() => {
    if (!suggestedStops?.length) {
      queueMicrotask(() => setStopPlaces([]));
      return;
    }
    Promise.all(suggestedStops.map(s => api.geocode({ q: String(s).trim() }).catch(() => null)))
      .then(results => {
        const validStops = results
          .filter(r => r && r.place)
          .map(r => ({
            ...r.place, 
            lat: Number(r.place.lat), 
            lon: Number(r.place.lon)
          }));
        setStopPlaces(validStops);
      });
  }, [suggestedStops]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      p => setSource([p.coords.latitude, p.coords.longitude]),
      () => console.warn("User location denied")
    );
  }, []);

  useEffect(() => {
    if (!place || !source) {
      queueMicrotask(() => setOsrmRoute(null));
      return;
    }
    fetch(`https://router.project-osrm.org/route/v1/driving/${source[1]},${source[0]};${place.lon},${place.lat}?overview=full&geometries=geojson`)
      .then(r => r.json())
      .then(data => {
        if (data?.routes?.[0]) {
          setOsrmRoute(data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
        } else {
          setOsrmRoute(null);
        }
      })
      .catch(() => setOsrmRoute(null));
  }, [place, source]);

  const linePositions = useMemo(() => 
    osrmRoute || (place && source ? [source, [place.lat, place.lon]] : null), 
  [osrmRoute, place, source]);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-end justify-between px-1">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600">Route Map</p>
          <h2 className="text-lg font-bold text-slate-900 truncate leading-tight">
            {destination || "Trip Preview"}
          </h2>
          <p className="text-[11px] text-slate-500 font-medium italic">
            {place?.displayName || (error ? "Location not found" : "Locating destination...")}
          </p>
        </div>
        {weather && (
          <div className="text-right">
            <p className="text-3xl font-black text-slate-900 tabular-nums tracking-tighter">
              {Math.round(weather.temperature_2m)}°C
            </p>
            <p className="text-[9px] text-slate-500 uppercase font-bold">Weather Now</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] px-3 py-2 rounded-xl flex items-center gap-2">
          <span>⚠️</span> <span>{error}. Try a more specific city name.</span>
        </div>
      )}

      <div style={{ height: mapHeightPx }} className="rounded-3xl overflow-hidden border border-black/10 relative z-0 shadow-sm bg-slate-50">
        <MapContainer 
          key={`${destination}-${place?.lat || 'initial'}`} 
          center={place ? [place.lat, place.lon] : [20.59, 78.96]} 
          zoom={place ? 12 : 5} 
          className="h-full w-full"
          scrollWheelZoom={false}
        >
          <MapResizeFix />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          <FitRouteBounds 
            dest={place ? [place.lat, place.lon] : null} 
            source={source} 
            stops={stopPlaces} 
          />

          {linePositions && (
            <Polyline 
              positions={linePositions} 
              pathOptions={{ color: osrmRoute ? '#0891b2' : '#94a3b8', weight: 4, dashArray: osrmRoute ? null : '10, 10', opacity: 0.7 }} 
            />
          )}

          {place && <Marker position={[place.lat, place.lon]} icon={iconDest} />}
          {source && <Marker position={source} icon={iconStart} />}
          {stopPlaces.map((s, i) => (
            <Marker key={`stop-${i}`} position={[s.lat, s.lon]} icon={iconStop} />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}