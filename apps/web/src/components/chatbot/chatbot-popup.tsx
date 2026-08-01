import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../../features/auth/auth-context';
import { api } from '../../services/api';
import type { ChatbotSource } from '../../types/chatbot';
import type { SupportMessage } from '../../types/support';

type ChatTab = 'ai' | 'support';

type AiMessage = {
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

const TOKEN_KEY = 'dichvuoi_token';

export function ChatbotPopup() {
  const titleId = useId();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ChatTab>('ai');
  const [draft, setDraft] = useState('');
  const [sessionId] = useState(newSessionId);
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: 'Xin chào! Mình là trợ lý Dịch Vụ Ơi. Hỏi về đặt lịch, giá, đối tác, dọn nhà, sửa chữa, gia sư, lập trình, game… Mình ưu tiên ~2000 câu FAQ sẵn, thiếu thì nhờ ChatGPT.',
      source: 'faq',
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const isStaff = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  const suggestionsQuery = useQuery({
    queryKey: ['chatbot-suggestions'],
    queryFn: () => api.chatbotSuggestions(8),
    enabled: open && tab === 'ai',
    staleTime: 60_000,
  });

  const statsQuery = useQuery({
    queryKey: ['chatbot-stats'],
    queryFn: () => api.chatbotStats(),
    enabled: open && tab === 'ai',
    staleTime: 60_000,
  });

  const supportQuery = useQuery({
    queryKey: ['support', 'my'],
    queryFn: api.getMySupportChat,
    enabled: open && tab === 'support' && Boolean(user) && !isStaff,
    staleTime: 15_000,
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

  const supportMutation = useMutation({
    mutationFn: (body: string) => api.postMySupportMessage(body),
    onSuccess: (message) => {
      queryClient.setQueryData<{
        thread: unknown;
        messages: SupportMessage[];
      }>(['support', 'my'], (prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === message.id)) return prev;
        return { ...prev, messages: [...prev.messages, message] };
      });
      void queryClient.invalidateQueries({ queryKey: ['support', 'my'] });
    },
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, supportQuery.data?.messages, askMutation.isPending, tab]);

  useEffect(() => {
    if (!open || tab !== 'support' || !user || isStaff) return;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    const base = import.meta.env.VITE_API_URL ?? '';
    const socket: Socket = io(`${base}/partner-realtime`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socket.on('support:message', (message: SupportMessage) => {
      queryClient.setQueryData<{
        thread: { id: string };
        messages: SupportMessage[];
      }>(['support', 'my'], (prev) => {
        if (!prev || prev.thread.id !== message.threadId) return prev;
        if (prev.messages.some((m) => m.id === message.id)) return prev;
        return { ...prev, messages: [...prev.messages, message] };
      });
    });
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [open, tab, user, isStaff, queryClient]);

  function sendAi(raw: string) {
    const message = raw.trim();
    if (!message || askMutation.isPending) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text: message },
    ]);
    setDraft('');
    askMutation.mutate(message);
  }

  function sendSupport(raw: string) {
    const message = raw.trim();
    if (!message || supportMutation.isPending) return;
    setDraft('');
    supportMutation.mutate(message);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (tab === 'ai') sendAi(draft);
    else sendSupport(draft);
  }

  const headerSubtitle =
    tab === 'ai'
      ? statsQuery.data
        ? `${statsQuery.data.faqCount.toLocaleString('vi-VN')} FAQ · ChatGPT ${
            statsQuery.data.chatgptEnabled ? 'bật' : 'tắt'
          }`
        : 'FAQ + ChatGPT'
      : 'Chat với admin / kỹ thuật viên';

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="pointer-events-auto flex h-[min(70vh,560px)] w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-2xl"
        >
          <header className="bg-[linear-gradient(135deg,var(--color-brand),var(--color-sea))] px-4 pt-3 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id={titleId} className="text-base font-semibold">
                  Hỗ trợ Dịch Vụ Ơi
                </h2>
                <p className="mt-0.5 text-xs text-white/85">{headerSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/15 px-2.5 py-1 text-sm hover:bg-white/25"
                aria-label="Đóng chat"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 flex gap-1">
              {(
                [
                  { id: 'ai' as const, label: 'Hỏi AI' },
                  { id: 'support' as const, label: 'Kỹ thuật viên' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTab(item.id);
                    setDraft('');
                  }}
                  className={`flex-1 rounded-t-lg px-3 py-2 text-sm font-semibold transition ${
                    tab === item.id
                      ? 'bg-white text-[var(--color-brand-deep)]'
                      : 'bg-white/15 text-white/90 hover:bg-white/25'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </header>

          {tab === 'ai' ? (
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
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                        m.role === 'user'
                          ? 'rounded-br-md bg-[var(--color-brand)] !text-white'
                          : 'rounded-bl-md border border-[var(--color-line)] bg-white text-[var(--color-ink)]'
                      }`}
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
                  className="rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold !text-white disabled:opacity-50"
                >
                  Gửi
                </button>
              </form>
            </>
          ) : (
            <>
              <div
                ref={listRef}
                className="flex-1 space-y-3 overflow-y-auto bg-[var(--color-canvas)] px-3 py-3"
              >
                {!user ? (
                  <div className="rounded-xl border border-[var(--color-line)] bg-white p-4 text-sm">
                    <p className="font-semibold text-[var(--color-ink)]">
                      Đăng nhập để chat với kỹ thuật viên
                    </p>
                    <p className="mt-1 text-[var(--color-muted)]">
                      Admin / moderator sẽ trả lời trực tiếp trên hội thoại của bạn.
                    </p>
                    <Link
                      to="/dang-nhap"
                      className="btn-primary mt-3 inline-flex px-4 py-2 text-sm !text-white"
                      onClick={() => setOpen(false)}
                    >
                      Đăng nhập
                    </Link>
                  </div>
                ) : isStaff ? (
                  <div className="rounded-xl border border-[var(--color-line)] bg-white p-4 text-sm">
                    <p className="font-semibold">Bạn đang đăng nhập tài khoản hỗ trợ</p>
                    <p className="mt-1 text-[var(--color-muted)]">
                      Trả lời khách tại dashboard Admin → Chat với khách.
                    </p>
                    <Link
                      to="/admin/support"
                      className="btn-primary mt-3 inline-flex px-4 py-2 text-sm !text-white"
                      onClick={() => setOpen(false)}
                    >
                      Mở inbox
                    </Link>
                  </div>
                ) : supportQuery.isLoading ? (
                  <p className="text-xs text-[var(--color-muted)]">Đang tải hội thoại…</p>
                ) : supportQuery.isError ? (
                  <p className="text-sm text-[var(--color-invoice)]">
                    {(supportQuery.error as Error).message || 'Không tải được chat hỗ trợ.'}
                  </p>
                ) : (
                  <>
                    {(supportQuery.data?.messages.length ?? 0) === 0 ? (
                      <p className="text-sm text-[var(--color-muted)]">
                        Chưa có tin nhắn. Hãy mô tả vấn đề — kỹ thuật viên sẽ phản hồi sớm.
                      </p>
                    ) : null}
                    {supportQuery.data?.messages.map((m) => {
                      const mine = m.senderId === user.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                              mine
                                ? 'rounded-br-md bg-[var(--color-brand)] !text-white'
                                : 'rounded-bl-md border border-[var(--color-line)] bg-white text-[var(--color-ink)]'
                            }`}
                          >
                            {!mine ? (
                              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide opacity-60">
                                {m.sender.fullName}
                              </p>
                            ) : null}
                            <p className="whitespace-pre-wrap">{m.body}</p>
                          </div>
                        </div>
                      );
                    })}
                    {supportMutation.isPending ? (
                      <p className="text-xs text-[var(--color-muted)]">Đang gửi…</p>
                    ) : null}
                    {supportMutation.isError ? (
                      <p className="text-xs text-[var(--color-invoice)]">
                        {(supportMutation.error as Error).message}
                      </p>
                    ) : null}
                  </>
                )}
              </div>

              {user && !isStaff ? (
                <form
                  onSubmit={onSubmit}
                  className="flex gap-2 border-t border-[var(--color-line)] bg-white p-3"
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={2000}
                    placeholder="Nhắn cho kỹ thuật viên…"
                    className="field-input min-w-0 flex-1 text-sm"
                    disabled={supportMutation.isPending}
                  />
                  <button
                    type="submit"
                    disabled={supportMutation.isPending || !draft.trim()}
                    className="rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold !text-white disabled:opacity-50"
                  >
                    Gửi
                  </button>
                </form>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand)] text-2xl !text-white shadow-lg shadow-[var(--color-brand)]/30 transition hover:bg-[var(--color-brand-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        aria-label={open ? 'Đóng trợ lý chat' : 'Mở trợ lý chat'}
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
