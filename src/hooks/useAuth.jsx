import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Picks up an existing session on load, and also handles the
    // magic-link redirect: supabase-js auto-parses the tokens from the
    // URL (detectSessionInUrl defaults to true) and fires this listener
    // once that's done.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Sends the magic link. `redirectTo` should point at /auth/callback
  // so the app can decide whether to send the person to the dashboard
  // or to onboarding, once the session is established.
  const sendMagicLink = useCallback(async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }, []);

  // Doctor onboarding: session already exists at this point (person
  // clicked the magic link) — this just creates the clinic/doctor rows
  // via the backend, which reads the session from the Authorization
  // header that api.js already attaches.
  const onboard = useCallback(async (details) => {
    const { data } = await api.post('/api/auth/onboard', details);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, sendMagicLink, onboard, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
