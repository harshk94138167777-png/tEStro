import { useState } from 'react';
import api from '../services/api.js';
import ResultPanel from '../components/ResultPanel.jsx';
import ModuleWorkbench, { ModuleFieldLabel } from '../components/ModuleWorkbench.jsx';
import { useHashScroll } from '../hooks/useHashScroll.js';
import { useModuleSection } from '../hooks/useModuleSection.js';
import { useUrlHistory } from '../hooks/useUrlHistory.js';
import { IconCodeBrackets, IconTerminalPrompt } from '../components/NavIcons.jsx';

const SECTION_IDS = ['sql', 'cmd'];

export default function Injection() {
  const active = useModuleSection('sql', SECTION_IDS);
  useHashScroll();
  const { urls: urlHistory, saveUrl } = useUrlHistory();
  const [targetUrl, setTargetUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [targetParam, setTargetParam] = useState('id');
  const [sqlPayload, setSqlPayload] = useState(`' OR '1'='1
; DROP TABLE users--
1' UNION SELECT NULL--`);
  const [cmdUrl, setCmdUrl] = useState('');
  const [cmdMethod, setCmdMethod] = useState('GET');
  const [cmdParam, setCmdParam] = useState('host');
  const [cmdPayload, setCmdPayload] = useState(`; id
| whoami
& cat /etc/passwd`);
  const [sqlRes, setSqlRes] = useState(null);
  const [cmdRes, setCmdRes] = useState(null);
  const [premiumSql, setPremiumSql] = useState(null);
  const [premiumCmd, setPremiumCmd] = useState(null);
  const [err, setErr] = useState('');

  const runSql = async () => {
    setErr('');
    try {
      saveUrl(targetUrl);
      const { data } = await api.post('/api/modules/injection/sql', {
        url: targetUrl,
        method,
        targetParam,
        payload: sqlPayload,
      });
      setSqlRes(data.result);
      setPremiumSql(data.premiumInsights);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  const runCmd = async () => {
    setErr('');
    try {
      saveUrl(cmdUrl);
      const { data } = await api.post('/api/modules/injection/command', {
        url: cmdUrl,
        method: cmdMethod,
        targetParam: cmdParam,
        payload: cmdPayload,
      });
      setCmdRes(data.result);
      setPremiumCmd(data.premiumInsights);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4">
      {err && (
        <div className="rounded-lg border border-red-500/45 bg-red-950/35 px-3 py-2 font-mono text-sm text-red-200">{err}</div>
      )}
      {active === 'sql' && (
      <ModuleWorkbench
        id="sql"
        breadcrumb={['Injection attacks', 'SQL injection']}
        title="SQLi vulnerability scanner"
        subtitle="Assess SQL injection risk using offline payload analysis or controlled live checks against authorized targets."
        banners={[
          { variant: 'passive', text: 'PASSIVE CHECK — No payloads are executed against live systems. Educational simulation only.' },
          { variant: 'auth', text: 'AUTHORIZED SYSTEMS ONLY — Use only on targets you own or have written permission to test.' },
        ]}
        configTitle="Target config"
        configIcon={IconCodeBrackets}
        primaryAction={{ label: 'Execute scan', onClick: runSql, disabled: !targetUrl.trim() }}
        resultActive={Boolean(sqlRes || premiumSql)}
        resultContent={<ResultPanel data={sqlRes} premium={premiumSql} title="Analysis output" embedded />}
        emptyIcon={IconCodeBrackets}
        emptyTitle="Awaiting parameters"
        emptySubtitle="Configure target context and payloads to run offline analysis or authorized live checks."
      >
        <div>
          <ModuleFieldLabel>Target URL</ModuleFieldLabel>
          <input
            className="suite-input mt-2 w-full"
            list="testro-url-history"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            onBlur={(e) => saveUrl(e.target.value)}
            placeholder="https://api.example.com/v1/users"
          />
          <datalist id="testro-url-history">
            {urlHistory.map((u) => (
              <option key={`sql-${u}`} value={u} />
            ))}
          </datalist>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <ModuleFieldLabel>Method</ModuleFieldLabel>
            <select className="suite-input mt-2 w-full" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
            </select>
          </div>
          <div>
            <ModuleFieldLabel>Target param</ModuleFieldLabel>
            <input className="suite-input mt-2 w-full" value={targetParam} onChange={(e) => setTargetParam(e.target.value)} />
          </div>
        </div>
        <div>
          <ModuleFieldLabel>Payloads (one per line)</ModuleFieldLabel>
          <textarea
            className="suite-input mt-2 min-h-[160px] w-full resize-y"
            value={sqlPayload}
            onChange={(e) => setSqlPayload(e.target.value)}
          />
        </div>
      </ModuleWorkbench>
      )}

      {active === 'cmd' && (
      <ModuleWorkbench
        id="cmd"
        breadcrumb={['Injection attacks', 'OS command injection']}
        title="Command execution simulator"
        subtitle="Classify command injection patterns with offline analysis or controlled live checks against authorized targets."
        banners={[
          { variant: 'passive', text: 'PASSIVE CHECK — Syntax analysis only; no commands are executed.' },
          { variant: 'auth', text: 'AUTHORIZED SYSTEMS ONLY — Educational use on permitted systems only.' },
        ]}
        configTitle="Target config"
        configIcon={IconTerminalPrompt}
        primaryAction={{ label: 'Launch scan', onClick: runCmd, disabled: !cmdUrl.trim() }}
        resultActive={Boolean(cmdRes || premiumCmd)}
        resultContent={<ResultPanel data={cmdRes} premium={premiumCmd} title="Analysis output" embedded />}
        emptyIcon={IconTerminalPrompt}
        emptyTitle="Awaiting target"
        emptySubtitle="Provide command-style payloads to run offline analysis or authorized live checks."
      >
        <div>
          <ModuleFieldLabel>Target URL</ModuleFieldLabel>
          <input
            className="suite-input mt-2 w-full"
            list="testro-url-history"
            value={cmdUrl}
            onChange={(e) => setCmdUrl(e.target.value)}
            onBlur={(e) => saveUrl(e.target.value)}
            placeholder="https://api.example.com/ping"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <ModuleFieldLabel>Method</ModuleFieldLabel>
            <select className="suite-input mt-2 w-full" value={cmdMethod} onChange={(e) => setCmdMethod(e.target.value)}>
              <option>GET</option>
              <option>POST</option>
            </select>
          </div>
          <div>
            <ModuleFieldLabel>Target param</ModuleFieldLabel>
            <input className="suite-input mt-2 w-full" value={cmdParam} onChange={(e) => setCmdParam(e.target.value)} />
          </div>
        </div>
        <div>
          <ModuleFieldLabel>Payloads (OS command tokens)</ModuleFieldLabel>
          <textarea
            className="suite-input mt-2 min-h-[140px] w-full resize-y"
            value={cmdPayload}
            onChange={(e) => setCmdPayload(e.target.value)}
          />
        </div>
      </ModuleWorkbench>
      )}
    </div>
  );
}
