import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import { FAB_SURFACE } from './chatbot-utils';
import type { ChatbotState } from './use-chatbot';

export function ChatbotSupportTab({ state }: { state: ChatbotState }) {
  const {
    user,
    isStaff,
    listRef,
    setOpen,
    supportQuery,
    supportMutation,
    onSubmit,
    draft,
    setDraft,
  } = state;
  return (
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
              Trả lời khách tại dashboard Admin · Chat với khách.
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
  );
}
