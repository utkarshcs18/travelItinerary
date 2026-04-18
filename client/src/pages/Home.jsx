import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import GlassCard from '../components/GlassCard';

// ESLint (flat config) can miss JSX member-expression usage like <motion.div>.
void motion;

function weatherLabel(code) {
  if (code == null) return 'Unknown';
  if (code === 0) return 'Clear';
  if ([1, 2, 3].includes(code)) return 'Partly cloudy';
  if ([45, 48].includes(code)) return 'Fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain';
  if ([71, 73, 75, 77].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Showers';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Weather';
}

export default function Home({ user, onPickDestination, onCustomTrip }) {
  const supportsGeo = Boolean(typeof navigator !== 'undefined' && navigator.geolocation);
  
  const [geo, setGeo] = useState(() =>
    supportsGeo
      ? { lat: null, lon: null, status: 'loading', error: null }
      : { lat: null, lon: null, status: 'error', error: 'Geolocation not supported' }
  );

  const [weather, setWeather] = useState(null);
  const [recs, setRecs] = useState([]);
  const [place, setPlace] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(true);

  // 1. Get Location
  useEffect(() => {
    if (!supportsGeo) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lon: pos.coords.longitude, status: 'ready', error: null });
      },
      (err) => {
        console.error("Geo Error:", err);
        setGeo({
          lat: 28.6139, 
          lon: 77.2090,
          status: 'ready', 
          error: 'Location denied. Using default location.',
        });
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, [supportsGeo]);

  // 2. Fetch Data
  useEffect(() => {
    if (geo.status !== 'ready') return;

    let isMounted = true;
    (async () => {
      setLoadingRecs(true);
      try {
        const weatherPromise = api.weather({ lat: geo.lat, lon: geo.lon }).catch(() => ({ current: null }));
        const recsPromise = api.recommendations({ lat: geo.lat, lon: geo.lon }).catch(() => ({ recommendations: [] }));
        const geoPromise = api.reverseGeocode({ lat: geo.lat, lon: geo.lon }).catch(() => ({ place: null }));

        const [wData, rData, gData] = await Promise.all([weatherPromise, recsPromise, geoPromise]);

        if (isMounted) {
          setWeather(wData.current);
          setRecs(rData.recommendations || []);
          setPlace(gData.place);
        }
      } catch (err) {
        console.error("Global Home Error:", err);
      } finally {
        if (isMounted) setLoadingRecs(false);
      }
    })();

    return () => { isMounted = false; };
  }, [geo.lat, geo.lon, geo.status]);

  const headline = useMemo(() => {
    const n = user?.name || user?.email?.split('@')?.[0] || 'traveler';
    return `Hey ${n}, let’s plan something smart.`;
  }, [user]);

  return (
    <div className="min-h-[calc(100vh-72px)] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-10">
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-600">
            AI travel recommendations
          </p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {headline}
          </h1>
        </motion.div>

        {/* Stats Cards Section - Now using 'weather', 'place', and 'weatherLabel' */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <GlassCard variant="light" interactive className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-700">Profile</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold">
                {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-950 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-600 truncate">{user?.email}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="light" interactive className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-700">Current Location</p>
            <p className="mt-4 text-sm font-medium text-slate-900">
              {place ? `${place.city || place.name || 'Unknown City'}, ${place.state || ''}` : 'Detecting location...'}
            </p>
            {geo.error && <p className="text-[10px] text-amber-600 mt-1">{geo.error}</p>}
          </GlassCard>

          <GlassCard variant="light" interactive className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-700">Local Weather</p>
            <div className="mt-4 flex items-baseline gap-2">
              <p className="text-2xl font-bold text-slate-950">
                {weather ? `${Math.round(weather.temperature_2m)}°C` : '--'}
              </p>
              <p className="text-xs font-medium text-slate-600">
                {weather ? weatherLabel(weather.weather_code) : 'Loading...'}
              </p>
            </div>
          </GlassCard>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">Recommended destinations</p>
          <button onClick={onCustomTrip} className="rounded-2xl bg-gradient-to-r from-cyan-300 to-sky-300 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg hover:shadow-cyan-400/20 transition-all">
            Generate my own trip
          </button>
        </div>

        {loadingRecs ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent mb-4"></div>
            <p className="text-slate-500 font-medium animate-pulse">Finding local adventures...</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recs.length > 0 ? (
              recs.map((r, idx) => (
                <motion.button
                  key={r.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => onPickDestination?.(r.destination)}
                  className="group text-left"
                >
                  <div className="overflow-hidden rounded-3xl border border-black/10 bg-white/80 shadow-md transition-all hover:shadow-xl hover:-translate-y-1">
                    <div className="relative h-44 bg-slate-200">
                      <img
                        src={r.imageUrl}
                        alt={r.destination}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500"; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <p className="text-sm font-bold">{r.destination}</p>
                        <p className="text-[10px] opacity-90">{r.title}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-slate-700 line-clamp-2">{r.reason}</p>
                    </div>
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-slate-500 italic">No recommendations found. Start a custom trip above!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}