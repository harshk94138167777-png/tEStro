import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { IconPulse, IconTerminalPrompt } from '../components/NavIcons.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      const apiMsg = err.response?.data?.error;
      const fallback =
        err.response == null
          ? 'Cannot reach the API. Start the backend and ensure MongoDB is connected.'
          : 'Login failed';
      setError(apiMsg || fallback);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-black lg:flex-row">
      <div className="border-b border-terminal-border/40 px-4 py-5 lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-terminal-accent/40 bg-terminal-panel font-mono text-xs font-semibold text-terminal-accent">
            &gt;_
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-bold text-terminal-accent">tEStro</p>
            <p className="font-mono text-[10px] text-terminal-muted">SecOps platform</p>
          </div>
        </div>
      </div>
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0a1f0a] via-black to-black p-10 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: `linear-gradient(rgba(0,255,65,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.08) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,255,65,0.16),transparent_50%)]" />
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-terminal-accent/40 bg-terminal-panel/80 shadow-[0_0_28px_rgba(0,255,65,0.35)] backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-terminal-accent" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="mt-10 max-w-md font-display text-4xl font-bold leading-tight tracking-tight text-terminal-accent">
            Test. Secure. Deploy.
          </h1>
          <p className="mt-4 max-w-md font-sans text-sm leading-relaxed text-terminal-muted">
            The ultimate educational platform for simulating cyber threats and fortifying modern applications.
          </p>
        </div>
        <div className="relative flex flex-wrap gap-3">
          <Link
            to="/register"
            title="Create a free operator account to unlock Command Center telemetry"
            className="inline-flex items-center gap-2 rounded-full border border-terminal-border bg-terminal-bg-deep/80 px-4 py-2 font-mono text-[11px] text-terminal-accent transition hover:border-terminal-accent hover:shadow-[0_0_18px_rgba(0,255,65,0.25)]"
          >
            <IconPulse className="h-4 w-4" />
            Real-time telemetry
          </Link>
          <Link
            to="/register?intent=ai"
            title="After signup, open AI Assistant from the Intelligence section"
            className="inline-flex items-center gap-2 rounded-full border border-terminal-border bg-terminal-bg-deep/80 px-4 py-2 font-mono text-[11px] text-terminal-accent transition hover:border-terminal-accent hover:shadow-[0_0_18px_rgba(0,255,65,0.25)]"
          >
            <IconTerminalPrompt className="h-4 w-4" />
            AI-powered analysis
          </Link>
        </div>
      </div>

      <div className="flex w-full flex-1 flex-col justify-center px-4 py-8 suite-scanlines sm:px-6 sm:py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full min-w-0 max-w-md">
          <h2 className="font-display text-xl font-bold text-terminal-accent sm:text-2xl">System Login</h2>
          <p className="mt-2 font-mono text-xs text-terminal-muted">Authenticate to access the SecOps platform.</p>

          <form onSubmit={onSubmit} className="mt-10 space-y-5">
            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-accent">
                Email sequence
              </label>
              <input
                className="suite-input mt-2 w-full"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@testro.sys"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-accent">
                Access key
              </label>
              <input
                className="suite-input mt-2 w-full ring-1 ring-terminal-accent/30"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</div>
            )}
            <button type="submit" disabled={busy} className="suite-btn-primary flex w-full items-center justify-center gap-2 font-mono">
              {busy ? 'Initializing…' : 'Initialize session'}
              <span aria-hidden>→</span>
            </button>
          </form>

          <p className="mt-8 text-center font-mono text-xs text-terminal-muted">
            Don&apos;t have operator clearance?{' '}
            <Link className="font-semibold text-terminal-accent hover:text-terminal-accent-bright hover:underline" to="/register">
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
