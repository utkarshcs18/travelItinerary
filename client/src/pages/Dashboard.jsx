import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { api } from '../lib/api';

void motion;

function fmtDate(v) {
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString();
  } catch {
    return '';
  }
}

function toIsoDateOnly(v) {
  if (v == null) return '';
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function hydrateItineraryFromDoc(item) {
  const dest = String(item?.destination ?? '').trim();
  const result = item?.result && typeof item.result === 'object' ? { ...item.result } : {};
  return {
    id: String(item._id ?? item.id ?? ''),
    ...result,
    destination: dest,
    startDate: toIsoDateOnly(item.startDate),
    endDate: toIsoDateOnly(item.endDate),
    travelMode: item.travelMode,
    budget: item.budget,
    members: item.members,
    preferencesText: item.preferencesText,
  };
}
export default function Dashboard({ user, onLogout, itinerary, setItinerary }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [openHistoryError, setOpenHistoryError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const res = await api.listItineraries();
        if (cancelled) return;
        setHistory(res.items || []);
      } catch (e) {
        if (cancelled) return;
        setHistoryError(e.message);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const pieData = useMemo(() => {
    const breakdown = itinerary?.budgetBreakdown || {};
    const entries = [
      ['Stay', breakdown.stay ?? 0],
      ['Food', breakdown.food ?? 0],
      ['Activities', breakdown.activities ?? 0],
      ['Transport', breakdown.transport ?? 0],
      ['Buffer', breakdown.buffer ?? 0],
    ];
    return entries.filter(([, v]) => Number(v) > 0).map(([name, value]) => ({ name, value }));
  }, [itinerary]);

  const dayCosts = useMemo(() => {
    const days = itinerary?.days || [];
    return days.map((d, idx) => ({
      day: `D${idx + 1}`,
      cost: Number(d.estimatedCost || 0),
    }));
  }, [itinerary]);

  const colors = ['#22d3ee', '#38bdf8', '#a78bfa', '#fb7185', '#fbbf24'];

  return (
    <div className="min-h-[calc(100vh-64px)] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Dashboard
          </motion.h1>

          <GlassCard variant="light" className="w-full max-w-md p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
                  Profile
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                  {user?.name || 'User'}
                </p>
                <p className="truncate text-xs text-slate-700">{user?.email || '—'}</p>
              </div>
              <button
                onClick={async () => {
                  await onLogout?.();
                  navigate('/auth');
                }}
                className="shrink-0 rounded-2xl border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
              >
                Logout
              </button>
            </div>
          </GlassCard>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-slate-700 sm:text-base">
          Budget charts for your current plan, plus history. Open any saved trip to view the full itinerary and map
          there.
        </p>

        <GlassCard variant="light" className="mt-6 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">History</h2>
              <p className="mt-1 text-sm text-slate-700">Your previously generated itineraries.</p>
            </div>
            <button
              onClick={() => navigate('/planner')}
              className="rounded-2xl bg-gradient-to-r from-cyan-300 to-sky-300 px-4 py-2 text-xs font-semibold text-slate-950 hover:from-cyan-200 hover:to-sky-200"
            >
              New plan
            </button>
          </div>

          {openHistoryError ? (
            <div className="mb-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm text-red-800">
              {openHistoryError}
            </div>
          ) : null}

          <div className="mt-4">
            {historyLoading ? (
              <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-slate-700">
                Loading…
              </div>
            ) : historyError ? (
              <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-800">
                {historyError}
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-slate-700">
                No saved plans yet. Generate one from the Planner.
              </div>
            ) : (
              <div className="divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/10 bg-white/70">
                {history.slice(0, 12).map((h) => (
                  <div key={h._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{h.destination}</p>
                      <p className="text-xs text-slate-700">
                        {fmtDate(h.startDate)}
                        {h.endDate ? ` → ${fmtDate(h.endDate)}` : ''}
                        {h.travelMode ? ` • ${h.travelMode}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        setOpenHistoryError(null);
                        try {
                          const res = await api.getItinerary(h._id);
                          const hydrated = hydrateItineraryFromDoc(res.item);
                          if (!hydrated.destination) {
                            throw new Error('Saved trip is missing a destination.');
                          }
                          setItinerary?.(hydrated);
                          navigate('/itinerary', { replace: false });
                        } catch (e) {
                          setOpenHistoryError(e.message || 'Could not open itinerary');
                        }
                      }}
                      className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <GlassCard variant="light" className="p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-900">Budget breakdown</h2>
            <div className="mt-4 h-64">
              {pieData.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-slate-600">
                  No budget breakdown yet. Generate an itinerary to populate charts.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={colors[i % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </GlassCard>

          <GlassCard variant="light" className="p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-900">Estimated cost per day</h2>
            <div className="mt-4 h-64">
              {dayCosts.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-slate-600">
                  No per-day costs yet. Generate an itinerary first.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayCosts}>
                    <XAxis dataKey="day" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="cost" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}