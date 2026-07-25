import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';

export default function AuthCallback() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return; // wait for supabase-js to finish parsing the URL

    if (!session) {
      // Link expired, already used, or something went wrong.
      setError('Login link வேலை செய்யவில்லை. மீண்டும் முயற்சிக்கவும்.');
      return;
    }

    // Session exists — figure out if this person already has a clinic
    // (existing doctor) or needs to onboard (brand new).
    api.get('/api/clinic')
      .then(() => navigate('/'))
      .catch((err) => {
        if (err.response?.status === 403 && err.response.data?.error === 'no_clinic_for_user') {
          navigate('/onboarding');
        } else {
          setError('ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.');
        }
      });
  }, [session, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="chit px-8 py-10 text-center max-w-sm w-full">
        {error ? (
          <>
            <p className="text-clay text-sm mb-4">{error}</p>
            <a href="/login" className="text-xs text-brass-deep underline underline-offset-2">Login-க்குத் திரும்பு · Back to Login</a>
          </>
        ) : (
          <p className="text-sm text-ink-soft">சரிபார்க்கிறது... · Verifying...</p>
        )}
      </div>
    </div>
  );
}
