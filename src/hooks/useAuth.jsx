import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Sends a 6-digit code to the doctor's email.
  //
  // This replaced magic links: a magic link can only complete in the
  // same browser storage that requested it, and on a phone the link
  // almost always opens somewhere else (Gmail's in-app browser, a
  // fresh Chrome tab, a copied-and-pasted URL) — so the session could
  // never be established. A typed code has no such dependency: it's
  // entered in the same tab that asked for it.
  const sendOtp = useCallback(async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  }, []);

  const verifyOtp = useCallback(async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
    setSession(data.session);
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
    <AuthContext.Provider value={{ session, loading, sendOtp, verifyOtp, onboard, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
