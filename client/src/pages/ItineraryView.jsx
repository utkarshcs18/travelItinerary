import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import DestinationMap from '../components/DestinationMap';
import DestinationGallery from '../components/DestinationGallery';
import TransportSuggestions from '../components/TransportSuggestions';
import { api } from '../lib/api';

void motion;

function extraCarryItems(packingList, weatherTempC) {
  const items = new Set((packingList || []).map((x) => String(x).trim()).filter(Boolean));
  if (Number.isFinite(weatherTempC)) {
    if (weatherTempC <= 10) {
      ['Light jacket', 'Warm layer', 'Moisturizer/lip balm'].forEach((x) => items.add(x));
    } else if (weatherTempC >= 28) {
      ['Sunscreen', 'Cap/hat', 'Reusable water bottle'].forEach((x) => items.add(x));
    }
  }
  items.add('Power bank');
  items.add('Basic first-aid');
  return Array.from(items);
}

function extractStopsFromItinerary(itinerary, max = 10) {
  const raw = [];
  for (const d of itinerary?.days || []) {
    raw.push(d?.morning, d?.afternoon, d?.evening);
  }
  const parts = raw
    .flatMap((s) =>
      String(s || '')
        .split(/[•|,;]/g)
        .map((x) => x.trim())
    )
    .filter(Boolean)
    .filter((x) => x.length >= 4 && x.length <= 48)
    .filter((x) => !/^(arrive|check[-\s]?in|breakfast|lunch|dinner|hotel|rest|free time|shopping)$/i.test(x));

  const seen = new Set();
  const out = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
    if (out.length >= max) break;
  }
  return out;
}

export default function ItineraryView({ itinerary, onOpenDashboard }) {
  const [destWeather, setDestWeather] = useState(null);
  const destination = useMemo(() => {
    if (!itinerary) return 'Destination';
    return itinerary.destination || itinerary.trip?.destination || itinerary.location || 'Destination';
  }, [itinerary]);

  const heroImageUrl = useMemo(() => {
    if (!destination) return '';
    return api.image({ query: `${destination} landmark travel`, w: 1600, h: 900, sig: 11 });
  }, [destination]);

  const suggestedStops = useMemo(() => extractStopsFromItinerary(itinerary, 10), [itinerary]);

  const startDateStr = useMemo(() => {
    const raw = itinerary?.startDate;
    if (!raw) return '';
    if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    try {
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    } catch {
      /* ignore */
    }
    return '';
  }, [itinerary]);

  if (!itinerary) {
    return (
      <div className="min-h-screen text-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-slate-400">No itinerary yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] text-slate-900">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center opacity-25 blur-[2px]"
        style={{ backgroundImage: `url(${heroImageUrl})` }}
      />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Your itinerary
          </motion.h1>
          <button
            onClick={onOpenDashboard}
            className="rounded-2xl border border-black/10 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-white"
          >
            Open dashboard
          </button>
        </div>

        <p className="mt-3 max-w-3xl text-sm text-slate-700 sm:text-base">
          {itinerary.summary ?? 'Your trip plan is ready below.'}
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-black/10 bg-white/80 shadow-[0_22px_80px_-46px_rgba(2,6,23,0.16)] backdrop-blur-xl">
              <div className="relative h-56">
                <img
                  src={heroImageUrl}
                  alt=""
                  className="h-full w-full object-cover opacity-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-700">
                    Destination
                  </p>
                  <p className="mt-1 text-xl font-semibold text-slate-950">{destination}</p>
                </div>
              </div>
            </div>

            <GlassCard variant="light" interactive className="p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-700">
                More destination images
              </p>
              <DestinationGallery destination={destination} />
            </GlassCard>

            <GlassCard variant="light" interactive className="p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-700">
                Things to carry
              </p>
              <p className="mt-2 text-sm text-slate-700">
                AI packing list + a few smart extras (based on destination weather).
              </p>
              <ul className="mt-4 grid list-disc grid-cols-1 gap-y-1 pl-5 text-sm text-slate-900 sm:grid-cols-2">
                {extraCarryItems(itinerary.packingList, Number(destWeather?.temperature_2m)).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </GlassCard>
          </div>

          <GlassCard variant="light" className="p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-700">
              Route preview &amp; transport ideas
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Map from your location to this trip’s destination, with suggested stops integrating soon from your plan. 
              and richer transit needs{' '}
              <span className="font-mono text-xs">(Using VITE GOOGLE MAPS)</span> with Directions enabled.
            </p>
            <div className="mt-6 flex min-w-0 flex-col gap-8">
              <div className="w-full min-w-0">
                <DestinationMap
                  destination={destination}
                  onWeather={setDestWeather}
                  routeMode="driving"
                  suggestedStops={suggestedStops}
                  mapHeightPx={440}
                />
              </div>
              <div className="w-full min-w-0 border-t border-black/10 pt-8">
                <TransportSuggestions destination={destination} startDate={startDateStr} />
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="mt-8 space-y-4">
          {(itinerary.days || []).map((d, idx) => (
            <motion.div
              key={`${d.date}-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="rounded-3xl border border-black/10 bg-white/80 p-5 shadow-[0_18px_70px_-46px_rgba(2,6,23,0.16)] backdrop-blur-xl sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-950">
                  Day {idx + 1} • {d.date}
                </h2>
                <span className="text-xs font-medium text-slate-600">
                  Estimated: {Number(d.estimatedCost || 0).toLocaleString()}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <GlassCard variant="light" className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-600">
                    Morning
                  </p>
                  <p className="mt-2 text-sm text-slate-900">{d.morning}</p>
                </GlassCard>
                <GlassCard variant="light" className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-600">
                    Afternoon
                  </p>
                  <p className="mt-2 text-sm text-slate-900">{d.afternoon}</p>
                </GlassCard>
                <GlassCard variant="light" className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-600">
                    Evening
                  </p>
                  <p className="mt-2 text-sm text-slate-900">{d.evening}</p>
                </GlassCard>
              </div>

              {(d.food?.length || 0) > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-600">
                    Food
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {d.food.map((f, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs text-slate-800"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(d.notes?.length || 0) > 0 && (
                <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {d.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <GlassCard variant="light" className="p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-900">Packing list</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {(itinerary.packingList || []).map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </GlassCard>
          <GlassCard variant="light" className="p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-900">Local tips</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {(itinerary.localTips || []).map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}