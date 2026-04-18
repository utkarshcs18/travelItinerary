import { useMemo, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Planner from './pages/Planner';
import ItineraryView from './pages/ItineraryView';
import Dashboard from './pages/Dashboard';
import { AnimatePresence, motion } from 'framer-motion';
import AiBackdrop from './components/AiBackdrop';
import GlassCard from './components/GlassCard';
import { api } from './lib/api';
import ChatWidget from './components/ChatWidget';

void motion;

function Shell({ authed, onLogout, children }) {
  return (
    <div className="min-h-screen text-slate-900">
      <AiBackdrop />
      <header className="sticky top-0 z-20 border-b border-black/10 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-2xl border border-black/10 bg-white">
                <span className="h-4 w-4 rounded-full bg-gradient-to-br from-cyan-300 to-sky-300" />
              </span>
              <span className="text-sm font-semibold tracking-wide text-slate-900">TourAI</span>
            </Link>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            {authed && (
              <>
                <Link
                  className="rounded-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-black/5 hover:text-slate-900"
                  to="/home"
                >
                  Home
                </Link>
                <Link
                  className="rounded-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-black/5 hover:text-slate-900"
                  to="/planner"
                >
                  Planner
                </Link>
                <Link
                  className="rounded-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-black/5 hover:text-slate-900"
                  to="/itinerary"
                >
                  Itinerary
                </Link>
                <Link
                  className="rounded-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-black/5 hover:text-slate-900"
                  to="/dashboard"
                >
                  Dashboard
                </Link>
              </>
            )}
            {authed ? (
              <button
                onClick={onLogout}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
              >
                Logout
              </button>
            ) : null}
          </nav>
        </div>
      </header>
      <div className="px-0">{children}</div>
      {authed && <ChatWidget />}
    </div>
  );
}

function Landing() {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl grid-cols-1 items-center gap-10 px-4 py-14 lg:grid-cols-2">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-left"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/90">
          AI itinerary lab
        </p>
        <h1 className="mt-5 text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
          Plan trips like an ML system: constraints in, schedule out.
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-sm text-slate-700 sm:text-base">
          TourAI turns destination + dates + budget into a structured itinerary, then visualizes the
          plan with dashboards you can iterate on.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/auth"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-300 to-sky-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_20px_80px_-44px_rgba(34,211,238,0.95)]"
          >
            <span className="absolute inset-0 opacity-0 transition group-hover:opacity-100 [background:radial-gradient(700px_circle_at_30%_0%,rgba(255,255,255,0.45),transparent_45%)]" />
            <span className="relative">Get started</span>
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ['Gemini LLM', 'Structured JSON output'],
            ['Budget-aware', 'Charts-ready breakdown'],
            ['Secure', 'JWT + rate limiting'],
          ].map(([k, v]) => (
            <div
              key={k}
              className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3"
            >
              <p className="text-xs font-semibold text-slate-900">{k}</p>
              <p className="mt-1 text-xs text-slate-700">{v}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard variant="light" className="p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-700">
            Output preview
          </p>
          <div className="mt-4 space-y-3">
            {[
              { t: 'Day 1', d: 'Arrive • neighborhood walk • local ramen spot' },
              { t: 'Day 2', d: 'Museum • street market • sunset viewpoint' },
              { t: 'Day 3', d: 'Day trip • nightlife • budget buffer' },
            ].map((x, i) => (
              <div
                key={i}
                className="rounded-2xl border border-black/10 bg-white/80 p-4"
              >
                <p className="text-xs font-semibold text-slate-900">{x.t}</p>
                <p className="mt-1 text-sm text-slate-700">{x.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-black/10 bg-white/80 px-4 py-3">
            <p className="text-xs text-slate-700">Budget breakdown ready</p>
            <span className="text-xs font-semibold text-sky-700">Charts</span>
          </div>
        </GlassCard>
      </motion.section>
    </main>
  );
}

function PlannerRoute({ onGenerated }) {
  const location = useLocation();
  const destination = location.state?.destination || null;
  return <Planner initialDestination={destination} onGenerated={onGenerated} />;
}

function AuthedRoutes({ authed, user, setUser, itinerary, setItinerary, onLogout }) {
  const navigate = useNavigate();
  if (!authed) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-slate-300">
        Please log in first. <Link className="text-cyan-300" to="/auth">Go to auth</Link>
      </main>
    );
  }

  return (
    <Routes>
      <Route
        path="/home"
        element={
          <Home
            user={user}
            onPickDestination={(d) => {
              navigate('/planner', { state: { destination: d } });
            }}
            onCustomTrip={() => navigate('/planner')}
          />
        }
      />
      <Route
        path="/planner"
        element={
          <PlannerRoute
            onGenerated={(res) => {
              setItinerary(res);
              navigate('/itinerary');
            }}
          />
        }
      />
      <Route
        path="/itinerary"
        element={
          <ItineraryView itinerary={itinerary} onOpenDashboard={() => navigate('/dashboard')} />
        }
      />
      <Route path="/profile" element={<Profile user={user} onUserUpdated={setUser} />} />
      <Route
        path="/dashboard"
        element={<Dashboard user={user} onLogout={onLogout} itinerary={itinerary} setItinerary={setItinerary} />}
      />

      <Route path="*" element={<Landing />} />
    </Routes>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [itinerary, setItinerary] = useState(null);

  const authed = useMemo(() => Boolean(user), [user]);
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setUser(null);
    setItinerary(null);
  };

  return (
    <BrowserRouter>
      <Shell
        authed={authed}
        onLogout={handleLogout}
      >
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/auth"
              element={
                <Auth
                  onAuthed={async (u) => {
                    setUser(u);
                    try {
                      const me = await api.me();
                      setUser(me.user);
                    } catch {
                      // ignore
                    }
                  }}
                />
              }
            />
            <Route
              path="/*"
              element={
                <AuthedRoutes
                  authed={authed}
                  user={user}
                  setUser={setUser}
                  itinerary={itinerary}
                  setItinerary={setItinerary}
                  onLogout={handleLogout}
                />
              }
            />
          </Routes>
        </AnimatePresence>
      </Shell>
    </BrowserRouter>
  );
}