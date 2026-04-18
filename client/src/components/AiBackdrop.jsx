import { motion } from 'framer-motion';

void motion;

export default function AiBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-slate-50" />
      <div className="absolute inset-0 opacity-90 [background:radial-gradient(1200px_circle_at_20%_10%,rgba(34,211,238,0.22),transparent_55%),radial-gradient(900px_circle_at_85%_25%,rgba(56,189,248,0.18),transparent_52%),radial-gradient(1000px_circle_at_50%_95%,rgba(14,165,233,0.12),transparent_58%)]" />

      <motion.div
        aria-hidden="true"
        className="absolute left-1/2 top-[-20%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-500/18 blur-3xl"
        animate={{ y: [0, 30, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute right-[-10%] top-[10%] h-[620px] w-[620px] rounded-full bg-sky-500/16 blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute bottom-[-18%] left-[-10%] h-[560px] w-[560px] rounded-full bg-cyan-500/12 blur-3xl"
        animate={{ x: [0, 35, 0], y: [0, -25, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="absolute inset-0 opacity-[0.10] [background-image:radial-gradient(circle_at_1px_1px,rgba(2,6,23,0.55)_1px,transparent_0)] [background-size:26px_26px]" />
    </div>
  );
}