import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useQueue, usePatients } from '../hooks/useClinicData';
import {
  SUGAR_TYPES, composeBP, parseBP, composeSugar, parseSugar, composeWeight, parseWeight,
} from '../lib/clinical';

const STATUS_LABEL = {
  waiting: { ta: 'காத்திருக்கிறார்', en: 'Waiting', color: 'text-brass-deep' },
  in_consultation: { ta: 'ஆலோசனையில்', en: 'In consultation', color: 'text-ink' },
  completed: { ta: 'முடிந்தது', en: 'Completed', color: 'text-sage' },
  cancelled: { ta: 'ரத்து செய்யப்பட்டது', en: 'Cancelled', color: 'text-clay' },
};

const NEXT_STATUS = { waiting: 'in_consultation', in_consultation: 'completed' };

// Vitals are captured as constrained numeric parts rather than free
// text: BP as systolic/diastolic, sugar with its mandatory reading type
// (a sugar value means nothing without knowing if it's fasting, PP or
// random), weight in kg. Composed into the same strings the API stores.
function VitalsQuickEntry({ token, onSave }) {
  const initialBP = parseBP(token.vitals?.bp);
  const initialSugar = parseSugar(token.vitals?.sugar);

  const [systolic, setSystolic] = useState(initialBP.systolic);
  const [diastolic, setDiastolic] = useState(initialBP.diastolic);
  const [sugarValue, setSugarValue] = useState(initialSugar.value);
  const [sugarType, setSugarType] = useState(initialSugar.type || 'Fasting');
  const [weight, setWeight] = useState(parseWeight(token.vitals?.weight));
  const [saved, setSaved] = useState(false);

  const num = (v, max) => v.replace(/\D/g, '').slice(0, max);

  const handleSave = async () => {
    await onSave(token.id, {
      bp: composeBP(systolic, diastolic),
      sugar: composeSugar(sugarValue, sugarType),
      weight: composeWeight(weight),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="mt-3 border-t border-ink/10 pt-3 space-y-2">
      <div className="text-[10px] text-ink-soft uppercase tracking-wide">
        உதவியாளர் பதிவு · Assistant: Vitals
      </div>

      <div>
        <div className="text-[10px] text-ink-soft mb-1">ரத்த அழுத்தம் · BP (mmHg)</div>
        <div className="flex items-center gap-1">
          <input type="tel" inputMode="numeric" placeholder="130" value={systolic}
            onChange={(e) => setSystolic(num(e.target.value, 3))}
            className="border border-ink/15 rounded px-2 py-1 text-xs w-16 text-center" />
          <span className="text-ink-soft">/</span>
          <input type="tel" inputMode="numeric" placeholder="80" value={diastolic}
            onChange={(e) => setDiastolic(num(e.target.value, 3))}
            className="border border-ink/15 rounded px-2 py-1 text-xs w-16 text-center" />
        </div>
      </div>

      <div>
        <div className="text-[10px] text-ink-soft mb-1">சர்க்கரை · Sugar (mg/dL)</div>
        <div className="flex items-center gap-1">
          <input type="tel" inputMode="numeric" placeholder="110" value={sugarValue}
            onChange={(e) => setSugarValue(num(e.target.value, 3))}
            className="border border-ink/15 rounded px-2 py-1 text-xs w-16 text-center" />
          <select value={sugarType} onChange={(e) => setSugarType(e.target.value)}
            className="border border-ink/15 rounded px-1 py-1 text-xs bg-white">
            {SUGAR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <div className="text-[10px] text-ink-soft mb-1">எடை · Weight</div>
        <div className="flex items-center gap-1">
          <input type="tel" inputMode="decimal" placeholder="68" value={weight}
            onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, '').slice(0, 5))}
            className="border border-ink/15 rounded px-2 py-1 text-xs w-16 text-center" />
          <span className="text-xs text-ink-soft">kg</span>
        </div>
      </div>

      <button onClick={handleSave} className="text-[11px] text-brass-deep hover:text-ink underline underline-offset-2">
        {saved ? 'சேமிக்கப்பட்டது ✓' : 'Vitals சேமி · Save'}
      </button>
    </div>
  );
}

export default function Queue() {
  const { tokens, issueToken, updateStatus, updateVitals } = useQueue();
  const { patients } = usePatients();
  const [selectedPatient, setSelectedPatient] = useState('');

  const handleIssue = async () => {
    await issueToken(selectedPatient || null);
    setSelectedPatient('');
  };

  return (
    <div>
      <Header title="இன்றைய வரிசை" subtitle="Today's Queue" />

      <div className="px-4 sm:px-8 py-4 sm:py-6">
        {/* Stacked on mobile instead of a fixed-width side-by-side row —
            the previous layout could overflow the screen width, which
            was also why the (fixed, but this made it worse) top menu
            bar seemed to "disappear" when scrolled sideways to reach
            this button. */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8">
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="border border-ink/15 rounded px-3 py-2 w-full sm:flex-1 sm:max-w-xs bg-white"
          >
            <option value="">நேரடி வருகை (இன்னும் பதிவு செய்யவில்லை) · Walk-in</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={handleIssue}
            className="bg-ink text-cream px-5 py-2 rounded font-medium hover:bg-ink-soft whitespace-nowrap"
          >
            + புதிய வரிசை எண் · New Token
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {tokens.length === 0 && (
            <p className="text-ink-soft text-sm col-span-full">
              இன்று இன்னும் யாரும் இல்லை. புதிய வரிசை எண் வழங்கத் தொடங்குங்கள்.
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
                <div className="mt-2 text-sm text-ink">{t.patients?.name || 'நேரடி வருகை · Walk-in'}</div>

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

                {/* Assistant/nurse captures vitals here while the patient
                    waits — the doctor's visit form picks this up
                    automatically via the link below. */}
                {t.status === 'waiting' && (
                  <VitalsQuickEntry token={t} onSave={updateVitals} />
                )}

                {t.patient_id ? (
                  <Link
                    to={`/patients/${t.patient_id}`}
                    state={{ vitals: t.vitals }}
                    className="mt-3 inline-block text-xs font-medium bg-brass text-ink rounded px-3 py-1.5 hover:bg-brass-deep hover:text-cream"
                  >
                    நோயாளி பதிவைத் திற · Open Consultation
                  </Link>
                ) : (
                  <p className="mt-3 text-[11px] text-ink-soft">
                    நேரடி வருகை — ஆலோசனை பதிவு செய்ய முதலில் Patients-ல் பதிவு செய்யுங்கள்
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
