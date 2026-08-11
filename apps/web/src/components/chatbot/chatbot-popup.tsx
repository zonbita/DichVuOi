import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { MessageCircle, Send, X } from 'lucide-react';
import { useAuth } from '../../features/auth/auth-context';
import {
  markSupportChatRead,
  OPEN_CHATBOT_EVENT,
  type OpenChatbotDetail,
} from '../../lib/support-chat-read';
import { api } from '../../services/api';
import type { ChatbotSource } from '../../types/chatbot';
import type { SupportMessage } from '../../types/support';

const FAB_SURFACE: CSSProperties = {
  background:
    'radial-gradient(circle at 42% 36%, #5eead4 0%, #14b8a6 38%, #009c95 68%, #0f766e 100%)',
  boxShadow:
    '0 10px 28px rgba(0, 122, 116, 0.38), 0 2px 6px rgba(7, 59, 92, 0.18), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -10px 18px rgba(7, 59, 92, 0.18)',
};

const PANEL_SHADOW =
  '0 18px 48px rgba(7, 59, 92, 0.18), 0 4px 14px rgba(0, 156, 149, 0.12)';

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
const FAB_POS_KEY = 'dichvuoi_chatbot_fab_pos';
const FAB_SIZE = 56;
const FAB_GAP = 12;
const DRAG_THRESHOLD = 6;

type FabPos = { x: number; y: number };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function defaultFabPos(): FabPos {
  if (typeof window === 'undefined') return { x: 24, y: 24 };
  return {
    x: Math.max(8, window.innerWidth - FAB_SIZE - 24),
    y: Math.max(8, window.innerHeight - FAB_SIZE - 24),
  };
}

function loadFabPos(): FabPos {
  try {
    const raw = sessionStorage.getItem(FAB_POS_KEY);
    if (!raw) return defaultFabPos();
    const parsed = JSON.parse(raw) as FabPos;
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
      return clampFabPos(parsed);
    }
  } catch {
    /* ignore */
  }
  return defaultFabPos();
}

function saveFabPos(pos: FabPos) {
  try {
    sessionStorage.setItem(FAB_POS_KEY, JSON.stringify(pos));
  } catch {
    /* ignore */
  }
}

function clampFabPos(pos: FabPos): FabPos {
  if (typeof window === 'undefined') return pos;
  const margin = 8;
  return {
    x: clamp(pos.x, margin, Math.max(margin, window.innerWidth - FAB_SIZE - margin)),
    y: clamp(pos.y, margin, Math.max(margin, window.innerHeight - FAB_SIZE - margin)),
  };
}

/** Panel neo cạnh FAB — ưu tiên phía trên, canh mép phải với nút. */
function panelStyleFromFab(fab: FabPos): CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const panelW = Math.min(380, vw - 16);
  const panelH = Math.min(vh * 0.7, 560);
  const margin = 8;

  let left = fab.x + FAB_SIZE - panelW;
  left = clamp(left, margin, Math.max(margin, vw - panelW - margin));

  let top = fab.y - FAB_GAP - panelH;
  if (top < margin) {
    top = fab.y + FAB_SIZE + FAB_GAP;
  }
  top = clamp(top, margin, Math.max(margin, vh - Math.min(panelH, vh - margin * 2) - margin));

  return {
    left,
    top,
    width: panelW,
    height: Math.min(panelH, vh - margin * 2),
  };
}

