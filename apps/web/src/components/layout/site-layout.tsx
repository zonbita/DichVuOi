import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { ChatbotPopup } from '../chatbot/chatbot-popup';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export function SiteLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  // Admin dùng shell riêng (sidebar) — không bọc header/footer marketplace.
  const isAdmin = pathname.startsWith('/admin');
  // Dashboard khách thuê / người làm: cột sidebar full-bleed dưới header.
  const isUserDash =
    pathname.startsWith('/don-cua-toi') || pathname.startsWith('/doi-tac');

  if (isAdmin) {
    return <div className="admin-shell min-h-screen">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main
        className={
          isHome || isUserDash ? 'flex-1' : 'page-shell flex-1 py-6'
        }
      >
        {isHome || isUserDash ? (
          children
        ) : (
          <div className="section-container">{children}</div>
        )}
      </main>
      <SiteFooter />
      <ChatbotPopup />
    </div>
  );
}
