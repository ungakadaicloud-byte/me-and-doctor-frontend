import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import api from '../lib/api';

const AuthContext = createContext(null);

// Supabase Auth's identifier field is always "email" internally, even
// though doctors only ever see and type a phone number. This composes
// a stable, fake-but-valid email from the phone digits so nothing
// about signup/login/reset depends on any real email inbox existing —
// which is the entire category of bug (delivery, templates, in-app
// browsers swallowing links) that cost three hours earlier.
const PSEUDO_EMAIL_DOMAIN = 'meanddoctor.internal';
function phoneToPseudoEmail(phone) {
  return `${phone.replace(/\D/g, '')}@${PSEUDO_EMAIL_DOMAIN}`;
}

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

  const signIn = useCallback(async (phone, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: phoneToPseudoEmail(phone),
      password,
    });
    if (error) throw error;
    setSession(data.session);
    return data.session;
  }, []);

  const signUp = useCallback(async (phone, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: phoneToPseudoEmail(phone),
      password,
    });
    if (error) throw error;
    const alreadyRegistered = Array.isArray(data.user?.identities) && data.user.identities.length === 0;
    if (data.session) setSession(data.session);
    return { session: data.session, user: data.user, alreadyRegistered };
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
