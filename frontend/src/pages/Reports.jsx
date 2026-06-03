import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import api from '../services/api.js';

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/api/reports/stats');
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.error || e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const download = async (kind) => {
    try {
      const res = await api.get(`/api/reports/export/${kind}`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = kind === 'pdf' ? 'testro-report.pdf' : 'testro-export.json';
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  const byDay = (stats?.byDay || []).map((d) => ({ day: d._id, count: d.count }));
  const byModule = (stats?.byModule || []).map((d) => ({ module: d._id, count: d.count }));

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-100 sm:text-2xl">Reports &amp; logs</h1>
          <p className="mt-1 text-xs text-terminal-muted sm:text-sm">Visualize stored simulations and export for documentation.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => download('json')}
            className="rounded border border-terminal-border bg-terminal-panel px-3 py-2 text-xs text-slate-200 hover:border-terminal-accent/50"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => download('pdf')}
            className="rounded border border-terminal-border bg-terminal-panel px-3 py-2 text-xs text-slate-200 hover:border-terminal-accent/50"
          >
            Export PDF
          </button>
        </div>
      </div>
      {err && <div className="text-sm text-red-400">{err}</div>}

      <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="suite-panel min-w-0 p-3 sm:p-4">
          <h2 className="text-xs font-semibold text-terminal-accent sm:text-sm">Tests per day (30d)</h2>
          <div className="mt-3 h-52 min-w-0 sm:mt-4 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2d3d" />
                <XAxis dataKey="day" stroke="#5c7a89" tick={{ fontSize: 10 }} />
                <YAxis stroke="#5c7a89" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#121a24', border: '1px solid #1f2d3d' }} />
                <Line type="monotone" dataKey="count" stroke="#00ff41" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="suite-panel min-w-0 p-3 sm:p-4">
          <h2 className="text-xs font-semibold text-terminal-accent sm:text-sm">By module</h2>
          <div className="mt-3 h-52 min-w-0 sm:mt-4 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byModule}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2d3d" />
                <XAxis dataKey="module" stroke="#5c7a89" tick={{ fontSize: 10 }} />
                <YAxis stroke="#5c7a89" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#121a24', border: '1px solid #1f2d3d' }} />
                <Bar dataKey="count" fill="#00ff41" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
