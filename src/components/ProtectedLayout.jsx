import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from './Sidebar';

export default function ProtectedLayout() {
  const { session, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return null; // avoid a flash-redirect while the session is still being read
  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Tap-outside-to-close overlay — mobile only (md:hidden), and
          only rendered while the sidebar is actually open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile-only top bar with hamburger — hidden entirely on
            desktop (md:hidden). Changed from `sticky` to `fixed`:
            `sticky` only locks vertical position, so a page with
            horizontal overflow (e.g. a wide row of buttons) could
            scroll the whole bar off to the side, hiding the menu
            button. `fixed` locks it to the viewport in both directions
            regardless of any page's own layout. */}
        <div className="md:hidden fixed top-0 left-0 right-0 flex items-center gap-3 px-4 py-3 border-b border-ink/10 bg-cream z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="text-ink p-1 -ml-1"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="font-display text-sm text-ink">Me &amp; Doctor</span>
        </div>

        <main className="flex-1 pt-14 md:pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
