import { useState } from 'react';
import api from '../services/api.js';
import ResultPanel from '../components/ResultPanel.jsx';
import ModuleWorkbench, { ModuleFieldLabel } from '../components/ModuleWorkbench.jsx';
import { useHashScroll } from '../hooks/useHashScroll.js';
import { useModuleSection } from '../hooks/useModuleSection.js';
import { useUrlHistory } from '../hooks/useUrlHistory.js';
import { IconGlobe, IconShieldOutline } from '../components/NavIcons.jsx';

const SECTION_IDS = ['xss', 'csrf'];

export default function CrossSite() {
  const active = useModuleSection('xss', SECTION_IDS);
  useHashScroll();
  const { urls: urlHistory, saveUrl } = useUrlHistory();
  const [xssUrl, setXssUrl] = useState('');
  const [xssVector, setXssVector] = useState('reflected');
  const [xssParam, setXssParam] = useState('q');
  const [xssPayload, setXssPayload] = useState(`<img src=x onerror=alert(1)>
<script>document.location='//evil'</script>
<svg onload=alert(1)>`);
  const [xssRes, setXssRes] = useState(null);
  const [premXss, setPremXss] = useState(null);

  const [csrfUrl, setCsrfUrl] = useState('');
  const [csrfRes, setCsrfRes] = useState(null);
  const [checks, setChecks] = useState({ origin: true, referer: true, token: true });

  const [err, setErr] = useState('');

  const runXss = async () => {
    setErr('');
    try {
      saveUrl(xssUrl);
      const { data } = await api.post('/api/modules/cross-site/xss', {
        url: xssUrl,
        vector: xssVector,
        targetParam: xssParam,
        payload: xssPayload,
      });
      setXssRes(data.result);
      setPremXss(data.premiumInsights);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  const runCsrf = async () => {
    setErr('');
    try {
      saveUrl(csrfUrl);
      const { data } = await api.post('/api/modules/cross-site/csrf', { url: csrfUrl, checks });
      setCsrfRes(data.result);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  const toggleCheck = (k) => setChecks((c) => ({ ...c, [k]: !c[k] }));

  return (
    <div className="w-full min-w-0 space-y-4">
      {err && (
        <div className="rounded-lg border border-red-500/45 bg-red-950/35 px-3 py-2 font-mono text-sm text-red-200">{err}</div>
      )}

      {active === 'xss' && (
      <ModuleWorkbench
        id="xss"
        breadcrumb={['Cross-site attacks', 'XSS tester']}
        title="Cross-site scripting (XSS)"
        subtitle="Analyze XSS vectors with offline checks or controlled live target testing when a URL is supplied."
        banners={[
          { variant: 'passive', text: 'SAFE EXECUTION — Payloads are inspected by controlled server checks, not executed in your browser.' },
          { variant: 'auth', text: 'AUTHORIZED SYSTEMS ONLY — Educational simulation on permitted targets only.' },
        ]}
        configTitle="Target config"
        configIcon={IconGlobe}
        primaryAction={{ label: 'Initiate scan', onClick: runXss, disabled: !xssUrl.trim() }}
        resultActive={Boolean(xssRes || premXss)}
        resultContent={<ResultPanel data={xssRes} premium={premXss} title="Analysis output" embedded />}
        emptyIcon={IconGlobe}
        emptyTitle="Awaiting target"
        emptySubtitle="Define URL context and payloads to evaluate reflected, stored, or DOM-style XSS signal."
      >
        <div>
          <ModuleFieldLabel>Target URL</ModuleFieldLabel>
          <input
            className="suite-input mt-2 w-full"
            list="testro-url-history-cross-site"
            value={xssUrl}
            onChange={(e) => setXssUrl(e.target.value)}
            onBlur={(e) => saveUrl(e.target.value)}
            placeholder="https://api.example.com/search"
          />
          <datalist id="testro-url-history-cross-site">
            {urlHistory.map((u) => (
              <option key={`cross-site-${u}`} value={u} />
            ))}
          </datalist>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <ModuleFieldLabel>XSS vector type</ModuleFieldLabel>
            <select className="suite-input mt-2 w-full" value={xssVector} onChange={(e) => setXssVector(e.target.value)}>
              <option value="reflected">Reflected</option>
              <option value="stored">Stored</option>
              <option value="dom">DOM</option>
            </select>
          </div>
          <div>
            <ModuleFieldLabel>Target param</ModuleFieldLabel>
            <input className="suite-input mt-2 w-full" value={xssParam} onChange={(e) => setXssParam(e.target.value)} />
          </div>
        </div>
        <div>
          <ModuleFieldLabel>Custom payloads</ModuleFieldLabel>
          <textarea
            className="suite-input mt-2 min-h-[160px] w-full resize-y"
            value={xssPayload}
            onChange={(e) => setXssPayload(e.target.value)}
          />
        </div>
      </ModuleWorkbench>
      )}

      {active === 'csrf' && (
      <ModuleWorkbench
        id="csrf"
        breadcrumb={['Cross-site attacks', 'CSRF simulation']}
        title="Cross-site request forgery"
        subtitle="Evaluate CSRF defenses using controlled target checks when URL is provided."
        banners={[
          { variant: 'passive', text: 'SAFE EXECUTION — Requests are safety-gated and intended only for authorized testing.' },
          { variant: 'auth', text: 'AUTHORIZED SYSTEMS ONLY — Confirm scope before relying on these results.' },
        ]}
        configTitle="Target config"
        configIcon={IconShieldOutline}
        primaryAction={{ label: 'Start simulation', onClick: runCsrf, disabled: !csrfUrl.trim() }}
        resultActive={Boolean(csrfRes)}
        resultContent={<ResultPanel data={csrfRes} title="Defensive checklist" embedded />}
        emptyIcon={IconShieldOutline}
        emptyTitle="Awaiting parameters"
        emptySubtitle="Define target and validation checks to review CSRF defenses."
      >
        <div>
          <ModuleFieldLabel>Target state-changing URL</ModuleFieldLabel>
          <input
            className="suite-input mt-2 w-full"
            list="testro-url-history-cross-site"
            value={csrfUrl}
            onChange={(e) => setCsrfUrl(e.target.value)}
            onBlur={(e) => saveUrl(e.target.value)}
            placeholder="https://api.example.com/user/update"
          />
        </div>
        <div>
          <ModuleFieldLabel>Validation checks</ModuleFieldLabel>
          <div className="mt-3 space-y-2 rounded-lg border border-terminal-border/60 bg-terminal-bg-deep/50 p-3">
            {[
              ['origin', 'Test Origin header enforcement'],
              ['referer', 'Test Referer header enforcement'],
              ['token', 'Check anti-CSRF token logic'],
            ].map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-3 font-mono text-sm text-terminal-accent">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-terminal-border text-terminal-accent"
                  checked={checks[key]}
                  onChange={() => toggleCheck(key)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </ModuleWorkbench>
      )}
    </div>
  );
}
