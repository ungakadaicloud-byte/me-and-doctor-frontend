import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import logo from '../assets/logo.png';

export default function Login() {
  const { sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState('email'); // email -> code
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await sendOtp(email);
      setStage('code');
    } catch (err) {
      console.error('sendOtp failed:', err);
      setError('குறியீட்டை அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await verifyOtp(email, code);
      // Existing doctor goes to the dashboard; a brand-new one has no
      // clinic row yet and needs to finish onboarding first.
      try {
        await api.get('/api/clinic');
        navigate('/');
      } catch (err) {
        if (err.response?.status === 403 && err.response.data?.error === 'no_clinic_for_user') {
          navigate('/onboarding');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      console.error('verifyOtp failed:', err);
      setError('தவறான குறியீடு. மீண்டும் முயற்சிக்கவும்.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="chit w-full max-w-sm px-8 py-10 mb-4">
        <div className="text-center mb-8">
          <img src={logo} alt="Me & Doctor" className="w-20 h-20 mx-auto mb-3 object-contain" />
          <div className="font-display text-2xl text-ink">Me &amp; Doctor</div>
          <div className="font-tamil text-sm text-brass-deep mt-1">Clinic OS</div>
        </div>

        {stage === 'email' ? (
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="text-xs text-ink-soft font-tamil">மின்னஞ்சல் முகவரி · Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@clinic.com"
                className="mt-1 w-full border border-ink/15 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass"
              />
            </div>
            {error && <p className="text-clay text-xs">{error}</p>}
            <button
              disabled={busy || !email}
              className="w-full bg-ink text-cream rounded py-2.5 font-medium hover:bg-ink-soft disabled:opacity-50"
            >
              {busy ? 'அனுப்புகிறது...' : 'குறியீடு அனுப்பு · Send Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-xs text-ink-soft text-center">
              <span className="font-medium text-ink">{email}</span> க்கு 6-இலக்க குறியீடு அனுப்பப்பட்டது.
            </p>
            <div>
              <label className="text-xs text-ink-soft font-tamil">குறியீடு · Code</label>
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="______"
                className="mt-1 w-full border border-ink/15 rounded px-3 py-2 tracking-[0.5em] text-center text-lg focus:outline-none focus:ring-2 focus:ring-brass"
              />
              <div className="text-[11px] text-ink-soft mt-1 text-center">{code.length}/6</div>
            </div>
            {error && <p className="text-clay text-xs">{error}</p>}
            <button
              disabled={busy || code.length !== 6}
              className="w-full bg-ink text-cream rounded py-2.5 font-medium hover:bg-ink-soft disabled:opacity-50"
            >
              {busy ? 'சரிபார்க்கிறது...' : 'உள்நுழை · Log In'}
            </button>
            <button
              type="button"
              onClick={() => { setStage('email'); setCode(''); setError(''); }}
              className="w-full text-xs text-brass-deep underline underline-offset-2"
            >
              வேறு மின்னஞ்சலைப் பயன்படுத்த · Use a different email
            </button>
          </form>
        )}

        <p className="text-center text-xs text-ink-soft mt-6">
          புதிய கிளினிக்-ஆ? மின்னஞ்சலை மேலே பதிவு செய்யுங்க, மீதி நாங்க பார்த்துக்குறோம் · New clinic? Just enter your email above.
        </p>
      </div>
    </div>
  );
}
