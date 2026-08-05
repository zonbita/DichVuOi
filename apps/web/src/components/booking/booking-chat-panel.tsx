import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { markBookingChatRead } from '../../lib/booking-chat-read';
import { BookingChat } from './booking-chat';

type Props = {
  bookingId: string;
  currentUserId: string;
  title?: string;
  open: boolean;
  onClose: () => void;
};

function ChatHeaderIcon() {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-white"
      aria-hidden
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 8.5h10M7 12h6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M5.5 4.5h13A2.5 2.5 0 0 1 21 7v7.5a2.5 2.5 0 0 1-2.5 2.5H11l-4.2 3.2a.6.6 0 0 1-1 .45V17H5.5A2.5 2.5 0 0 1 3 14.5V7A2.5 2.5 0 0 1 5.5 4.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Panel chat cố định phải: full-width trên mobile, max 360px từ sm. */
export function BookingChatPanel({
  bookingId,
  currentUserId,
  title = 'Chat đơn',
  open,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !currentUserId) return;
    markBookingChatRead(currentUserId, bookingId);
  }, [open, currentUserId, bookingId]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Đóng chat"
        className="fixed inset-0 z-[210] bg-black/20"
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 right-0 z-[220] flex w-full max-w-[360px] flex-col border-l border-[var(--color-line)] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex shrink-0 items-center gap-2.5 border-b border-[var(--color-line)] px-3 py-3">
          <ChatHeaderIcon />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[var(--color-ink)]">
              {title}
            </p>
            <p className="text-[11px] text-[var(--color-muted)]">
              Chỉ qua Dich Vụ Ơi
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xl leading-none text-[var(--color-muted)] hover:bg-[var(--color-canvas)]"
            aria-label="Đóng"
          >
            ×
          </button>
        </header>
        <div className="min-h-0 flex-1">
          <BookingChat bookingId={bookingId} layout="panel" />
        </div>
      </aside>
    </>,
    document.body,
  );
}
