import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import { usePatientDetail, useVisits, usePrescriptions, useBilling } from '../hooks/useClinicData';
import api from '../lib/api';

const VISIT_STATUS_LABEL = { completed: 'முடிந்தது · Completed', cancelled: 'ரத்து · Cancelled' };

export default function PatientDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { patient, reload } = usePatientDetail(id);
  const { addVisit, updateVisitStatus } = useVisits(id);
  const { lastRx, createPrescription, sharePrescription } = usePrescriptions(id);
  const { recordPayment } = useBilling();

  const [chiefComplaint, setChiefComplaint] = useState('');
  const [vitals, setVitals] = useState(() => {
    // Auto-fills from whatever the assistant/nurse already captured in
    // the queue while this patient was waiting — the doctor shouldn't
    // have to re-type BP/Sugar/Weight that's already on file.
    const queueVitals = location.state?.vitals;
    return (queueVitals && Object.keys(queueVitals).length > 0)
      ? queueVitals
      : { bp: '', sugar: '', weight: '' };
  });
  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [labTests, setLabTests] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
  const [advice, setAdvice] = useState('');
  const [savedRx, setSavedRx] = useState(null);
  const [savedVisit, setSavedVisit] = useState(null);
  const [saving, setSaving] = useState(false);

  const [billing, setBilling] = useState({ consultation_fee: '', other_charges: '', discount: '', payment_mode: 'cash' });
  const [savedBill, setSavedBill] = useState(null);

  const [showReferral, setShowReferral] = useState(false);
  const [referral, setReferral] = useState({ referred_to: '', specialty: '', reason: '' });
  const [referralBusy, setReferralBusy] = useState(false);

  const handleGenerateReferral = async (e) => {
    e.preventDefault();
    setReferralBusy(true);
    try {
      const res = await api.post('/api/referral/pdf', { patient_id: id, ...referral }, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(blobUrl, '_blank');
    } finally {
      setReferralBusy(false);
    }
  };

  const updateMedicine = (i, field, value) => {
    setMedicines((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  };

  const addMedicineRow = () => setMedicines((prev) => [...prev, { name: '', dosage: '', frequency: '', duration: '' }]);

  const repeatLast = () => {
    if (lastRx) {
      setMedicines(lastRx.medicines);
      if (lastRx.advice) setAdvice(lastRx.advice);
    }
  };

  const handleSaveVisitAndRx = async () => {
    setSaving(true);
    try {
      const visit = await addVisit({
        chief_complaint: chiefComplaint,
        soap_notes: notes,
        diagnosis,
        lab_tests: labTests,
        vitals,
        follow_up_date: followUpDate || null,
      });
      setSavedVisit(visit);

      const validMedicines = medicines.filter((m) => m.name.trim());
      if (validMedicines.length) {
        const rx = await createPrescription(visit.id, validMedicines, advice);
        setSavedRx(rx);
      }

      setChiefComplaint('');
      setNotes('');
      setDiagnosis('');
      setLabTests('');
      setFollowUpDate('');
      setAdvice('');
      setVitals({ bp: '', sugar: '', weight: '' });
      setMedicines([{ name: '', dosage: '', frequency: '', duration: '' }]);
      reload();
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (savedRx) await sharePrescription(savedRx.id);
  };

  const handleCancelVisit = async (visitId) => {
    await updateVisitStatus(visitId, 'cancelled');
    reload();
  };

  const handleSaveBilling = async (e) => {
    e.preventDefault();
    if (!savedVisit) return;
    const bill = await recordPayment(savedVisit.id, {
      consultation_fee: Number(billing.consultation_fee || 0),
      other_charges: Number(billing.other_charges || 0),
      discount: Number(billing.discount || 0),
      payment_mode: billing.payment_mode,
    });
    setSavedBill(bill);
  };

  if (!patient) return null;

  return (
    <div>
      <Header title={patient.name} subtitle={`${patient.phone || '—'} · ${patient.age || '—'} y · ${patient.gender || '—'}`} />

      {(patient.address || patient.blood_group || patient.allergies || patient.chronic_conditions || patient.emergency_contact) && (
        <div className="px-8 pt-4">
          <div className="chit px-5 py-4 flex flex-wrap gap-x-8 gap-y-1 text-sm">
            {patient.blood_group && <span><span className="text-ink-soft">Blood group:</span> {patient.blood_group}</span>}
            {patient.date_of_birth && <span><span className="text-ink-soft">DOB:</span> {patient.date_of_birth}</span>}
            {patient.address && <span><span className="text-ink-soft">Address:</span> {patient.address}</span>}
            {patient.emergency_contact && <span><span className="text-ink-soft">Emergency:</span> {patient.emergency_contact}</span>}
            {patient.allergies && <span className="text-clay"><span className="text-ink-soft">Allergies:</span> {patient.allergies}</span>}
            {patient.chronic_conditions && <span><span className="text-ink-soft">Chronic:</span> {patient.chronic_conditions}</span>}
            {patient.notes && <span className="w-full"><span className="text-ink-soft">Notes:</span> {patient.notes}</span>}
          </div>
        </div>
      )}

      <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* The doctor's complete digital memory for this patient */}
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-lg text-ink mb-3">வருகை வரலாறு · Visit Timeline</h2>
            <div className="space-y-3">
              {(patient.recent_visits || []).length === 0 && (
                <p className="text-sm text-ink-soft">முந்தைய வருகைகள் இல்லை.</p>
              )}
              {(patient.recent_visits || []).map((v) => (
                <div key={v.id} className="chit px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-brass-deep">{new Date(v.visit_date).toLocaleDateString()}</div>
                    <span className={`text-xs ${v.status === 'cancelled' ? 'text-clay' : 'text-sage'}`}>
                      {VISIT_STATUS_LABEL[v.status] || v.status}
                    </span>
                  </div>
                  {v.chief_complaint && <p className="text-xs text-ink-soft mt-1">CC: {v.chief_complaint}</p>}
                  {v.diagnosis && <p className="text-sm text-ink font-medium mt-1">{v.diagnosis}</p>}
                  {v.soap_notes && <p className="text-sm text-ink mt-1">{v.soap_notes}</p>}
                  {v.lab_tests && <p className="text-xs text-ink-soft mt-1">Lab/Test: {v.lab_tests}</p>}
                  {v.follow_up_date && (
                    <p className="text-xs text-clay mt-1">அடுத்த வருகை: {new Date(v.follow_up_date).toLocaleDateString()}</p>
                  )}
                  {v.vitals && (v.vitals.bp || v.vitals.sugar || v.vitals.weight) && (
                    <div className="flex gap-4 mt-2 text-xs text-ink-soft">
                      {v.vitals.bp && <span>BP: {v.vitals.bp}</span>}
                      {v.vitals.sugar && <span>Sugar: {v.vitals.sugar}</span>}
                      {v.vitals.weight && <span>Weight: {v.vitals.weight}</span>}
                    </div>
                  )}
                  {v.status !== 'cancelled' && (
                    <button onClick={() => handleCancelVisit(v.id)} className="mt-2 text-[11px] text-ink-soft hover:text-clay underline underline-offset-2">
                      இந்த வருகையை ரத்து செய் · Cancel visit
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg text-ink mb-3">மருந்துச் சீட்டு வரலாறு · Prescription History</h2>
            <div className="space-y-2">
              {(patient.prescriptions || []).map((rx) => (
                <div key={rx.id} className="chit px-5 py-3">
                  <div className="text-xs text-brass-deep">{new Date(rx.created_at).toLocaleDateString()}</div>
                  <div className="text-sm text-ink">{rx.medicines.map((m) => m.name).join(', ')}</div>
                </div>
              ))}
              {(patient.prescriptions || []).length === 0 && <p className="text-sm text-ink-soft">சீட்டுகள் இல்லை.</p>}
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg text-ink mb-3">கட்டண வரலாறு · Payment History</h2>
            <div className="space-y-2">
              {(patient.bills || []).map((b) => (
                <a key={b.id}
                  href={`${import.meta.env.VITE_API_BASE_URL}/api/billing/${b.id}/pdf`}
                  target="_blank" rel="noreferrer"
                  className="chit flex justify-between px-5 py-3 hover:bg-parchment">
                  <div>
                    <div className="text-xs text-brass-deep">{new Date(b.created_at).toLocaleDateString()}</div>
                    {b.invoice_number && <div className="text-xs text-ink-soft">ரசீது #{b.invoice_number}</div>}
                  </div>
                  <div className="text-right">
                    <div className={`text-xs uppercase ${b.payment_status === 'paid' ? 'text-sage' : 'text-clay'}`}>{b.payment_status}</div>
                    <div className="font-medium text-ink">₹{Number(b.amount).toLocaleString('en-IN')}</div>
                  </div>
                </a>
              ))}
              {(patient.bills || []).length === 0 && <p className="text-sm text-ink-soft">பில்கள் இல்லை.</p>}
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg text-ink mb-3">பின்தொடர்தல் வரலாறு · Follow-up History</h2>
            <div className="space-y-2">
              {(patient.follow_up_history || []).map((f) => (
                <div key={f.id} className="chit flex justify-between px-5 py-3">
                  <span className="text-sm text-ink">{new Date(f.send_date).toLocaleDateString()}</span>
                  <span className="text-xs text-ink-soft uppercase">{f.delivery_status || 'scheduled'}</span>
                </div>
              ))}
              {(patient.follow_up_history || []).length === 0 && <p className="text-sm text-ink-soft">பின்தொடர்தல் இல்லை.</p>}
            </div>
          </div>
        </div>

        {/* New visit + prescription + billing workflow */}
        <div>
          <h2 className="font-display text-lg text-ink mb-3">புதிய பரிசோதனை · New Visit</h2>
          <div className="chit px-5 py-5 space-y-4">
            <textarea
              placeholder="Chief Complaint"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              className="w-full border border-ink/15 rounded px-3 py-2 text-sm"
              rows={2}
            />
            <textarea
              placeholder="Clinical Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-ink/15 rounded px-3 py-2 text-sm"
              rows={2}
            />
            <textarea
              placeholder="Diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full border border-ink/15 rounded px-3 py-2 text-sm"
              rows={2}
            />
            <textarea
              placeholder="Lab / Test Recommendations"
              value={labTests}
              onChange={(e) => setLabTests(e.target.value)}
              className="w-full border border-ink/15 rounded px-3 py-2 text-sm"
              rows={2}
            />
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="BP" value={vitals.bp} onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                className="border border-ink/15 rounded px-2 py-1.5 text-sm" />
              <input placeholder="Sugar" value={vitals.sugar} onChange={(e) => setVitals({ ...vitals, sugar: e.target.value })}
                className="border border-ink/15 rounded px-2 py-1.5 text-sm" />
              <input placeholder="Weight" value={vitals.weight} onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                className="border border-ink/15 rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-ink-soft">அடுத்த வருகை தேதி · Follow-up Date</label>
              <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)}
                className="mt-1 w-full border border-ink/15 rounded px-3 py-2 text-sm" />
            </div>

            <div className="border-t border-ink/10 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-ink">மருந்துச் சீட்டு · Prescription</span>
                {lastRx && (
                  <button onClick={repeatLast} type="button" className="text-xs text-brass-deep hover:text-ink underline underline-offset-2">
                    கடந்த சீட்டை மீண்டும் பயன்படுத்து · Repeat last Rx
                  </button>
                )}
              </div>

              {medicines.map((m, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                  <input placeholder="Medicine" value={m.name} onChange={(e) => updateMedicine(i, 'name', e.target.value)}
                    className="border border-ink/15 rounded px-2 py-1.5 text-sm col-span-2" />
                  <input placeholder="Dosage" value={m.dosage} onChange={(e) => updateMedicine(i, 'dosage', e.target.value)}
                    className="border border-ink/15 rounded px-2 py-1.5 text-sm" />
                  <input placeholder="Freq / Days" value={m.frequency} onChange={(e) => updateMedicine(i, 'frequency', e.target.value)}
                    className="border border-ink/15 rounded px-2 py-1.5 text-sm" />
                </div>
              ))}
              <button onClick={addMedicineRow} type="button" className="text-xs text-ink-soft hover:text-ink">
                + மருந்து சேர் · Add medicine
              </button>

              <textarea
                placeholder="Advice (diet, rest, etc.)"
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                className="w-full border border-ink/15 rounded px-3 py-2 text-sm mt-2"
                rows={2}
              />
            </div>

            <button
              onClick={handleSaveVisitAndRx}
              disabled={saving}
              className="w-full bg-ink text-cream rounded py-2.5 font-medium hover:bg-ink-soft disabled:opacity-50"
            >
              {saving ? 'சேமிக்கிறது...' : 'சேமி · Save Visit'}
            </button>

            {savedRx && (
              <div className="flex gap-3">
                <a href={`${import.meta.env.VITE_API_BASE_URL}/api/prescriptions/${savedRx.id}/pdf`}
                  target="_blank" rel="noreferrer"
                  className="flex-1 text-center border border-ink/15 rounded py-2 text-sm hover:bg-parchment">
                  PDF பார்க்க · Print
                </a>
                <button onClick={handleShare}
                  className="flex-1 bg-brass text-ink rounded py-2 text-sm font-medium hover:bg-brass-deep hover:text-cream">
                  WhatsApp-ல் அனுப்பு
                </button>
              </div>
            )}

            {savedVisit && !savedBill && (
              <form onSubmit={handleSaveBilling} className="border-t border-ink/10 pt-4 space-y-2">
                <span className="text-sm font-medium text-ink">இந்த வருகைக்கான கட்டணம் · Billing for this visit</span>
                <div className="grid grid-cols-3 gap-2">
                  <input placeholder="ஆலோசனை கட்டணம் · Fee" type="number" value={billing.consultation_fee}
                    onChange={(e) => setBilling({ ...billing, consultation_fee: e.target.value })}
                    className="border border-ink/15 rounded px-2 py-1.5 text-sm" />
                  <input placeholder="மற்ற கட்டணம் · Other" type="number" value={billing.other_charges}
                    onChange={(e) => setBilling({ ...billing, other_charges: e.target.value })}
                    className="border border-ink/15 rounded px-2 py-1.5 text-sm" />
                  <input placeholder="தள்ளுபடி · Discount" type="number" value={billing.discount}
                    onChange={(e) => setBilling({ ...billing, discount: e.target.value })}
                    className="border border-ink/15 rounded px-2 py-1.5 text-sm" />
                </div>
                <select value={billing.payment_mode} onChange={(e) => setBilling({ ...billing, payment_mode: e.target.value })}
                  className="w-full border border-ink/15 rounded px-3 py-2 text-sm bg-white">
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                </select>
                <button className="w-full bg-brass text-ink rounded py-2 text-sm font-medium hover:bg-brass-deep hover:text-cream">
                  கட்டணம் சேமி · Save Bill
                </button>
              </form>
            )}
            {savedBill && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-sage">கட்டணம் பதிவு செய்யப்பட்டது ✓ (ரசீது #{savedBill.invoice_number})</p>
                <a href={`${import.meta.env.VITE_API_BASE_URL}/api/billing/${savedBill.id}/pdf`}
                  target="_blank" rel="noreferrer"
                  className="text-xs text-brass-deep hover:text-ink underline underline-offset-2">
                  ரசீது PDF
                </a>
              </div>
            )}
          </div>

          {/* Referral Letter — generated on demand, not saved anywhere;
              the visit record already holds the diagnosis, so this is
              just a printable letterhead for the specialist. */}
          <div className="chit px-5 py-4 mt-4">
            <button
              onClick={() => setShowReferral((s) => !s)}
              type="button"
              className="text-sm font-medium text-ink hover:text-brass-deep"
            >
              {showReferral ? '− ' : '+ '}Referral Letter
            </button>

            {showReferral && (
              <form onSubmit={handleGenerateReferral} className="mt-3 space-y-2">
                <input required placeholder="Referred To (Doctor/Hospital name)" value={referral.referred_to}
                  onChange={(e) => setReferral({ ...referral, referred_to: e.target.value })}
                  className="w-full border border-ink/15 rounded px-3 py-2 text-sm" />
                <input placeholder="Specialty (optional)" value={referral.specialty}
                  onChange={(e) => setReferral({ ...referral, specialty: e.target.value })}
                  className="w-full border border-ink/15 rounded px-3 py-2 text-sm" />
                <textarea placeholder="Reason for referral (optional)" value={referral.reason}
                  onChange={(e) => setReferral({ ...referral, reason: e.target.value })}
                  className="w-full border border-ink/15 rounded px-3 py-2 text-sm" rows={2} />
                <button
                  disabled={referralBusy}
                  className="w-full bg-ink text-cream rounded py-2 text-sm font-medium hover:bg-ink-soft disabled:opacity-50"
                >
                  {referralBusy ? 'உருவாக்குகிறது...' : 'Generate Referral PDF'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
