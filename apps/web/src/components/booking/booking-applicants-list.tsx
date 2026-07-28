import { formatPrice } from '../../services/api';
import type { BookingApplication } from '../../types/catalog';

type Props = {
  applications: BookingApplication[];
  selecting?: boolean;
  onSelect: (applicationId: string) => void;
  matchingDeadlineAt?: string | null;
};

export function BookingApplicantsList({
  applications,
  selecting,
  onSelect,
  matchingDeadlineAt,
}: Props) {
  const applied = applications.filter((a) => a.status === 'APPLIED');
  const others = applications.filter((a) => a.status !== 'APPLIED');

  return (
    <section className="surface-card space-y-3 p-4 sm:p-5">
      <div>
        <h2 className="text-lg font-extrabold">Ứng viên ứng tuyển</h2>
        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
          Người làm đặt cọc 10% để vào list. Bạn chọn 1 người để giao việc.
          {matchingDeadlineAt
            ? ` Hạn ghép: ${new Date(matchingDeadlineAt).toLocaleString('vi-VN')}.`
            : null}
        </p>
      </div>

      {applied.length === 0 ? (
        <p className="rounded-xl bg-[var(--color-canvas)]/80 px-3 py-6 text-center text-sm text-[var(--color-muted)]">
          Chưa có ai ứng tuyển. Đơn đang hiện trên hàng chờ người làm.
        </p>
      ) : (
        <ul className="space-y-2">
          {applied.map((app) => {
            const profile = app.partner?.partnerProfile;
            return (
              <li
                key={app.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] bg-white p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">
                    {app.partner?.fullName ?? 'Người làm'}
                    {profile?.isVerified ? (
                      <span className="ml-1 text-[10px] font-bold text-emerald-700">
                        ✓
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                    {profile?.headline || profile?.city || '—'}
                    {profile?.ratingAvg != null
                      ? ` · ★ ${profile.ratingAvg.toFixed(1)} (${profile.ratingCount ?? 0})`
                      : null}
                    {profile?.level != null ? ` · Lv.${profile.level}` : null}
                  </p>
                  {app.note ? (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--color-ink)]">
                      {app.note}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                    Cọc ứng tuyển: {formatPrice(app.depositAmount)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={selecting}
                  onClick={() => onSelect(app.id)}
                  className="shrink-0 rounded-lg bg-[var(--color-ink)] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  Chọn làm việc
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {others.length > 0 ? (
        <p className="text-[11px] text-[var(--color-muted)]">
          Đã xử lý: {others.length} hồ sơ (từ chối / hoàn cọc / đã chọn).
        </p>
      ) : null}
    </section>
  );
}
