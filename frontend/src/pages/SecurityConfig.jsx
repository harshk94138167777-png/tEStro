import { useState } from 'react';
import api from '../services/api.js';
import ResultPanel from '../components/ResultPanel.jsx';
import ModuleWorkbench, { ModuleFieldLabel } from '../components/ModuleWorkbench.jsx';
import { useHashScroll } from '../hooks/useHashScroll.js';
import { useModuleSection } from '../hooks/useModuleSection.js';
import { useUrlHistory } from '../hooks/useUrlHistory.js';
import { IconPadlock, IconShieldOutline, IconShieldCheck } from '../components/NavIcons.jsx';

const SECTION_IDS = ['headers', 'session', 'ssl'];

export default function SecurityConfig() {
  const active = useModuleSection('headers', SECTION_IDS);
  useHashScroll();
  const { urls: urlHistory, saveUrl } = useUrlHistory();
  const [url, setUrl] = useState('');
  const [res, setRes] = useState(null);
  const [prem, setPrem] = useState(null);

  const [sessionUrl, setSessionUrl] = useState('');
  const [cookieName, setCookieName] = useState('session');
  const [tokenSample, setTokenSample] = useState('');
  const [sessionRes, setSessionRes] = useState(null);
  const [sessionPrem, setSessionPrem] = useState(null);

  const [sslUrl, setSslUrl] = useState('');
  const [sslRes, setSslRes] = useState(null);

  const [err, setErr] = useState('');

  const runHeaders = async () => {
    setErr('');
    try {
      saveUrl(url);
      const { data } = await api.post('/api/modules/security/headers', { url });
      setRes(data.result);
      setPrem(data.premiumInsights);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  const runSession = async () => {
    setErr('');
    try {
      saveUrl(sessionUrl);
      const { data } = await api.post('/api/modules/security/headers', { url: sessionUrl });
      const token = tokenSample.trim();
      let entropyBits = null;
      if (token.length > 0) {
        const counts = new Map();
        for (const ch of token) counts.set(ch, (counts.get(ch) || 0) + 1);
        let h = 0;
        for (const c of counts.values()) {
          const p = c / token.length;
          h -= p * Math.log2(p);
        }
        entropyBits = Math.round(h * 1000) / 1000;
      }
      setSessionRes({
        ...data.result,
        _note: 'Passive review: Set-Cookie flags and security headers from a single response.',
        sessionContext: {
          cookieNameInspect: cookieName.trim() || '(any)',
          tokenSampleChars: token.length,
          estimatedEntropyBits: entropyBits,
        },
      });
      setSessionPrem(data.premiumInsights);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  const runSsl = () => {
    setErr('');
    saveUrl(sslUrl);
    setSslRes({
      target: sslUrl,
      guidance: [
        'Inspect certificate chain, expiry, and SAN list in browser devtools or with openssl s_client.',
        'Confirm TLS 1.2+ and modern cipher suites for your environment.',
        'Pair with HTTP header review — HSTS and upgrade-insecure-requests reduce downgrade risk.',
      ],
      mode: 'passive_tls_checklist',
    });
  };

  return (
    <div className="w-full min-w-0 space-y-4">
      {err && (
        <div className="rounded-lg border border-red-500/45 bg-red-950/35 px-3 py-2 font-mono text-sm text-red-200">{err}</div>
      )}

      {active === 'headers' && (
      <ModuleWorkbench
        id="headers"
        breadcrumb={['Security config', 'Headers check']}
        title="HTTP security headers"
        subtitle="Fetch a localhost response and highlight missing CSP, HSTS, X-Frame-Options, and related protections."
        banners={[
          { variant: 'passive', text: 'PASSIVE CHECK — Only safe GET-style fetches to loopback targets are performed.' },
        ]}
        configTitle="Target configuration"
        configIcon={IconShieldOutline}
        primaryAction={{ label: 'Run header check', onClick: runHeaders, disabled: !url.trim() }}
        resultActive={Boolean(res || prem)}
        resultContent={<ResultPanel data={res} premium={prem} title="Header matrix" embedded />}
        emptyIcon={IconShieldOutline}
        emptyTitle="Awaiting target"
        emptySubtitle="Provide a localhost URL to compare response headers against recommended posture."
      >
        <div>
          <ModuleFieldLabel>Target URL</ModuleFieldLabel>
          <input
            className="suite-input mt-2 w-full"
            list="testro-url-history-security"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={(e) => saveUrl(e.target.value)}
            placeholder="http://127.0.0.1:5000/api/health"
          />
          <datalist id="testro-url-history-security">
            {urlHistory.map((u) => (
              <option key={`security-${u}`} value={u} />
            ))}
          </datalist>
        </div>
      </ModuleWorkbench>
      )}

      {active === 'session' && (
      <ModuleWorkbench
        id="session"
        breadcrumb={['Security config', 'Session checker']}
        title="Session security analyzer"
        subtitle="Passive analysis of session tokens, cookie flags, and header-derived signals from one HTTP response."
        banners={[
          {
            variant: 'teal',
            text: 'PASSIVE ANALYSIS — Single GET/HEAD-style fetch to your URL; no brute-force or token guessing. Token box is local entropy math only.',
          },
        ]}
        configTitle="Target config"
        configIcon={IconShieldCheck}
        primaryAction={{ label: 'Evaluate posture', onClick: runSession, disabled: !sessionUrl.trim() }}
        resultActive={Boolean(sessionRes || sessionPrem)}
        resultContent={<ResultPanel data={sessionRes} premium={sessionPrem} title="Session signals" embedded />}
        emptyIcon={IconShieldCheck}
        emptyTitle="Awaiting target"
        emptySubtitle="Provide an application URL (localhost) to evaluate cookie flags and header hygiene."
      >
        <div>
          <ModuleFieldLabel>Target application URL</ModuleFieldLabel>
          <input
            className="suite-input mt-2 w-full"
            list="testro-url-history-security"
            value={sessionUrl}
            onChange={(e) => setSessionUrl(e.target.value)}
            onBlur={(e) => saveUrl(e.target.value)}
            placeholder="http://127.0.0.1:5000/api/health"
          />
        </div>
        <div>
          <ModuleFieldLabel>Cookie name (to inspect)</ModuleFieldLabel>
          <input className="suite-input mt-2 w-full" value={cookieName} onChange={(e) => setCookieName(e.target.value)} />
        </div>
        <div>
          <ModuleFieldLabel>Sample token (for entropy check)</ModuleFieldLabel>
          <textarea
            className="suite-input mt-2 min-h-[100px] w-full resize-y"
            value={tokenSample}
            onChange={(e) => setTokenSample(e.target.value)}
            placeholder="Paste a raw token (JWT, UUID, etc.) here to evaluate its Shannon entropy locally…"
          />
        </div>
      </ModuleWorkbench>
      )}

      {active === 'ssl' && (
      <ModuleWorkbench
        id="ssl"
        breadcrumb={['Security config', 'SSL/TLS check']}
        title="SSL / TLS check"
        subtitle="Offline checklist for transport security. No handshakes are initiated from tEStro for arbitrary hosts."
        banners={[
          { variant: 'passive', text: 'PASSIVE CHECK — No payloads or probes are sent; this module documents review steps only.' },
        ]}
        configTitle="Target configuration"
        configIcon={IconPadlock}
        primaryAction={{ label: 'Run SSL check', onClick: runSsl, disabled: !sslUrl.trim() }}
        resultActive={Boolean(sslRes)}
        resultContent={<ResultPanel data={sslRes} title="TLS guidance" embedded />}
        emptyIcon={IconPadlock}
        emptyTitle="Awaiting target"
        emptySubtitle="Capture the hostname you plan to review, then run the checklist."
      >
        <div>
          <ModuleFieldLabel>Target URL</ModuleFieldLabel>
          <input
            className="suite-input mt-2 w-full"
            list="testro-url-history-security"
            value={sslUrl}
            onChange={(e) => setSslUrl(e.target.value)}
            onBlur={(e) => saveUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
      </ModuleWorkbench>
      )}
    </div>
  );
}
