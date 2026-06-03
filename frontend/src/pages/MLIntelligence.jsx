import { useState } from 'react';
import api from '../services/api.js';
import ResultPanel from '../components/ResultPanel.jsx';
import ModuleWorkbench, { ModuleFieldLabel } from '../components/ModuleWorkbench.jsx';
import { IconCpu } from '../components/NavIcons.jsx';

export default function MLIntelligence() {
  const [targetDescription, setTargetDescription] = useState('REST API with JSON login on staging…');
  const [samplePayloads, setSamplePayloads] = useState(`' OR 1=1--
{{7*7}}
; ls`);
  const [res, setRes] = useState(null);
  const [prem, setPrem] = useState(null);
  const [err, setErr] = useState('');

  const run = async () => {
    setErr('');
    try {
      const { data } = await api.post('/api/modules/ml/analyze', { targetDescription, samplePayloads });
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
        breadcrumb={['Intelligence', 'ML predictor']}
        title="ML vulnerability predictor"
        subtitle="Premium heuristic risk scoring — runs in the Node.js API. Outputs are advisory; pair with human review and authorized testing only."
        banners={[
          { variant: 'teal', text: 'PREMIUM MODULE — MERN placeholder engine; no separate Python service required.' },
        ]}
        configTitle="Target context"
        configIcon={IconCpu}
        primaryAction={{ label: 'Run heuristic analysis', onClick: run, disabled: !targetDescription.trim() }}
        resultActive={Boolean(res || prem)}
        resultContent={<ResultPanel data={res} premium={prem} title="ML-style assessment" embedded />}
        emptyIcon={IconCpu}
        emptyTitle="Awaiting context"
        emptySubtitle="Describe the target surface and optional payloads to sequence offline heuristics."
      >
        <div>
          <ModuleFieldLabel>Target description</ModuleFieldLabel>
          <textarea
            className="suite-input mt-2 min-h-[100px] w-full resize-y"
            placeholder="e.g. REST login endpoint on staging, accepts JSON body…"
            value={targetDescription}
            onChange={(e) => setTargetDescription(e.target.value)}
          />
        </div>
        <div>
          <ModuleFieldLabel>Sample payloads (optional)</ModuleFieldLabel>
          <textarea
            className="suite-input mt-2 min-h-[160px] w-full resize-y text-xs"
            placeholder="Paste example inputs / payloads for offline pattern analysis…"
            value={samplePayloads}
            onChange={(e) => setSamplePayloads(e.target.value)}
          />
        </div>
      </ModuleWorkbench>
    </div>
  );
}
