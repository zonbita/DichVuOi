import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../../features/auth/auth-context';
import { api } from '../../services/api';
import type {
  HomeLobbyFeed,
  HomeLobbyPresence,
  HomeLobbyReaction,
  HomeLobbyViewer,
  HomeShout,
  HomeShoutKind,
} from '../../types/home-lobby';
import { DEFAULT_LOBBY_SMILES } from '../../types/home-lobby';
import { offeringColor } from '../../utils/catalog-colors';
import { Icon } from '../ui/icon';
import { UserAvatar } from '../ui/user-avatar';

const TOKEN_KEY = 'dichvuoi_token';
const GUEST_KEY = 'dichvuoi_lobby_guest';

const KIND_HINT: Record<HomeShoutKind, string> = {
  GREETING: 'Chào dịch vụ',
  AVAILABLE: 'Đang nhận việc',
  PROMO: 'Ưu đãi',
  LOOKING: 'Còn slot',
  THANKS: 'Cảm ơn khách',
};

type FloatSmile = {
  key: string;
  emoji: string;
  left: number;
  drift: number;
  scale: number;
};

function ensureGuestId() {
  try {
    const existing = localStorage.getItem(GUEST_KEY);
    if (existing) return existing;
    const id = `g_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(GUEST_KEY, id);
    return id;
  } catch {
    return `g_${Date.now()}`;
  }
}

/** Message API dùng «tên dịch vụ» — icon + chữ navy; màu nghề chỉ 1 gạch nhỏ (ít nhiễu). */
function ShoutMessage({
  message,
  groupSlug,
}: {
  message: string;
  groupSlug?: string | null;
}) {
  const color = offeringColor(groupSlug);
  const parts = message.split(/(«[^»]+»)/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = /^«(.+)»$/.exec(part);
        if (!match) return <span key={i}>{part}</span>;
        return (
          <span
            key={i}
            className="mx-0.5 inline-flex items-center gap-1 align-middle font-semibold text-[var(--color-navy)]"
          >
            <span
              className="inline-block h-3 w-0.5 shrink-0 rounded-full"
              style={{ backgroundColor: color.main }}
              aria-hidden
            />
            <Icon
              name="briefcase"
              className="h-3.5 w-3.5 shrink-0 !text-[var(--color-muted)]"
            />
            <span>{match[1]}</span>
          </span>
        );
      })}
    </>
  );
}

function prependShout(prev: HomeLobbyFeed | undefined, shout: HomeShout): HomeLobbyFeed {
  const kinds =
    prev?.kinds ??
    (Object.entries(KIND_HINT).map(([k, label]) => ({
      kind: k as HomeShoutKind,
      label,
    })) as HomeLobbyFeed['kinds']);
  const smiles = prev?.smiles?.length ? prev.smiles : [...DEFAULT_LOBBY_SMILES];
  const items = prev?.items ?? [];
  if (items.some((item) => item.id === shout.id)) {
    return prev ?? { items, kinds, smiles };
  }
  return { kinds, smiles, items: [shout, ...items].slice(0, 40) };
}

/** Sảnh hô dịch vụ + smile livestream kiểu TikTok. */
export function HomeLobbySection() {
  const { user, canOffer } = useAuth();
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<HomeShoutKind>('GREETING');
  const [servicePostId, setServicePostId] = useState('');
  const [floats, setFloats] = useState<FloatSmile[]>([]);
  const [reactError, setReactError] = useState<string | null>(null);
  const [smileOpen, setSmileOpen] = useState(false);
  const [presence, setPresence] = useState<HomeLobbyPresence>({
    onlineCount: 0,
    viewers: [],
  });
  const socketRef = useRef<Socket | null>(null);
  const lastTapRef = useRef(0);
  const smilePanelRef = useRef<HTMLDivElement | null>(null);

  const feedQuery = useQuery({
    queryKey: ['home-lobby'],
    queryFn: () => api.getHomeLobby(28),
    staleTime: 8_000,
    refetchInterval: 12_000,
  });

  const presenceQuery = useQuery({
    queryKey: ['home-lobby', 'presence'],
    queryFn: api.getHomeLobbyPresence,
    staleTime: 5_000,
    refetchInterval: 20_000,
  });

  useEffect(() => {
    if (presenceQuery.data) setPresence(presenceQuery.data);
  }, [presenceQuery.data]);

  const myPostsQuery = useQuery({
    queryKey: ['partners', 'me', 'posts', 'lobby'],
    queryFn: () => api.getMyServicePosts(),
    enabled: Boolean(user && canOffer),
    staleTime: 30_000,
  });

  const approvedPosts = useMemo(
    () => (myPostsQuery.data ?? []).filter((p) => p.status === 'APPROVED'),
    [myPostsQuery.data],
  );

  const smiles =
    feedQuery.data?.smiles?.length ? feedQuery.data.smiles : DEFAULT_LOBBY_SMILES;

  useEffect(() => {
    if (!servicePostId && approvedPosts[0]) {
      setServicePostId(approvedPosts[0].id);
    }
  }, [approvedPosts, servicePostId]);

  function spawnFloat(emoji: string) {
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const item: FloatSmile = {
      key,
      emoji,
      // Bay từ mép phải vùng chat (kiểu TikTok live).
      left: 58 + Math.random() * 32,
      drift: -28 + Math.random() * 56,
      scale: 0.95 + Math.random() * 0.5,
    };
    setFloats((prev) => [...prev.slice(-22), item]);
    window.setTimeout(() => {
      setFloats((prev) => prev.filter((f) => f.key !== key));
    }, 2600);
  }

  useEffect(() => {
    if (!smileOpen) return;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const el = smilePanelRef.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (target && !el.contains(target)) setSmileOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSmileOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [smileOpen]);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const guestId = token ? undefined : ensureGuestId();
    const base = import.meta.env.VITE_API_URL ?? '';
    const socket = io(`${base}/partner-realtime`, {
      auth: token
        ? { token, lobby: true }
        : { guestId, lobby: true },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on('home:shout', (shout: HomeShout) => {
      queryClient.setQueryData<HomeLobbyFeed>(['home-lobby'], (prev) =>
        prependShout(prev, shout),
      );
    });

    socket.on('home:reaction', (reaction: HomeLobbyReaction) => {
      if (reaction?.emoji) spawnFloat(reaction.emoji);
    });

    socket.on('home:presence', (snap: HomeLobbyPresence) => {
      if (snap && typeof snap.onlineCount === 'number') {
        setPresence(snap);
        queryClient.setQueryData(['home-lobby', 'presence'], snap);
      }
    });

    socket.on('connect', () => {
      socket.emit('lobby:sync', undefined, (snap: HomeLobbyPresence) => {
        if (snap && typeof snap.onlineCount === 'number') {
          setPresence(snap);
        }
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient, user?.id]);

  const shoutMutation = useMutation({
    mutationFn: () => api.createHomeShout({ kind, servicePostId }),
    onSuccess: (shout) => {
      queryClient.setQueryData<HomeLobbyFeed>(['home-lobby'], (prev) =>
        prependShout(prev, shout),
      );
    },
  });

  const reactMutation = useMutation({
    mutationFn: (emoji: string) =>
      api.createHomeReaction({
        emoji,
        guestId: user ? undefined : ensureGuestId(),
      }),
    onSuccess: () => {
      setReactError(null);
    },
    onError: (err) => {
      setReactError((err as Error).message || 'Không gửi được smile');
    },
  });

  function onTapSmile(emoji: string) {
    const now = Date.now();
    if (now - lastTapRef.current < 180) return;
    lastTapRef.current = now;
    // Optimistic local float (TikTok feel); server/broadcast sync thêm.
    spawnFloat(emoji);
    reactMutation.mutate(emoji);
  }

  const items = feedQuery.data?.items ?? [];
  const kinds =
    feedQuery.data?.kinds ??
    (Object.entries(KIND_HINT).map(([k, label]) => ({
      kind: k as HomeShoutKind,
      label,
    })) as HomeLobbyFeed['kinds']);

  return (
    <section className="page-shell mt-4">
      <div className="section-container">
        <div className="flex h-[500px] flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-[0_8px_24px_rgba(15,39,71,0.06)] lg:grid lg:grid-cols-[minmax(200px,240px)_minmax(0,1fr)]">
          {/* Trái: người đang tham gia + tổng online */}
          <aside className="flex shrink-0 flex-col border-b border-[var(--color-line)] bg-[var(--color-canvas)]/50 lg:h-full lg:shrink lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-line)] px-3 py-2.5 sm:px-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted)]">
                Đang tham gia
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800 ring-1 ring-emerald-200">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                {presence.onlineCount} online
              </span>
            </div>

            {/* Mobile: hàng avatar ngang */}
            <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-3 py-2.5 lg:hidden">
              {presence.viewers.length === 0 ? (
                <p className="text-xs text-[var(--color-muted)]">Chưa có ai trong sảnh</p>
              ) : (
                presence.viewers.map((viewer) => (
                  <LobbyViewerChip key={viewer.key} viewer={viewer} compact />
                ))
              )}
            </div>

            {/* Desktop: danh sách dọc */}
            <ul className="hidden min-h-0 flex-1 space-y-1 overflow-y-auto p-2 lg:block">
              {presence.viewers.length === 0 ? (
                <li className="px-2 py-6 text-center text-xs text-[var(--color-muted)]">
                  Chưa có ai trong sảnh — mở trang này để vào phòng.
                </li>
              ) : (
                presence.viewers.map((viewer) => (
                  <li key={viewer.key}>
                    <LobbyViewerChip viewer={viewer} />
                  </li>
                ))
              )}
            </ul>
          </aside>

          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Emoji bay xuyên vùng chat — không chỉ hiệu ứng nút */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-16 top-0 z-20 overflow-hidden sm:bottom-20"
            aria-hidden
          >
            {floats.map((f) => (
              <span
                key={f.key}
                className="lobby-float-smile absolute bottom-2 text-3xl sm:bottom-3 sm:text-4xl"
                style={
                  {
                    left: `${f.left}%`,
                    '--lobby-drift': `${f.drift}px`,
                    '--lobby-scale': String(f.scale),
                  } as CSSProperties
                }
              >
                {f.emoji}
              </span>
            ))}
          </div>

          <div className="relative z-[1] min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-2.5 sm:px-3.5">
            {feedQuery.isLoading ? (
              <p className="py-8 text-center text-sm text-[var(--color-muted)]">
                Đang tải sảnh…
              </p>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-muted)]">
                Chưa có ai hô dịch vụ — bấm icon smile để thả reaction hoặc đăng nhập để chào sàn.
              </p>
            ) : (
              items.map((item) => (
                <Link
                  key={item.id}
                  to={item.servicePost.href}
                  className="flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-[var(--color-canvas)]/80"
                  title={item.message}
                >
                  <UserAvatar
                    name={item.user.fullName}
                    src={item.user.avatarUrl}
                    userId={item.user.id}
                    size="sm"
                    className="!h-7 !w-7 shrink-0 !ring-1 !ring-[var(--color-line)]"
                  />
                  <p className="min-w-0 flex-1 truncate text-sm leading-snug text-[var(--color-ink)]">
                    <span className="font-extrabold text-[var(--color-navy)]">
                      {item.user.fullName}
                    </span>
                    <span className="mx-1 font-semibold text-[var(--color-muted)]">
                      :
                    </span>
                    <ShoutMessage
                      message={item.message}
                      groupSlug={item.servicePost.groupSlug}
                    />
                  </p>
                </Link>
              ))
            )}
          </div>

          <div className="relative z-[2] shrink-0 border-t border-[var(--color-line)] bg-[var(--color-canvas)]/70 px-3 py-3 sm:px-4">
            <div className="flex items-end gap-2.5 sm:gap-3">
              <div className="min-w-0 flex-1">
            {!user ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-[var(--color-muted)]">
                  Smile thì ai cũng bấm được. Đăng nhập mới hô / quảng cáo dịch vụ.
                </p>
                <Link
                  to="/dang-nhap?redirect=/"
                  className="btn-primary inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm"
                >
                  Đăng nhập để hô
                  <Icon name="chevronRight" className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : !canOffer ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-[var(--color-muted)]">
                  Cần mở hồ sơ người làm trước khi quảng cáo dịch vụ.
                </p>
                <Link
                  to="/doi-tac"
                  className="inline-flex items-center gap-1.5 rounded-[14px] border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-ink)] sm:text-sm"
                >
                  Mở hồ sơ người làm
                </Link>
              </div>
            ) : approvedPosts.length === 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-[var(--color-muted)]">
                  Cần ít nhất một bài dịch vụ đã duyệt để hô trên sảnh.
                </p>
                <Link
                  to="/doi-tac/dich-vu"
                  className="inline-flex items-center gap-1.5 rounded-[14px] border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--color-ink)] sm:text-sm"
                >
                  Quản lý bài đăng
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {kinds.map((item) => (
                    <button
                      key={item.kind}
                      type="button"
                      onClick={() => setKind(item.kind)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 transition ${
                        kind === item.kind
                          ? 'bg-[var(--color-navy)] text-white ring-[var(--color-navy)]'
                          : 'bg-white text-[var(--color-ink)] ring-[var(--color-line)] hover:bg-white/90'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    value={servicePostId}
                    onChange={(e) => setServicePostId(e.target.value)}
                    className="field-input min-w-0 flex-1 text-sm"
                  >
                    {approvedPosts.map((post) => (
                      <option key={post.id} value={post.id}>
                        {post.title || post.service.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={
                      shoutMutation.isPending || !servicePostId || !kind
                    }
                    onClick={() => shoutMutation.mutate()}
                    className="btn-primary shrink-0 px-4 py-2.5 text-sm disabled:opacity-60"
                  >
                    {shoutMutation.isPending ? 'Đang gửi…' : 'Hô lên sảnh'}
                  </button>
                </div>
                {shoutMutation.isError ? (
                  <p className="text-sm text-red-600">
                    {(shoutMutation.error as Error).message ||
                      'Không gửi được thông báo'}
                  </p>
                ) : null}
              </div>
            )}
              </div>

              {/* 1 icon → bảng smile (TikTok); bấm emoji bay lên chat */}
              <div ref={smilePanelRef} className="relative shrink-0 self-end">
                {smileOpen ? (
                  <div
                    className="absolute bottom-[calc(100%+10px)] right-0 z-30 w-[min(100vw-2rem,22rem)] rounded-2xl border border-[var(--color-line)] bg-white p-3 shadow-[0_12px_32px_rgba(15,39,71,0.14)] sm:w-[24rem]"
                    role="dialog"
                    aria-label="Bảng smile"
                  >
                    <div className="flex items-center gap-2">
                      <p className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted)]">
                        Smile
                      </p>
                      <div className="grid min-w-0 flex-1 grid-cols-8 gap-1.5">
                        {smiles.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => onTapSmile(emoji)}
                            className="lobby-smile-btn flex aspect-square items-center justify-center rounded-xl bg-[var(--color-canvas)] text-lg shadow-sm ring-1 ring-[var(--color-line)] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:scale-90 sm:text-xl"
                            aria-label={`Gửi ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    {reactError ? (
                      <p className="mt-2 text-xs text-red-600">{reactError}</p>
                    ) : (
                      <p className="mt-2 text-[11px] text-[var(--color-muted)]">
                        Bấm smile để thả tim kiểu livestream — không cần nhập chat.
                      </p>
                    )}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setSmileOpen((open) => !open)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full shadow-md ring-1 transition sm:h-12 sm:w-12 ${
                    smileOpen
                      ? 'bg-[var(--color-navy)] text-white ring-[var(--color-navy)]'
                      : 'bg-white text-rose-500 ring-[var(--color-line)] hover:bg-[var(--color-canvas)]'
                  }`}
                  aria-label={smileOpen ? 'Đóng bảng smile' : 'Mở bảng smile'}
                  aria-expanded={smileOpen}
                >
                  <Icon
                    name="heart"
                    filled={smileOpen}
                    className="h-5 w-5 !text-current sm:h-[22px] sm:w-[22px]"
                  />
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LobbyViewerChip({
  viewer,
  compact = false,
}: {
  viewer: HomeLobbyViewer;
  compact?: boolean;
}) {
  const inner = (
    <>
      <span className="relative shrink-0">
        <UserAvatar
          name={viewer.fullName}
          src={viewer.avatarUrl}
          userId={viewer.userId}
          size="sm"
          className="!ring-2 !ring-white shadow-sm"
        />
        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
      </span>
      {compact ? (
        <span className="max-w-[4.5rem] truncate text-[10px] font-semibold text-[var(--color-navy)]">
          {viewer.fullName}
        </span>
      ) : (
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--color-navy)]">
          {viewer.fullName}
          {viewer.isGuest ? (
            <span className="ml-1 text-[10px] font-medium text-[var(--color-muted)]">
              · xem
            </span>
          ) : null}
        </span>
      )}
    </>
  );

  if (compact) {
    return (
      <div className="flex w-[4.75rem] shrink-0 flex-col items-center gap-1">
        {viewer.userId ? (
          <Link to={`/user/${viewer.userId}`} className="flex flex-col items-center gap-1">
            {inner}
          </Link>
        ) : (
          inner
        )}
      </div>
    );
  }

  const rowClass =
    'flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-white';

  if (viewer.userId) {
    return (
      <Link to={`/user/${viewer.userId}`} className={rowClass}>
        {inner}
      </Link>
    );
  }

  return <div className={rowClass}>{inner}</div>;
}
