import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import EmptyCard from '../components/EmptyCard';
import api from '../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.get('/api/dashboard')
      .then((res) => setStats(res.data))
      .catch(() => setFailed(true));
  }, []);

  const cards = [
    { label: 'இன்று நோயாளிகள்', sub: "Today's Patients", value: stats?.today_patient_count, bg: 'bg-ink' },
    { label: 'நேரடி வருகை', sub: 'Walk-ins', value: stats?.walk_ins_today, bg: 'bg-sage' },
    { label: 'முடிந்த ஆலோசனைகள்', sub: 'Completed Visits', value: stats?.completed_visits_today, bg: 'bg-clay' },
    { label: 'நிலுவை கட்டணம்', sub: 'Pending Payments', value: stats ? `${stats.pending_payments_count} · ₹${stats.pending_payments_amount.toLocaleString('en-IN')}` : undefined, bg: 'bg-brass-deep' },
  ];

  return (
    <div>
      <Header title="முகப்பு" subtitle="Dashboard" />

      <div className="px-4 sm:px-8 py-3 sm:py-6">
        {failed && (
          <p className="text-clay text-xs mb-3">
            புள்ளிவிவரங்களை ஏற்ற முடியவில்லை. · Couldn't load stats.
          </p>
        )}

        {/* Readable-again sizes — the previous pass over-compacted this
            to fit one screen and made the numbers too small to read. */}
        <div className="bg-ink rounded-xl px-5 py-4 sm:px-6 sm:py-6 mb-3 max-w-3xl">
          <div className="text-brass text-xs uppercase tracking-wider font-semibold">இன்றைய சுருக்கம் · Today's Summary</div>
          <div className="font-display font-semibold text-3xl sm:text-5xl text-white mt-1.5 leading-none">
            {stats ? `₹${stats.today_revenue.toLocaleString('en-IN')}` : (failed ? '—' : '…')}
          </div>
          {stats && (
            <div className="text-brass/80 text-xs sm:text-sm mt-2">
              {stats.today_patient_count} நோயாளிகள் · {stats.pending_payments_count} பில் நிலுவையில்
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 max-w-3xl">
          {cards.map((c) => (
            <div key={c.sub} className={`${c.bg} rounded-xl px-3 py-3 sm:px-5 sm:py-5 flex flex-col justify-between min-h-[92px] sm:min-h-[120px]`}>
              <div className="text-white/60 text-[10px] sm:text-xs uppercase tracking-wide font-medium leading-tight">{c.label}</div>
              <div className="font-display font-semibold text-white text-xl sm:text-3xl leading-tight my-1">
                {c.value ?? (failed ? '—' : '…')}
              </div>
              <div className="text-brass text-[10px] sm:text-[11px] font-medium leading-tight">{c.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
          <div>
            <h2 className="font-display text-sm sm:text-lg text-ink mb-2 sm:mb-3">சமீபத்திய நோயாளிகள் · Recent Patients</h2>
            <div className="space-y-1.5 sm:space-y-2">
              {(stats?.recent_patients || []).slice(0, 5).map((p) => (
                <Link key={p.id} to={`/patients/${p.id}`} className="chit flex justify-between px-4 py-2 sm:px-5 sm:py-3">
                  <span className="text-ink text-sm sm:text-base">{p.name}</span>
                  <span className="text-xs text-ink-soft">{p.phone || '—'}</span>
                </Link>
              ))}
              {stats && stats.recent_patients.length === 0 && (
                <EmptyCard label="இன்னும் நோயாளிகள் இல்லை · No patients yet" />
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display text-sm sm:text-lg text-ink mb-2 sm:mb-3">வரும் பின்தொடர்தல் · Upcoming Follow-ups</h2>
            <div className="space-y-1.5 sm:space-y-2">
              {(stats?.upcoming_follow_ups || []).slice(0, 5).map((f) => (
                <div key={f.id} className="chit flex justify-between px-4 py-2 sm:px-5 sm:py-3">
                  <span className="text-ink text-sm sm:text-base">{f.patients?.name}</span>
                  <span className="text-xs text-brass-deep">{new Date(f.follow_up_date).toLocaleDateString()}</span>
                </div>
              ))}
              {stats && stats.upcoming_follow_ups.length === 0 && (
                <EmptyCard label="அடுத்த 7 நாட்களில் பின்தொடர்தல் இல்லை" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
