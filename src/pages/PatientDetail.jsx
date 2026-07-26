import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import { usePatientDetail, useVisits, usePrescriptions, useBilling } from '../hooks/useClinicData';
import api from '../lib/api';
import {
  SUGAR_TYPES, DOSE_UNITS,
  composeBP, parseBP, composeSugar, parseSugar, composeWeight, parseWeight,
  composeDose, parseDose, composeFrequency, parseFrequency,
  formatDateInput, dmyToISO,
} from '../lib/clinical';

const VISIT_STATUS_LABEL = { completed: 'முடிந்தது · Completed', cancelled: 'ரத்து · Cancelled' };
const onlyDigits = (v, max) => v.replace(/\D/g, '').slice(0, max);
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Shown next to any record that's been changed since it was first
// saved — a corrected medical record should stay visibly transparent
// rather than silently rewriting history. Anything under 60 seconds
// apart is treated as "just saved", not "edited later".
function LastEdited({ createdAt, updatedAt }) {
  if (!updatedAt || !createdAt) return null;
  const diff = new Date(updatedAt) - new Date(createdAt);
  if (diff < 60000) return null;
  return (
    <span className="text-[10px] text-brass-deep italic">
      திருத்தப்பட்டது · Edited {new Date(updatedAt).toLocaleDateString()}
    </span>
  );
}

