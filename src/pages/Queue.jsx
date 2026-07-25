import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useQueue, usePatients } from '../hooks/useClinicData';

const STATUS_LABEL = {
  waiting: { ta: 'காத்திருக்கிறார்', en: 'Waiting', color: 'text-brass-deep' },
  in_consultation: { ta: 'ஆலோசனையில்', en: 'In consultation', color: 'text-ink' },
  completed: { ta: 'முடிந்தது', en: 'Completed', color: 'text-sage' },
  cancelled: { ta: 'ரத்து செய்யப்பட்டது', en: 'Cancelled', color: 'text-clay' },
};

const NEXT_STATUS = { waiting: 'in_consultation', in_consultation: 'completed' };

export default function Queue() {
  const { tokens, issueToken, updateStatus } = useQueue();
  const { patients } = usePatients();
  const [selectedPatient, setSelectedPatient] = useState('');

  const handleIssue = async () => {
    await issueToken(selectedPatient || null);
    setSelectedPatient('');
  };

  return (
    <div>
      <Header title="இன்றைய வரிசை" subtitle="Today's Queue" />

      <div className="px-8 py-6">
        <div className="flex gap-3 mb-8">
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="border border-ink/15 rounded px-3 py-2 flex-1 max-w-xs bg-white"
          >
            <option value="">Walk-in (இன்னும் பதிவு செய்யவில்லை)</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={handleIssue}
            className="bg-ink text-cream px-5 py-2 rounded font-medium hover:bg-ink-soft"
          >
            + புதிய டோக்கன் · New Token
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {tokens.length === 0 && (
            <p className="text-ink-soft text-sm col-span-full">
              இன்று இன்னும் யாரும் இல்லை. புதிய டோக்கன் வழங்கத் தொடங்குங்கள்.
            </p>
          )}

          {tokens.map((t) => {
            const status = STATUS_LABEL[t.status];
            const isFinal = t.status === 'completed' || t.status === 'cancelled';
            return (
              <div key={t.id} className="chit px-5 py-4">
                <div className="flex items-start justify-between">
                  <div className="token-number text-3xl text-ink">{String(t.token_number).padStart(2, '0')}</div>
                  <span className={`text-xs font-medium ${status.color}`}>{status.en}</span>
                </div>
                <div className="mt-2 text-sm text-ink">{t.patients?.name || 'Walk-in'}</div>

                {!isFinal && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      onClick={() => updateStatus(t.id, NEXT_STATUS[t.status])}
                      className="text-xs font-medium text-brass-deep hover:text-ink underline underline-offset-2"
                    >
                      {t.status === 'waiting' ? 'ஆலோசனை தொடங்கு →' : 'முடிந்தது என குறி →'}
                    </button>
                    <button
                      onClick={() => updateStatus(t.id, 'cancelled')}
                      className="text-xs text-ink-soft hover:text-clay underline underline-offset-2"
                    >
                      ரத்து · Cancel
                    </button>
                  </div>
                )}

                {t.patient_id ? (
                  <Link
                    to={`/patients/${t.patient_id}`}
                    className="mt-3 inline-block text-xs font-medium bg-brass text-ink rounded px-3 py-1.5 hover:bg-brass-deep hover:text-cream"
                  >
                    நோயாளி பதிவைத் திற · Open Consultation
                  </Link>
                ) : (
                  <p className="mt-3 text-[11px] text-ink-soft">
                    Walk-in — ஆலோசனை பதிவு செய்ய முதலில் Patients-ல் பதிவு செய்யுங்கள்
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
