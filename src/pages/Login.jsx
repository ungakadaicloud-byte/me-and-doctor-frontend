import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/logo.png';

export default function Login() {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch (err) {
      console.error('sendMagicLink failed:', err);
      setError('இணைப்பை அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.');
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

        {sent ? (
          <div className="text-center space-y-2">
            <p className="text-sm text-ink">
              <span className="font-tamil">{email}</span> க்கு உள்நுழை இணைப்பு அனுப்பப்பட்டது.
            </p>
            <p className="text-xs text-ink-soft">மின்னஞ்சலைத் திறந்து இணைப்பைத் தொடவும் · Check your email and click the link to log in.</p>
            <button
              onClick={() => setSent(false)}
              className="text-xs text-brass-deep underline underline-offset-2 mt-4"
            >
              வேறு மின்னஞ்சலைப் பயன்படுத்த · Use a different email
            </button>
          </div>
        ) : (
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
              உள்நுழை இணைப்பு அனுப்பு · Send Login Link
            </button>
          </form>
        )}

        <p className="text-center text-xs text-ink-soft mt-6">
          புதிய கிளினிக்-ஆ? மின்னஞ்சலை மேலே பதிவு செய்யுங்க, மீதி நாங்க பார்த்துக்குறோம் · New clinic? Just enter your email above — we'll set you up after you click the link.
        </p>
      </div>
    </div>
  );
}
