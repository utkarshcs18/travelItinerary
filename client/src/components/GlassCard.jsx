export default function GlassCard({ className = '', variant = 'dark', interactive = false, children }) {
  const base =
    'rounded-3xl border shadow-[0_20px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl transition';

  const variants = {
    dark: 'border-white/10 bg-white/[0.06]',
    light:
      'border-black/10 bg-white/80 text-slate-950 shadow-[0_22px_80px_-46px_rgba(2,6,23,0.35)]',
  };

  const fx = interactive
    ? 'hover:-translate-y-0.5 hover:shadow-[0_28px_100px_-56px_rgba(34,211,238,0.55)]'
    : '';

  return (
    <div
      className={[
        base,
        variants[variant] || variants.dark,
        fx,
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}