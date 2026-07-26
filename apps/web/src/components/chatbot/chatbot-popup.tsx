import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { ChatbotSource } from '../../types/chatbot';

type ChatMessage = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  source?: ChatbotSource;
  matchedQuestion?: string;
};

function sourceLabel(source?: ChatbotSource) {
  if (source === 'faq') return 'FAQ sẵn';
  if (source === 'chatgpt') return 'ChatGPT';
  if (source === 'fallback') return 'Gợi ý';
  return '';
}

function newSessionId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `s-${Date.now()}`;
  }
}

export function ChatbotPopup() {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [sessionId] = useState(newSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: 'Xin chào! Mình là trợ lý Dịch Vụ Ơi. Hỏi về đặt lịch, giá, đối tác, dọn nhà, sửa chữa, gia sư, lập trình, game… Mình ưu tiên ~2000 câu FAQ sẵn, thiếu thì nhờ ChatGPT.',
      source: 'faq',
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);

  const suggestionsQuery = useQuery({
    queryKey: ['chatbot-suggestions'],
    queryFn: () => api.chatbotSuggestions(8),
    enabled: open,
    staleTime: 60_000,
  });

  const statsQuery = useQuery({
    queryKey: ['chatbot-stats'],
    queryFn: () => api.chatbotStats(),
    enabled: open,
    staleTime: 60_000,
  });

  const askMutation = useMutation({
    mutationFn: (message: string) => api.chatbotAsk(message, sessionId),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'bot',
          text: data.reply,
          source: data.source,
          matchedQuestion: data.matchedQuestion,
        },
      ]);
    },
    onError: (err: Error) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'bot',
          text: err.message || 'Không gửi được câu hỏi. Thử lại giúp mình.',
          source: 'fallback',
        },
      ]);
    },
  });

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, askMutation.isPending]);

  function send(text: string) {
    const message = text.trim();
    if (!message || askMutation.isPending) return;
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', text: message },
    ]);
    setDraft('');
    askMutation.mutate(message);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(draft);
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="pointer-events-auto flex h-[min(70vh,560px)] w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-2xl"
        >
          <header className="flex items-start justify-between gap-3 bg-[linear-gradient(135deg,var(--color-brand),var(--color-sea))] px-4 py-3 text-white">
            <div>
              <h2 id={titleId} className="text-base font-semibold">
                Trợ lý Dịch Vụ Ơi
              </h2>
              <p className="mt-0.5 text-xs text-white/85">
                {statsQuery.data
                  ? `${statsQuery.data.faqCount.toLocaleString('vi-VN')} FAQ · ChatGPT ${
                      statsQuery.data.chatgptEnabled ? 'bật' : 'tắt'
                    }`
                  : 'FAQ + ChatGPT'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-white/15 px-2.5 py-1 text-sm hover:bg-white/25"
              aria-label="Đóng chat"
            >
              ✕
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-[var(--color-canvas)] px-3 py-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'rounded-br-md bg-[var(--color-brand)] text-white'
                      : 'rounded-bl-md border border-[var(--color-line)] bg-white text-[var(--color-ink)]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.role === 'bot' && m.source ? (
                    <p className="mt-1.5 text-[10px] uppercase tracking-wide opacity-60">
                      {sourceLabel(m.source)}
                      {m.matchedQuestion ? ` · gần: ${m.matchedQuestion.slice(0, 42)}…` : ''}
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
                  onClick={() => send(q)}
                  disabled={askMutation.isPending}
                  className="shrink-0 rounded-full border border-[var(--color-line)] bg-[var(--color-brand-soft)] px-2.5 py-1 text-xs text-[var(--color-brand-deep)] hover:border-[var(--color-brand)] disabled:opacity-50"
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
              className="rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Gửi
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand)] text-2xl text-white shadow-lg shadow-[var(--color-brand)]/30 transition hover:bg-[var(--color-brand-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        aria-label={open ? 'Đóng trợ lý chat' : 'Mở trợ lý chat'}
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
