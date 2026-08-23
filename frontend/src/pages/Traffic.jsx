import { useEffect, useState } from 'react';
import api from '../services/api.js';
import ResultPanel from '../components/ResultPanel.jsx';
import ModuleWorkbench, { ModuleFieldLabel } from '../components/ModuleWorkbench.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useUrlHistory } from '../hooks/useUrlHistory.js';
import { IconServer } from '../components/NavIcons.jsx';

export default function Traffic() {
  const { user } = useAuth();
  const { urls: urlHistory, saveUrl } = useUrlHistory();
  const [url, setUrl] = useState('');
  const [durationSec, setDurationSec] = useState(10);
  const [rps, setRps] = useState(10);
  const [concurrency, setConcurrency] = useState(2);
  const [totalRequests, setTotalRequests] = useState(10);
  const [liveMode, setLiveMode] = useState(false);
  const [res, setRes] = useState(null);
  const [prem, setPrem] = useState(null);
  const [err, setErr] = useState('');
  const [limits, setLimits] = useState(null);

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

  const isPrivileged = user?.role === 'premium' || user?.role === 'admin';
  const maxPerRun =
    user?.role === 'free'
      ? limits?.loadSimMaxTotal?.free ?? 50
      : limits?.loadSimMaxTotal?.premium ?? 1000;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const estimatedTotal = clamp(Math.round((Number(durationSec) || 1) * (Number(rps) || 1)), 1, maxPerRun);
  const maxAllowed = isPrivileged ? Number.MAX_SAFE_INTEGER : maxPerRun;

  const run = async () => {
    setErr('');
    try {
      saveUrl(url);
      const effectiveTotal = clamp(Number(totalRequests) || estimatedTotal, 1, maxAllowed);
      const { data } = await api.post('/api/modules/traffic/simulate', {
        url,
        concurrency: clamp(Number(concurrency) || 1, 1, 50),
        totalRequests: effectiveTotal,
        live: liveMode,
        mode: liveMode ? 'live' : 'simulate',
      });
      setRes(data.result);
      setPrem(data.premiumInsights);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      {err && (
        <div className="rounded-lg border border-red-500/45 bg-red-950/35 px-3 py-2 font-mono text-sm text-red-200">{err}</div>
      )}

      <ModuleWorkbench
        breadcrumb={['Traffic & load', 'DoS simulator']}
        title="Denial of service simulation"
        subtitle="Bounded concurrent request simulation for authorized testing. The execution monitor shows click time, finish time, and total runtime."
        banners={[
          {
            variant: 'teal',
            text: 'Safe mode active — hard limits on concurrency and total requests. Use only on authorized targets.',
          },
        ]}
        configTitle="Simulation config"
        configIcon={IconServer}
        authLabel="I authorize this stress test on systems I own or have explicit permission to test."
        primaryAction={{
          label: 'Start simulation',
          onClick: run,
          variant: 'danger',
          disabled: !url.trim(),
        }}
        resultActive={Boolean(res || prem)}
        resultContent={<ResultPanel data={res} premium={prem} title="Simulation output" embedded />}
        emptyIcon={IconServer}
        emptyTitle="Ready to begin simulation"
        emptySubtitle="Tune target and request budget, confirm authorization, then launch the capped run."
      >
        <div>
          <ModuleFieldLabel>Target URL</ModuleFieldLabel>
          <input
            className="suite-input mt-2 w-full"
            list="testro-url-history-traffic"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={(e) => saveUrl(e.target.value)}
            placeholder="http://127.0.0.1:5000/api/health"
          />
          <datalist id="testro-url-history-traffic">
            {urlHistory.map((u) => (
              <option key={`traffic-${u}`} value={u} />
            ))}
          </datalist>
        </div>
        <label className="mt-3 flex items-center gap-2 font-mono text-sm text-terminal-accent">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-terminal-border text-terminal-accent"
            checked={liveMode}
            onChange={(e) => setLiveMode(e.target.checked)}
          />
          {isPrivileged ? 'Run authorized live probe (explicit opt-in)' : 'Run localhost-only live probe (explicit opt-in)'}
        </label>
        <p className="mt-1 font-mono text-[11px] text-terminal-muted">
          {isPrivileged
            ? 'Admin/premium live probes may use approved targets configured by the backend.'
            : 'Only use this for localhost or 127.0.0.1 targets you control. The backend rejects non-local targets.'}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <ModuleFieldLabel>Duration (seconds)</ModuleFieldLabel>
              <span className="font-mono text-[10px] text-terminal-muted">Used</span>
            </div>
            <input
              type="number"
              min={1}
              max={60}
              className="suite-input mt-2 w-full"
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value))}
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <ModuleFieldLabel>Requests / sec</ModuleFieldLabel>
              <span className="font-mono text-[10px] text-terminal-muted">Used</span>
            </div>
            <input
              type="number"
              min={1}
              max={50}
              className="suite-input mt-2 w-full"
              value={rps}
              onChange={(e) => setRps(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <ModuleFieldLabel>Concurrency</ModuleFieldLabel>
            <input
              type="number"
              min={1}
              className="suite-input mt-2 w-full"
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <ModuleFieldLabel>Total requests</ModuleFieldLabel>
              <span className="font-mono text-[10px] text-terminal-muted">Auto {estimatedTotal} / Max {isPrivileged ? 'manual' : maxPerRun}</span>
            </div>
            <input
              type="number"
              min={1}
              max={isPrivileged ? undefined : maxPerRun}
              className="suite-input mt-2 w-full"
              value={totalRequests}
              onChange={(e) => setTotalRequests(Number(e.target.value))}
            />
            <p className="mt-2 font-mono text-[10px] text-terminal-muted">
              {isPrivileged
                ? 'Premium/admin can enter a larger cap manually; the server will honor the value you submit.'
                : `Estimated from duration x rps: ${estimatedTotal} requests (capped by plan limit).`}
            </p>
          </div>
        </div>
      </ModuleWorkbench>
    </div>
  );
}
