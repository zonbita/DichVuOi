import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  FACEBOOK_EMOTICONS,
  FacebookEmoticonIcon,
} from './facebook-emoticons';
import { offeringColor } from '../../utils/catalog-colors';
import { Icon } from '../ui/icon';
import { UserAvatar } from '../ui/user-avatar';
import { PartnerHoverPreview } from './partner-hover-preview';

const TOKEN_KEY = 'dichvuoi_token';
const GUEST_KEY = 'dichvuoi_lobby_guest';

const KIND_HINT: Record<HomeShoutKind, string> = {
  GREETING: 'Chào dịch vụ',
  AVAILABLE: 'Đang nhận việc',
  PROMO: 'Ưu đãi',
  LOOKING: 'Còn slot',
  THANKS: 'Cảm ơn khách',
};

/** 7 màu cầu vồng cho loại hô — tách biệt bảng màu ngành nghề. */
const KIND_RAINBOW = [
  '#dc2626', // đỏ
  '#ea580c', // cam
  '#ca8a04', // vàng
  '#16a34a', // lục
  '#2563eb', // lam
  '#4f46e5', // chàm
  '#9333ea', // tím
] as const;

const KIND_ORDER: HomeShoutKind[] = [
  'GREETING',
  'AVAILABLE',
  'PROMO',
  'LOOKING',
  'THANKS',
];

function kindRainbowColor(kind: HomeShoutKind): string {
  const i = KIND_ORDER.indexOf(kind);
  return KIND_RAINBOW[i >= 0 ? i % KIND_RAINBOW.length : 0];
}

