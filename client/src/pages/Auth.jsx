import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api, setAccessToken } from '../lib/api';
import GlassCard from '../components/GlassCard';

void motion;

export default function Auth({ onAuthed }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = { email, password, ...(mode === 'signup' ? { name } : {}) };
      const res = mode === 'signup' ? await api.signup(payload) : await api.login(payload);
      localStorage.setItem('token', res.accessToken);
      setAccessToken(res.accessToken);
      onAuthed?.(res.user);
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] text-slate-900">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-14 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/90">
            Secure access
          </p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {mode === 'login' ? 'Log in to your workspace.' : 'Create your TourAI account.'}
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-sm text-slate-700 sm:text-base">
            Your itinerary engine runs on Gemini + smart budgeting. Login to generate plans, view
            dashboards, and iterate faster.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-700">
            <span className="rounded-full border border-black/10 bg-white/80 px-3 py-1.5">
              JWT + Refresh cookies
            </span>
            <span className="rounded-full border border-black/10 bg-white/80 px-3 py-1.5">
              Rate-limited auth
            </span>
            <span className="rounded-full border border-black/10 bg-white/80 px-3 py-1.5">
              Audit-friendly logs
            </span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard variant="light" className="p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/90">
                  TourAI
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {mode === 'login' ? 'Welcome back' : 'Start in seconds'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMode((m) => (m === 'login' ? 'signup' : 'login'))}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
              >
                {mode === 'login' ? 'Switch to signup' : 'Login'}
              </button>
            </div>

            <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-semibold text-slate-700">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-sky-400/70 focus:ring-4 focus:ring-sky-400/15"
                  placeholder="Utkarsh"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-sky-400/70 focus:ring-4 focus:ring-sky-400/15"
                placeholder="you@example.com"
                type="email"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-sky-400/70 focus:ring-4 focus:ring-sky-400/15"
                placeholder="••••••••"
                type="password"
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-800">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_60px_-28px_rgba(34,211,238,0.9)] transition hover:bg-cyan-300 disabled:opacity-60"
            >
              <span className="absolute inset-0 opacity-0 transition group-hover:opacity-100 [background:radial-gradient(600px_circle_at_30%_0%,rgba(255,255,255,0.35),transparent_40%)]" />
              <span className="relative">
                {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
              </span>
            </button>
          </form>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}