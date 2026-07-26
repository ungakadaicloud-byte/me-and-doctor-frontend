import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import EmptyCard from '../components/EmptyCard';
import { useReports, useDailyRegister } from '../hooks/useClinicData';

const RANGE_OPTIONS = [{ days: 7 }, { days: 30 }, { days: 90 }];

// Opens a clean, print-only tab with today's register — a digital
// stand-in for the paper register book, built from data already
// on the page (no separate PDF library needed for this one).
// Downloads the register as a CSV the doctor can keep on their phone or
// computer, or forward to someone — printing alone assumes a printer is
// at hand and leaves nothing saved.
function downloadRegister(rows) {
  const header = ['Token', 'Patient', 'Phone', 'Diagnosis', 'Amount', 'Payment'];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    header.map(escape).join(','),
    ...rows.map((r) => [
      r.token_number, r.patient_name, r.phone || '', r.diagnosis || '',
      r.amount != null ? r.amount : '', r.payment_status || '',
    ].map(escape).join(',')),
  ];

  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `me-and-doctor-register-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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
  const [downloading, setDownloading] = useState(false);

  const handlePrintRegister = async () => {
    setPrinting(true);
    try {
      const rows = await fetchRegister();
      printRegister(rows || []);
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadRegister = async () => {
    setDownloading(true);
    try {
      const rows = await fetchRegister();
      downloadRegister(rows || []);
    } finally {
      setDownloading(false);
    }
  };

  const totalCollection = daily.reduce((sum, d) => sum + d.collection, 0);
  const totalPatients = daily.reduce((sum, d) => sum + d.patients, 0);

  return (
    <div>
      <Header title="அறிக்கைகள்" subtitle="Reports" />

      <div className="px-8 py-6">
        <div className="grid grid-cols-2 gap-2 mb-4 max-w-md">
          <button
            onClick={handlePrintRegister}
            disabled={printing}
            className="text-xs font-medium bg-brass text-ink rounded-lg px-3 py-3 hover:bg-brass-deep hover:text-cream disabled:opacity-50 leading-tight"
          >
            {printing ? 'தயார் செய்கிறது...' : (<><div>இன்றைய பதிவேடு அச்சிடு</div><div className="text-[10px] opacity-75 mt-0.5">Print Register</div></>)}
          </button>
          <button
            onClick={handleDownloadRegister}
            disabled={downloading}
            className="text-xs font-medium bg-ink text-cream rounded-lg px-3 py-3 hover:bg-ink-soft disabled:opacity-50 leading-tight"
          >
            {downloading ? 'தயார் செய்கிறது...' : (<><div>பதிவேடு பதிவிறக்கம்</div><div className="text-[10px] opacity-75 mt-0.5">Download CSV</div></>)}
          </button>
        </div>

        {/* Equal-width, two-line boxes so none of the three runs to the
            screen edge or sits visually attached to the next one. */}
        <div className="grid grid-cols-3 gap-2 mb-4 max-w-md">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`rounded-lg py-3 px-1 text-center leading-tight ${
                days === r.days ? 'bg-ink text-cream' : 'bg-parchment text-ink-soft'
              }`}
            >
              <div className="text-base font-semibold">{r.days}</div>
              <div className="text-[11px] opacity-75 mt-0.5">நாட்கள் · days</div>
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
