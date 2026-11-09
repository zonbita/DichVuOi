import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../../../features/auth/auth-context';
import { api } from '../../../services/api';
import type {
  HomeLobbyFeed,
  HomeLobbyPresence,
  HomeLobbyReaction,
  HomeShout,
  HomeShoutKind,
} from '../../../types/home-lobby';
import { offeringColor } from '../../../utils/catalog-colors';
import {
  ensureGuestId,
  KIND_HINT,
  prependShout,
  TOKEN_KEY,
  type SmileChat,
} from './lobby-utils';

export type LobbyFeedRow =
  | { type: 'shout'; at: string; id: string; shout: HomeShout }
  | { type: 'smile'; at: string; id: string; chat: SmileChat };

export function useHomeLobby() {
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
  const feedRows = useMemo((): LobbyFeedRow[] => {
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

  return {
    user,
    canOffer,
    kind,
    setKind,
    servicePostId,
    setServicePostId,
    presence,
    feedQuery,
    feedRows,
    kinds,
    approvedPosts,
    lobbyColor,
    shoutMutation,
    reactError,
    smileOpen,
    setSmileOpen,
    smilePanelRef,
    onTapSmile,
  };
}
