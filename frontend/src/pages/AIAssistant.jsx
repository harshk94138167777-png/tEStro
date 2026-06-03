import { useMemo, useState } from 'react';
import api from '../services/api.js';

const WELCOME_TEXT =
  'I can help explain your tEStro simulation results and suggest defensive fixes. I will not assist with attacking systems without authorization.';

function makeWelcomeMessage() {
  return { role: 'assistant', content: WELCOME_TEXT };
}

export default function AIAssistant() {
  const [sessions, setSessions] = useState(() => [
    { id: '1', label: 'Session 1', messages: [makeWelcomeMessage()] },
  ]);
  const [activeId, setActiveId] = useState('1');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const active = useMemo(() => sessions.find((s) => s.id === activeId) ?? sessions[0], [sessions, activeId]);
  const messages = active?.messages ?? [makeWelcomeMessage()];

  const patchSession = (sessionId, updater) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, messages: updater(s.messages) } : s))
    );
  };

  const newSession = () => {
    const id = String(Date.now());
    const n = sessions.length + 1;
    setSessions((prev) => [...prev, { id, label: `Session ${n}`, messages: [makeWelcomeMessage()] }]);
    setActiveId(id);
    setErr('');
    setInput('');
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const sessionId = activeId;
    setErr('');
    const next = [...messages, { role: 'user', content: text }];
    patchSession(sessionId, () => next);
    setInput('');
    setBusy(true);
    try {
      const { data } = await api.post('/api/ai/chat', {
        messages: next.map((m) => ({ role: m.role, content: m.content })),
        context: { source: 'tEStro UI' },
      });
      patchSession(sessionId, () => [...next, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
      patchSession(sessionId, () => next);
    } finally {
      setBusy(false);
    }
  };

  const onlyWelcome =
    messages.length === 1 && messages[0].role === 'assistant' && messages[0].content === WELCOME_TEXT;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 sm:gap-4 lg:max-h-[calc(100dvh-9rem)] lg:flex-row lg:gap-5">
      <aside className="flex max-h-[38vh] min-h-0 shrink-0 flex-col rounded-xl border border-terminal-border bg-terminal-panel/90 p-3 shadow-suite-sm sm:p-4 lg:max-h-none lg:w-56 lg:shrink-0">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-terminal-cyan drop-shadow-[0_0_10px_rgba(0,255,65,0.2)]">
            Active sessions
          </h2>
          <button
            type="button"
            onClick={newSession}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-terminal-cyan/50 text-lg font-light text-terminal-cyan transition hover:bg-terminal-accent/10 hover:shadow-[0_0_14px_rgba(0,255,65,0.25)]"
            aria-label="New session"
          >
            +
          </button>
        </div>
        <ul className="mt-2 max-h-[22vh] space-y-1 overflow-y-auto sm:mt-3 sm:max-h-[28vh] lg:max-h-[min(40vh,320px)] lg:overflow-y-auto xl:max-h-none">
          {sessions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  setActiveId(s.id);
                  setErr('');
                }}
                className={[
                  'w-full rounded-lg border px-2 py-2 text-left font-mono text-[11px] transition',
                  s.id === activeId
                    ? 'border-terminal-accent/50 bg-terminal-accent/10 text-terminal-accent shadow-[0_0_12px_rgba(0,255,65,0.15)]'
                    : 'border-transparent text-terminal-muted hover:border-terminal-border hover:text-terminal-accent-bright',
                ].join(' ')}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-auto pt-4 font-mono text-[10px] text-terminal-muted">Sessions are kept in this tab only.</p>
      </aside>

      <div className="flex min-h-[min(52vh,420px)] min-w-0 flex-1 flex-col rounded-xl border border-terminal-border bg-terminal-panel/80 shadow-suite lg:min-h-0">
        {err && (
          <div className="border-b border-red-500/30 bg-red-950/30 px-4 py-2 font-mono text-xs text-red-200">{err}</div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
          {onlyWelcome ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <svg
                className="h-16 w-16 text-terminal-muted opacity-40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path d="M21 15a4 4 0 01-4 4H7l-4 4V7a4 4 0 014-4h10a4 4 0 014 4v8z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-4 max-w-md px-2 font-mono text-xs leading-relaxed text-terminal-muted sm:mt-6 sm:text-sm">
                Initialize a secure connection with the AI analyst to review telemetry or discuss SecOps protocol.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div
                  key={`${activeId}-${i}`}
                  className={[
                    'max-w-[min(92%,100%)] rounded-xl border px-2.5 py-2 text-xs sm:max-w-[92%] sm:px-3 sm:py-2.5 sm:text-sm',
                    m.role === 'user'
                      ? 'ml-auto border-terminal-accent/35 bg-terminal-accent/10 text-slate-100 shadow-[0_0_12px_rgba(0,255,65,0.08)]'
                      : 'mr-auto border-terminal-border/60 bg-black/30 text-slate-300',
                  ].join(' ')}
                >
                  <div className="font-mono text-[10px] uppercase tracking-wider text-terminal-muted">{m.role}</div>
                  <div className="mt-1 min-w-0 break-words whitespace-pre-wrap font-mono text-[12px] leading-relaxed sm:text-[13px]">
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && <div className="font-mono text-xs text-terminal-muted">Thinking…</div>}
            </div>
          )}
        </div>

        <div className="border-t border-terminal-border p-2 sm:p-3">
          <div className="flex min-w-0 items-end gap-1.5 rounded-lg border border-terminal-border/80 bg-terminal-bg-deep/90 px-2 py-2 shadow-[0_0_14px_rgba(0,255,65,0.06)] sm:gap-2 sm:px-3">
            <span className="pb-2 font-mono text-terminal-accent">&gt;</span>
            <textarea
              className="max-h-32 min-h-[44px] min-w-0 flex-1 resize-none bg-transparent py-2 font-mono text-xs text-terminal-accent outline-none placeholder:text-terminal-muted sm:text-sm"
              placeholder="Query the analyst…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={send}
              className="mb-1 shrink-0 rounded-lg bg-terminal-accent px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-black shadow-glow transition hover:brightness-110 disabled:opacity-50 sm:px-4 sm:text-xs"
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-center font-mono text-[10px] text-terminal-muted">
            Powered by OpenAI when <code className="text-terminal-accent/90">OPENAI_API_KEY</code> is set on the server.
          </p>
        </div>
      </div>
    </div>
  );
}
