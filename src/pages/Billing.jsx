import { useState } from 'react';
import Header from '../components/Header';
import { useBilling } from '../hooks/useClinicData';

export default function Billing() {
  const [range, setRange] = useState('day');
  const { summary, markPaid } = useBilling(range);

  return (
    <div>
      <Header title="வரவு" subtitle="Billing" />

      <div className="px-8 py-6">
        <div className="flex gap-2 mb-6">
          {[
            { key: 'day', ta: 'இன்று', en: 'Today' },
            { key: 'month', ta: 'இந்த மாதம்', en: 'This Month' },
          ].map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-4 py-1.5 rounded text-sm font-medium ${
                range === r.key ? 'bg-ink text-cream' : 'bg-parchment text-ink-soft'
              }`}
            >
              {r.ta} · {r.en}
            </button>
          ))}
        </div>

        {/* Summary stat — colorful card, consistent with Dashboard's
            stat-card treatment. List rows below stay white/"chit" since
            they're scannable records, not headline numbers. */}
        {summary && (
          <div className="bg-ink rounded-xl px-6 py-6 max-w-sm mb-8">
            <div className="text-brass text-[10px] sm:text-xs uppercase tracking-wider font-semibold">மொத்த வரவு · Total Collection</div>
            <div className="font-display font-semibold text-3xl sm:text-4xl text-white mt-1.5">₹{summary.total.toLocaleString('en-IN')}</div>
            <div className="text-brass/80 text-xs sm:text-sm mt-2">{summary.count} வருகைகள் கட்டணம் பெறப்பட்டது</div>
          </div>
        )}

        <div className="space-y-2">
          {summary?.rows.map((row, i) => (
            <div key={i} className="chit px-5 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-ink-soft">{new Date(row.created_at).toLocaleString()}</div>
                  {row.invoice_number && (
                    row.id ? (
                      <a
                        href={`${import.meta.env.VITE_API_BASE_URL}/api/billing/${row.id}/pdf`}
                        target="_blank" rel="noreferrer"
                        className="text-xs text-brass-deep hover:text-ink underline underline-offset-2"
                      >
                        ரசீது #{row.invoice_number}
                      </a>
                    ) : (
                      <div className="text-xs text-brass-deep">ரசீது #{row.invoice_number}</div>
                    )
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs uppercase font-medium ${row.payment_status === 'paid' ? 'text-sage' : 'text-clay'}`}>
                    {row.payment_status === 'paid' ? 'செலுத்தப்பட்டது' : 'நிலுவையில்'}
                  </span>
                  {row.payment_status === 'pending' && row.id && (
                    <button onClick={() => markPaid(row.id)} className="text-xs text-brass-deep hover:text-ink underline underline-offset-2">
                      செலுத்தப்பட்டதாக் குறி · Mark Paid
                    </button>
                  )}
                  <span className="text-xs uppercase text-brass-deep">{row.payment_mode}</span>
                  <span className="font-medium text-ink">₹{Number(row.amount).toLocaleString('en-IN')}</span>
                </div>
              </div>
              {row.consultation_fee != null && (
                <div className="mt-1 text-[11px] text-ink-soft">
                  ஆலோசனை ₹{row.consultation_fee} + மற்றவை ₹{row.other_charges || 0} − தள்ளுபடி ₹{row.discount || 0}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
