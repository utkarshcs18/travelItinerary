import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import GlassCard from '../components/GlassCard';
import DestinationGallery from '../components/DestinationGallery';

void motion;

export default function Planner({ onGenerated, initialDestination }) {
  const [destination, setDestination] = useState(initialDestination || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelMode, setTravelMode] = useState('flight');
  const [budget, setBudget] = useState(20000);
  const [members, setMembers] = useState(2);
  const [preferencesText, setPreferencesText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const preferencePresets = [
    'Food',
    'Museums',
    'Street markets',
    'Nature',
    'Nightlife',
    'Photography',
    'Shopping',
    'Low walking',
    'No early mornings',
    'Budget-friendly',
  ];

  function addPreference(p) {
    const cleaned = preferencesText.trim().replace(/[,\\s]+$/, '');
    const next = cleaned ? `${cleaned}, ${p}` : p;
    setPreferencesText(next);
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);

    if (!destination || !startDate || !endDate) {
      setError('Please fill all required fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.generateItinerary({
        destination: destination.trim(),
        startDate,
        endDate,
        travelMode,
        budget: Number(budget) || 0,
        members: Number(members) || 1,
        preferencesText: preferencesText.trim(),
      });

      onGenerated?.({
        id: res.id,
        ...res.result,
        destination: destination.trim(),
        startDate,
        endDate,
        travelMode,
        budget: Number(budget) || 0,
        members: Number(members) || 1,
      });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Build your itinerary
        </motion.h1>

        <p className="mt-3 max-w-2xl text-sm text-slate-700 sm:text-base">
          Feed the model your constraints. We’ll generate a day-by-day plan,
          budget breakdown, and dashboard-friendly data.
        </p>

        <GlassCard variant="light">
          <form onSubmit={submit} className="mt-8 space-y-5 p-6 sm:p-8">

            {/* Destination + Travel Mode */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Destination
                </label>
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none focus:border-sky-400/70 focus:ring-4 focus:ring-sky-400/15"
                  placeholder="Tokyo, Japan"
                  required
                />
                <DestinationGallery destination={destination} />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Travel mode
                </label>
                <select
                  value={travelMode}
                  onChange={(e) => setTravelMode(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none focus:border-sky-400/70 focus:ring-4 focus:ring-sky-400/15"
                >
                  <option value="flight">Flight</option>
                  <option value="train">Train</option>
                  <option value="car">Car</option>
                  <option value="bus">Bus</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Start date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none focus:border-sky-400/70 focus:ring-4 focus:ring-sky-400/15"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  End date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none focus:border-sky-400/70 focus:ring-4 focus:ring-sky-400/15"
                  required
                />
              </div>
            </div>

            {/* Budget + Members */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Budget
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  min={0}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none focus:border-sky-400/70 focus:ring-4 focus:ring-sky-400/15"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Members
                </label>
                <input
                  type="number"
                  value={members}
                  onChange={(e) => setMembers(e.target.value)}
                  min={1}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none focus:border-sky-400/70 focus:ring-4 focus:ring-sky-400/15"
                />
              </div>
            </div>

            {/* Preferences */}
            <div>
              <label className="text-xs font-semibold text-slate-700">
                Preferences (optional)
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                {preferencePresets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => addPreference(p)}
                    className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                  >
                    + {p}
                  </button>
                ))}
              </div>

              <textarea
                value={preferencesText}
                onChange={(e) => setPreferencesText(e.target.value)}
                rows={4}
                placeholder="Foodie, museums, street markets..."
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm outline-none focus:border-sky-400/70 focus:ring-4 focus:ring-sky-400/15"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              disabled={loading}
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-300 to-sky-300 px-4 py-3 text-sm font-semibold shadow hover:from-cyan-200 hover:to-sky-200 disabled:opacity-60"
            >
              {loading ? 'Generating…' : 'Generate itinerary'}
            </button>

          </form>
        </GlassCard>
      </div>
    </div>
  );
}
