import { useEffect, useState } from 'react';
import api from '../services/api.js';
import ResultPanel from '../components/ResultPanel.jsx';
import ModuleWorkbench, { ModuleFieldLabel } from '../components/ModuleWorkbench.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useHashScroll } from '../hooks/useHashScroll.js';
import { useModuleSection } from '../hooks/useModuleSection.js';
import { useUrlHistory } from '../hooks/useUrlHistory.js';
import { IconBolt, IconWarningTriangle } from '../components/NavIcons.jsx';

const SECTION_IDS = ['rate', 'security'];

export default function APIRate() {
  const active = useModuleSection('rate', SECTION_IDS);
  useHashScroll();
  const { user } = useAuth();
  const { urls: urlHistory, saveUrl } = useUrlHistory();
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [res, setRes] = useState(null);
  const [prem, setPrem] = useState(null);

  const [batchCount, setBatchCount] = useState(10);
  const [batchRes, setBatchRes] = useState(null);
  const [batchPrem, setBatchPrem] = useState(null);
  const [ratePerMin, setRatePerMin] = useState(60);

  const [apiChecks, setApiChecks] = useState({
    authBypass: true,
    inputFuzzing: true,
    verboseErrors: true,
  });
  const toggleApiCheck = (k) => setApiChecks((c) => ({ ...c, [k]: !c[k] }));

  const [limits, setLimits] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const { data } = await api.get('/api/health');
        if (!c) setLimits(data.planLimits);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const maxBatch =
    user?.role === 'free'
      ? limits?.rateBatchMax?.free ?? 40
      : user?.role === 'premium' || user?.role === 'admin'
        ? limits?.rateBatchMax?.premium ?? 600
        : 40;

  const runProbe = async () => {
    setErr('');
    try {
      saveUrl(url);
      const { data } = await api.post('/api/modules/api/probe', { url, method });
      setRes({
        ...data.result,
        plannedChecks: {
          authBypassChecks: apiChecks.authBypass,
          inputFuzzing: apiChecks.inputFuzzing,
          verboseErrorLeaks: apiChecks.verboseErrors,
          note: 'Flags reflect your selections; this build runs the transport probe only — full orchestration can extend these toggles later.',
        },
      });
      setPrem(data.premiumInsights);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  const runBatch = async () => {
    setErr('');
    try {
      saveUrl(url);
      const { data } = await api.post('/api/modules/api/rate-test', { url, count: batchCount });
      setBatchRes(data.result);
      setBatchPrem(data.premiumInsights);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4">
      {err && (
        <div className="rounded-lg border border-red-500/45 bg-red-950/35 px-3 py-2 font-mono text-sm text-red-200">{err}</div>
      )}

      {active === 'security' && (
      <ModuleWorkbench
        id="security"
        breadcrumb={['Modules', 'API security']}
        title="API vulnerability scanner"
        subtitle="Single-shot GET/HEAD probe against localhost URLs registered in the suite. Records timing, status, and header samples."
        banners={[
          { variant: 'passive', text: 'PASSIVE CHECK — Probe respects server URL policy (localhost / 127.0.0.1).' },
          { variant: 'auth', text: 'AUTHORIZED SYSTEMS ONLY — Probe only systems you are permitted to test.' },
        ]}
        configTitle="Scanner config"
        configIcon={IconWarningTriangle}
        primaryAction={{ label: 'Start scan', onClick: runProbe, disabled: !url.trim() }}
        resultActive={Boolean(res || prem)}
        resultContent={<ResultPanel data={res} premium={prem} title="Probe result" embedded />}
        emptyIcon={IconWarningTriangle}
        emptyTitle="System standing by"
        emptySubtitle="Configure target URL and method to initialize passive API diagnostics."
      >
        <div>
          <ModuleFieldLabel>Target URL</ModuleFieldLabel>
          <input
            className="suite-input mt-2 w-full"
            list="testro-url-history-api-rate"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={(e) => saveUrl(e.target.value)}
            placeholder="http://127.0.0.1:5000/api/health"
          />
          <datalist id="testro-url-history-api-rate">
            {urlHistory.map((u) => (
              <option key={`api-rate-${u}`} value={u} />
            ))}
          </datalist>
        </div>
        <div>
          <ModuleFieldLabel>Method</ModuleFieldLabel>
          <select className="suite-input mt-2 w-full md:max-w-xs" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option>GET</option>
            <option>HEAD</option>
          </select>
        </div>
        <div>
          <ModuleFieldLabel>Scanner options</ModuleFieldLabel>
          <div className="mt-3 space-y-2 rounded-lg border border-terminal-border/60 bg-terminal-bg-deep/50 p-3">
            {[
              ['authBypass', 'Auth bypass checks'],
              ['inputFuzzing', 'Input fuzzing'],
              ['verboseErrors', 'Verbose error leaks'],
            ].map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-3 font-mono text-sm text-terminal-accent">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-terminal-border text-terminal-accent"
                  checked={apiChecks[key]}
                  onChange={() => toggleApiCheck(key)}
                />
                {label}
              </label>
            ))}
          </div>
          <p className="mt-2 font-mono text-[11px] text-terminal-muted">
            Selections are recorded with results. Current probe captures baseline transport metadata; toggles map to future multi-check runs.
          </p>
        </div>
      </ModuleWorkbench>
      )}

      {active === 'rate' && (
      <ModuleWorkbench
        id="rate"
        breadcrumb={['Modules', 'Rate limit tester']}
        title="Rate limit assessment"
        subtitle="Sequential GET requests with aggregation of status codes, latency, and HTTP 429 counts. Localhost targets only."
        banners={[
          {
            variant: 'teal',
            text: `Plan ceiling: up to ${maxBatch} requests per batch for your current role.`,
          },
        ]}
        configTitle="Target config"
        configIcon={IconBolt}
        primaryAction={{ label: 'Launch test', onClick: runBatch, disabled: !url.trim() }}
        resultActive={Boolean(batchRes || batchPrem)}
        resultContent={<ResultPanel data={batchRes} premium={batchPrem} title="Batch diagnostics" embedded />}
        emptyIcon={IconBolt}
        emptyTitle="Awaiting parameters"
        emptySubtitle="Configure target parameters in the left panel to initialize rate-limit diagnostics."
      >
        <div>
          <ModuleFieldLabel>Target URL</ModuleFieldLabel>
          <input
            className="suite-input mt-2 w-full"
            list="testro-url-history-api-rate"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={(e) => saveUrl(e.target.value)}
            placeholder="http://127.0.0.1:5000/api/health"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <ModuleFieldLabel>Method</ModuleFieldLabel>
            <select className="suite-input mt-2 w-full" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>GET</option>
            </select>
          </div>
          <div>
            <ModuleFieldLabel>Total requests (1–{maxBatch})</ModuleFieldLabel>
            <input
              type="number"
              min={1}
              max={maxBatch}
              className="suite-input mt-2 w-full"
              value={batchCount}
              onChange={(e) => setBatchCount(Number(e.target.value))}
            />
          </div>
        </div>
        <div>
          <ModuleFieldLabel>Rate (req/min) — reference</ModuleFieldLabel>
          <input
            type="number"
            className="suite-input mt-2 w-full md:max-w-xs"
            value={ratePerMin}
            onChange={(e) => setRatePerMin(Number(e.target.value))}
          />
          <p className="mt-2 text-[11px] text-terminal-muted">
            Batch execution uses server-side pacing; this field documents your intended cadence for reports only.
          </p>
        </div>
      </ModuleWorkbench>
      )}
    </div>
  );
}