type SmileChat = {
  id: string;
  text: string;
  at: string;
  fromName: string;
  userId: string | null;
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

/** Câu hô = màu loại (cầu vồng); chip nghề = offeringColor. */
function ShoutMessage({
  message,
  groupSlug,
  kind,
}: {
  message: string;
  groupSlug?: string | null;
  kind: HomeShoutKind;
}) {
  const profession = offeringColor(groupSlug);
  const kindColor = kindRainbowColor(kind);
  const parts = message.split(/(«[^»]+»)/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = /^«(.+)»$/.exec(part);
        if (!match) {
          return (
            <span key={i} className="font-semibold" style={{ color: kindColor }}>
              {part}
            </span>
          );
        }
        return (
          <span
            key={i}
            className="mx-0.5 inline-flex max-w-full items-center gap-1 align-middle rounded-md px-1.5 py-0.5 font-semibold"
            style={{
              backgroundColor: profession.soft,
              color: profession.ink,
            }}
          >
            <Icon
              name="briefcase"
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: profession.main }}
            />
            <span className="truncate">{match[1]}</span>
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
  const [smileChats, setSmileChats] = useState<SmileChat[]>([]);
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

  const selectedPost = useMemo(
    () => approvedPosts.find((p) => p.id === servicePostId) ?? approvedPosts[0],
    [approvedPosts, servicePostId],
  );
  const lobbyColor = offeringColor(selectedPost?.service.category?.group.slug);

  useEffect(() => {
    if (!servicePostId && approvedPosts[0]) {
      setServicePostId(approvedPosts[0].id);
    }
  }, [approvedPosts, servicePostId]);

  function appendSmileChat(reaction: HomeLobbyReaction) {
    if (!reaction?.emoji) return;
    const line: SmileChat = {
      id: reaction.id,
      text: reaction.emoji,
      at: reaction.at || new Date().toISOString(),
      fromName: reaction.fromName?.trim() || 'Khách',
      userId: reaction.userId ?? null,
    };
    setSmileChats((prev) => {
      if (prev.some((item) => item.id === line.id)) return prev;
      return [line, ...prev].slice(0, 40);
    });
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
      appendSmileChat(reaction);
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
    onSuccess: (reaction) => {
      setReactError(null);
      appendSmileChat(reaction);
    },
    onError: (err) => {
      setReactError((err as Error).message || 'Không gửi được smile');
    },
  });

  function onTapSmile(code: string) {
    const now = Date.now();
    if (now - lastTapRef.current < 180) return;
    lastTapRef.current = now;
    reactMutation.mutate(code);
  }

  const items = feedQuery.data?.items ?? [];
  const feedRows = useMemo(() => {
    const shouts = items.map((shout) => ({
      type: 'shout' as const,
      at: shout.createdAt,
      id: shout.id,
      shout,
    }));
    const smiles = smileChats.map((chat) => ({
      type: 'smile' as const,
      at: chat.at,
      id: chat.id,
      chat,
    }));
    return [...shouts, ...smiles].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }, [items, smileChats]);
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
          <div className="relative z-[1] min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-2.5 sm:px-3.5">
            {feedQuery.isLoading ? (
              <p className="py-8 text-center text-sm text-[var(--color-muted)]">
                Đang tải sảnh…
              </p>
            ) : feedRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--color-muted)]">
                Chưa có ai chat — bấm smile để gửi :)) lên sảnh.
              </p>
            ) : (
              feedRows.map((row) =>
                row.type === 'smile' ? (
                  <div
                    key={row.id}
                    className="flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1"
                  >
                    {row.chat.userId ? (
                      <PartnerHoverPreview
                        seed={{
                          userId: row.chat.userId,
                          fullName: row.chat.fromName,
                        }}
                      >
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <Link
                            to={`/user/${row.chat.userId}`}
                            className="shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <UserAvatar
                              name={row.chat.fromName}
                              userId={row.chat.userId}
                              size="sm"
                              className="!h-7 !w-7 shrink-0 !ring-1 !ring-[var(--color-line)]"
                            />
                          </Link>
                          <Link
                            to={`/user/${row.chat.userId}`}
                            className="truncate font-extrabold text-[var(--color-navy)] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {row.chat.fromName}
                          </Link>
                        </span>
                      </PartnerHoverPreview>
                    ) : (
                      <>
                        <UserAvatar
                          name={row.chat.fromName}
                          size="sm"
                          className="!h-7 !w-7 shrink-0 !ring-1 !ring-[var(--color-line)]"
                        />
                        <span className="truncate font-extrabold text-[var(--color-navy)]">
                          {row.chat.fromName}
                        </span>
                      </>
                    )}
                    <p className="min-w-0 flex-1 truncate text-sm leading-snug text-[var(--color-ink)]">
                      <span className="mx-1 font-semibold text-[var(--color-muted)]">
                        :
                      </span>
                      <span className="font-semibold tracking-wide">
                        {row.chat.text}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div
                    key={row.id}
                    className="flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-[var(--color-canvas)]/80"
                  >
                    <PartnerHoverPreview
                      seed={{
                        userId: row.shout.user.id,
                        fullName: row.shout.user.fullName,
                        avatarUrl: row.shout.user.avatarUrl,
                        level: row.shout.user.level,
                        acceptingJobs: row.shout.user.acceptingJobs,
                      }}
                    >
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <Link
                          to={
                            row.shout.servicePost.profileHref ||
                            `/user/${row.shout.user.id}`
                          }
                          className="shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <UserAvatar
                            name={row.shout.user.fullName}
                            src={row.shout.user.avatarUrl}
                            userId={row.shout.user.id}
                            size="sm"
                            className="!h-7 !w-7 shrink-0 !ring-1 !ring-[var(--color-line)]"
                          />
                        </Link>
                        <Link
                          to={
                            row.shout.servicePost.profileHref ||
                            `/user/${row.shout.user.id}`
                          }
                          className="truncate font-extrabold text-[var(--color-navy)] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.shout.user.fullName}
                        </Link>
                      </span>
                    </PartnerHoverPreview>
                    <Link
                      to={row.shout.servicePost.href}
                      className="min-w-0 flex-1 truncate text-sm leading-snug text-[var(--color-ink)]"
                      title={row.shout.message}
                    >
                      <span className="mx-1 font-semibold text-[var(--color-muted)]">
                        :
                      </span>
                      <ShoutMessage
                        message={row.shout.message}
                        groupSlug={row.shout.servicePost.groupSlug}
                        kind={row.shout.kind}
                      />
                    </Link>
                  </div>
                ),
              )
            )}
          </div>

          <div className="relative z-[2] shrink-0 border-t border-[var(--color-line)] bg-[var(--color-canvas)]/70 px-3 py-3 sm:px-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="min-w-0 flex-1">
                {!user ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-[var(--color-muted)]">
                      Smile thì ai cũng bấm được. Đăng nhập mới hô / quảng cáo dịch vụ.
                    </p>
                    <Link
                      to="/dang-nhap?redirect=/"
                      className="btn-primary inline-flex h-11 items-center gap-1.5 px-3 text-xs sm:text-sm"
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
                      className="inline-flex h-11 items-center gap-1.5 rounded-[14px] border border-[var(--color-line)] bg-white px-3 text-xs font-semibold text-[var(--color-ink)] sm:text-sm"
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
                      className="inline-flex h-11 items-center gap-1.5 rounded-[14px] border border-[var(--color-line)] bg-white px-3 text-xs font-semibold text-[var(--color-ink)] sm:text-sm"
                    >
                      Quản lý bài đăng
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(9.5rem,11rem)_minmax(0,1fr)_auto] sm:items-stretch">
                      <select
                        value={kind}
                        onChange={(e) => setKind(e.target.value as HomeShoutKind)}
                        aria-label="Loại thông báo"
                        className="field-input h-11 w-full text-sm font-semibold"
                        style={{ color: kindRainbowColor(kind) }}
                      >
                        {kinds.map((item) => (
                          <option key={item.kind} value={item.kind}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={servicePostId}
                        onChange={(e) => setServicePostId(e.target.value)}
                        aria-label="Bài dịch vụ"
                        className="field-input h-11 min-w-0 w-full text-sm font-semibold"
                        style={{ color: lobbyColor.ink }}
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
                        className="btn-primary inline-flex h-11 w-full items-center justify-center px-4 text-sm disabled:opacity-60 sm:w-auto sm:min-w-[8.5rem]"
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

              {/* Bấm smile: chat chữ :)) lên sảnh */}
              <div ref={smilePanelRef} className="relative shrink-0 self-center">
                {smileOpen ? (
                  <div
                    className="absolute bottom-[calc(100%+10px)] right-0 z-30 w-[min(100vw-1.5rem,20rem)] overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-[0_12px_32px_rgba(15,39,71,0.14)] sm:w-[22rem]"
                    role="dialog"
                    aria-label="Bảng smile"
                  >
                    <div className="px-3 pb-2 pt-3">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted)]">
                        Smile
                      </p>
                      <div className="grid max-h-[16rem] grid-cols-5 gap-1 overflow-y-auto overscroll-contain pr-0.5">
                        {FACEBOOK_EMOTICONS.map((item) => (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => onTapSmile(item.code)}
                            className="lobby-smile-btn flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition hover:bg-[var(--color-canvas)] hover:scale-105 active:scale-95"
                            aria-label={`Chat ${item.code}`}
                            title={item.code}
                          >
                            <FacebookEmoticonIcon
                              face={item.face}
                              className="h-7 w-7 sm:h-8 sm:w-8"
                            />
                            <span className="text-[10px] font-bold leading-none text-[var(--color-navy)]">
                              {item.code}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    {reactError ? (
                      <p className="px-3 pb-2 text-xs text-red-600">
                        {reactError}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setSmileOpen((open) => !open)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md ring-1 transition ${
                    smileOpen
                      ? 'ring-[var(--color-brand)]'
                      : 'ring-[var(--color-line)] hover:bg-[var(--color-canvas)]'
                  }`}
                  aria-label={smileOpen ? 'Đóng bảng smile' : 'Mở bảng smile'}
                  aria-expanded={smileOpen}
                >
                  <FacebookEmoticonIcon
                    face="haha"
                    className="h-7 w-7 sm:h-8 sm:w-8"
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

  const linked = viewer.userId ? (
    <PartnerHoverPreview
      seed={{
        userId: viewer.userId,
        fullName: viewer.fullName,
        avatarUrl: viewer.avatarUrl,
      }}
      className={compact ? 'w-full' : 'w-full'}
    >
      {compact ? (
        <Link
          to={`/user/${viewer.userId}`}
          className="flex flex-col items-center gap-1"
        >
          {inner}
        </Link>
      ) : (
        <Link
          to={`/user/${viewer.userId}`}
          className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-white"
        >
          {inner}
        </Link>
      )}
    </PartnerHoverPreview>
  ) : (
    inner
  );

  if (compact) {
    return (
      <div className="flex w-[4.75rem] shrink-0 flex-col items-center gap-1">
        {linked}
      </div>
    );
  }

  if (viewer.userId) return linked;

  return (
    <div className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-white">
      {inner}
    </div>
  );
}
