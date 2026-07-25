import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useReports } from '../hooks/useClinicData';

const RANGE_OPTIONS = [
  { days: 7, label: '7 நாட்கள்' },
  { days: 30, label: '30 நாட்கள்' },
  { days: 90, label: '90 நாட்கள்' },
];

export default function Reports() {
  const [days, setDays] = useState(7);
  const { daily, pending } = useReports(days);

  const totalCollection = daily.reduce((sum, d) => sum + d.collection, 0);
  const totalPatients = daily.reduce((sum, d) => sum + d.patients, 0);

  return (
    <div>
      <Header title="அறிக்கைகள்" subtitle="Reports" />

      <div className="px-8 py-6">
        <div className="flex gap-2 mb-4">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`px-4 py-1.5 rounded text-sm font-medium ${
                days === r.days ? 'bg-ink text-cream' : 'bg-parchment text-ink-soft'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <h2 className="font-display text-lg text-ink mb-3">கடந்த {days} நாட்கள் · Last {days} Days</h2>

        {/* Colorful summary cards, matching Dashboard/Billing — the daily
            breakdown list below stays white/"chit" since it's a scannable
            row-by-row record. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mb-8">
          <div className="bg-ink rounded-xl px-4 py-4 sm:px-5 sm:py-5">
            <div className="text-brass text-[10px] sm:text-xs uppercase tracking-wide font-semibold">தினசரி வரவு · Daily Collection</div>
            <div className="font-display font-semibold text-xl sm:text-2xl text-white mt-1">₹{totalCollection.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-sage rounded-xl px-4 py-4 sm:px-5 sm:py-5">
            <div className="text-white/70 text-[10px] sm:text-xs uppercase tracking-wide font-semibold">தினசரி நோயாளிகள் · Daily Patients</div>
            <div className="font-display font-semibold text-xl sm:text-2xl text-white mt-1">{totalPatients}</div>
          </div>
        </div>

        <div className="space-y-1 mb-10 max-w-md max-h-96 overflow-y-auto">
          {daily.map((d) => (
            <div key={d.date} className="flex justify-between text-sm px-2 py-1.5 border-b border-ink/10">
              <span className="text-ink-soft">{d.date}</span>
              <span className="text-ink">{d.patients} நோயாளிகள்</span>
              <span className="text-brass-deep">₹{d.collection.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>

        <h2 className="font-display text-lg text-ink mb-3">நிலுவை கட்டணங்கள் · Pending Payments</h2>
        <div className="space-y-2 max-w-lg">
          {pending.map((p) => (
            <Link key={p.id} to={`/patients/${p.visits?.patient_id}`} className="chit flex justify-between px-5 py-3">
              <div>
                <div className="text-ink">{p.visits?.patients?.name || 'நோயாளி'}</div>
                <div className="text-xs text-ink-soft">{new Date(p.created_at).toLocaleDateString()}</div>
              </div>
              <span className="font-medium text-clay">₹{Number(p.amount).toLocaleString('en-IN')}</span>
            </Link>
          ))}
          {pending.length === 0 && <p className="text-sm text-ink-soft">நிலுவையில் எதுவும் இல்லை.</p>}
        </div>
      </div>
    </div>
  );
}
