import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import logo from '../assets/logo.png';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // login | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  // After auth succeeds: existing doctor -> dashboard, brand-new
  // account (no clinic row yet) -> onboarding.
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
      if (mode === 'signup') {
        if (password.length < 6) {
          setError('கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்.');
          return;
        }
        const newSession = await signUp(email, password);
        // With "Confirm email" enabled in Supabase, signUp returns no
        // session — the account exists but can't be used until the
        // emailed link is clicked. Say so plainly instead of pushing
        // the user into a protected route that will bounce them back.
        if (!newSession) {
          setError('');
          setInfo('கணக்கு உருவாக்கப்பட்டது. மின்னஞ்சலைத் திறந்து உறுதிசெய்து, பிறகு உள்நுழையுங்கள்.');
          setMode('login');
          setPassword('');
          return;
        }
      } else {
        await signIn(email, password);
      }
      await routeAfterAuth();
    } catch (err) {
      console.error(`${mode} failed:`, err);
      const msg = err?.message || '';
      if (/already registered|already exists/i.test(msg)) {
        setError('இந்த மின்னஞ்சல் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது. உள்நுழையுங்கள்.');
      } else if (/email not confirmed/i.test(msg)) {
        setError('மின்னஞ்சல் இன்னும் உறுதிசெய்யப்படவில்லை. மின்னஞ்சலில் உள்ள இணைப்பைத் தொடவும்.');
      } else if (/invalid login credentials/i.test(msg)) {
        setError('மின்னஞ்சல் அல்லது கடவுச்சொல் தவறு.');
      } else {
        // Shows the underlying message rather than swallowing it — a
        // generic "something went wrong" made every distinct failure
        // look identical and impossible to diagnose.
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

        <div className="flex mb-6 bg-parchment rounded p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setInfo(''); }}
            className={`flex-1 py-2 rounded text-sm font-medium ${mode === 'login' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'}`}
          >
            உள்நுழை · Log In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); setInfo(''); }}
            className={`flex-1 py-2 rounded text-sm font-medium ${mode === 'signup' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'}`}
          >
            பதிவு · Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-ink-soft font-tamil">மின்னஞ்சல் · Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@clinic.com"
              className="mt-1 w-full border border-ink/15 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass"
            />
          </div>
          <div>
            <label className="text-xs text-ink-soft font-tamil">கடவுச்சொல் · Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="mt-1 w-full border border-ink/15 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brass"
            />
            {mode === 'signup' && (
              <div className="text-[11px] text-ink-soft mt-1">குறைந்தது 6 எழுத்துகள் · At least 6 characters</div>
            )}
          </div>
          {info && <p className="text-sage text-xs">{info}</p>}
          {error && <p className="text-clay text-xs">{error}</p>}
          <button
            disabled={busy || !email || !password}
            className="w-full bg-ink text-cream rounded py-2.5 font-medium hover:bg-ink-soft disabled:opacity-50"
          >
            {busy
              ? (mode === 'signup' ? 'பதிவு செய்கிறது...' : 'உள்நுழைகிறது...')
              : (mode === 'signup' ? 'கணக்கு உருவாக்கு · Create Account' : 'உள்நுழை · Log In')}
          </button>
        </form>

        <p className="text-center text-xs text-ink-soft mt-6">
          {mode === 'login'
            ? 'புதிய கிளினிக்-ஆ? மேலே "பதிவு" தேர்ந்தெடுங்க · New clinic? Choose Sign Up above.'
            : 'ஏற்கனவே கணக்கு இருக்கா? மேலே "உள்நுழை" தேர்ந்தெடுங்க · Already have an account? Choose Log In.'}
        </p>
      </div>
    </div>
  );
}
