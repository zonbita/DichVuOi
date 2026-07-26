import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { BookingMessage } from '../../types/catalog';

type Props = {
  bookingId: string;
  enabled?: boolean;
};

export function BookingChat({ bookingId, enabled = true }: Props) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');

  const messagesQuery = useQuery({
    queryKey: ['booking-messages', bookingId],
    queryFn: () => api.getBookingMessages(bookingId),
    enabled: enabled && Boolean(bookingId),
    // Realtime qua Socket; poll thưa chỉ làm lưới an toàn khi WS rớt
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
    <div className="mt-3 rounded-md border border-black/8 bg-[var(--color-canvas)]/60 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        Chat đơn · chỉ qua Dich Vụ Ơi
      </p>
      <p className="mt-1 text-xs text-[var(--color-muted)]">
        Không gửi SĐT / Zalo / Facebook — hệ thống tự ẩn nếu phát hiện.
      </p>

      <div className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
        {messagesQuery.isLoading ? <p>Đang tải tin…</p> : null}
        {messagesQuery.isError ? (
          <p className="text-red-600">Không tải được chat.</p>
        ) : null}
        {messages.map((m) => (
          <div key={m.id} className="rounded bg-white px-2.5 py-2 shadow-sm">
            <p className="text-xs font-semibold text-[var(--color-ink)]">
              {m.sender.fullName}
              <span className="ml-2 font-normal text-[var(--color-muted)]">
                {new Date(m.createdAt).toLocaleString('vi-VN')}
              </span>
              {m.redacted ? (
                <span className="ml-2 font-normal text-amber-700">(đã ẩn liên hệ)</span>
              ) : null}
            </p>
            <p className="mt-0.5 whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
        {!messagesQuery.isLoading && messages.length === 0 ? (
          <p className="text-[var(--color-muted)]">Chưa có tin — bắt đầu trao đổi tại đây.</p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
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
        <p className="mt-1 text-xs text-red-600">
          {(sendMutation.error as Error).message || 'Gửi thất bại'}
        </p>
      ) : null}
    </div>
  );
}
