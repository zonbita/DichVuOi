import { Send } from 'lucide-react';
import { FAB_SURFACE, sourceLabel } from './chatbot-utils';
import type { ChatbotState } from './use-chatbot';

export function ChatbotAiTab({ state }: { state: ChatbotState }) {
  const {
    messages,
    listRef,
    askMutation,
    suggestionsQuery,
    sendAi,
    onSubmit,
    draft,
    setDraft,
  } = state;
  return (
    <>
      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto bg-[var(--color-canvas)] px-3 py-3"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'rounded-br-md !text-white shadow-[0_4px_12px_rgba(0,122,116,0.28)]'
                  : 'rounded-bl-md border border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-[0_2px_8px_rgba(7,59,92,0.06)]'
              }`}
              style={
                m.role === 'user'
                  ? {
                      background:
                        'radial-gradient(circle at 30% 20%, #2dd4bf 0%, #009c95 55%, #0f766e 100%)',
                    }
                  : undefined
              }
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.role === 'bot' && m.source ? (
                <p className="mt-1.5 text-[10px] uppercase tracking-wide opacity-60">
                  {sourceLabel(m.source)}
                  {m.matchedQuestion
                    ? ` · gần: ${m.matchedQuestion.slice(0, 42)}…`
                    : ''}
                </p>
              ) : null}
            </div>
          </div>
        ))}
        {askMutation.isPending ? (
          <p className="text-xs text-[var(--color-muted)]">Đang soạn trả lời…</p>
        ) : null}
      </div>

      {suggestionsQuery.data && suggestionsQuery.data.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto border-t border-[var(--color-line)] bg-white px-3 py-2">
          {suggestionsQuery.data.slice(0, 6).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => sendAi(q)}
              disabled={askMutation.isPending}
              className="shrink-0 rounded-full border border-[var(--color-brand)]/20 bg-[var(--color-brand-soft)] px-2.5 py-1 text-xs font-medium text-[var(--color-brand-deep)] shadow-[0_1px_3px_rgba(0,156,149,0.1)] transition hover:border-[var(--color-brand)]/40 hover:shadow-[0_2px_8px_rgba(0,156,149,0.18)] disabled:opacity-50"
            >
              {q.length > 36 ? `${q.slice(0, 36)}…` : q}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="flex gap-2 border-t border-[var(--color-line)] bg-white p-3"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={1000}
          placeholder="Nhập câu hỏi…"
          className="field-input min-w-0 flex-1 text-sm"
          disabled={askMutation.isPending}
        />
        <button
          type="submit"
          disabled={askMutation.isPending || !draft.trim()}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] !text-white transition disabled:opacity-50"
          style={FAB_SURFACE}
          aria-label="Gửi"
        >
          <Send className="h-4 w-4 drop-shadow-[0_1px_2px_rgba(7,59,92,0.35)]" strokeWidth={2.5} />
        </button>
      </form>
    </>
  );
}
