import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../../features/auth/auth-context';
import {
  markSupportChatRead,
  OPEN_CHATBOT_EVENT,
  type OpenChatbotDetail,
} from '../../lib/support-chat-read';
import { api } from '../../services/api';
import type { SupportMessage } from '../../types/support';
import {
  newSessionId,
  TOKEN_KEY,
  type AiMessage,
  type ChatTab,
} from './chatbot-utils';

export function useChatbot(initialOpen: boolean) {
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

  const headerSubtitle =
    tab === 'ai'
      ? statsQuery.data
        ? `${statsQuery.data.faqCount.toLocaleString('vi-VN')} FAQ · ChatGPT ${
            statsQuery.data.chatgptEnabled ? 'bật' : 'tắt'
          }`
        : 'FAQ + ChatGPT'
      : 'Chat với admin / kỹ thuật viên';

  return {
    titleId,
    user,
    open,
    setOpen,
    tab,
    setTab,
    draft,
    setDraft,
    messages,
    listRef,
    isStaff,
    suggestionsQuery,
    supportQuery,
    askMutation,
    supportMutation,
    sendAi,
    onSubmit,
    headerSubtitle,
  };
}

export type ChatbotState = ReturnType<typeof useChatbot>;
