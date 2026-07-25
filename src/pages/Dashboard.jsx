import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
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

      <div className="px-3 sm:px-8 py-2 sm:py-6">
        {failed && (
          <p className="text-clay text-[11px] mb-2">
            புள்ளிவிவரங்களை ஏற்ற முடியவில்லை. · Couldn't load stats.
          </p>
        )}

        {/* Hero summary — label/number/caption now use three distinct
            tones (gold label, bold white number, soft gold caption)
            instead of everything being the same weight/color. */}
        <div className="bg-ink rounded-xl px-4 py-3 sm:px-6 sm:py-6 mb-2 sm:mb-3 max-w-3xl">
          <div className="text-brass text-[10px] sm:text-xs uppercase tracking-wider font-semibold">இன்றைய சுருக்கம் · Today's Summary</div>
          <div className="font-display font-semibold text-2xl sm:text-5xl text-white mt-1 sm:mt-2 leading-none">
            {stats ? `₹${stats.today_revenue.toLocaleString('en-IN')}` : (failed ? '—' : '…')}
          </div>
          {stats && (
            <div className="text-brass/80 text-[10px] sm:text-sm mt-1.5 sm:mt-2">
              {stats.today_patient_count} நோயாளிகள் · {stats.pending_payments_count} பில் நிலுவையில்
            </div>
          )}
        </div>

        {/* Each card: box padding and font size now scale together —
            the number is the dominant, bold element; label/caption are
            two different lighter tones around it, same proportions the
            reference design uses. */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4 mb-2 sm:mb-6 max-w-3xl">
          {cards.map((c) => (
            <div key={c.sub} className={`${c.bg} rounded-xl px-2.5 py-2.5 sm:px-5 sm:py-5 flex flex-col justify-between min-h-[76px] sm:min-h-[120px]`}>
              <div className="text-white/60 text-[8.5px] sm:text-xs uppercase tracking-wide font-medium leading-tight">{c.label}</div>
              <div className="font-display font-semibold text-white text-lg sm:text-3xl leading-tight my-0.5 sm:my-1">
                {c.value ?? (failed ? '—' : '…')}
              </div>
              <div className="text-brass text-[8px] sm:text-[11px] font-medium leading-tight">{c.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-8 mt-2 sm:mt-6">
          <div>
            <h2 className="font-display text-[11px] sm:text-lg text-ink mb-1 sm:mb-3 leading-tight">சமீபத்திய நோயாளிகள்<br className="sm:hidden" /> · Recent Patients</h2>
            <div className="space-y-1 sm:space-y-2">
              {(stats?.recent_patients || []).slice(0, 3).map((p) => (
                <Link key={p.id} to={`/patients/${p.id}`} className="chit flex justify-between px-2 py-1.5 sm:px-5 sm:py-3">
                  <span className="text-ink text-[11px] sm:text-base truncate">{p.name}</span>
                </Link>
              ))}
              {stats && stats.recent_patients.length === 0 && (
                <p className="text-[11px] sm:text-sm text-ink-soft">இல்லை.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display text-[11px] sm:text-lg text-ink mb-1 sm:mb-3 leading-tight">பின்தொடர்தல்<br className="sm:hidden" /> · Follow-ups</h2>
            <div className="space-y-1 sm:space-y-2">
              {(stats?.upcoming_follow_ups || []).slice(0, 3).map((f) => (
                <div key={f.id} className="chit flex justify-between px-2 py-1.5 sm:px-5 sm:py-3">
                  <span className="text-ink text-[11px] sm:text-base truncate">{f.patients?.name}</span>
                </div>
              ))}
              {stats && stats.upcoming_follow_ups.length === 0 && (
                <p className="text-[11px] sm:text-sm text-ink-soft">இல்லை.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
