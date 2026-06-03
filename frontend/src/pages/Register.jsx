import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const upgradePitch = params.get('upgrade') === '1';
  const intentAi = params.get('intent') === 'ai';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(name, email, password);
      if (intentAi) navigate('/ai', { replace: true });
      else navigate('/', { replace: true });
    } catch (err) {
      const apiMsg = err.response?.data?.error;
      const fallback =
        err.response == null
          ? 'Cannot reach the API. Start the backend (npm run dev in backend/) and ensure MongoDB connects.'
          : 'Registration failed';
      setError(apiMsg || fallback);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-black suite-scanlines">
      <div className="mx-auto flex w-full min-w-0 max-w-md flex-col justify-center px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="font-display text-xl font-bold text-terminal-accent sm:text-2xl">Request access</h1>
        <p className="mt-2 font-mono text-xs text-terminal-muted">Provision a free operator account · educational use only.</p>
        {upgradePitch && (
          <p className="mt-4 break-words rounded-lg border border-terminal-accent/35 bg-terminal-accent/5 px-3 py-2 font-mono text-xs leading-relaxed text-terminal-accent shadow-[0_0_20px_rgba(0,255,65,0.12)]">
            Upgrade path: free tier includes the full testing arsenal. Premium unlocks ML predictor and higher rate limits — create an account first, then contact an admin to elevate your role.
          </p>
        )}
        {intentAi && !upgradePitch && (
          <p className="mt-4 rounded-lg border border-terminal-cyan/30 bg-black/40 px-3 py-2 font-mono text-xs text-terminal-muted">
            After signup you&apos;ll be routed to the <span className="text-terminal-accent">AI Assistant</span> workspace.
          </p>
        )}
        <form onSubmit={onSubmit} className="mt-10 space-y-5">
          <div>
            <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-accent">
              Operator name
            </label>
            <input className="suite-input mt-2 w-full" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-accent">
              Email sequence
            </label>
            <input
              className="suite-input mt-2 w-full"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-accent">
              Access key (min 8)
            </label>
            <input
              className="suite-input mt-2 w-full"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</div>
          )}
          <button type="submit" disabled={busy} className="suite-btn-primary w-full font-mono">
            {busy ? 'Provisioning…' : 'Create clearance'}
          </button>
        </form>
        <p className="mt-8 text-center font-mono text-xs text-terminal-muted">
          Already cleared?{' '}
          <Link className="font-semibold text-terminal-accent hover:text-terminal-accent-bright hover:underline" to="/login">
            System login
          </Link>
        </p>
      </div>
    </div>
  );
}
