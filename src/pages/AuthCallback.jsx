import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import api from '../lib/api';

const MAX_API_ATTEMPTS = 3;
const API_RETRY_DELAY_MS = 1500;
// Supabase parses the magic-link token out of the URL asynchronously.
// The previous version checked for a session on the very first render
// and immediately showed "link didn't work" if it wasn't there yet —
// which it never is, because parsing hasn't finished. This waits for
// the session to actually arrive before deciding anything failed.
const SESSION_WAIT_MS = 8000;

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const attemptRef = useRef(0);
  const settledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timeoutId;

    // Once a session exists, decide where the doctor lands: dashboard
    // if their clinic is already set up, onboarding if it isn't.
    const routeWithSession = () => {
      attemptRef.current += 1;
      api.get('/api/clinic')
        .then(() => { if (!cancelled) navigate('/'); })
        .catch((err) => {
          if (cancelled) return;

          if (err.response?.status === 403 && err.response.data?.error === 'no_clinic_for_user') {
            navigate('/onboarding');
            return;
          }

          // Backend cold starts can make the first call fail even though
          // the session itself is fine — retry before showing an error.
          if (attemptRef.current < MAX_API_ATTEMPTS) {
            setRetrying(true);
            setTimeout(routeWithSession, API_RETRY_DELAY_MS);
          } else {
            setError('ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.');
          }
        });
    };

    const settle = (session) => {
      if (settledRef.current || cancelled) return;
      settledRef.current = true;
      clearTimeout(timeoutId);
      if (session) routeWithSession();
    };

    // Fires when supabase-js finishes parsing the token out of the URL.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) settle(session);
    });

    // Covers the case where the session was already established before
    // this component mounted (listener wouldn't fire again).
    (async () => {
      // PKCE-style links arrive as ?code=... and need an explicit
      // exchange; implicit-style links arrive as #access_token=... and
      // are handled automatically by detectSessionInUrl.
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        try {
          const { data } = await supabase.auth.exchangeCodeForSession(code);
          if (data?.session) { settle(data.session); return; }
        } catch {
          // Fall through — the listener may still deliver a session.
        }
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) settle(data.session);
    })();

    // Only after genuinely waiting do we conclude the link failed.
    timeoutId = setTimeout(() => {
      if (settledRef.current || cancelled) return;
      settledRef.current = true;
      setError('உள்நுழை இணைப்பு வேலை செய்யவில்லை. மீண்டும் முயற்சிக்கவும்.');
    }, SESSION_WAIT_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

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
