import { Navigate } from 'react-router-dom';
import { CustomerPublishScheduleBoard } from '../components/customer/customer-publish-schedule-board';
import { useAuth } from '../features/auth/auth-context';

export function CustomerPublishSchedulePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <p className="px-1 py-6 text-sm text-[var(--color-muted)]">Đang tải…</p>
    );
  }

  if (!user) {
    return (
      <Navigate to="/dang-nhap?redirect=/don-cua-toi/lich-dang" replace />
    );
  }

  return <CustomerPublishScheduleBoard enabled={Boolean(user)} />;
}
