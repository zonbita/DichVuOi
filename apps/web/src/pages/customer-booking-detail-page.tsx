import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import { BookingChecklist } from '../components/booking/booking-checklist';
import { BookingComplaintForm } from '../components/booking/booking-complaint-form';
import { CustomerBookingCard } from '../components/customer/customer-booking-card';
import { useAuth } from '../features/auth/auth-context';
import { useCustomerRealtime } from '../hooks/use-customer-realtime';
import { api } from '../services/api';

export function CustomerBookingDetailPage() {
  const { id = '' } = useParams();
  const { user, loading, refreshMe } = useAuth();
  const queryClient = useQueryClient();

  useCustomerRealtime(Boolean(user), user?.id);

  const bookingQuery = useQuery({
    queryKey: ['booking', id],
    queryFn: () => api.getBooking(id),
    enabled: Boolean(id) && Boolean(user),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['booking', id] });
    void queryClient.invalidateQueries({ queryKey: ['bookings', 'mine'] });
  };

  const cancelMutation = useMutation({
    mutationFn: () => api.updateBookingStatus(id, 'CANCELLED'),
    onSuccess: invalidate,
  });

  const payMutation = useMutation({
    mutationFn: () => api.payBooking(id),
    onSuccess: async (booking) => {
      queryClient.setQueryData(['booking', id], booking);
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
      await refreshMe();
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (acceptIncomplete: boolean) =>
      api.confirmBooking(id, acceptIncomplete),
    onSuccess: (booking) => {
      queryClient.setQueryData(['booking', id], booking);
      invalidate();
    },
  });

  if (loading || bookingQuery.isLoading) return <p>Đang tải đơn...</p>;
  if (!user) {
    return <Navigate to={`/dang-nhap?redirect=/don-cua-toi/don/${id}`} replace />;
  }
  if (bookingQuery.isError || !bookingQuery.data) {
    return (
      <div className="space-y-3">
        <Link
          to="/don-cua-toi"
          className="text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
        >
          ← Đơn thuê
        </Link>
        <p className="text-red-600">Không tìm thấy đơn hoặc bạn không có quyền xem.</p>
      </div>
    );
  }

  const booking = bookingQuery.data;

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/don-cua-toi"
            className="text-sm font-semibold text-[var(--color-brand-deep)] hover:underline"
          >
            ← Đơn thuê
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold">Chi tiết đơn</h1>
          <p className="mt-1 text-xs text-[var(--color-muted)]">Mã: {booking.id}</p>
        </div>
        <Link to="/don-cua-toi/khieu-nai" className="text-sm font-semibold text-[var(--color-muted)]">
          Hướng dẫn khiếu nại
        </Link>
      </div>

      <CustomerBookingCard
        booking={booking}
        currentUserId={user.id}
        paying={payMutation.isPending}
        cancelling={cancelMutation.isPending}
        confirming={confirmMutation.isPending}
        payError={payMutation.isError ? (payMutation.error as Error).message : null}
        confirmError={
          confirmMutation.isError ? (confirmMutation.error as Error).message : null
        }
        onPay={() => payMutation.mutate()}
        onCancel={() => cancelMutation.mutate()}
        onConfirm={(_bookingId, acceptIncomplete) =>
          confirmMutation.mutate(acceptIncomplete)
        }
      />

      <BookingChecklist booking={booking} mode="customer" />

      <BookingComplaintForm
        bookingId={booking.id}
        partnerId={booking.partnerId}
        bookingStatus={booking.status}
        mode="customer"
        requirements={booking.requirements}
      />
    </div>
  );
}
