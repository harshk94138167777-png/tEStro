export default function ResultPanel({ title, data, premium, embedded }) {
  if (!data && !premium) return null;

  const preClass =
    'max-h-[min(50vh,360px)] max-w-full overflow-x-auto overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-terminal-border/60 bg-black/40 p-2.5 text-[11px] text-slate-300 sm:max-h-[min(60vh,480px)] sm:p-3 sm:text-xs';

  const inner = (
    <>
      {data && (
        <div>
          <h3 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-terminal-muted">
            {title || 'Result'}
          </h3>
          {/* Boolean summary: show simulated/live and any important boolean flags */}
          {(() => {
            const boolEntries = Object.entries(data).filter(([, v]) => typeof v === 'boolean');
            if (boolEntries.length === 0) return null;
            return (
              <div className="mb-2 flex flex-wrap gap-2">
                {boolEntries.map(([k, v]) => (
                  <span
                    key={k}
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-mono font-semibold ${
                      v ? 'bg-emerald-600/30 text-emerald-300' : 'bg-rose-600/20 text-rose-300'
                    }`}
                  >
                    {k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}: {v ? 'Yes' : 'No'}
                  </span>
                ))}
              </div>
            );
          })()}
          <pre className={preClass}>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      {premium && (
        <div className={data ? 'mt-4' : ''}>
          <h3 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-terminal-accent">
            Premium analysis
          </h3>
          <pre className={`${preClass} border-terminal-accent/25`}>{JSON.stringify(premium, null, 2)}</pre>
        </div>
      )}
    </>
  );

  if (embedded) {
    return <div className="min-w-0 space-y-2">{inner}</div>;
  }

  return <div className="mt-6 grid gap-4 md:grid-cols-2">{inner}</div>;
}
