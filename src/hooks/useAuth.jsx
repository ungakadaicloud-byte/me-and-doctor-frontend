import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import api from '../lib/api';

const AuthContext = createContext(null);

// True when the current URL carries an auth payload Supabase still has
// to process (an email-confirmation link, a recovery link, etc). While
// that's pending, getSession() legitimately returns null — so treating
// that null as "not logged in" would bounce the user straight back to
// the login page a split second after they arrived.
function urlHasAuthPayload() {
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  return hash.includes('access_token') || hash.includes('error_description') || search.includes('code=');
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let settled = false;
    let fallbackTimer;

    const finish = (newSession) => {
      settled = true;
      clearTimeout(fallbackTimer);
      setSession(newSession);
      setLoading(false);
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Always keep the live session in sync, including sign-out.
      setSession(newSession);
      if (newSession && !settled) finish(newSession);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { finish(data.session); return; }

      // No session yet. If the URL is mid-auth, wait for the listener
      // rather than declaring the user logged out immediately.
      if (urlHasAuthPayload()) {
        fallbackTimer = setTimeout(() => { if (!settled) finish(null); }, 8000);
      } else {
        finish(null);
      }
    });

    return () => {
      clearTimeout(fallbackTimer);
      listener.subscription.unsubscribe();
    };
  }, []);

  // Email + password, deliberately chosen over magic links and emailed
  // OTP codes. Both of those depend on email delivery, Supabase email
  // templates, and (for magic links) the session completing in the very
  // same browser storage that requested it — which on a phone it almost
  // never does, because the link opens in Gmail's in-app browser or a
  // fresh tab. Password auth needs none of that: it's a single API call
  // that completes in the tab the doctor is already looking at.
  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setSession(data.session);
    return data.session;
  }, []);

  const signUp = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // With "Confirm email" disabled in Supabase, signUp returns a live
    // session immediately and the doctor goes straight to onboarding.
    if (data.session) setSession(data.session);
    return data.session;
  }, []);

  const onboard = useCallback(async (details) => {
    const { data } = await api.post('/api/auth/onboard', details);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, onboard, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
