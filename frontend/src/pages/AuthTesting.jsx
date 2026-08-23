import { useEffect, useState } from 'react';
import api from '../services/api.js';
import ResultPanel from '../components/ResultPanel.jsx';
import ModuleWorkbench, { ModuleFieldLabel } from '../components/ModuleWorkbench.jsx';
import { useHashScroll } from '../hooks/useHashScroll.js';
import { useModuleSection } from '../hooks/useModuleSection.js';
import { useUrlHistory } from '../hooks/useUrlHistory.js';
import { useAuth } from '../context/AuthContext.jsx';
import { IconKey } from '../components/NavIcons.jsx';

const SECTION_IDS = ['brute', 'cred'];

export default function AuthTesting() {
  const active = useModuleSection('brute', SECTION_IDS);
  const { user } = useAuth();
  const canProbeExternal = user?.role === 'admin' || user?.role === 'premium';
  useHashScroll();
  const { urls: urlHistory, saveUrl } = useUrlHistory();
  const [baseUrl, setBaseUrl] = useState('');
  const [loginPath, setLoginPath] = useState('/auth/login');
  const [username, setUsername] = useState('admin');
  const [identifierField, setIdentifierField] = useState('email');
  const [password, setPassword] = useState('password');
  const [iterations, setIterations] = useState(5);
  const [attempts, setAttempts] = useState('wrong1\nwrong2\nwrong3\nwrong4\nwrong5');
  const [liveMode, setLiveMode] = useState(false);

  const [credUrl, setCredUrl] = useState('');
  const [credPairs, setCredPairs] = useState('admin:password123\nuser:letmein\ntest:test123');
  const [passwordSingle, setPasswordSingle] = useState('password');
  const [credentialIdentifierField, setCredentialIdentifierField] = useState('email');

  const [bf, setBf] = useState(null);
  const [cs, setCs] = useState(null);
  const [prem, setPrem] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (attempts !== 'wrong1\nwrong2\nwrong3\nwrong4\nwrong5') return;
    const n = Math.min(5, Math.max(1, iterations));
    setAttempts(Array.from({ length: n }, (_, i) => `wrong${i + 1}`).join('\n'));
  }, [iterations, attempts]);

  const runBf = async () => {
    setErr('');
    try {
      saveUrl(baseUrl);
      const list = attempts.split(/\r?\n/).filter(Boolean).slice(0, 5);
      const url = `${String(baseUrl || '').replace(/\/$/, '')}${loginPath.startsWith('/') ? loginPath : `/${loginPath}`}`;
      const { data } = await api.post('/api/modules/auth/brute-force', {
        attempts: list,
        url,
        identifierField,
        [identifierField]: username,
        passwords: list,
        live: liveMode,
        mode: liveMode ? 'live' : 'simulate',
      });
      setBf(data.result);
      setPrem(data.premiumInsights);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  const runCs = async () => {
    setErr('');
    try {
      saveUrl(credUrl);
      const credentialIdentifier = credPairs.split(/\r?\n/).find(Boolean)?.split(':')[0] || '';
      const { data } = await api.post('/api/modules/auth/credential-stuffing', {
        url: credUrl,
        identifierField: credentialIdentifierField,
        [credentialIdentifierField]: credentialIdentifier,
        password: passwordSingle,
        credentialContext: credPairs,
        live: liveMode,
        mode: liveMode ? 'live' : 'simulate',
      });
      setCs(data.result);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4">
      {err && (
        <div className="rounded-lg border border-red-500/45 bg-red-950/35 px-3 py-2 font-mono text-sm text-red-200">{err}</div>
      )}

      {active === 'brute' && (
      <ModuleWorkbench
        id="brute"
        breadcrumb={['Authentication', 'Brute force simulator']}
        title="Login rate & lockout analysis"
        subtitle="Illustrative login attempts only — capped by the API. Use to reason about throttling and account lockout posture."
        banners={[
          {
            variant: 'teal',
            text: 'EDUCATIONAL CAP — A maximum of five attempt strings are processed per run regardless of UI configuration.',
          },
          { variant: 'auth', text: 'AUTHORIZED SYSTEMS ONLY — Never aim this workflow at accounts you do not control.' },
        ]}
        configTitle="Test vectors"
        configIcon={IconKey}
        primaryAction={{ label: 'Initiate sequence', onClick: runBf, disabled: !baseUrl.trim() || !loginPath.trim() }}
        resultActive={Boolean(bf || prem)}
        resultContent={<ResultPanel data={bf} premium={prem} title="Simulation output" embedded />}
        emptyIcon={IconKey}
        emptyTitle="Awaiting parameters"
        emptySubtitle="Provide endpoint context and attempt lines to evaluate rate-limiting signal."
      >
        <div>
          <ModuleFieldLabel>Base URL</ModuleFieldLabel>
          <input
            className="suite-input mt-2 w-full"
            list="testro-url-history-auth"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            onBlur={(e) => saveUrl(e.target.value)}
            placeholder="https://api.example.com"
          />
          <datalist id="testro-url-history-auth">
            {urlHistory.map((u) => (
              <option key={`auth-${u}`} value={u} />
            ))}
          </datalist>
        </div>
        <div>
          <ModuleFieldLabel>Login path</ModuleFieldLabel>
          <input className="suite-input mt-2 w-full" value={loginPath} onChange={(e) => setLoginPath(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <ModuleFieldLabel>Login identifier</ModuleFieldLabel>
            <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem]">
              <input className="suite-input w-full" value={username} onChange={(e) => setUsername(e.target.value)} />
              <select className="suite-input w-full" value={identifierField} onChange={(e) => setIdentifierField(e.target.value)}>
                <option value="email">Email</option>
                <option value="username">Username</option>
              </select>
            </div>
          </div>
          <div>
            <ModuleFieldLabel>Password (context)</ModuleFieldLabel>
            <input
              className="suite-input mt-2 w-full"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 font-mono text-sm text-terminal-accent">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-terminal-border text-terminal-accent"
            checked={liveMode}
            onChange={(e) => setLiveMode(e.target.checked)}
          />
          {canProbeExternal ? 'Run authorized live probe (explicit opt-in)' : 'Run localhost-only live probe (explicit opt-in)'}
        </label>
        <p className="mt-1 font-mono text-[11px] text-terminal-muted">
          {canProbeExternal
            ? 'Admin/premium live probes may use approved targets configured by the backend.'
            : 'Only use this for localhost or 127.0.0.1 targets you control. The backend rejects non-local targets.'}
        </p>
        <div>
          <div className="flex items-center justify-between gap-2">
            <ModuleFieldLabel>Iterations (attempt lines)</ModuleFieldLabel>
            <span className="font-mono text-[10px] text-terminal-muted">Max 5 processed</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
            className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-terminal-border accent-terminal-accent"
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-terminal-muted">
            <span>1</span>
            <span>{iterations} lines</span>
            <span>5</span>
          </div>
        </div>
        <div>
          <ModuleFieldLabel>Attempt strings (synced)</ModuleFieldLabel>
          <textarea
            className="suite-input mt-2 min-h-[120px] w-full resize-y"
            value={attempts}
            onChange={(e) => setAttempts(e.target.value)}
          />
        </div>
      </ModuleWorkbench>
      )}

      {active === 'cred' && (
      <ModuleWorkbench
        id="cred"
        breadcrumb={['Authentication', 'Credential stuffing']}
        title="Credential stuffing simulator"
        subtitle="Run controlled credential checks against authorized endpoints or offline demo scoring when URL is omitted."
        banners={[
          {
            variant: liveMode ? 'teal' : 'passive',
            text: liveMode
              ? 'LIVE CHECK — Only use a login endpoint and test account you own or are authorized to assess.'
              : 'PASSIVE CHECK — No credentials are posted; analysis uses the demo weak-password list server-side.',
          },
          { variant: 'auth', text: 'AUTHORIZED SYSTEMS ONLY — Never test live accounts without permission.' },
        ]}
        configTitle="Target config"
        configIcon={IconKey}
        primaryAction={{ label: 'Start injection', onClick: runCs, disabled: !credUrl.trim() }}
        resultActive={Boolean(cs)}
        resultContent={<ResultPanel data={cs} title="Check output" embedded />}
        emptyIcon={IconKey}
        emptyTitle="Awaiting target & payloads"
        emptySubtitle="Provide endpoint context and credential pairs for defensive review."
      >
        <div>
          <ModuleFieldLabel>Login POST endpoint</ModuleFieldLabel>
          <input
            className="suite-input mt-2 w-full"
            list="testro-url-history-auth"
            value={credUrl}
            onChange={(e) => setCredUrl(e.target.value)}
            onBlur={(e) => saveUrl(e.target.value)}
            placeholder="https://api.example.com/login"
          />
        </div>
        <label className="mt-3 flex items-center gap-2 font-mono text-sm text-terminal-accent">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-terminal-border text-terminal-accent"
            checked={liveMode}
            onChange={(e) => setLiveMode(e.target.checked)}
          />
          {canProbeExternal ? 'Run authorized live probe (explicit opt-in)' : 'Run localhost-only live probe (explicit opt-in)'}
        </label>
        <p className="mt-1 font-mono text-[11px] text-terminal-muted">
          {canProbeExternal
            ? 'Admin/premium live probes may use approved targets configured by the backend.'
            : 'Only use this for localhost or 127.0.0.1 targets you control. The backend rejects non-local targets.'}
        </p>
        <div>
          <ModuleFieldLabel>Credentials (user:pass)</ModuleFieldLabel>
          <textarea
            className="suite-input mt-2 min-h-[140px] w-full resize-y"
            value={credPairs}
            onChange={(e) => setCredPairs(e.target.value)}
          />
        </div>
        <div>
          <ModuleFieldLabel>Login identifier type</ModuleFieldLabel>
          <select
            className="suite-input mt-2 w-full"
            value={credentialIdentifierField}
            onChange={(e) => setCredentialIdentifierField(e.target.value)}
          >
            <option value="email">Email</option>
            <option value="username">Username</option>
          </select>
        </div>
        <div>
          <ModuleFieldLabel>Password to evaluate (API field)</ModuleFieldLabel>
          <input
            className="suite-input mt-2 w-full"
            value={passwordSingle}
            onChange={(e) => setPasswordSingle(e.target.value)}
          />
          <p className="mt-2 text-[11px] text-terminal-muted">
            The backend module scores this password against the demo weak list. Pairs above are for documentation context.
          </p>
        </div>
      </ModuleWorkbench>
      )}
    </div>
  );
}
