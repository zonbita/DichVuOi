import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/auth-context';
import { usePartnerPresence } from '../../hooks/use-partner-presence';
import { ChatbotPopup } from '../chatbot/chatbot-popup';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export function SiteLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { canOffer } = useAuth();
  usePartnerPresence(canOffer);
  const isHome = pathname === '/';
  // Admin dùng shell riêng (sidebar) — không bọc header/footer marketplace.
  const isAdmin = pathname.startsWith('/admin');
  // Dashboard khách thuê / người làm: cột sidebar full-bleed dưới header.
  const isUserDash =
    pathname.startsWith('/don-cua-toi') || pathname.startsWith('/doi-tac');
  const isPartnerPublicProfile = pathname.startsWith('/user/');
  const hideFooter =
    pathname.startsWith('/don-cua-toi') || pathname.startsWith('/doi-tac');

  if (isAdmin) {
    return <div className="admin-shell min-h-screen">{children}</div>;
  }

  return (
    <div
      className={
        isUserDash
          ? 'flex h-dvh max-h-dvh flex-col overflow-hidden'
          : 'flex min-h-screen flex-col'
      }
    >
      <SiteHeader />
      <main
        className={
          isHome
            ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip'
            : isUserDash
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
              : isPartnerPublicProfile
                ? 'page-shell glass-page min-w-0 flex-1 py-6'
                : 'page-shell flex-1 py-6'
        }
      >
        {isHome || isUserDash ? (
          children
        ) : (
          <div className="section-container">{children}</div>
        )}
      </main>
      {!hideFooter ? <SiteFooter /> : null}
      <ChatbotPopup />
    </div>
  );
}
