import { MessageCircle, X } from 'lucide-react';
import { ChatbotAiTab } from './chatbot-ai-tab';
import { ChatbotSupportTab } from './chatbot-support-tab';
import { PANEL_SHADOW, FAB_SURFACE, panelStyleFromFab } from './chatbot-utils';
import { useChatbot } from './use-chatbot';
import { useFabDrag } from './use-fab-drag';

export function ChatbotPopup({ initialOpen = false }: { initialOpen?: boolean }) {
  const state = useChatbot(initialOpen);
  const { titleId, open, setOpen, tab, setTab, setDraft, headerSubtitle } = state;
  const { fabPos, onFabPointerDown, onFabPointerMove, onFabPointerUp } =
    useFabDrag(() => setOpen((v) => !v));

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
            <ChatbotAiTab state={state} />
          ) : (
            <ChatbotSupportTab state={state} />
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
