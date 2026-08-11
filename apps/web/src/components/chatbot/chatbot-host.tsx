import { lazy, Suspense, useEffect, useState, type CSSProperties } from 'react';
import { MessageCircle } from 'lucide-react';
import { OPEN_CHATBOT_EVENT } from '../../lib/support-chat-read';

const ChatbotPopup = lazy(() =>
  import('./chatbot-popup').then((m) => ({ default: m.ChatbotPopup })),
);

const FAB_SIZE = 56;

const FAB_SURFACE: CSSProperties = {
  background:
    'radial-gradient(circle at 42% 36%, #5eead4 0%, #14b8a6 38%, #009c95 68%, #0f766e 100%)',
  boxShadow:
    '0 10px 28px rgba(0, 122, 116, 0.38), 0 2px 6px rgba(7, 59, 92, 0.18), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -10px 18px rgba(7, 59, 92, 0.18)',
};

function defaultFabStyle(): CSSProperties {
  const x =
    typeof window === 'undefined'
      ? 24
      : Math.max(8, window.innerWidth - FAB_SIZE - 24);
  const y =
    typeof window === 'undefined'
      ? 24
      : Math.max(8, window.innerHeight - FAB_SIZE - 24);
  return { left: x, top: y, ...FAB_SURFACE };
}

function FabStub({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={defaultFabStyle()}
      className="pointer-events-auto fixed z-[100000] flex h-14 w-14 items-center justify-center rounded-[18px] !text-white transition duration-200 hover:brightness-105 hover:scale-[1.03] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
      aria-label="Mở trợ lý chat"
    >
      <MessageCircle
        className="h-7 w-7 drop-shadow-[0_2px_4px_rgba(7,59,92,0.35)]"
        strokeWidth={2.25}
      />
    </button>
  );
}

/** FAB nhẹ; panel + socket chỉ load khi mở chat. */
export function ChatbotHost() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    function onOpen() {
      setMounted(true);
    }
    window.addEventListener(OPEN_CHATBOT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHATBOT_EVENT, onOpen);
  }, []);

  if (!mounted) {
    return <FabStub onOpen={() => setMounted(true)} />;
  }

  return (
    <Suspense fallback={<FabStub onOpen={() => undefined} />}>
      <ChatbotPopup initialOpen />
    </Suspense>
  );
}
