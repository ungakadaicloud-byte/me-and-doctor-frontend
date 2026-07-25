import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { useAndroidBackButton } from './hooks/useAndroidBackButton';
import ProtectedLayout from './components/ProtectedLayout';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Queue from './pages/Queue';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import Reports from './pages/Reports';

// Separated from App() because useAndroidBackButton needs
// react-router's navigate/location, which only exist inside
// <BrowserRouter> — App() itself renders the router, so it can't
// call the hook directly.
function AppRoutes() {
  useAndroidBackButton();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/queue" element={<Queue />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
