import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import logo from '../assets/logo.png';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // login | signup
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const handlePhoneChange = (e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));

  const routeAfterAuth = async () => {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (phone.length !== 10) {
        setError('10 இலக்க மொபைல் எண் கொடுங்கள்.');
        return;
      }
      if (mode === 'signup') {
        if (password.length < 6) {
          setError('கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்.');
          return;
        }
        const { session: newSession, alreadyRegistered } = await signUp(phone, password);
        if (alreadyRegistered) {
          setError('இந்த மொபைல் எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது. உள்நுழையுங்கள்.');
          setMode('login');
          setPassword('');
          return;
        }
        if (!newSession) {
          setInfo('கணக்கு உருவாக்கப்பட்டது. Support-ஐ தொடர்பு கொள்ளவும்.');
          setMode('login');
          setPassword('');
          return;
        }
      } else {
        await signIn(phone, password);
      }
      await routeAfterAuth();
    } catch (err) {
      console.error(`${mode} failed`, { code: err?.code, status: err?.status, message: err?.message });
      const msg = err?.message || '';
      if (/already registered|already exists/i.test(msg)) {
        setError('இந்த மொபைல் எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது. உள்நுழையுங்கள்.');
      } else if (/invalid login credentials/i.test(msg)) {
        setError('மொபைல் எண் அல்லது கடவுச்சொல் தவறு.');
      } else {
        setError(msg || 'முடியவில்லை. மீண்டும் முயற்சிக்கவும்.');
      }
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-ink-soft font-tamil">மொபைல் எண் · Phone Number</label>
            <input
              type="tel" inputMode="numeric" required maxLength={10}
              value={phone} onChange={handlePhoneChange}
              placeholder="98xxxxxxxx"
              className="mt-1 w-full border border-ink/15 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass"
            />
          </div>
          <div>
            <label className="text-xs text-ink-soft font-tamil">கடவுச்சொல் · Password</label>
            <input
              type="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="mt-1 w-full border border-ink/15 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass"
            />
            {mode === 'signup' && (
              <div className="text-[11px] text-ink-soft mt-1">குறைந்தது 6 எழுத்துகள்</div>
            )}
          </div>
          {info && <p className="text-sage text-xs">{info}</p>}
          {error && <p className="text-clay text-xs">{error}</p>}
          <button
            disabled={busy || phone.length !== 10 || !password}
            className="w-full bg-ink text-cream rounded py-2.5 font-medium hover:bg-ink-soft disabled:opacity-50"
          >
            {busy
              ? (mode === 'signup' ? 'பதிவு செய்கிறது...' : 'உள்நுழைகிறது...')
              : (mode === 'signup' ? 'கணக்கு உருவாக்கு · Create Account' : 'உள்நுழை · Log In')}
          </button>
        </form>

        {/* Password reset is handled by support (call the registered
            phone number), not a self-service email link — there's no
            real inbox behind the pseudo-email, and this matches how
            the team already plans to handle it during the manual/
            onboarding phase. */}
        <p className="text-center text-xs text-ink-soft mt-4">
          கடவுச்சொல் மறந்துவிட்டதா? Support-ஐ அழையுங்கள்.
        </p>

        {/* Sign Up kept as a small secondary link rather than an
            equal-weight tab — during the manual-onboarding phase,
            "Log In" is the action almost every visitor needs; making
            Sign Up visually loud invited accidental self-registration. */}
        <p className="text-center text-xs text-ink-soft mt-6">
          {mode === 'login' ? (
            <>புதிய கிளினிக்-ஆ? <button type="button" onClick={() => { setMode('signup'); setError(''); setInfo(''); }} className="text-brass-deep underline underline-offset-2">பதிவு செய்யுங்கள்</button></>
          ) : (
            <>ஏற்கனவே கணக்கு இருக்கா? <button type="button" onClick={() => { setMode('login'); setError(''); setInfo(''); }} className="text-brass-deep underline underline-offset-2">உள்நுழையுங்கள்</button></>
          )}
        </p>
      </div>
    </div>
  );
}
