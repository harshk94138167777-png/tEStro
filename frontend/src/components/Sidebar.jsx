import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  IconPulse,
  IconCodeBrackets,
  IconTerminalPrompt,
  IconGlobe,
  IconShieldOutline,
  IconKey,
  IconShieldCheck,
  IconCone,
  IconServer,
  IconBolt,
  IconWarningTriangle,
  IconShield,
  IconPadlock,
  IconSearchFile,
  IconCpu,
  IconMessage,
  IconReports,
  IconChevronDown,
  IconAdmin,
} from './NavIcons.jsx';

const navGroups = [
  {
    id: 'overview',
    label: 'OVERVIEW',
    collapsible: false,
    items: [{ to: '/', end: true, label: 'Command Center', Icon: IconPulse }],
  },
  {
    id: 'injection',
    label: 'INJECTION ATTACKS',
    HeaderIcon: IconCodeBrackets,
    collapsible: true,
    items: [
      { to: '/injection', hash: '#sql', label: 'SQL Injection', Icon: IconCodeBrackets },
      { to: '/injection', hash: '#cmd', label: 'Command Injection', Icon: IconTerminalPrompt },
    ],
  },
  {
    id: 'cross',
    label: 'CROSS-SITE ATTACKS',
    HeaderIcon: IconGlobe,
    collapsible: true,
    items: [
      { to: '/cross-site', hash: '#xss', label: 'XSS Tester', Icon: IconGlobe },
      { to: '/cross-site', hash: '#csrf', label: 'CSRF Simulation', Icon: IconShieldOutline },
    ],
  },
  {
    id: 'auth',
    label: 'AUTHENTICATION',
    HeaderIcon: IconKey,
    collapsible: true,
    items: [
      { to: '/auth-testing', hash: '#brute', label: 'Brute Force', Icon: IconKey },
      { to: '/auth-testing', hash: '#cred', label: 'Cred. Stuffing', Icon: IconKey },
      { to: '/security-config', hash: '#session', label: 'Session Checker', Icon: IconShieldCheck },
    ],
  },
  {
    id: 'traffic',
    label: 'TRAFFIC & LOAD',
    HeaderIcon: IconCone,
    collapsible: true,
    items: [{ to: '/traffic', label: 'DoS Simulator', Icon: IconServer }],
  },
  {
    id: 'api',
    label: 'API & RATE LIMITS',
    HeaderIcon: IconBolt,
    collapsible: true,
    items: [
      { to: '/api-rate', hash: '#rate', label: 'Rate Limit Tester', Icon: IconBolt },
      { to: '/api-rate', hash: '#security', label: 'API Security', Icon: IconWarningTriangle },
    ],
  },
  {
    id: 'sec',
    label: 'SECURITY CONFIG',
    HeaderIcon: IconShield,
    collapsible: true,
    items: [
      { to: '/security-config', hash: '#headers', label: 'Headers Check', Icon: IconShieldOutline },
      { to: '/security-config', hash: '#ssl', label: 'SSL/TLS Check', Icon: IconPadlock },
    ],
  },
  {
    id: 'file',
    label: 'FILE & PATH',
    HeaderIcon: IconSearchFile,
    collapsible: true,
    items: [
      { to: '/file-path', hash: '#upload', label: 'File Upload', Icon: IconSearchFile },
      { to: '/file-path', hash: '#path', label: 'Path Traversal', Icon: IconSearchFile },
    ],
  },
  {
    id: 'intel',
    label: 'INTELLIGENCE',
    collapsible: false,
    items: [
      { to: '/ml-intelligence', label: 'ML Predictor', Icon: IconCpu, premium: true },
      { to: '/ai', label: 'AI Assistant', Icon: IconMessage },
      { to: '/reports', label: 'Reports & Logs', Icon: IconReports },
    ],
  },
];

function itemMatches(pathname, hash, item) {
  if (pathname !== item.to) return false;
  if (item.hash) return hash === item.hash;
  const h = hash || '';
  return h === '' || h === '#';
}

function groupIsActive(pathname, hash, group) {
  return group.items.some((item) => itemMatches(pathname, hash, item));
}

