import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const links = [
  { to: '/', label: 'முகப்பு', sub: 'Dashboard' },
  { to: '/queue', label: 'இன்றைய வரிசை', sub: "Today's Queue" },
  { to: '/patients', label: 'நோயாளிகள்', sub: 'Patients' },
  { to: '/billing', label: 'வரவு', sub: 'Billing' },
  { to: '/reports', label: 'அறிக்கைகள்', sub: 'Reports' },
  { to: '/settings', label: 'அமைப்புகள்', sub: 'Settings' },
];

// `open`/`onClose` only matter below the md breakpoint — on desktop,
// `md:translate-x-0` always shows the sidebar regardless of `open`,
// so this component's desktop rendering is unchanged from before.
export default function Sidebar({ open, onClose }) {
  const { logout } = useAuth();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-56 shrink-0 bg-ink text-cream min-h-screen flex flex-col
        transform transition-transform duration-200 ease-in-out
        md:static md:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="px-5 py-6 border-b border-white/10">
        <div className="font-display text-lg tracking-wide">Me &amp; Doctor</div>
        <div className="text-xs text-brass mt-0.5 font-tamil">Clinic OS</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `block rounded px-3 py-2.5 transition-colors ${
                isActive ? 'bg-brass text-ink' : 'hover:bg-white/10 text-cream'
              }`
            }
          >
            <div className="font-tamil text-sm">{l.label}</div>
            <div className="text-[11px] opacity-70">{l.sub}</div>
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => { logout(); onClose?.(); }}
        className="mx-3 mb-5 text-left text-xs text-cream/60 hover:text-clay px-3 py-2"
      >
        வெளியேறு · Sign out
      </button>
    </aside>
  );
}
