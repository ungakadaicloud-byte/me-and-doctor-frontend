import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

export default function AuthCallback() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const attemptRef = useRef(0);

  useEffect(() => {
    if (loading) return; // wait for supabase-js to finish parsing the URL

    if (!session) {
      // Link expired, already used, or something went wrong.
      setError('உள்நுழை இணைப்பு வேலை செய்யவில்லை. மீண்டும் முயற்சிக்கவும்.');
      return;
    }

    let cancelled = false;

    // Retries a few times before showing an error — the backend can be
    // slow to respond right after a cold start (Railway's free/hobby
    // plan sleeps idle services), which previously showed a scary error
    // on the very first login attempt even though the session itself
    // was fine and a second click always worked.
    const attempt = () => {
      attemptRef.current += 1;
      api.get('/api/clinic')
        .then(() => { if (!cancelled) navigate('/'); })
        .catch((err) => {
          if (cancelled) return;

          if (err.response?.status === 403 && err.response.data?.error === 'no_clinic_for_user') {
            navigate('/onboarding');
            return;
          }

          if (attemptRef.current < MAX_ATTEMPTS) {
            setRetrying(true);
            setTimeout(attempt, RETRY_DELAY_MS);
          } else {
            setError('ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.');
          }
        });
    };

    attempt();
    return () => { cancelled = true; };
  }, [session, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="chit px-8 py-10 text-center max-w-sm w-full">
        {error ? (
          <>
            <p className="text-clay text-sm mb-4">{error}</p>
            <a href="/login" className="text-xs text-brass-deep underline underline-offset-2">உள்நுழைவுக்குத் திரும்பு · Back to Login</a>
          </>
        ) : (
          <p className="text-sm text-ink-soft">
            {retrying ? 'இன்னும் கொஞ்சம்... · Almost there...' : 'சரிபார்க்கிறது... · Verifying...'}
          </p>
        )}
      </div>
    </div>
  );
}
