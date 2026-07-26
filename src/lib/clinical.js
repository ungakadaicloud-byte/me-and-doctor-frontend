// Shared helpers for structured clinical entry.
//
// These formats are not cosmetic: a bare "650" dosage with no unit, or a
// sugar reading with no fasting/PP/random context, is genuinely unsafe on
// a prescription. Each field is captured as separate constrained parts
// and composed into the single string the API already stores, so nothing
// downstream (PDFs, timeline, repeat-Rx) has to change.

export const SUGAR_TYPES = ['Fasting', 'PP', 'Random'];
export const DOSE_UNITS = ['mg', 'g', 'ml', 'IU', 'drops'];

// "130/80" <-> { systolic, diastolic }
export function composeBP(systolic, diastolic) {
  if (!systolic && !diastolic) return '';
  return `${systolic || ''}/${diastolic || ''}`;
}
export function parseBP(value = '') {
  const [systolic = '', diastolic = ''] = String(value).split('/');
  return { systolic: systolic.trim(), diastolic: diastolic.trim() };
}

// "110 (Fasting)" <-> { value, type }
export function composeSugar(value, type) {
  if (!value) return '';
  return type ? `${value} (${type})` : String(value);
}
export function parseSugar(raw = '') {
  const match = String(raw).match(/^\s*(\d+)\s*(?:\((.+)\))?\s*$/);
  if (!match) return { value: '', type: '' };
  return { value: match[1], type: match[2] || '' };
}

// "68 kg" <-> "68"
export function composeWeight(value) {
  return value ? `${value} kg` : '';
}
export function parseWeight(raw = '') {
  const match = String(raw).match(/(\d+(?:\.\d+)?)/);
  return match ? match[1] : '';
}

// "650 mg" <-> { amount, unit }
export function composeDose(amount, unit) {
  if (!amount) return '';
  return `${amount} ${unit || 'mg'}`;
}
export function parseDose(raw = '') {
  const match = String(raw).match(/^\s*(\d+(?:\.\d+)?)\s*(\w+)?/);
  if (!match) return { amount: '', unit: 'mg' };
  return { amount: match[1], unit: match[2] || 'mg' };
}

// "1-1-2" <-> { morning, afternoon, night } — the notation Indian
// doctors actually write: dose count at morning-afternoon-night.
export function composeFrequency(morning, afternoon, night) {
  if (!morning && !afternoon && !night) return '';
  return `${morning || 0}-${afternoon || 0}-${night || 0}`;
}
export function parseFrequency(raw = '') {
  const parts = String(raw).split('-');
  return {
    morning: parts[0]?.trim() || '',
    afternoon: parts[1]?.trim() || '',
    night: parts[2]?.trim() || '',
  };
}

// DD/MM/YYYY typed entry -> ISO, with auto-inserted separators. Used for
// both date of birth and follow-up date so date entry is consistent
// everywhere instead of mixing typed fields and calendar pickers.
export function formatDateInput(text) {
  const digits = String(text).replace(/\D/g, '').slice(0, 8);
  if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}
export function dmyToISO(text) {
  const match = String(text).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}
