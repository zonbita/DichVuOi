import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import { BookingChecklist } from '../components/booking/booking-checklist';
import { BookingComplaintForm } from '../components/booking/booking-complaint-form';
import { PartnerBookingCard } from '../components/partner/partner-booking-card';
import { useAuth } from '../features/auth/auth-context';
import { usePartnerRealtime } from '../hooks/use-partner-realtime';
import { api } from '../services/api';

export function PartnerBookingDetailPage() {
  const { id = '' } = useParams();
  const { user, loading, canOffer } = useAuth();
  const queryClient = useQueryClient();

  usePartnerRealtime(Boolean(user) && canOffer, user?.id);

  const bookingQuery = useQuery({
    queryKey: ['booking', id],
    queryFn: () => api.getBooking(id),
    enabled: Boolean(id) && Boolean(user),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['booking', id] });
    void queryClient.invalidateQueries({ queryKey: ['bookings', 'partner'] });
  };

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.updateBookingStatus(id, status),
    onSuccess: (booking) => {
      queryClient.setQueryData(['booking', id], booking);
      invalidate();
    },
  });

  if (loading || bookingQuery.isLoading) return <p>Đang tải đơn...</p>;
  if (!user) {
    return <Navigate to={`/dang-nhap?redirect=/doi-tac/viec/${id}`} replace />;
  }
  if (!canOffer) {
    return <Navigate to="/doi-tac" replace />;
  }
  if (bookingQuery.isError || !bookingQuery.data) {
    return (
      <div className="space-y-3">
        <Link
          to="/doi-tac/viec"
          className="text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
        >
          ← Việc của tôi
        </Link>
        <p className="text-red-600">Không tìm thấy đơn hoặc bạn không có quyền xem.</p>
      </div>
    );
  }

  const booking = bookingQuery.data;

  return (
    <div className="space-y-4 pb-6">
      <div>
        <Link
          to="/doi-tac/viec"
          className="text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
        >
          ← Việc của tôi
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold">Chi tiết việc</h1>
        <p className="mt-1 text-xs text-[var(--color-muted)]">Mã: {booking.id}</p>
      </div>

      <PartnerBookingCard
        booking={booking}
        currentUserId={user.id}
        statusPending={statusMutation.isPending}
        statusError={
          statusMutation.isError ? (statusMutation.error as Error).message : null
        }
        onStart={() => statusMutation.mutate('IN_PROGRESS')}
        onComplete={() => statusMutation.mutate('AWAITING_CONFIRM')}
      />

      <BookingChecklist booking={booking} mode="partner" />

      <BookingComplaintForm
        bookingId={booking.id}
        partnerId={booking.partnerId}
        bookingStatus={booking.status}
        mode="partner"
        requirements={booking.requirements}
      />
    </div>
  );
}
