import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useClinic } from '../hooks/useClinicData';

const DAYS = [
  { key: 'Mon', ta: 'திங்கள்' }, { key: 'Tue', ta: 'செவ்வாய்' }, { key: 'Wed', ta: 'புதன்' },
  { key: 'Thu', ta: 'வியாழன்' }, { key: 'Fri', ta: 'வெள்ளி' }, { key: 'Sat', ta: 'சனி' }, { key: 'Sun', ta: 'ஞாயிறு' },
];

const DEFAULT_DAY = { open: true, start: '09:00', end: '13:00' };

function composeTimingsText(timings) {
  return DAYS.map(({ key }) => {
    const t = timings[key];
    return t.open && t.start && t.end ? `${key}: ${t.start}–${t.end}` : `${key}: Closed`;
  }).join('; ');
}

export default function Settings() {
  const { clinic, updateClinic } = useClinic();
  const [form, setForm] = useState({
    doctor_name: '', qualification: '', clinic_name: '', clinic_address: '', phone: '',
    registration_number: '', consultation_fee: '', logo_url: '', prescription_header: '',
  });
  const [timings, setTimings] = useState(() =>
    Object.fromEntries(DAYS.map(({ key }) => [key, { ...DEFAULT_DAY }]))
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (clinic) {
      // Doctor Name is stored with the "Dr." prefix already baked in —
      // strip it back out for editing so the fixed "Dr." label + the
      // input don't end up showing "Dr. Dr. Suresh".
      const nameWithoutPrefix = (clinic.doctor_name || '').replace(/^Dr\.\s*/i, '');
      setForm({ ...clinic, doctor_name: nameWithoutPrefix });
    }
  }, [clinic]);

  const handlePhoneChange = (e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) });

  const updateDay = (day, patch) => setTimings((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      doctor_name: form.doctor_name ? `Dr. ${form.doctor_name}` : '',
      clinic_timings: composeTimingsText(timings),
    };
    await updateClinic(payload);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <Header title="கிளினிக் அமைப்புகள்" subtitle="Settings" />

      <div className="px-8 py-6">
        <form onSubmit={handleSave} className="chit px-6 py-6 max-w-lg space-y-4">
          <div>
            <label className="text-xs text-ink-soft">மருத்துவர் பெயர் · Doctor Name</label>
            {/* Fixed "Dr." prefix — the doctor only ever types the name
                itself, so patient-facing screens always read "Dr. X". */}
            <div className="mt-1 flex items-stretch">
              <span className="flex items-center px-3 border border-r-0 border-ink/15 rounded-l bg-parchment text-ink-soft font-medium">Dr.</span>
              <input value={form.doctor_name || ''} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
                className="flex-1 border border-ink/15 rounded-r px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="text-xs text-ink-soft">பட்டம் · Qualification</label>
            <input value={form.qualification || ''} onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              className="mt-1 w-full border border-ink/15 rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-xs text-ink-soft">பதிவு எண் · Registration Number</label>
            <input value={form.registration_number || ''} onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
              className="mt-1 w-full border border-ink/15 rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-xs text-ink-soft">கிளினிக் பெயர் · Clinic Name</label>
            <input value={form.clinic_name || ''} onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
              className="mt-1 w-full border border-ink/15 rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-xs text-ink-soft">முகவரி · Address</label>
            <textarea value={form.clinic_address || ''} onChange={(e) => setForm({ ...form, clinic_address: e.target.value })}
              className="mt-1 w-full border border-ink/15 rounded px-3 py-2" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-ink-soft">தொலைபேசி · Phone</label>
              <input value={form.phone || ''} onChange={handlePhoneChange} type="tel" inputMode="numeric" maxLength={10}
                className="mt-1 w-full border border-ink/15 rounded px-3 py-2" />
            </div>
            <div>
              {/* Shortened to one line so this row matches the Phone
                  field's height instead of wrapping to 3 lines. */}
              <label className="text-xs text-ink-soft whitespace-nowrap">கட்டணம் (Default) · Fee</label>
              <input type="number" value={form.consultation_fee || ''} onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })}
                className="mt-1 w-full border border-ink/15 rounded px-3 py-2" />
            </div>
          </div>

          {/* Structured day-by-day picker (tap toggles + native time
              pickers) instead of a single free-text field — nobody was
              going to type out the whole weekly schedule by hand. */}
          <div>
            <label className="text-xs text-ink-soft">கிளினிக் நேரம் · Clinic Timings</label>
            {/* Every row uses the same fixed column widths (shrink-0 on
                the day button, flex-1 on each time field). Previously
                the day button sized itself to its own text, so rows with
                longer Tamil day names — ஞாயிறு vs புதன் — pushed the
                time fields to different horizontal positions and nothing
                lined up down the column. */}
            <div className="mt-1 border border-ink/15 rounded divide-y divide-ink/10">
              {DAYS.map(({ key, ta }) => {
                const day = timings[key];
                return (
                  <div key={key} className="flex items-center gap-2 px-2 py-2">
                    <button type="button" onClick={() => updateDay(key, { open: !day.open })}
                      className={`shrink-0 w-20 text-[11px] px-1 py-1.5 rounded font-medium text-center ${day.open ? 'bg-sage text-cream' : 'bg-parchment text-ink-soft'}`}>
                      {ta} {day.open ? '✓' : '✕'}
                    </button>
                    {day.open ? (
                      <>
                        <input type="time" value={day.start} onChange={(e) => updateDay(key, { start: e.target.value })}
                          className="flex-1 min-w-0 border border-ink/15 rounded px-1 py-1 text-xs" />
                        <span className="shrink-0 text-ink-soft text-xs">–</span>
                        <input type="time" value={day.end} onChange={(e) => updateDay(key, { end: e.target.value })}
                          className="flex-1 min-w-0 border border-ink/15 rounded px-1 py-1 text-xs" />
                      </>
                    ) : (
                      <span className="flex-1 text-xs text-ink-soft">மூடப்பட்டது · Closed</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs text-ink-soft">லோகோ இணைப்பு · Logo URL</label>
            <input value={form.logo_url || ''} onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              className="mt-1 w-full border border-ink/15 rounded px-3 py-2" />
          </div>
          <div>
            <label className="text-xs text-ink-soft">மருந்துச் சீட்டு தலைப்பு · Prescription Header</label>
            <input placeholder="Custom text printed above the clinic name on prescriptions" value={form.prescription_header || ''}
              onChange={(e) => setForm({ ...form, prescription_header: e.target.value })}
              className="mt-1 w-full border border-ink/15 rounded px-3 py-2" />
          </div>
          <button className="bg-ink text-cream rounded py-2.5 px-6 font-medium hover:bg-ink-soft">
            {saved ? 'சேமிக்கப்பட்டது ✓' : 'சேமி · Save'}
          </button>
        </form>
      </div>
    </div>
  );
}