function SidebarNavLink({ item, pathname, hash, isPremium, nested, onNavigate }) {
  const active = itemMatches(pathname, hash, item);
  const to = item.hash ? { pathname: item.to, hash: item.hash.slice(1) } : item.to;
  const Icon = item.Icon;
  const showLock = item.premium && !isPremium;
  const pad = nested ? 'pl-8' : 'pl-7';

  if (showLock) {
    return (
      <Link
        to="/register?upgrade=1"
        onClick={onNavigate}
        className={`flex items-center gap-2.5 rounded-md py-2 ${pad} pr-2 text-[13px] font-medium text-terminal-accent-muted transition-colors hover:bg-terminal-panel-elevated/60 hover:text-terminal-accent-bright`}
        title="Premium module — open registration / upgrade info"
      >
        <Icon className="h-4 w-4 shrink-0 opacity-90" />
        <span className="flex-1 truncate font-sans">{item.label}</span>
        <IconPadlock className="h-3.5 w-3.5 shrink-0 text-terminal-cyan" aria-label="Premium" />
      </Link>
    );
  }

  return (
    <NavLink
      to={to}
      end={item.end}
      onClick={onNavigate}
      className={() =>
        [
          'flex items-center gap-2.5 rounded-md py-2 pr-2 text-[13px] font-medium transition-colors',
          pad,
          active
            ? 'bg-terminal-accent-dim text-terminal-accent shadow-[inset_3px_0_0_#00ff41,0_0_22px_rgba(0,255,65,0.22)] ring-1 ring-terminal-accent/25'
            : 'text-terminal-accent-muted hover:bg-terminal-panel-elevated/60 hover:text-terminal-accent-bright',
        ].join(' ')
      }
    >
      <Icon className="h-4 w-4 shrink-0 opacity-90" />
      <span className="flex-1 truncate font-sans">{item.label}</span>
    </NavLink>
  );
}

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { user, logout, isAdmin, isPremium } = useAuth();
  const { pathname, hash } = useLocation();
  const closeMobile = () => onMobileClose?.();

  const [open, setOpen] = useState(() => {
    const all = new Set(
      navGroups.filter((g) => g.collapsible).map((g) => g.id)
    );
    return all;
  });

  useEffect(() => {
    setOpen((prev) => {
      const n = new Set(prev);
      navGroups.forEach((g) => {
        if (g.collapsible && groupIsActive(pathname, hash, g)) n.add(g.id);
      });
      return n;
    });
  }, [pathname, hash]);

  const toggle = (id) => {
    setOpen((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  return (
    <>
      <button
        type="button"
        className={[
          'fixed inset-0 z-30 bg-black/65 backdrop-blur-[1px] transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        aria-label="Close menu"
        tabIndex={mobileOpen ? 0 : -1}
        onClick={closeMobile}
      />
      <aside
        className={[
          'flex w-[min(100vw-2.5rem,17.5rem)] max-w-[280px] shrink-0 flex-col border-r border-terminal-border bg-black',
          'fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-[272px] lg:max-w-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
      <div className="flex items-center justify-end border-b border-terminal-border px-2 py-2 lg:hidden">
        <button
          type="button"
          onClick={closeMobile}
          className="rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-terminal-muted hover:bg-terminal-panel hover:text-terminal-accent"
        >
          Close
        </button>
      </div>
      <div className="h-1 w-full bg-[repeating-linear-gradient(135deg,#b45309_0,#b45309_6px,#0f172a_6px,#0f172a_12px)]" aria-hidden />
      <div className="border-b border-terminal-border px-3 py-4 sm:px-4 sm:py-5">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-terminal-accent/40 bg-terminal-panel font-mono text-sm font-semibold text-terminal-accent shadow-[0_0_14px_rgba(0,255,65,0.22)]">
            &gt;_
          </div>
          <div className="min-w-0">
          <div className="font-display text-xl font-bold tracking-tight text-[#00FF9C] drop-shadow-[0_0_12px_#00FF9C]">
              tEStro
            </div>
            <div className="mt-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-terminal-accent-muted">
              SECOPS PLATFORM
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {navGroups.map((group) => {
          const HeaderIcon = group.HeaderIcon;
          const expanded = !group.collapsible || open.has(group.id);
          const headerActive = groupIsActive(pathname, hash, group);

          if (!group.collapsible) {
            return (
              <div key={group.id} className="pb-2">
                <div className="px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-accent-muted">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <SidebarNavLink
                      key={`${item.to}${item.hash || ''}`}
                      item={item}
                      pathname={pathname}
                      hash={hash}
                      isPremium={isPremium}
                      onNavigate={closeMobile}
                    />
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div key={group.id} className="pb-1">
              <button
                type="button"
                onClick={() => toggle(group.id)}
                className={[
                  'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors',
                  headerActive
                    ? 'text-terminal-accent'
                    : 'text-terminal-accent-muted hover:text-terminal-accent-bright',
                ].join(' ')}
              >
                {HeaderIcon && <HeaderIcon className="h-4 w-4 shrink-0" />}
                <span className="min-w-0 flex-1 truncate">{group.label}</span>
                <IconChevronDown
                  className={['h-4 w-4 shrink-0 transition-transform', expanded ? 'rotate-0' : '-rotate-90'].join(
                    ' '
                  )}
                />
              </button>
              {expanded && (
                <div className="mt-0.5 space-y-0.5 border-l border-terminal-border/60 pl-1 ml-3">
                  {group.items.map((item) => (
                    <SidebarNavLink
                      key={`${item.to}${item.hash || ''}`}
                      nested
                      item={item}
                      pathname={pathname}
                      hash={hash}
                      isPremium={isPremium}
                      onNavigate={closeMobile}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isAdmin && (
          <div className="border-t border-terminal-border pt-3">
            <div className="px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-accent-muted">
              ADMIN
            </div>
            <NavLink
              to="/admin"
              onClick={closeMobile}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2.5 rounded-md py-2 pl-9 pr-2 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'bg-terminal-accent-dim text-terminal-accent shadow-[inset_3px_0_0_#00ff41,0_0_22px_rgba(0,255,65,0.22)] ring-1 ring-terminal-accent/25'
                    : 'text-terminal-accent-muted hover:bg-terminal-panel-elevated/60 hover:text-terminal-accent-bright',
                ].join(' ')
              }
            >
              <IconAdmin className="h-4 w-4 shrink-0" />
              <span className="font-sans">Admin console</span>
            </NavLink>
          </div>
        )}
      </nav>

      <div className="border-t border-terminal-border p-3 text-[11px] text-terminal-muted">
        <div className="truncate font-mono text-slate-300">{user?.email}</div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-terminal-accent-muted">Tier</span>
          <span className="rounded border border-terminal-border bg-terminal-panel px-2 py-0.5 font-mono text-[10px] uppercase text-terminal-accent">
            {user?.role}
          </span>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-3 w-full rounded-md border border-red-500/35 bg-red-950/30 px-2 py-2 font-mono text-[10px] uppercase tracking-wider text-red-200 transition hover:bg-red-950/50"
        >
          Disconnect
        </button>
      </div>
    </aside>
    </>
  );
}