// ── Editable patient profile ──────────────────────────────────────
function PatientProfile({ patient, onSave }) {
  const [editing, setEditing] = useState(false);
  const [dobText, setDobText] = useState(patient.date_of_birth ? formatDateInput(patient.date_of_birth.split('-').reverse().join('')) : '');
  const [form, setForm] = useState({
    name: patient.name || '', phone: patient.phone || '', gender: patient.gender || '',
    blood_group: patient.blood_group || '', address: patient.address || '',
    emergency_contact: patient.emergency_contact || '', allergies: patient.allergies || '',
    chronic_conditions: patient.chronic_conditions || '', notes: patient.notes || '',
  });

  const handleSave = async (e) => {
    e.preventDefault();
    await onSave({ ...form, date_of_birth: dmyToISO(dobText) || patient.date_of_birth });
    setEditing(false);
  };

  const hasProfileInfo = patient.address || patient.blood_group || patient.allergies || patient.chronic_conditions || patient.emergency_contact;

  if (!editing) {
    return (
      <div className="px-8 pt-4">
        {hasProfileInfo && (
          <div className="chit px-5 py-4 flex flex-wrap gap-x-8 gap-y-1 text-sm">
            {patient.blood_group && <span><span className="text-ink-soft">Blood group:</span> {patient.blood_group}</span>}
            {patient.date_of_birth && <span><span className="text-ink-soft">DOB:</span> {patient.date_of_birth}</span>}
            {patient.address && <span><span className="text-ink-soft">Address:</span> {patient.address}</span>}
            {patient.emergency_contact && <span><span className="text-ink-soft">Emergency:</span> {patient.emergency_contact}</span>}
            {patient.allergies && <span className="text-clay"><span className="text-ink-soft">Allergies:</span> {patient.allergies}</span>}
            {patient.chronic_conditions && <span><span className="text-ink-soft">Chronic:</span> {patient.chronic_conditions}</span>}
            {patient.notes && <span className="w-full"><span className="text-ink-soft">Notes:</span> {patient.notes}</span>}
            <LastEdited createdAt={patient.created_at} updatedAt={patient.updated_at} />
          </div>
        )}
        <button onClick={() => setEditing(true)} className="mt-2 text-xs text-brass-deep hover:text-ink underline underline-offset-2">
          நோயாளி விவரம் திருத்து · Edit patient details
        </button>
      </div>
    );
  }

  return (
    <div className="px-8 pt-4">
      <form onSubmit={handleSave} className="chit px-5 py-5 grid grid-cols-2 gap-3">
        <input required placeholder="பெயர் · Name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border border-ink/15 rounded px-3 py-2 text-sm col-span-2" />
        <input placeholder="மொபைல் · Mobile" type="tel" inputMode="numeric" maxLength={10}
          value={form.phone} onChange={(e) => setForm({ ...form, phone: onlyDigits(e.target.value, 10) })}
          className="border border-ink/15 rounded px-3 py-2 text-sm" />
        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
          className="border border-ink/15 rounded px-3 py-2 text-sm bg-white">
          <option value="">பாலினம் · Gender</option>
          <option value="male">ஆண் · Male</option>
          <option value="female">பெண் · Female</option>
          <option value="other">மற்றவை · Other</option>
        </select>
        <div>
          <label className="text-[11px] text-ink-soft">DOB (DD/MM/YYYY)</label>
          <input type="text" inputMode="numeric" maxLength={10} placeholder="23/05/1980" value={dobText}
            onChange={(e) => setDobText(formatDateInput(e.target.value))}
            className="mt-0.5 w-full border border-ink/15 rounded px-3 py-2 text-sm" />
        </div>
        <select value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
          className="border border-ink/15 rounded px-3 py-2 text-sm bg-white">
          <option value="">இரத்த வகை</option>
          {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
        </select>
        <input placeholder="அவசர தொடர்பு" type="tel" inputMode="numeric" maxLength={10} value={form.emergency_contact}
          onChange={(e) => setForm({ ...form, emergency_contact: onlyDigits(e.target.value, 10) })}
          className="border border-ink/15 rounded px-3 py-2 text-sm" />
        <input placeholder="முகவரி · Address" value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="border border-ink/15 rounded px-3 py-2 text-sm col-span-2" />
        <input placeholder="ஒவ்வாமை · Allergies" value={form.allergies}
          onChange={(e) => setForm({ ...form, allergies: e.target.value })}
          className="border border-ink/15 rounded px-3 py-2 text-sm col-span-2" />
        <input placeholder="நாள்பட்ட நோய்கள்" value={form.chronic_conditions}
          onChange={(e) => setForm({ ...form, chronic_conditions: e.target.value })}
          className="border border-ink/15 rounded px-3 py-2 text-sm col-span-2" />
        <textarea placeholder="குறிப்புகள்" value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="border border-ink/15 rounded px-3 py-2 text-sm col-span-2" rows={2} />
        <div className="col-span-2 flex gap-2">
          <button className="flex-1 bg-ink text-cream rounded py-2 text-sm font-medium hover:bg-ink-soft">சேமி · Save</button>
          <button type="button" onClick={() => setEditing(false)} className="flex-1 border border-ink/15 rounded py-2 text-sm hover:bg-parchment">ரத்து · Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ── Editable visit card ────────────────────────────────────────────
function VisitCard({ visit, onSave, onCancel }) {
  const [editing, setEditing] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState(visit.chief_complaint || '');
  const [notes, setNotes] = useState(visit.soap_notes || '');
  const [diagnosis, setDiagnosis] = useState(visit.diagnosis || '');
  const [labTests, setLabTests] = useState(visit.lab_tests || '');
  const [followUpText, setFollowUpText] = useState(
    visit.follow_up_date ? formatDateInput(visit.follow_up_date.split('-').reverse().join('')) : ''
  );
  const [bp, setBp] = useState(() => parseBP(visit.vitals?.bp));
  const [sugar, setSugar] = useState(() => {
    const p = parseSugar(visit.vitals?.sugar);
    return { value: p.value, type: p.type || 'Fasting' };
  });
  const [weight, setWeight] = useState(() => parseWeight(visit.vitals?.weight));

  const handleSave = async () => {
    await onSave(visit.id, {
      chief_complaint: chiefComplaint,
      soap_notes: notes,
      diagnosis,
      lab_tests: labTests,
      follow_up_date: dmyToISO(followUpText) || null,
      vitals: {
        bp: composeBP(bp.systolic, bp.diastolic),
        sugar: composeSugar(sugar.value, sugar.type),
        weight: composeWeight(weight),
      },
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="chit px-5 py-4 space-y-2">
        <textarea placeholder="Chief Complaint" value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)}
          className="w-full border border-ink/15 rounded px-2 py-1.5 text-sm" rows={2} />
        <textarea placeholder="Clinical Notes" value={notes} onChange={(e) => setNotes(e.target.value)}
          className="w-full border border-ink/15 rounded px-2 py-1.5 text-sm" rows={2} />
        <textarea placeholder="Diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
          className="w-full border border-ink/15 rounded px-2 py-1.5 text-sm" rows={2} />
        <textarea placeholder="Lab / Test" value={labTests} onChange={(e) => setLabTests(e.target.value)}
          className="w-full border border-ink/15 rounded px-2 py-1.5 text-sm" rows={2} />
        <div className="flex items-center gap-2">
          <input type="tel" inputMode="numeric" placeholder="BP sys" value={bp.systolic}
            onChange={(e) => setBp({ ...bp, systolic: onlyDigits(e.target.value, 3) })}
            className="border border-ink/15 rounded px-2 py-1 text-xs w-14 text-center" />
          <span className="text-ink-soft">/</span>
          <input type="tel" inputMode="numeric" placeholder="dia" value={bp.diastolic}
            onChange={(e) => setBp({ ...bp, diastolic: onlyDigits(e.target.value, 3) })}
            className="border border-ink/15 rounded px-2 py-1 text-xs w-14 text-center" />
          <input type="tel" inputMode="numeric" placeholder="Sugar" value={sugar.value}
            onChange={(e) => setSugar({ ...sugar, value: onlyDigits(e.target.value, 3) })}
            className="border border-ink/15 rounded px-2 py-1 text-xs w-14 text-center ml-2" />
          <select value={sugar.type} onChange={(e) => setSugar({ ...sugar, type: e.target.value })}
            className="border border-ink/15 rounded px-1 py-1 text-xs bg-white">
            {SUGAR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="tel" inputMode="decimal" placeholder="kg" value={weight}
            onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, '').slice(0, 5))}
            className="border border-ink/15 rounded px-2 py-1 text-xs w-14 text-center ml-2" />
        </div>
        <input type="text" inputMode="numeric" maxLength={10} placeholder="Follow-up DD/MM/YYYY" value={followUpText}
          onChange={(e) => setFollowUpText(formatDateInput(e.target.value))}
          className="w-full border border-ink/15 rounded px-2 py-1.5 text-sm" />
        <div className="flex gap-2">
          <button onClick={handleSave} className="flex-1 bg-ink text-cream rounded py-1.5 text-sm font-medium hover:bg-ink-soft">சேமி · Save</button>
          <button onClick={() => setEditing(false)} className="flex-1 border border-ink/15 rounded py-1.5 text-sm hover:bg-parchment">ரத்து · Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chit px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-brass-deep">{new Date(visit.visit_date).toLocaleDateString()}</div>
        <span className={`text-xs ${visit.status === 'cancelled' ? 'text-clay' : 'text-sage'}`}>
          {VISIT_STATUS_LABEL[visit.status] || visit.status}
        </span>
      </div>
      {visit.chief_complaint && <p className="text-xs text-ink-soft mt-1">CC: {visit.chief_complaint}</p>}
      {visit.diagnosis && <p className="text-sm text-ink font-medium mt-1">{visit.diagnosis}</p>}
      {visit.soap_notes && <p className="text-sm text-ink mt-1">{visit.soap_notes}</p>}
      {visit.lab_tests && <p className="text-xs text-ink-soft mt-1">Lab/Test: {visit.lab_tests}</p>}
      {visit.follow_up_date && (
        <p className="text-xs text-clay mt-1">அடுத்த வருகை: {new Date(visit.follow_up_date).toLocaleDateString()}</p>
      )}
      {visit.vitals && (visit.vitals.bp || visit.vitals.sugar || visit.vitals.weight) && (
        <div className="flex gap-4 mt-2 text-xs text-ink-soft">
          {visit.vitals.bp && <span>BP: {visit.vitals.bp}</span>}
          {visit.vitals.sugar && <span>Sugar: {visit.vitals.sugar}</span>}
          {visit.vitals.weight && <span>Weight: {visit.vitals.weight}</span>}
        </div>
      )}
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        <button onClick={() => setEditing(true)} className="text-[11px] text-brass-deep hover:text-ink underline underline-offset-2">
          திருத்து · Edit
        </button>
        {visit.status !== 'cancelled' && (
          <button onClick={() => onCancel(visit.id)} className="text-[11px] text-ink-soft hover:text-clay underline underline-offset-2">
            இந்த வருகையை ரத்து செய் · Cancel visit
          </button>
        )}
        <LastEdited createdAt={visit.created_at} updatedAt={visit.updated_at} />
      </div>
    </div>
  );
}

// ── Editable prescription card ──────────────────────────────────────
function PrescriptionCard({ rx, onSave }) {
  const [editing, setEditing] = useState(false);
  const [medicines, setMedicines] = useState(rx.medicines);
  const [advice, setAdvice] = useState(rx.advice || '');

  const updateMed = (i, field, value) => {
    setMedicines((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  };

  const handleSave = async () => {
    await onSave(rx.id, { medicines: medicines.filter((m) => m.name.trim()), advice });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="chit px-5 py-4 space-y-2">
        {medicines.map((m, i) => {
          const dose = parseDose(m.dosage);
          const freq = parseFrequency(m.frequency);
          return (
            <div key={i} className="border-t border-ink/10 pt-2 first:border-t-0 first:pt-0">
              <input placeholder="Medicine" value={m.name} onChange={(e) => updateMed(i, 'name', e.target.value)}
                className="border border-ink/15 rounded px-2 py-1 text-sm w-full mb-1" />
              <div className="flex items-center gap-1.5 mb-1">
                <input type="tel" inputMode="decimal" placeholder="650" value={dose.amount}
                  onChange={(e) => updateMed(i, 'dosage', composeDose(e.target.value.replace(/[^\d.]/g, '').slice(0, 6), dose.unit))}
                  className="border border-ink/15 rounded px-2 py-1 text-xs w-16 text-center" />
                <select value={dose.unit} onChange={(e) => updateMed(i, 'dosage', composeDose(dose.amount, e.target.value))}
                  className="border border-ink/15 rounded px-1 py-1 text-xs bg-white">
                  {DOSE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                {['morning', 'afternoon', 'night'].map((key) => (
                  <input key={key} type="tel" inputMode="numeric" maxLength={1} placeholder="0" value={freq[key]}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 1);
                      const next = { ...freq, [key]: v };
                      updateMed(i, 'frequency', composeFrequency(next.morning, next.afternoon, next.night));
                    }}
                    className="border border-ink/15 rounded px-1 py-1 text-xs w-7 text-center" />
                ))}
              </div>
            </div>
          );
        })}
        <textarea placeholder="Advice" value={advice} onChange={(e) => setAdvice(e.target.value)}
          className="w-full border border-ink/15 rounded px-2 py-1.5 text-sm" rows={2} />
        <div className="flex gap-2">
          <button onClick={handleSave} className="flex-1 bg-ink text-cream rounded py-1.5 text-sm font-medium hover:bg-ink-soft">சேமி · Save</button>
          <button onClick={() => setEditing(false)} className="flex-1 border border-ink/15 rounded py-1.5 text-sm hover:bg-parchment">ரத்து · Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chit px-5 py-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-brass-deep">{new Date(rx.created_at).toLocaleDateString()}</div>
        <LastEdited createdAt={rx.created_at} updatedAt={rx.updated_at} />
      </div>
      <div className="text-sm text-ink">{rx.medicines.map((m) => m.name).join(', ')}</div>
      <button onClick={() => setEditing(true)} className="mt-1 text-[11px] text-brass-deep hover:text-ink underline underline-offset-2">
        திருத்து · Edit
      </button>
    </div>
  );
}

// ── Editable bill row ────────────────────────────────────────────
function BillRow({ bill, onSave }) {
  const [editing, setEditing] = useState(false);
  const [fee, setFee] = useState(bill.consultation_fee ?? '');
  const [other, setOther] = useState(bill.other_charges ?? '');
  const [discount, setDiscount] = useState(bill.discount ?? '');

  const handleSave = async () => {
    await onSave(bill.id, {
      consultation_fee: Number(fee || 0),
      other_charges: Number(other || 0),
      discount: Number(discount || 0),
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="chit px-5 py-3 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <input type="number" placeholder="Fee" value={fee} onChange={(e) => setFee(e.target.value)}
            className="border border-ink/15 rounded px-2 py-1 text-sm" />
          <input type="number" placeholder="Other" value={other} onChange={(e) => setOther(e.target.value)}
            className="border border-ink/15 rounded px-2 py-1 text-sm" />
          <input type="number" placeholder="Discount" value={discount} onChange={(e) => setDiscount(e.target.value)}
            className="border border-ink/15 rounded px-2 py-1 text-sm" />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} className="flex-1 bg-ink text-cream rounded py-1.5 text-sm font-medium hover:bg-ink-soft">சேமி · Save</button>
          <button onClick={() => setEditing(false)} className="flex-1 border border-ink/15 rounded py-1.5 text-sm hover:bg-parchment">ரத்து · Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chit flex justify-between items-center px-5 py-3">
      <a href={`${import.meta.env.VITE_API_BASE_URL}/api/billing/${bill.id}/pdf`} target="_blank" rel="noreferrer" className="hover:opacity-80">
        <div className="text-xs text-brass-deep">{new Date(bill.created_at).toLocaleDateString()}</div>
        {bill.invoice_number && <div className="text-xs text-ink-soft">ரசீது #{bill.invoice_number}</div>}
      </a>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className={`text-xs uppercase ${bill.payment_status === 'paid' ? 'text-sage' : 'text-clay'}`}>{bill.payment_status}</div>
          <div className="font-medium text-ink">₹{Number(bill.amount).toLocaleString('en-IN')}</div>
        </div>
        <button onClick={() => setEditing(true)} className="text-[11px] text-brass-deep hover:text-ink underline underline-offset-2 whitespace-nowrap">
          திருத்து
        </button>
      </div>
    </div>
  );
}

export default function PatientDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { patient, reload, updateProfile } = usePatientDetail(id);
  const { addVisit, updateVisitStatus, updateVisit } = useVisits(id);
  const { lastRx, createPrescription, sharePrescription, updatePrescription } = usePrescriptions(id);
  const { recordPayment, updateBilling } = useBilling();

  const [chiefComplaint, setChiefComplaint] = useState('');
  const queueVitals = location.state?.vitals || {};
  const [bp, setBp] = useState(() => parseBP(queueVitals.bp));
  const [sugar, setSugar] = useState(() => {
    const parsed = parseSugar(queueVitals.sugar);
    return { value: parsed.value, type: parsed.type || 'Fasting' };
  });
  const [weight, setWeight] = useState(() => parseWeight(queueVitals.weight));

  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [labTests, setLabTests] = useState('');
  const [followUpText, setFollowUpText] = useState('');
  const followUpDate = dmyToISO(followUpText);
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
        vitals: {
          bp: composeBP(bp.systolic, bp.diastolic),
          sugar: composeSugar(sugar.value, sugar.type),
          weight: composeWeight(weight),
        },
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
      setFollowUpText('');
      setAdvice('');
      setBp({ systolic: '', diastolic: '' });
      setSugar({ value: '', type: 'Fasting' });
      setWeight('');
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

  const handleEditVisit = async (visitId, patch) => {
    await updateVisit(visitId, patch);
    reload();
  };

  const handleEditPrescription = async (rxId, patch) => {
    await updatePrescription(rxId, patch);
    reload();
  };

  const handleEditBill = async (billId, patch) => {
    await updateBilling(billId, patch);
    reload();
  };

  if (!patient) return null;

  return (
    <div>
      <Header title={patient.name} subtitle={`${patient.phone || '—'} · ${patient.age || '—'} y · ${patient.gender || '—'}`} />

      <PatientProfile patient={patient} onSave={async (patch) => { await updateProfile(patch); }} />

      <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-lg text-ink mb-3">வருகை வரலாறு · Visit Timeline</h2>
            <div className="space-y-3">
              {(patient.recent_visits || []).length === 0 && (
                <p className="text-sm text-ink-soft">முந்தைய வருகைகள் இல்லை.</p>
              )}
              {(patient.recent_visits || []).map((v) => (
                <VisitCard key={v.id} visit={v} onSave={handleEditVisit} onCancel={handleCancelVisit} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg text-ink mb-3">மருந்துச் சீட்டு வரலாறு · Prescription History</h2>
            <div className="space-y-2">
              {(patient.prescriptions || []).map((rx) => (
                <PrescriptionCard key={rx.id} rx={rx} onSave={handleEditPrescription} />
              ))}
              {(patient.prescriptions || []).length === 0 && <p className="text-sm text-ink-soft">சீட்டுகள் இல்லை.</p>}
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg text-ink mb-3">கட்டண வரலாறு · Payment History</h2>
            <div className="space-y-2">
              {(patient.bills || []).map((b) => (
                <BillRow key={b.id} bill={b} onSave={handleEditBill} />
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
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-soft w-24">BP (mmHg)</span>
                <input type="tel" inputMode="numeric" placeholder="130" value={bp.systolic}
                  onChange={(e) => setBp({ ...bp, systolic: onlyDigits(e.target.value, 3) })}
                  className="border border-ink/15 rounded px-2 py-1.5 text-sm w-16 text-center" />
                <span className="text-ink-soft">/</span>
                <input type="tel" inputMode="numeric" placeholder="80" value={bp.diastolic}
                  onChange={(e) => setBp({ ...bp, diastolic: onlyDigits(e.target.value, 3) })}
                  className="border border-ink/15 rounded px-2 py-1.5 text-sm w-16 text-center" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-soft w-24">Sugar (mg/dL)</span>
                <input type="tel" inputMode="numeric" placeholder="110" value={sugar.value}
                  onChange={(e) => setSugar({ ...sugar, value: onlyDigits(e.target.value, 3) })}
                  className="border border-ink/15 rounded px-2 py-1.5 text-sm w-16 text-center" />
                <select value={sugar.type} onChange={(e) => setSugar({ ...sugar, type: e.target.value })}
                  className="border border-ink/15 rounded px-2 py-1.5 text-sm bg-white">
                  {SUGAR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-soft w-24">Weight</span>
                <input type="tel" inputMode="decimal" placeholder="68" value={weight}
                  onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, '').slice(0, 5))}
                  className="border border-ink/15 rounded px-2 py-1.5 text-sm w-16 text-center" />
                <span className="text-sm text-ink-soft">kg</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-ink-soft">அடுத்த வருகை · Follow-up (DD/MM/YYYY)</label>
              <input
                type="text" inputMode="numeric" maxLength={10} placeholder="23/05/2026"
                value={followUpText}
                onChange={(e) => setFollowUpText(formatDateInput(e.target.value))}
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

              {medicines.map((m, i) => {
                const dose = parseDose(m.dosage);
                const freq = parseFrequency(m.frequency);
                return (
                  <div key={i} className="border-t border-ink/10 pt-2 mb-3 first:border-t-0 first:pt-0">
                    <input placeholder="Medicine name" value={m.name}
                      onChange={(e) => updateMedicine(i, 'name', e.target.value)}
                      className="border border-ink/15 rounded px-2 py-1.5 text-sm w-full mb-2" />

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] text-ink-soft w-16">அளவு · Dose</span>
                      <input type="tel" inputMode="decimal" placeholder="650" value={dose.amount}
                        onChange={(e) => updateMedicine(i, 'dosage', composeDose(e.target.value.replace(/[^\d.]/g, '').slice(0, 6), dose.unit))}
                        className="border border-ink/15 rounded px-2 py-1.5 text-sm w-20 text-center" />
                      <select value={dose.unit}
                        onChange={(e) => updateMedicine(i, 'dosage', composeDose(dose.amount, e.target.value))}
                        className="border border-ink/15 rounded px-2 py-1.5 text-sm bg-white">
                        {DOSE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-ink-soft w-16">வேளை</span>
                      <div className="flex items-center gap-1">
                        {[
                          { key: 'morning', label: 'கா', val: freq.morning },
                          { key: 'afternoon', label: 'ம', val: freq.afternoon },
                          { key: 'night', label: 'இ', val: freq.night },
                        ].map((slot, idx) => (
                          <div key={slot.key} className="flex items-center">
                            {idx > 0 && <span className="text-ink-soft mx-0.5">-</span>}
                            <div className="text-center">
                              <input
                                type="tel" inputMode="numeric" maxLength={1} placeholder="0" value={slot.val}
                                onChange={(e) => {
                                  const v = e.target.value.replace(/\D/g, '').slice(0, 1);
                                  const next = { ...freq, [slot.key]: v };
                                  updateMedicine(i, 'frequency', composeFrequency(next.morning, next.afternoon, next.night));
                                }}
                                className="border border-ink/15 rounded px-1 py-1.5 text-sm w-9 text-center" />
                              <div className="text-[9px] text-ink-soft mt-0.5">{slot.label}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <span className="text-[10px] text-ink-soft">காலை-மதியம்-இரவு</span>
                    </div>
                  </div>
                );
              })}
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
