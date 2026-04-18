import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

void motion;

export default function DestinationGallery({ destination }) {
  const query = (destination || '').trim();
  const imgs = useMemo(() => {
    if (!query) return [];
    return [
      api.image({ query: `${query} skyline travel`, w: 900, h: 650, sig: 1 }),
      api.image({ query: `${query} landmark city`, w: 900, h: 650, sig: 2 }),
      api.image({ query: `${query} street food culture`, w: 900, h: 650, sig: 3 }),
    ];
  }, [query]);

  if (!query) return null;

  return (
    <div className="mt-5">
      <p className="text-xs font-semibold text-slate-700">Destination preview</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {imgs.map((src, i) => (
          <motion.div
            key={src}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white/80 shadow-[0_18px_70px_-46px_rgba(2,6,23,0.16)]"
          >
            <img
              src={src}
              alt=""
              loading="lazy"
              className="h-40 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}