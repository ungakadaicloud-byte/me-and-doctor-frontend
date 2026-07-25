import axios from 'axios';
import { supabase } from './supabaseClient';

const baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  // Without this guard, a missing env var silently resolves fetches
  // as relative paths on the frontend's own domain, returning HTML
  // 404 pages instead of JSON — a real bug hit on Me & Coach's launch.
  throw new Error(
    'VITE_API_BASE_URL is not set. Check your Vercel build environment variables.'
  );
}

const api = axios.create({ baseURL });

api.interceptors.request.use(async (config) => {
  // Reads the current session fresh on every request rather than a
  // stale localStorage value — supabase-js auto-refreshes the token
  // in the background, so this always sends a still-valid one.
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } else if (err.response?.status === 403 && err.response.data?.error === 'no_clinic_for_user') {
      // Valid session, but this person hasn't finished clinic
      // onboarding yet — send them to finish it instead of showing
      // broken protected pages.
      window.location.href = '/onboarding';
    }
    return Promise.reject(err);
  }
);

export default api;
