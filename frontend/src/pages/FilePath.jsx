import { useMemo, useState } from 'react';
import api from '../services/api.js';
import ResultPanel from '../components/ResultPanel.jsx';
import ModuleWorkbench, { ModuleFieldLabel } from '../components/ModuleWorkbench.jsx';
import { useHashScroll } from '../hooks/useHashScroll.js';
import { useModuleSection } from '../hooks/useModuleSection.js';
import { useUrlHistory } from '../hooks/useUrlHistory.js';
import { IconSearchFile } from '../components/NavIcons.jsx';

const FILE_TAGS = ['.php', '.exe', '.sh', '.svg', '.html', '.js', '.txt', '.jpg', '.pdf'];
const SECTION_IDS = ['upload', 'path'];

export default function FilePath() {
  const active = useModuleSection('upload', SECTION_IDS);
  useHashScroll();
  const { urls: urlHistory, saveUrl } = useUrlHistory();
  const [uploadUrl, setUploadUrl] = useState('');
  const [activeTypes, setActiveTypes] = useState(() => new Set(['.php', '.exe', '.sh', '.svg', '.html']));
  const [filename, setFilename] = useState('shell.php');

  const [pathUrl, setPathUrl] = useState('');
  const [pathParam, setPathParam] = useState('file');
  const [depth, setDepth] = useState(3);

  const [tr, setTr] = useState(null);
  const [fv, setFv] = useState(null);
  const [prem, setPrem] = useState(null);
  const [err, setErr] = useState('');

  const traversalPayload = useMemo(() => '../'.repeat(depth) + 'etc/passwd', [depth]);

  const toggleType = (ext) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(ext)) next.delete(ext);
      else next.add(ext);
      return next;
    });
  };

  const runFv = async () => {
    setErr('');
    try {
      saveUrl(uploadUrl);
      const { data } = await api.post('/api/modules/file/validate-name', { url: uploadUrl, filename });
      setFv(data.result);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  const runTr = async () => {
    setErr('');
    try {
      saveUrl(pathUrl);
      const { data } = await api.post('/api/modules/file/path-traversal', {
        url: pathUrl,
        targetParam: pathParam,
        payload: traversalPayload,
      });
      setTr(data.result);
      setPrem(data.premiumInsights);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4">
      {err && (
        <div className="rounded-lg border border-red-500/45 bg-red-950/35 px-3 py-2 font-mono text-sm text-red-200">{err}</div>
      )}

      {active === 'upload' && (
      <ModuleWorkbench
        id="upload"
        breadcrumb={['File & path', 'File upload tester']}
        title="File upload tester"
        subtitle="Validate risky filenames using offline checks or controlled live endpoint checks when URL is provided."
        banners={[
          { variant: 'auth', text: 'AUTHORIZED SYSTEMS ONLY — Simulated file-type probes for lab use only.' },
        ]}
        configTitle="Test configuration"
        configIcon={IconSearchFile}
        primaryAction={{ label: 'Run file upload test', onClick: runFv, disabled: !filename.trim() }}
        resultActive={Boolean(fv)}
        resultContent={<ResultPanel data={fv} title="Validation output" embedded />}
        emptyIcon={IconSearchFile}
        emptyTitle="Awaiting parameters"
        emptySubtitle="Choose risky extensions and a filename to score against the safe-policy engine."
      >
        <div>
          <ModuleFieldLabel>Upload endpoint URL</ModuleFieldLabel>
          <input
            className="suite-input mt-2 w-full"
            list="testro-url-history-file-path"
            value={uploadUrl}
            onChange={(e) => setUploadUrl(e.target.value)}
            onBlur={(e) => saveUrl(e.target.value)}
            placeholder="https://example.com/upload"
          />
          <datalist id="testro-url-history-file-path">
            {urlHistory.map((u) => (
              <option key={`file-path-${u}`} value={u} />
            ))}
          </datalist>
        </div>
        <div>
          <ModuleFieldLabel>File types to test</ModuleFieldLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {FILE_TAGS.map((ext) => {
              const on = activeTypes.has(ext);
              return (
                <button
                  key={ext}
                  type="button"
                  onClick={() => toggleType(ext)}
                  className={[
                    'rounded-lg border px-3 py-1.5 font-mono text-xs transition',
                    on
                      ? 'border-terminal-accent bg-terminal-accent text-black'
                      : 'border-terminal-border text-terminal-accent hover:border-terminal-accent/60',
                  ].join(' ')}
                >
                  {ext}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <ModuleFieldLabel>Filename sent to validator</ModuleFieldLabel>
          <input className="suite-input mt-2 w-full" value={filename} onChange={(e) => setFilename(e.target.value)} />
        </div>
      </ModuleWorkbench>
      )}

      {active === 'path' && (
      <ModuleWorkbench
        id="path"
        breadcrumb={['File & path', 'Path traversal']}
        title="Path traversal"
        subtitle="Detect traversal risks with offline pattern checks or controlled live target checks when URL is provided."
        banners={[
          { variant: 'auth', text: 'AUTHORIZED SYSTEMS ONLY — Educational simulation only.' },
        ]}
        configTitle="Test configuration"
        configIcon={IconSearchFile}
        primaryAction={{ label: 'Run path traversal test', onClick: runTr, disabled: !pathUrl.trim() }}
        resultActive={Boolean(tr || prem)}
        resultContent={<ResultPanel data={tr} premium={prem} title="Pattern analysis" embedded />}
        emptyIcon={IconSearchFile}
        emptyTitle="Awaiting parameters"
        emptySubtitle="Tune traversal depth and context fields to evaluate normalization risks."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <ModuleFieldLabel>Target URL</ModuleFieldLabel>
            <input
              className="suite-input mt-2 w-full"
              list="testro-url-history-file-path"
              value={pathUrl}
              onChange={(e) => setPathUrl(e.target.value)}
              onBlur={(e) => saveUrl(e.target.value)}
              placeholder="https://example.com/download"
            />
          </div>
          <div>
            <ModuleFieldLabel>Vulnerable parameter name</ModuleFieldLabel>
            <input className="suite-input mt-2 w-full" value={pathParam} onChange={(e) => setPathParam(e.target.value)} />
          </div>
        </div>
        <div>
          <ModuleFieldLabel>Traversal depth — payload preview</ModuleFieldLabel>
          <p className="mt-1 font-mono text-[11px] text-terminal-accent/90">{traversalPayload}</p>
          <input
            type="range"
            min={1}
            max={5}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-terminal-border accent-terminal-accent"
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-terminal-muted">
            <span>1 level</span>
            <span>{depth} levels</span>
            <span>5 levels</span>
          </div>
        </div>
      </ModuleWorkbench>
      )}
    </div>
  );
}
