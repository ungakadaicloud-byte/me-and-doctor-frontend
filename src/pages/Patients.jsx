import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { usePatients } from '../hooks/useClinicData';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// DD/MM/YYYY -> ISO (YYYY-MM-DD) for the backend; returns null if the
// text isn't a complete, valid date yet (so partial typing doesn't error).
function parseDMY(text) {
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const day = d.padStart(2, '0');
  const month = m.padStart(2, '0');
  return `${y}-${month}-${day}`;
}

export default function Patients() {
  const [query, setQuery] = useState('');
  const [tokenQuery, setTokenQuery] = useState('');
  const { patients, addPatient } = usePatients(tokenQuery ? { token: tokenQuery } : query);
  const [showForm, setShowForm] = useState(false);
  const [dobText, setDobText] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', age: '', gender: '', date_of_birth: '', address: '',
    blood_group: '', allergies: '', chronic_conditions: '', emergency_contact: '', notes: '',
  });

  const handlePhoneChange = (e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) });
  const handleEmergencyChange = (e) => setForm({ ...form, emergency_contact: e.target.value.replace(/\D/g, '').slice(0, 10) });

  const handleDobChange = (e) => {
    // Auto-inserts the "/" separators as the doctor types digits, so
    // they only ever type numbers (DDMMYYYY) — no manual "/" needed.
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2) formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    setDobText(formatted);
    setForm({ ...form, date_of_birth: parseDMY(formatted) || '' });
  };

  const resetForm = () => {
    setForm({
      name: '', phone: '', age: '', gender: '', date_of_birth: '', address: '',
      blood_group: '', allergies: '', chronic_conditions: '', emergency_contact: '', notes: '',
    });
    setDobText('');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    await addPatient(form);
    resetForm();
    setShowForm(false);
  };

  return (
    <div>
      <Header title="நோயாளிகள்" subtitle="Patients" />

      <div className="px-8 py-6">
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Search icon inside the input, like a normal search bar */}
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setTokenQuery(''); }}
              placeholder="பெயர் அல்லது எண் தேடுங்கள் · Search name or phone"
              className="border border-ink/15 rounded pl-9 pr-3 py-2 w-full bg-white"
            />
          </div>
          <input
            value={tokenQuery}
            onChange={(e) => { setTokenQuery(e.target.value); setQuery(''); }}
            placeholder="வரிசை எண் · Token #"
            type="number"
            className="border border-ink/15 rounded px-3 py-2 w-32 bg-white"
          />
          <button
            onClick={() => setShowForm((s) => !s)}
            className="bg-ink text-cream px-5 py-2 rounded font-medium hover:bg-ink-soft"
          >
            + புதிய நோயாளி · New Patient
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="chit px-5 py-5 mb-8 max-w-lg grid grid-cols-2 gap-3">
            <input required placeholder="பெயர் · Full Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-ink/15 rounded px-3 py-2 col-span-2" />
            <input placeholder="மொபைல் எண் · Mobile" type="tel" inputMode="numeric" maxLength={10}
              value={form.phone} onChange={handlePhoneChange}
              className="border border-ink/15 rounded px-3 py-2" />
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="border border-ink/15 rounded px-3 py-2 bg-white">
              <option value="">பாலினம் · Gender</option>
              <option value="male">ஆண் · Male</option>
              <option value="female">பெண் · Female</option>
              <option value="other">மற்றவை · Other</option>
            </select>
            <div>
              <label className="text-xs text-ink-soft">பிறந்த தேதி · DOB (DD/MM/YYYY)</label>
              <input
                type="text" inputMode="numeric" placeholder="23/05/1980" value={dobText}
                onChange={handleDobChange} maxLength={10}
                className="mt-1 w-full border border-ink/15 rounded px-3 py-2" />
            </div>
            <input placeholder="வயது · Age" type="number" value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="border border-ink/15 rounded px-3 py-2" />
            <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
              className="border border-ink/15 rounded px-3 py-2 bg-white">
              <option value="">இரத்த வகை · Blood group</option>
              {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
            </select>
            <input placeholder="அவசர தொடர்பு · Emergency" type="tel" inputMode="numeric" maxLength={10}
              value={form.emergency_contact} onChange={handleEmergencyChange}
              className="border border-ink/15 rounded px-3 py-2" />
            <input placeholder="முகவரி · Address" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="border border-ink/15 rounded px-3 py-2 col-span-2" />
            <input placeholder="ஒவ்வாமை · Allergies" value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              className="border border-ink/15 rounded px-3 py-2 col-span-2" />
            <input placeholder="நாள்பட்ட நோய்கள் · Chronic conditions" value={form.chronic_conditions}
              onChange={(e) => setForm({ ...form, chronic_conditions: e.target.value })}
              className="border border-ink/15 rounded px-3 py-2 col-span-2" />
            <textarea placeholder="குறிப்புகள் · Notes" value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="border border-ink/15 rounded px-3 py-2 col-span-2" rows={2} />
            <button className="col-span-2 bg-brass text-ink rounded py-2 font-medium hover:bg-brass-deep hover:text-cream">
              சேமி · Save
            </button>
          </form>
        )}

        <div className="space-y-2">
          {patients.map((p) => (
            <Link
              key={p.id}
              to={`/patients/${p.id}`}
              className="chit flex items-center justify-between px-5 py-3 hover:translate-x-0.5 transition-transform"
            >
              <div>
                <div className="text-ink font-medium">{p.name}</div>
                <div className="text-xs text-ink-soft">{p.phone || '—'} {p.age ? `· ${p.age}y` : ''}</div>
              </div>
              <span className="text-brass-deep text-sm">→</span>
            </Link>
          ))}
          {patients.length === 0 && (query || tokenQuery) && (
            <p className="text-sm text-ink-soft">பொருந்தும் நோயாளிகள் இல்லை.</p>
          )}
        </div>
      </div>
    </div>
  );
}
