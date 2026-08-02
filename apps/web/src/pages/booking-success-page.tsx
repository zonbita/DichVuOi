import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { api, formatBookingStatus, formatPaymentStatus, formatPrice } from '../services/api';

export function BookingSuccessPage() {
  const { id = '' } = useParams();
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => api.getBooking(id),
    enabled: Boolean(id) && Boolean(user),
  });

  const payMutation = useMutation({
    mutationFn: () => api.payBooking(id),
    onSuccess: (booking) => {
      queryClient.setQueryData(['booking', id], booking);
      void queryClient.invalidateQueries({ queryKey: ['bookings', 'mine'] });
    },
  });

  if (loading || isLoading) return <p>Đang tải đơn...</p>;
  if (!user) return <Navigate to={`/dang-nhap?redirect=/dat-lich/${id}`} replace />;
  if (isError || !data) return <p className="text-red-600">Không tìm thấy đơn thuê.</p>;

  const needsDeposit =
    data.paymentStatus === 'UNPAID' && data.status !== 'CANCELLED';

  return (
    <div className="mx-auto max-w-xl border border-black/5 bg-white/90 p-6 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-sea)]">
        {needsDeposit ? 'Đơn đã tạo — cần đặt cọc' : 'Thuê dịch vụ thành công'}
      </p>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{data.service.name}</h1>
      <p className="mt-4 text-sm opacity-70">Mã đơn: {data.id}</p>
      <div className="mt-6 space-y-2 text-left text-sm sm:text-base">
        <p>
          <strong>Khách:</strong> {data.customerName} — {data.customerPhone}
        </p>
        <p>
          <strong>Địa chỉ:</strong> {data.address}
        </p>
        <p>
          <strong>Thời gian:</strong>{' '}
          {new Date(data.scheduledAt).toLocaleString('vi-VN')}
        </p>
        <p>
          <strong>Tạm tính:</strong> {formatPrice(data.totalPrice)}
        </p>
        <p>
          <strong>Trạng thái:</strong> {formatBookingStatus(data.status)}
        </p>
        {data.paymentStatus ? (
          <p>
            <strong>Thanh toán:</strong> {formatPaymentStatus(data.paymentStatus)}
          </p>
        ) : null}
        {data.partner ? (
          <p>
            <strong>Người làm:</strong> {data.partner.fullName} (liên hệ qua chat đơn — không lộ
            SĐT)
          </p>
        ) : null}
        {data.contactPolicy?.hint ? (
          <p className="text-xs text-amber-800">{data.contactPolicy.hint}</p>
        ) : null}
      </div>

      {needsDeposit ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm">
          <p className="font-semibold text-amber-950">Bắt buộc đặt cọc giữ chỗ</p>
          <p className="mt-1 text-amber-900/80">
            Đơn chỉ vào hàng chờ / mở chat / lộ địa chỉ cho người làm sau khi đặt cọc giữ chỗ
            (thanh toán mock — cổng thật sau). Hoa hồng sàn trừ khi hoàn thành.
          </p>
          <button
            type="button"
            onClick={() => payMutation.mutate()}
            disabled={payMutation.isPending}
            className="btn-primary mt-4 w-full px-5 py-3 text-sm disabled:opacity-50"
          >
            {payMutation.isPending
              ? 'Đang đặt cọc…'
              : `Đặt cọc ${formatPrice(data.totalPrice)}`}
          </button>
          {payMutation.isError ? (
            <p className="mt-2 text-xs text-red-600">
              {(payMutation.error as Error).message}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 text-sm text-[var(--color-muted)]">
          Đã giữ tiền trên sàn. Theo dõi tiến độ và chat trong «Đơn thuê».
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to={`/don-cua-toi/don/${data.id}`}
          className="btn-navy inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold"
        >
          Xem chi tiết đơn
        </Link>
        <Link
          to="/"
          className="inline-block border border-black/10 px-5 py-2.5 text-sm font-semibold"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
