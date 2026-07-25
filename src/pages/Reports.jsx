import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import EmptyCard from '../components/EmptyCard';
import { useReports, useDailyRegister } from '../hooks/useClinicData';

const RANGE_OPTIONS = [
  { days: 7, label: '7 நாட்கள்' },
  { days: 30, label: '30 நாட்கள்' },
  { days: 90, label: '90 நாட்கள்' },
];

// Opens a clean, print-only tab with today's register — a digital
// stand-in for the paper register book, built from data already
// on the page (no separate PDF library needed for this one).
function printRegister(rows) {
  const win = window.open('', '_blank');
  const bodyRows = rows.map((r) => `
    <tr>
      <td>${r.token_number}</td>
      <td>${r.patient_name}</td>
      <td>${r.phone || '-'}</td>
      <td>${r.diagnosis || '-'}</td>
      <td>${r.amount != null ? '₹' + Number(r.amount).toLocaleString('en-IN') : '-'}</td>
      <td>${r.payment_status || '-'}</td>
    </tr>
  `).join('');

  win.document.write(`
    <html>
      <head>
        <title>Today's Register — ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: sans-serif; padding: 24px; }
          h1 { font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 13px; }
          th { background: #f2ecdc; }
        </style>
      </head>
      <body>
        <h1>Me &amp; Doctor — Today's Register (${new Date().toLocaleDateString()})</h1>
        <table>
          <thead><tr><th>Token</th><th>Patient</th><th>Phone</th><th>Diagnosis</th><th>Amount</th><th>Payment</th></tr></thead>
          <tbody>${bodyRows || '<tr><td colspan="6">No patients today</td></tr>'}</tbody>
        </table>
        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `);
  win.document.close();
}

export default function Reports() {
  const [days, setDays] = useState(7);
  const { daily, pending } = useReports(days);
  const { fetchRegister } = useDailyRegister();
  const [printing, setPrinting] = useState(false);

  const handlePrintRegister = async () => {
    setPrinting(true);
    try {
      const rows = await fetchRegister();
      printRegister(rows || []);
    } finally {
      setPrinting(false);
    }
  };

  const totalCollection = daily.reduce((sum, d) => sum + d.collection, 0);
  const totalPatients = daily.reduce((sum, d) => sum + d.patients, 0);

  return (
    <div>
      <Header title="அறிக்கைகள்" subtitle="Reports" />

      <div className="px-8 py-6">
        <button
          onClick={handlePrintRegister}
          disabled={printing}
          className="mb-4 text-xs font-medium bg-brass text-ink rounded px-4 py-2 hover:bg-brass-deep hover:text-cream disabled:opacity-50"
        >
          {printing ? 'தயார் செய்கிறது...' : 'இன்றைய பதிவேடு அச்சிடு · Print Today\'s Register'}
        </button>

        <div className="flex gap-2 mb-4">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`px-4 py-1.5 rounded text-sm font-medium whitespace-nowrap ${
                days === r.days ? 'bg-ink text-cream' : 'bg-parchment text-ink-soft'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Fixed size + nowrap so switching between 7/30/90 never
            reflows this heading to two lines and shifts everything
            below it down. */}
        <h2 className="font-display text-base sm:text-lg text-ink mb-3 whitespace-nowrap overflow-x-auto">
          கடந்த {days} நாட்கள் · Last {days} Days
        </h2>

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
          {pending.length === 0 && (
            <EmptyCard label="நிலுவையில் எதுவும் இல்லை · Nothing pending" showRupee className="max-w-sm" />
          )}
        </div>
      </div>
    </div>
  );
}
