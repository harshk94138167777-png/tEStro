import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  IconInjection,
  IconCrossSite,
  IconAuth,
  IconTraffic,
  IconApi,
  IconShield,
  IconFile,
  IconPulse,
  IconShieldOutline,
  IconCpu,
  IconPadlock,
  IconTerminalPrompt,
  IconShieldCheck,
  IconWarningTriangle,
} from '../components/NavIcons.jsx';

function ArsenalCard({ to, title, desc, Icon, locked }) {
  const inner = (
    <>
      <div className="flex items-start gap-3">
        <div className="rounded-lg border border-terminal-border/80 bg-terminal-bg-deep p-2.5 text-terminal-accent">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-semibold text-terminal-accent">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-terminal-muted">{desc}</p>
          <span className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-terminal-accent">
            {locked ? 'Locked' : 'Initiate'} <span aria-hidden>›</span>
          </span>
        </div>
      </div>
    </>
  );
  if (locked) {
    return (
      <div className="suite-panel min-w-0 cursor-not-allowed p-3 opacity-55 sm:p-4" title="Requires Premium or Admin">
        {inner}
      </div>
    );
  }
  return (
    <Link
      to={to}
      className="suite-panel block min-w-0 p-3 transition hover:border-terminal-accent/50 hover:shadow-[0_0_28px_rgba(0,255,65,0.2)] sm:p-4"
    >
      {inner}
    </Link>
  );
}

