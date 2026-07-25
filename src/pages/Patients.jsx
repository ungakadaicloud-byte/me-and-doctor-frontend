import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { usePatients } from '../hooks/useClinicData';

export default function Patients() {
  const [query, setQuery] = useState('');
  const [tokenQuery, setTokenQuery] = useState('');
  const { patients, addPatient } = usePatients(tokenQuery ? { token: tokenQuery } : query);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', age: '', gender: '', date_of_birth: '', address: '',
    blood_group: '', allergies: '', chronic_conditions: '', emergency_contact: '', notes: '',
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    await addPatient(form);
    setForm({
      name: '', phone: '', age: '', gender: '', date_of_birth: '', address: '',
      blood_group: '', allergies: '', chronic_conditions: '', emergency_contact: '', notes: '',
    });
    setShowForm(false);
  };

  return (
    <div>
      <Header title="நோயாளிகள்" subtitle="Patients" />

      <div className="px-8 py-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setTokenQuery(''); }}
            placeholder="பெயர் அல்லது எண் தேடுங்கள் · Search name or phone"
            className="border border-ink/15 rounded px-3 py-2 flex-1 max-w-sm bg-white"
          />
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
            <input placeholder="மொபைல் எண் · Mobile Number" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="border border-ink/15 rounded px-3 py-2" />
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="border border-ink/15 rounded px-3 py-2 bg-white">
              <option value="">பாலினம் · Gender</option>
              <option value="male">ஆண் · Male</option>
              <option value="female">பெண் · Female</option>
              <option value="other">மற்றவை · Other</option>
            </select>
            <div>
              <label className="text-xs text-ink-soft">பிறந்த தேதி · Date of Birth</label>
              <input type="date" value={form.date_of_birth}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                className="mt-1 w-full border border-ink/15 rounded px-3 py-2" />
            </div>
            <input placeholder="வயது (பிறந்த தேதி இல்லையெனில்) · Age" type="number" value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="border border-ink/15 rounded px-3 py-2" />
            <input placeholder="இரத்த வகை · Blood group" value={form.blood_group}
              onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
              className="border border-ink/15 rounded px-3 py-2" />
            <input placeholder="அவசர தொடர்பு எண் · Emergency Contact" value={form.emergency_contact}
              onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
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
