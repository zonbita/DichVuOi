import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { BookingMessage } from '../../types/catalog';

type Props = {
  bookingId: string;
  enabled?: boolean;
  /** `panel` = full chiều cao trong drawer 360px. */
  layout?: 'inline' | 'panel';
};

function MessageCard({ message }: { message: BookingMessage }) {
  return (
    <div className="rounded-lg border border-black/4 bg-white px-3 py-2.5 shadow-sm">
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-xs leading-snug">
          <span className="font-semibold text-[var(--color-ink)]">
            {message.sender.fullName}
          </span>
          <span className="ml-1.5 font-normal text-[var(--color-muted)]">
            {new Date(message.createdAt).toLocaleString('vi-VN')}
          </span>
        </p>
        {message.redacted ? (
          <span className="shrink-0 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
            Đã ẩn liên hệ
          </span>
        ) : null}
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-ink)]">
        {message.body}
      </p>
    </div>
  );
}

export function BookingChat({
  bookingId,
  enabled = true,
  layout = 'inline',
}: Props) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const isPanel = layout === 'panel';

  const messagesQuery = useQuery({
    queryKey: ['booking-messages', bookingId],
    queryFn: () => api.getBookingMessages(bookingId),
    enabled: enabled && Boolean(bookingId),
    refetchInterval: 60_000,
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => api.postBookingMessage(bookingId, body),
    onSuccess: (message) => {
      setDraft('');
      queryClient.setQueryData<BookingMessage[]>(
        ['booking-messages', bookingId],
        (prev) => {
          const list = prev ?? [];
          if (list.some((m) => m.id === message.id)) return list;
          return [...list, message];
        },
      );
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sendMutation.isPending) return;
    sendMutation.mutate(body);
  }

  const messages: BookingMessage[] = messagesQuery.data ?? [];

  return (
    <div
      className={
        isPanel
          ? 'flex h-full min-h-0 flex-col bg-[var(--color-canvas)]'
          : 'mt-3 rounded-md border border-black/8 bg-[var(--color-canvas)]/60 p-3'
      }
    >
      {!isPanel ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Chat đơn · chỉ qua Dich Vụ Ơi
        </p>
      ) : null}

      <div
        className={
          isPanel
            ? 'min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-3'
            : 'mt-3 max-h-48 space-y-2.5 overflow-y-auto'
        }
      >
        {messagesQuery.isLoading ? (
          <p className="text-sm text-[var(--color-muted)]">Đang tải tin…</p>
        ) : null}
        {messagesQuery.isError ? (
          <p className="text-sm text-red-600">Không tải được chat.</p>
        ) : null}
        {messages.map((m) => (
          <MessageCard key={m.id} message={m} />
        ))}
        {!messagesQuery.isLoading && messages.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Chưa có tin — bắt đầu trao đổi tại đây.
          </p>
        ) : null}
      </div>

      <form
        onSubmit={onSubmit}
        className={
          isPanel
            ? 'flex shrink-0 gap-2 border-t border-[var(--color-line)] bg-white p-3'
            : 'mt-3 flex gap-2'
        }
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
          placeholder="Nhắn trong đơn…"
          className="field-input min-w-0 flex-1 text-sm"
        />
        <button
          type="submit"
          disabled={sendMutation.isPending || !draft.trim()}
          className="btn-primary shrink-0 px-3 py-2 text-sm disabled:opacity-50"
        >
          Gửi
        </button>
      </form>
      {sendMutation.isError ? (
        <p
          className={`text-xs text-red-600 ${isPanel ? 'px-3 pb-2' : 'mt-1'}`}
        >
          {(sendMutation.error as Error).message || 'Gửi thất bại'}
        </p>
      ) : null}
    </div>
  );
}
