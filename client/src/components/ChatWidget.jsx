import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from './GlassCard';
import { api } from '../lib/api';

void motion;

export default function ChatWidget({ enabled }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const starter = useMemo(
    () => [{ role: 'assistant', content: 'Hey! I’m TourAI. Want chitchat, travel ideas, or help using the app?' }],
    []
  );
  const [messages, setMessages] = useState(starter);
  const listRef = useRef(null);

  const canUse = useMemo(() => enabled !== false, [enabled]);

  function clearChat() {
    setMessages(starter);
    setInput('');
  }

  async function sendText(text) {
    const trimmed = String(text || '').trim();
    if (!trimmed || loading) return;
    setInput('');
    const next = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await api.chat({ messages: next.slice(-12) });
      setMessages((m) => [...m, { role: 'assistant', content: res.reply }]);
      setTimeout(() => listRef.current?.scrollTo?.({ top: 999999, behavior: 'smooth' }), 50);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    return sendText(input);
  }

  if (!canUse) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="mb-3 w-[340px] sm:w-[380px]"
          >
            <GlassCard variant="light" className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-black/10 bg-white/70 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">TourAI Chat</p>
                  <p className="text-xs text-slate-600">Powered by Gemini</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearChat}
                    className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div ref={listRef} className="max-h-[340px] overflow-auto px-4 py-3">
                <div className="mb-3 flex flex-wrap gap-2">
                  {[
                    { label: 'Chitchat', text: 'Let’s just chitchat for a bit.' },
                    { label: 'Trip ideas', text: 'Suggest 5 destinations for a 3-day trip from my city.' },
                    { label: 'Planner help', text: 'How do I generate an itinerary in this app?' },
                    { label: 'Fix an error', text: 'I’m getting an error in the app. Ask me what you need and help me fix it.' },
                  ].map((x) => (
                    <button
                      key={x.label}
                      disabled={loading}
                      onClick={() => sendText(x.text)}
                      className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {messages.map((m, idx) => (
                    <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                      <div
                        className={[
                          'inline-block max-w-[90%] rounded-2xl px-3 py-2 text-sm',
                          m.role === 'user'
                            ? 'bg-sky-500 text-white'
                            : 'border border-black/10 bg-white text-slate-900',
                        ].join(' ')}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="text-left">
                      <div className="inline-block rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-600">
                        Thinking…
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-black/10 bg-white/70 p-3">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => (e.key === 'Enter' ? send() : null)}
                    placeholder="Chitchat, travel ideas, or app help…"
                    className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400/70 focus:ring-4 focus:ring-sky-400/15"
                  />
                  <button
                    onClick={send}
                    className="rounded-2xl bg-gradient-to-r from-cyan-300 to-sky-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:from-cyan-200 hover:to-sky-200"
                  >
                    Send
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-2xl bg-gradient-to-r from-cyan-300 to-sky-300 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_70px_-40px_rgba(34,211,238,0.9)] hover:from-cyan-200 hover:to-sky-200"
      >
        {open ? 'Chat' : 'Chat'}
      </button>
    </div>
  );
}