export function ChatbotPopup({ initialOpen = false }: { initialOpen?: boolean }) {
  const titleId = useId();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(initialOpen);
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
  const [fabPos, setFabPos] = useState<FabPos>(() => loadFabPos());
  const listRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);
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
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<OpenChatbotDetail>).detail;
      const nextTab = detail?.tab ?? 'support';
      setTab(nextTab);
      setOpen(true);
      if (nextTab === 'support' && user && !isStaff) {
        markSupportChatRead(user.id);
      }
    }
    window.addEventListener(OPEN_CHATBOT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHATBOT_EVENT, onOpen);
  }, [user, isStaff]);

  useEffect(() => {
    if (!open || tab !== 'support' || !user || isStaff) return;
    markSupportChatRead(user.id);
  }, [open, tab, user, isStaff]);

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
      if (user) markSupportChatRead(user.id);
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

  function onFabPointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: fabPos.x,
      origY: fabPos.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onFabPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    setFabPos(
      clampFabPos({
        x: drag.origX + dx,
        y: drag.origY + dy,
      }),
    );
  }

  function onFabPointerUp(e: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (drag.moved) {
      setFabPos((current) => {
        const next = clampFabPos(current);
        saveFabPos(next);
        return next;
      });
      return;
    }
    setOpen((v) => !v);
  }

  useEffect(() => {
    function onResize() {
      setFabPos((current) => clampFabPos(current));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const headerSubtitle =
    tab === 'ai'
      ? statsQuery.data
        ? `${statsQuery.data.faqCount.toLocaleString('vi-VN')} FAQ · ChatGPT ${
            statsQuery.data.chatgptEnabled ? 'bật' : 'tắt'
          }`
        : 'FAQ + ChatGPT'
      : 'Chat với admin / kỹ thuật viên';

  const panelStyle = panelStyleFromFab(fabPos);

  return (
    <>
      {open ? (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          style={{ ...panelStyle, boxShadow: PANEL_SHADOW }}
          className="pointer-events-auto fixed z-[99999] flex flex-col overflow-hidden rounded-[22px] border border-white/70 bg-white"
        >
          <header
            className="relative px-4 pt-3.5 text-white"
            style={{
              background:
                'radial-gradient(ellipse 120% 140% at 30% 0%, #5eead4 0%, #14b8a6 32%, #009c95 62%, #0f766e 100%)',
              boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.18)',
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.28),transparent_70%)]"
            />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-white/18 text-white shadow-[0_4px_12px_rgba(7,59,92,0.2),inset_0_1px_0_rgba(255,255,255,0.4)]"
                  aria-hidden
                >
                  <MessageCircle className="h-5 w-5 drop-shadow-[0_2px_3px_rgba(7,59,92,0.25)]" strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                  <h2 id={titleId} className="text-base font-semibold tracking-tight drop-shadow-sm">
                    Hỗ trợ Dịch Vụ Ơi
                  </h2>
                  <p className="mt-0.5 text-xs text-white/90">{headerSubtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/18 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition hover:bg-white/28"
                aria-label="Đóng chat"
              >
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
            <div className="relative mt-3.5 flex gap-1">
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
                  className={`flex-1 rounded-t-[12px] px-3 py-2 text-sm font-semibold transition ${
                    tab === item.id
                      ? 'bg-white text-[var(--color-brand-deep)] shadow-[0_-2px_8px_rgba(7,59,92,0.08)]'
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
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                              mine
                                ? 'rounded-br-md !text-white shadow-[0_4px_12px_rgba(0,122,116,0.28)]'
                                : 'rounded-bl-md border border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-[0_2px_8px_rgba(7,59,92,0.06)]'
                            }`}
                            style={
                              mine
                                ? {
                                    background:
                                      'radial-gradient(circle at 30% 20%, #2dd4bf 0%, #009c95 55%, #0f766e 100%)',
                                  }
                                : undefined
                            }
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
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] !text-white transition disabled:opacity-50"
                    style={FAB_SURFACE}
                    aria-label="Gửi"
                  >
                    <Send className="h-4 w-4 drop-shadow-[0_1px_2px_rgba(7,59,92,0.35)]" strokeWidth={2.5} />
                  </button>
                </form>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      <button
        type="button"
        onPointerDown={onFabPointerDown}
        onPointerMove={onFabPointerMove}
        onPointerUp={onFabPointerUp}
        onPointerCancel={onFabPointerUp}
        style={{ left: fabPos.x, top: fabPos.y, ...FAB_SURFACE }}
        className="pointer-events-auto fixed z-[100000] flex h-14 w-14 cursor-grab touch-none items-center justify-center rounded-[18px] !text-white transition duration-200 hover:brightness-105 hover:scale-[1.03] active:cursor-grabbing active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        aria-label={open ? 'Đóng trợ lý chat' : 'Mở trợ lý chat — kéo để di chuyển'}
        title="Kéo để di chuyển · nhấp để mở/đóng"
      >
        {open ? (
          <X className="h-6 w-6 drop-shadow-[0_2px_4px_rgba(7,59,92,0.35)]" strokeWidth={2.5} />
        ) : (
          <MessageCircle
            className="h-7 w-7 drop-shadow-[0_2px_4px_rgba(7,59,92,0.35)]"
            strokeWidth={2.25}
          />
        )}
      </button>
    </>
  );
}
