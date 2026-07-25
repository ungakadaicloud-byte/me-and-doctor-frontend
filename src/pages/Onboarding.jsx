import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.png';

export default function Onboarding() {
  const { session, loading, onboard } = useAuth();
  const navigate = useNavigate();
  const [details, setDetails] = useState({ doctor_name: '', qualification: '', clinic_name: '', clinic_address: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // This page assumes a session already exists (arrived here via the
  // magic-link callback). If someone lands here directly without one,
  // send them to Login instead.
  if (!loading && !session) return <Navigate to="/login" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onboard(details);
      navigate('/');
    } catch (err) {
      console.error('onboard failed:', err);
      const code = err?.response?.data?.error;
      if (code === 'doctor_already_exists') {
        setError('இந்த கணக்கு ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது.');
      } else {
        setError('பதிவு செய்ய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4 py-10">
      <div className="chit w-full max-w-sm px-8 py-10 mb-4">
        <div className="text-center mb-8">
          <img src={logo} alt="Me & Doctor" className="w-20 h-20 mx-auto mb-3 object-contain" />
          <div className="font-display text-2xl text-ink">Me &amp; Doctor</div>
          <div className="font-tamil text-sm text-brass-deep mt-1">புதிய கிளினிக் பதிவு · New Clinic</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input required placeholder="மருத்துவர் பெயர் · Doctor Name" value={details.doctor_name}
            onChange={(e) => setDetails({ ...details, doctor_name: e.target.value })}
            className="w-full border border-ink/15 rounded px-3 py-2 text-sm" />
          <input placeholder="பட்டம் · Qualification" value={details.qualification}
            onChange={(e) => setDetails({ ...details, qualification: e.target.value })}
            className="w-full border border-ink/15 rounded px-3 py-2 text-sm" />
          <input required placeholder="கிளினிக் பெயர் · Clinic Name" value={details.clinic_name}
            onChange={(e) => setDetails({ ...details, clinic_name: e.target.value })}
            className="w-full border border-ink/15 rounded px-3 py-2 text-sm" />
          <textarea placeholder="முகவரி · Address" value={details.clinic_address}
            onChange={(e) => setDetails({ ...details, clinic_address: e.target.value })}
            className="w-full border border-ink/15 rounded px-3 py-2 text-sm" rows={2} />
          {error && <p className="text-clay text-xs">{error}</p>}
          <button
            disabled={busy}
            className="w-full bg-ink text-cream rounded py-2.5 font-medium hover:bg-ink-soft disabled:opacity-50"
          >
            {busy ? 'உருவாக்குகிறது...' : 'கிளினிக் உருவாக்கு · Create Clinic'}
          </button>
        </form>
      </div>
    </div>
  );
}
