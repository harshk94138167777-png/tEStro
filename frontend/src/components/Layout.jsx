import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from './Sidebar.jsx';
import WarningBanner from './WarningBanner.jsx';
import { IconPadlock } from './NavIcons.jsx';

function MenuIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

function StatusStrip({ onOpenNav, mobileNavOpen }) {
  const { user, isPremium } = useAuth();
  const handle =
    user?.name?.trim() ||
    (user?.email ? user.email.split('@')[0] : null) ||
    'operator';

  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-terminal-border bg-black/90 px-3 py-2 text-[11px] backdrop-blur-sm sm:gap-3 sm:px-4 sm:py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-terminal-border/80 text-terminal-accent transition hover:border-terminal-accent/50 hover:bg-terminal-panel lg:hidden"
          aria-label="Open navigation menu"
          aria-expanded={Boolean(mobileNavOpen)}
          onClick={onOpenNav}
        >
          <MenuIcon className="h-4 w-4" />
        </button>
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 font-mono text-terminal-muted sm:gap-x-4">
        <span className="flex items-center gap-2 text-terminal-accent">
          <span className="h-2 w-2 animate-pulse rounded-full bg-terminal-accent shadow-[0_0_12px_#00ff41]" />
          System status: <span className="text-terminal-accent-bright">ONLINE</span>
        </span>
        <span className="hidden text-terminal-border sm:inline">|</span>
        <span className="min-w-0 truncate max-sm:max-w-[9rem] sm:max-w-none">
          Operator: <span className="text-slate-200">{handle}</span>
        </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {!isPremium && (
          <Link
            to="/register?upgrade=1"
            className="flex items-center gap-1.5 rounded-md border border-terminal-accent/45 bg-terminal-panel px-2 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-terminal-accent shadow-[0_0_18px_rgba(0,255,65,0.2)] transition hover:border-terminal-accent hover:shadow-[0_0_26px_rgba(0,255,65,0.35)] sm:px-3 sm:text-[10px]"
          >
            <IconPadlock className="h-3 w-3 shrink-0" />
            <span className="sm:hidden">Upgrade</span>
            <span className="hidden sm:inline">Upgrade to premium</span>
          </Link>
        )}
        <span className="hidden rounded border border-terminal-border/80 bg-terminal-bg-deep px-2 py-1 font-mono text-[10px] text-terminal-muted sm:inline">
          Enc: TLS
        </span>
        <span className="font-mono text-[10px] text-terminal-accent-muted">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </header>
  );
}

export default function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  return (
    <div className="suite-backdrop flex min-h-screen min-w-0">
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="suite-scanlines flex min-w-0 flex-1 flex-col">
        <StatusStrip mobileNavOpen={mobileNavOpen} onOpenNav={() => setMobileNavOpen(true)} />
        <WarningBanner />
        <main className="relative flex-1 overflow-x-hidden overflow-y-auto px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-5 md:px-8 md:pt-8 md:pb-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='5' y='20' fill='%2300ff41' font-size='10' font-family='monospace'%3E01%3C/text%3E%3C/svg%3E")`,
              backgroundSize: '80px 80px',
            }}
            aria-hidden
          />
          <div className="relative mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
