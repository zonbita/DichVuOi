import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../../features/auth/auth-context';
import { api } from '../../services/api';
import type { SupportMessage, SupportThread } from '../../types/support';

const TOKEN_KEY = 'dichvuoi_token';

export function AdminSupportChatPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const threadsQuery = useQuery({
    queryKey: ['support', 'threads'],
    queryFn: () => api.listSupportThreads(),
    staleTime: 10_000,
  });

  const detailQuery = useQuery({
    queryKey: ['support', 'thread', selectedId],
    queryFn: () => api.getSupportThread(selectedId!),
    enabled: Boolean(selectedId),
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => api.postSupportThreadMessage(selectedId!, body),
    onSuccess: (message) => {
      queryClient.setQueryData<{
        thread: SupportThread;
        messages: SupportMessage[];
      }>(['support', 'thread', selectedId], (prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === message.id)) return prev;
        return { ...prev, messages: [...prev.messages, message] };
      });
      void queryClient.invalidateQueries({ queryKey: ['support', 'threads'] });
      setDraft('');
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => api.updateSupportThread(selectedId!, { status: 'CLOSED' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['support', 'threads'] });
      void queryClient.invalidateQueries({ queryKey: ['support', 'thread', selectedId] });
    },
  });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [detailQuery.data?.messages]);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    const base = import.meta.env.VITE_API_URL ?? '';
    const socket: Socket = io(`${base}/partner-realtime`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socket.on('support:message', (message: SupportMessage) => {
      void queryClient.invalidateQueries({ queryKey: ['support', 'threads'] });
      queryClient.setQueryData<{
        thread: SupportThread;
        messages: SupportMessage[];
      }>(['support', 'thread', message.threadId], (prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === message.id)) return prev;
        return { ...prev, messages: [...prev.messages, message] };
      });
    });
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [queryClient]);

  useEffect(() => {
    if (!selectedId && threadsQuery.data && threadsQuery.data.length > 0) {
      setSelectedId(threadsQuery.data[0].id);
    }
  }, [threadsQuery.data, selectedId]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !selectedId || sendMutation.isPending) return;
    sendMutation.mutate(body);
  }

  const threads = threadsQuery.data ?? [];
  const detail = detailQuery.data;

  return (
    <div className="grid min-h-[min(70vh,560px)] overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-white shadow-sm lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-[var(--admin-border)] lg:border-b-0 lg:border-r">
          <div className="border-b border-[var(--admin-border)] px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-[var(--color-muted)]">
            Hội thoại ({threads.length})
          </div>
          <div className="max-h-[36vh] overflow-y-auto lg:max-h-[520px]">
            {threadsQuery.isLoading ? (
              <p className="p-4 text-sm text-[var(--color-muted)]">Đang tải…</p>
            ) : null}
            {!threadsQuery.isLoading && threads.length === 0 ? (
              <p className="p-4 text-sm text-[var(--color-muted)]">Chưa có chat hỗ trợ.</p>
            ) : null}
            {threads.map((t) => {
              const active = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`block w-full border-b border-[var(--admin-border)] px-3 py-3 text-left transition ${
                    active ? 'bg-[var(--color-brand-soft)]' : 'hover:bg-[var(--color-canvas)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-[var(--color-ink)]">
                      {t.customer.fullName}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        t.status === 'OPEN'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.status === 'OPEN' ? 'Mở' : 'Đóng'}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                    {t.lastPreview?.body ?? t.customer.email}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="flex min-h-[360px] flex-col">
          {!selectedId ? (
            <p className="m-auto text-sm text-[var(--color-muted)]">Chọn một hội thoại</p>
          ) : detailQuery.isLoading ? (
            <p className="m-auto text-sm text-[var(--color-muted)]">Đang tải tin nhắn…</p>
          ) : detail ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--admin-border)] px-4 py-3">
                <div>
                  <p className="font-extrabold text-[var(--color-navy)]">
                    {detail.thread.customer.fullName}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {detail.thread.customer.email}
                    {detail.thread.customer.phone
                      ? ` · ${detail.thread.customer.phone}`
                      : ''}
                    {detail.thread.assignee
                      ? ` · Phụ trách: ${detail.thread.assignee.fullName}`
                      : ''}
                  </p>
                </div>
                {detail.thread.status === 'OPEN' ? (
                  <button
                    type="button"
                    onClick={() => closeMutation.mutate()}
                    disabled={closeMutation.isPending}
                    className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--color-canvas)]"
                  >
                    Đóng hội thoại
                  </button>
                ) : null}
              </div>

              <div
                ref={listRef}
                className="flex-1 space-y-3 overflow-y-auto bg-[var(--color-canvas)] px-4 py-4"
              >
                {detail.messages.map((m) => {
                  const mine = m.senderId === user?.id;
                  const staff = m.sender.role === 'ADMIN' || m.sender.role === 'MODERATOR';
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine || staff ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                          mine || staff
                            ? 'rounded-br-md bg-[var(--color-navy)] !text-white'
                            : 'rounded-bl-md border border-[var(--color-line)] bg-white'
                        }`}
                      >
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide opacity-70">
                          {m.sender.fullName}
                          {m.sender.role === 'MODERATOR'
                            ? ' · Mod'
                            : m.sender.role === 'ADMIN'
                              ? ' · Admin'
                              : ''}
                        </p>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {detail.thread.status === 'OPEN' ? (
                <form
                  onSubmit={onSubmit}
                  className="flex gap-2 border-t border-[var(--admin-border)] bg-white p-3"
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={2000}
                    placeholder="Trả lời khách…"
                    className="field-input min-w-0 flex-1 text-sm"
                    disabled={sendMutation.isPending}
                  />
                  <button
                    type="submit"
                    disabled={sendMutation.isPending || !draft.trim()}
                    className="rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold !text-white disabled:opacity-50"
                  >
                    Gửi
                  </button>
                </form>
              ) : (
                <p className="border-t border-[var(--admin-border)] px-4 py-3 text-sm text-[var(--color-muted)]">
                  Hội thoại đã đóng.
                </p>
              )}
            </>
          ) : (
            <p className="m-auto text-sm text-[var(--color-muted)]">Không tải được hội thoại.</p>
          )}
        </div>
    </div>
  );
}
