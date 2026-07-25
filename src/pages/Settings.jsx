import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useClinic } from '../hooks/useClinicData';

export default function Settings() {
  const { clinic, updateClinic } = useClinic();
  const [form, setForm] = useState({
    doctor_name: '', qualification: '', clinic_name: '', clinic_address: '', phone: '',
    registration_number: '', consultation_fee: '', clinic_timings: '', logo_url: '', prescription_header: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (clinic) setForm({ ...form, ...clinic });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinic]);

  const handleSave = async (e) => {
    e.preventDefault();
    await updateClinic(form);
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
            <input value={form.doctor_name || ''} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
              className="mt-1 w-full border border-ink/15 rounded px-3 py-2" />
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
              <label className="text-xs text-ink-soft">தொலைபேசி எண் · Phone</label>
              <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full border border-ink/15 rounded px-3 py-2" />
            </div>
            <div>
              <label className="text-xs text-ink-soft">ஆலோசனை கட்டணம் · Consultation Fee (default)</label>
              <input type="number" value={form.consultation_fee || ''} onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })}
                className="mt-1 w-full border border-ink/15 rounded px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="text-xs text-ink-soft">கிளினிக் நேரம் · Clinic Timings</label>
            <input placeholder="e.g. Mon–Sat, 9:00 AM – 1:00 PM & 5:00 PM – 8:00 PM" value={form.clinic_timings || ''}
              onChange={(e) => setForm({ ...form, clinic_timings: e.target.value })}
              className="mt-1 w-full border border-ink/15 rounded px-3 py-2" />
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
