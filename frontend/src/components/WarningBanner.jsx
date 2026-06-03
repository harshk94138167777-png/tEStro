export default function WarningBanner() {
  return (
    <div className="flex items-start gap-2 border-b border-amber-500/25 bg-gradient-to-r from-amber-950/50 to-terminal-panel/40 px-3 py-2 text-[11px] text-amber-100/95 sm:gap-3 sm:px-4 sm:py-2.5 sm:text-xs">
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-amber-500/40 bg-amber-500/10 font-display text-[10px] font-bold text-amber-400"
        aria-hidden
      >
        !
      </span>
      <p className="min-w-0 break-words leading-snug">
        <strong className="text-amber-300">Authorized use only.</strong> Use tEStro only on systems you own or have
        explicit written permission to test. Modules are simulated or strictly bounded — no real attacks against
        third parties.
      </p>
    </div>
  );
}