function Section({ kicker, subtitle, children }) {
  return (
    <section className="min-w-0 space-y-3">
      <div className="min-w-0">
        <h2 className="break-words font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-terminal-accent sm:text-[11px] sm:tracking-[0.25em]">
          {kicker}
        </h2>
        {subtitle && <p className="mt-1 text-xs text-terminal-muted">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

export default function Dashboard() {
  const { user, isPremium } = useAuth();
  const [health, setHealth] = useState(null);
  const [recent, setRecent] = useState([]);
  const [totalScans, setTotalScans] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [h, r, st] = await Promise.all([
          api.get('/api/health'),
          api.get('/api/reports?limit=8'),
          api.get('/api/reports/stats'),
        ]);
        if (!cancelled) {
          setHealth(h.data);
          setRecent(r.data.items || []);
          const bm = st.data?.byModule || [];
          setTotalScans(bm.reduce((s, x) => s + (x.count || 0), 0));
        }
      } catch {
        if (!cancelled) setHealth({ ok: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handle =
    user?.name?.trim() ||
    (user?.email ? user.email.split('@')[0] : null) ||
    'operator';
  const planLabel = user?.role === 'admin' ? 'ADMIN' : user?.role === 'premium' ? 'PREMIUM' : 'FREE';

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="suite-page-title">Command Center</h1>
          <p className="mt-2 break-words font-mono text-xs text-terminal-muted sm:text-sm">
            Operator: <span className="text-terminal-accent-bright">{handle}</span>
            <span className="text-terminal-border"> · </span>
            System status: <span className="text-terminal-accent">ONLINE</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="suite-panel relative min-w-0 overflow-hidden p-4 sm:p-5">
          <div className="pointer-events-none absolute -right-4 -top-4 opacity-[0.07]">
            <IconPulse className="h-28 w-28 text-terminal-accent" />
          </div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-muted">Total scans</p>
          <p className="mt-2 font-display text-4xl font-bold text-terminal-accent">{totalScans}</p>
        </div>
        <div className="suite-panel relative min-w-0 overflow-hidden p-4 sm:p-5">
          <div className="pointer-events-none absolute -right-2 -top-2 opacity-[0.08]">
            <IconShieldOutline className="h-24 w-24 text-terminal-accent" />
          </div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-muted">Plan status</p>
          <p className="mt-2 font-display text-3xl font-bold uppercase tracking-wide text-terminal-accent">{planLabel}</p>
        </div>
        <div className="suite-panel relative min-w-0 overflow-hidden p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg border border-terminal-border bg-terminal-bg-deep p-2 text-terminal-accent">
                <IconCpu className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-sm font-semibold text-terminal-accent">ML vulnerability predictor</h2>
                <p className="mt-1 max-w-xl text-xs text-terminal-muted">
                  Use AI to generate optimized payloads and predict attack vectors before execution.
                </p>
              </div>
            </div>
            {isPremium ? (
              <Link
                to="/ml-intelligence"
                className="shrink-0 rounded-lg border border-terminal-accent/50 bg-terminal-accent/10 px-4 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-terminal-accent transition hover:bg-terminal-accent/20"
              >
                Open →
              </Link>
            ) : (
              <Link
                to="/register?upgrade=1"
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-terminal-accent/40 bg-terminal-bg-deep px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-terminal-accent shadow-[0_0_16px_rgba(0,255,65,0.15)] transition hover:border-terminal-accent hover:shadow-[0_0_24px_rgba(0,255,65,0.3)]"
              >
                <IconPadlock className="h-3.5 w-3.5 text-terminal-cyan" />
                Locked →
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <h2 className="font-display text-base font-bold text-terminal-accent sm:text-lg">Testing Arsenal</h2>
        <div className="mt-5 space-y-6 sm:mt-6 sm:space-y-8">
          <Section kicker="Injection attacks" subtitle="Test for unsafe payload handling">
            <ArsenalCard
              to="/injection#sql"
              title="SQL Injection"
              desc="Database query manipulation checks."
              Icon={IconInjection}
            />
            <ArsenalCard
              to="/injection#cmd"
              title="Command Injection"
              desc="OS command execution vulnerabilities."
              Icon={IconTerminalPrompt}
            />
          </Section>

          <Section kicker="Cross-site attacks" subtitle="Client-side vulnerability scanners">
            <ArsenalCard to="/cross-site#xss" title="XSS Tester" desc="Reflected, stored, and DOM cross-site scripting." Icon={IconCrossSite} />
            <ArsenalCard
              to="/cross-site#csrf"
              title="CSRF Simulation"
              desc="Cross-Site Request Forgery vulnerability checks."
              Icon={IconShieldOutline}
            />
          </Section>

          <Section kicker="Authentication" subtitle="Identity & access testing">
            <ArsenalCard to="/auth-testing#brute" title="Brute Force" desc="Controlled attempt simulation (capped)." Icon={IconAuth} />
            <ArsenalCard
              to="/auth-testing#cred"
              title="Cred. Stuffing"
              desc="Demo weak-password list comparison."
              Icon={IconAuth}
            />
            <ArsenalCard
              to="/security-config#session"
              title="Session checker"
              desc="Cookie flags, tokens, and session posture from a single response."
              Icon={IconShieldCheck}
            />
          </Section>

          <Section kicker="Traffic & API" subtitle="Load and endpoint security">
            <ArsenalCard to="/api-rate#rate" title="Rate Limit Tester" desc="Sequential requests against localhost APIs." Icon={IconApi} />
            <ArsenalCard
              to="/api-rate#security"
              title="API security"
              desc="Localhost GET/HEAD probe — timing, status, and header samples."
              Icon={IconWarningTriangle}
            />
            <ArsenalCard to="/traffic" title="DoS Simulator" desc="Safe load simulation — localhost only, hard caps." Icon={IconTraffic} />
          </Section>

          <Section kicker="Configuration" subtitle="Server & infrastructure posture">
            <ArsenalCard
              to="/security-config#headers"
              title="Headers Check"
              desc="CSP, HSTS, and vital security headers."
              Icon={IconShield}
            />
            <ArsenalCard
              to="/security-config#ssl"
              title="SSL/TLS Check"
              desc="Certificate validity and transport guidance."
              Icon={IconShield}
            />
            <ArsenalCard
              to="/file-path#upload"
              title="File Upload"
              desc="Malicious file handling validation."
              Icon={IconFile}
            />
            <ArsenalCard
              to="/file-path#path"
              title="Path Traversal"
              desc="Directory escape vulnerability checks."
              Icon={IconFile}
            />
          </Section>
        </div>
      </div>

      <div className="suite-panel min-w-0 overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-terminal-border bg-terminal-panel px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
          <h2 className="font-display text-sm font-bold text-terminal-accent sm:text-base">Recent Telemetry</h2>
          <Link
            to="/reports"
            className="inline-flex items-center justify-center rounded-md border border-terminal-accent/45 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-terminal-accent shadow-[0_0_14px_rgba(0,255,65,0.12)] transition hover:bg-terminal-accent/10 hover:shadow-[0_0_22px_rgba(0,255,65,0.28)]"
          >
            View full logs →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead>
              <tr className="border-b border-terminal-border bg-terminal-bg-deep font-mono text-[10px] uppercase tracking-wider text-terminal-muted">
                <th className="whitespace-nowrap px-3 py-2.5 sm:px-5 sm:py-3">Test vector</th>
                <th className="whitespace-nowrap px-3 py-2.5 sm:px-5 sm:py-3">Target host</th>
                <th className="whitespace-nowrap px-3 py-2.5 sm:px-5 sm:py-3">Timestamp (UTC)</th>
                <th className="whitespace-nowrap px-3 py-2.5 sm:px-5 sm:py-3">Action</th>
              </tr>
            </thead>
            <tbody className="text-terminal-muted">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-xs text-terminal-muted sm:px-5 sm:py-8 sm:text-sm">
                    No telemetry yet — initiate a module from the arsenal or sidebar.
                  </td>
                </tr>
              ) : (
                recent.map((t) => (
                  <tr key={t._id} className="border-b border-terminal-border/50 last:border-0">
                    <td className="max-w-[10rem] break-words px-3 py-2.5 font-mono text-[11px] text-terminal-accent/90 sm:max-w-none sm:px-5 sm:py-3 sm:text-xs">
                      [{t.module}] {t.testType}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 sm:px-5 sm:py-3">—</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[10px] sm:px-5 sm:py-3 sm:text-[11px]">
                      {new Date(t.createdAt).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="px-3 py-2.5 text-terminal-accent sm:px-5 sm:py-3">{t.riskLevel}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-[10px] text-terminal-accent-muted">
        API: {health?.ok ? 'Operational' : 'Unreachable'}
        {health?.db ? ` · DB: ${health.db}` : ''}
      </p>
    </div>
  );
}
