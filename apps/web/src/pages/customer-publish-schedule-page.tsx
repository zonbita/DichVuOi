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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-navy)]">
          Lịch đăng đơn
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Xem các đơn đã hẹn giờ đăng lên bảng tin — bố cục giống lịch thuê theo
          tháng của người làm.
        </p>
      </div>
      <CustomerPublishScheduleBoard enabled={Boolean(user)} />
    </div>
  );
}
