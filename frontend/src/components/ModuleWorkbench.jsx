import { useState } from 'react';

/** Uppercase monospaced field label */
export function ModuleFieldLabel({ children, className = '' }) {
  return (
    <label
      className={`block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-terminal-muted ${className}`}
    >
      {children}
    </label>
  );
}

function Banner({ variant, children }) {
  const map = {
    passive:
      'border border-red-900/55 bg-red-950/45 text-red-200 [&_svg]:text-red-400',
    auth: 'border border-red-600/35 bg-[#2a0a0a] text-red-200 [&_svg]:text-red-400',
    teal: 'border border-teal-700/40 bg-[#042a28]/90 text-teal-200 [&_svg]:text-teal-400',
  };
  return (
    <div
      className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-[11px] font-mono leading-snug sm:text-xs ${map[variant] || map.passive}`}
      role="note"
    >
      {variant === 'passive' && (
        <span className="mt-0.5 shrink-0" aria-hidden>
          ⚠
        </span>
      )}
      {variant === 'auth' && (
        <span className="mt-0.5 shrink-0" aria-hidden>
          ⚠
        </span>
      )}
      {variant === 'teal' && (
        <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

/**
 * Standard tool page: breadcrumbs, title, banners, 2-col config + results (matches SecOps mocks).
 */
export default function ModuleWorkbench({
  id,
  breadcrumb = [],
  title,
  subtitle,
  banners = [],
  configKicker = 'TARGET CONFIGURATION',
  configTitle,
  configIcon: ConfigIcon,
  requireAuthConfirm = true,
  authLabel = 'I confirm I am authorized to run this analysis on systems I own or have explicit permission to test.',
  primaryAction,
  children,
  resultActive,
  resultContent,
  emptyIcon: EmptyIcon,
  emptyTitle = 'Awaiting parameters',
  emptySubtitle = 'Configure the target in the left panel to initialize this module.',
}) {
  const [agree, setAgree] = useState(!requireAuthConfirm);
  const [execState, setExecState] = useState({
    status: 'idle',
    clickedAt: null,
    startedAt: null,
    finishedAt: null,
    durationMs: null,
    error: '',
  });
  const runDisabled =
    Boolean(primaryAction?.disabled) || (requireAuthConfirm && !agree);
  const variant = primaryAction?.variant === 'danger' ? 'danger' : 'accent';
  const isRunning = execState.status === 'running';

  const handlePrimaryAction = async () => {
    if (!primaryAction?.onClick || runDisabled) return;
    const clickedAt = new Date();
    const startedAtMs = Date.now();
    setExecState({
      status: 'running',
      clickedAt: clickedAt.toISOString(),
      startedAt: new Date(startedAtMs).toISOString(),
      finishedAt: null,
      durationMs: null,
      error: '',
    });
    try {
      await Promise.resolve(primaryAction.onClick());
      const finishedAtMs = Date.now();
      setExecState((prev) => ({
        ...prev,
        status: 'success',
        finishedAt: new Date(finishedAtMs).toISOString(),
        durationMs: finishedAtMs - startedAtMs,
      }));
    } catch (e) {
      const finishedAtMs = Date.now();
      setExecState((prev) => ({
        ...prev,
        status: 'error',
        finishedAt: new Date(finishedAtMs).toISOString(),
        durationMs: finishedAtMs - startedAtMs,
        error: e?.response?.data?.error || e?.message || 'Execution failed',
      }));
    }
  };

  return (
    <div id={id} className="scroll-mt-16 space-y-3 sm:scroll-mt-24 sm:space-y-4">
      <nav className="break-words font-mono text-[10px] text-terminal-accent/90 sm:text-[11px]">
        {breadcrumb.map((crumb, i) => (
          <span key={crumb}>
            {i > 0 && <span className="text-terminal-border"> · </span>}
            <span className={i === breadcrumb.length - 1 ? 'text-terminal-accent-bright' : 'text-terminal-muted'}>
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <header className="min-w-0">
        <h1 className="font-display text-xl font-bold tracking-tight text-terminal-accent sm:text-2xl md:text-3xl">{title}</h1>
        {subtitle && (
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-terminal-muted sm:text-sm">{subtitle}</p>
        )}
      </header>

      <div className="space-y-3">
        {banners.map((b, i) => (
          <Banner key={i} variant={b.variant}>
            {b.text}
          </Banner>
        ))}
      </div>

      <div className="grid min-h-0 min-w-0 gap-4 sm:gap-5 lg:grid-cols-2 lg:items-stretch lg:gap-6">
        <div className="flex h-full min-h-0 flex-col rounded-xl border border-terminal-border bg-terminal-panel p-4 shadow-suite sm:p-5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-terminal-muted">{configKicker}</p>
          <div className="mt-3 flex items-center gap-2.5 border-b border-terminal-border/60 pb-3">
            {ConfigIcon && (
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-terminal-border bg-terminal-bg-deep text-terminal-accent">
                <ConfigIcon className="h-5 w-5" />
              </span>
            )}
            <h2 className="min-w-0 font-display text-sm font-semibold text-terminal-accent sm:text-base">{configTitle}</h2>
          </div>

          <div className="mt-5 space-y-4">{children}</div>

          {requireAuthConfirm && (
            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-terminal-border/80 bg-terminal-bg-deep/80 px-3 py-2.5">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-terminal-border text-terminal-accent focus:ring-terminal-accent"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span className="min-w-0 font-mono text-[11px] leading-relaxed text-terminal-accent sm:text-xs">{authLabel}</span>
            </label>
          )}

          <div className="mt-4 rounded-lg border border-terminal-border/70 bg-terminal-bg-deep/70 px-3 py-2.5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-terminal-muted">Execution monitor</p>
            <div className="mt-2 space-y-1 font-mono text-[11px] text-terminal-accent">
              <p>Status: {execState.status}</p>
              <p>Clicked: {execState.clickedAt ? new Date(execState.clickedAt).toLocaleTimeString() : '-'}</p>
              <p>Started: {execState.startedAt ? new Date(execState.startedAt).toLocaleTimeString() : '-'}</p>
              <p>Finished: {execState.finishedAt ? new Date(execState.finishedAt).toLocaleTimeString() : '-'}</p>
              <p>Duration: {execState.durationMs != null ? `${execState.durationMs} ms` : '-'}</p>
              {execState.error ? <p className="text-red-300">Error: {execState.error}</p> : null}
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={runDisabled || isRunning}
            className={[
              'mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-mono text-xs font-bold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm',
              variant === 'danger'
                ? 'bg-red-600 text-white shadow-[0_0_28px_rgba(220,38,38,0.45)] hover:bg-red-500 hover:shadow-[0_0_36px_rgba(220,38,38,0.55)]'
                : 'bg-terminal-accent text-black shadow-glow hover:brightness-110 hover:shadow-[0_0_36px_rgba(0,255,65,0.55)]',
            ].join(' ')}
          >
            <span aria-hidden className="text-lg leading-none">
              ▶
            </span>
            {isRunning ? 'Running...' : primaryAction.label}
          </button>
        </div>

        <div className="flex h-full min-h-0 w-full flex-col rounded-xl border border-terminal-border bg-terminal-panel/90 shadow-suite">
          {resultActive ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-5">
                {resultContent}
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-6 text-center sm:px-6 sm:py-8">
              {EmptyIcon && (
                <EmptyIcon className="h-12 w-12 text-terminal-accent opacity-[0.12] sm:h-16 sm:w-16" aria-hidden />
              )}
              <p className="mt-3 font-display text-base font-semibold text-terminal-accent sm:mt-4 sm:text-lg">{emptyTitle}</p>
              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-terminal-muted sm:mt-2 sm:text-sm">{emptySubtitle}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
