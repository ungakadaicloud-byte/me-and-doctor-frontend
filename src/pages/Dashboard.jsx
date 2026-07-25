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
    { label: 'இன்று நோயாளிகள்', sub: "Today's Patients", value: stats?.today_patient_count, bg: 'bg-ink', text: 'text-cream', sub_text: 'text-cream/70' },
    { label: 'வாக்-இன்', sub: 'Walk-ins', value: stats?.walk_ins_today, bg: 'bg-sage', text: 'text-cream', sub_text: 'text-cream/70' },
    { label: 'முடிந்த ஆலோசனைகள்', sub: 'Completed Visits', value: stats?.completed_visits_today, bg: 'bg-clay', text: 'text-cream', sub_text: 'text-cream/70' },
    { label: 'நிலுவை கட்டணம்', sub: 'Pending Payments', value: stats ? `${stats.pending_payments_count} · ₹${stats.pending_payments_amount.toLocaleString('en-IN')}` : undefined, bg: 'bg-brass-deep', text: 'text-cream', sub_text: 'text-cream/70' },
  ];

  return (
    <div>
      <Header title="டாஷ்போர்டு" subtitle="Doctor Dashboard" />

      <div className="px-4 sm:px-8 py-4 sm:py-6">
        {failed && (
          <p className="text-clay text-xs mb-3">
            புள்ளிவிவரங்களை ஏற்ற முடியவில்லை. · Couldn't load stats — pull to refresh or reopen this page.
          </p>
        )}

        <div className="bg-ink rounded-lg px-5 py-5 mb-3 max-w-3xl">
          <div className="text-brass text-[10px] sm:text-xs uppercase tracking-wide font-medium">இன்றைய சுருக்கம் · Today's Summary</div>
          <div className="token-number text-2xl sm:text-4xl text-cream mt-1">
            {stats ? `₹${stats.today_revenue.toLocaleString('en-IN')}` : (failed ? '—' : '…')}
          </div>
          <div className="text-cream/70 text-xs sm:text-sm mt-1">
            {stats
              ? `${stats.today_patient_count} நோயாளிகள் · ${stats.pending_payments_count} பில் நிலுவையில்`
              : 'Today\'s Revenue'}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 max-w-3xl">
          {cards.map((c) => (
            <div key={c.sub} className={`${c.bg} rounded-lg px-3 py-3 sm:px-5 sm:py-5`}>
              <div className={`text-[10px] sm:text-xs ${c.sub_text} uppercase tracking-wide leading-tight`}>{c.label}</div>
              <div className={`token-number text-lg sm:text-3xl ${c.text} mt-1`}>{c.value ?? (failed ? '—' : '…')}</div>
              <div className={`text-[9px] sm:text-[11px] ${c.sub_text} mt-1`}>{c.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mt-4 sm:mt-6">
          <div>
            <h2 className="font-display text-base sm:text-lg text-ink mb-2 sm:mb-3">சமீபத்திய நோயாளிகள் · Recent Patients</h2>
            <div className="space-y-2">
              {(stats?.recent_patients || []).map((p) => (
                <Link key={p.id} to={`/patients/${p.id}`} className="chit flex justify-between px-4 py-2.5 sm:px-5 sm:py-3">
                  <span className="text-ink text-sm sm:text-base">{p.name}</span>
                  <span className="text-xs text-ink-soft">{p.phone || '—'}</span>
                </Link>
              ))}
              {stats && stats.recent_patients.length === 0 && (
                <p className="text-sm text-ink-soft">இன்னும் நோயாளிகள் இல்லை.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display text-base sm:text-lg text-ink mb-2 sm:mb-3">வரும் பின்தொடர்தல் · Upcoming Follow-ups</h2>
            <div className="space-y-2">
              {(stats?.upcoming_follow_ups || []).map((f) => (
                <div key={f.id} className="chit flex justify-between px-4 py-2.5 sm:px-5 sm:py-3">
                  <span className="text-ink text-sm sm:text-base">{f.patients?.name}</span>
                  <span className="text-xs text-brass-deep">{new Date(f.follow_up_date).toLocaleDateString()}</span>
                </div>
              ))}
              {stats && stats.upcoming_follow_ups.length === 0 && (
                <p className="text-sm text-ink-soft">அடுத்த 7 நாட்களில் பின்தொடர்தல் இல்லை.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6 mt-6 sm:mt-10">
          <Link to="/queue" className="text-sm text-brass-deep hover:text-ink underline underline-offset-2">
            இன்றைய வரிசைக்குச் செல் · Go to Today's Queue →
          </Link>
          <Link to="/reports" className="text-sm text-brass-deep hover:text-ink underline underline-offset-2">
            அறிக்கைகள் · View Reports →
          </Link>
        </div>
      </div>
    </div>
  );
}
