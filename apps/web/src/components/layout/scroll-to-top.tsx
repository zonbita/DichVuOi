import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Mỗi lần đổi route → cuộn về đầu trang (window). */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}
