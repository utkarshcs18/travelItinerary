import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import { api } from '../lib/api';

void motion;

export default function Profile({ user, onUserUpdated }) {
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fallbackAvatar = useMemo(() => {
    const seed = user?.email || 'tourai';
    return `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(seed)}`;
  }, [user]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await api.updateMe({ name, avatarUrl: avatarUrl || undefined });
      onUserUpdated?.(res.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-72px)] text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          Profile
        </motion.h1>
        <p className="mt-3 text-sm text-slate-700 sm:text-base">
          Add a name and avatar. This will show on your home dashboard.
        </p>

        <GlassCard variant="light" className="mt-8 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <img
              src={avatarUrl || fallbackAvatar}
              alt=""
              className="h-16 w-16 rounded-3xl border border-black/10 bg-white"
            />
            <div>
              <p className="text-sm font-semibold text-slate-950">{user?.email}</p>
              <p className="text-xs text-slate-600">Update your public profile fields.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">Display name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-sky-400/70 focus:ring-4 focus:ring-sky-400/15"
                placeholder="Utkarsh"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Avatar image URL</label>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-sky-400/70 focus:ring-4 focus:ring-sky-400/15"
                placeholder="https://images.unsplash.com/..."
              />
              <p className="mt-2 text-xs text-slate-600">
                Tip: you can paste any public image URL. Upload support can be added next.
              </p>
            </div>
          </div>

          {error && (
            <p className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-2xl bg-gradient-to-r from-cyan-300 to-sky-300 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_70px_-40px_rgba(34,211,238,0.9)] hover:from-cyan-200 hover:to-sky-200 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}