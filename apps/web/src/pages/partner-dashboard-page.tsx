import { Link, Navigate } from 'react-router-dom';
import {
  DashboardEmpty,
  DashboardPageHeader,
} from '../components/dashboard/dashboard-chrome';
import { PartnerIncomingList } from '../components/partner/partner-incoming-list';
import { PartnerJobsList } from '../components/partner/partner-jobs-list';
import { PartnerLevelPanel } from '../components/partner/partner-level-panel';
import { PartnerScheduleBoard } from '../components/partner/partner-schedule-board';
import { PartnerStatsBar } from '../components/partner/partner-stats-bar';
import { PartnerProfileTab } from './partner-dashboard/partner-profile-tab';
import { usePartnerDashboard } from './partner-dashboard/use-partner-dashboard';

export function PartnerDashboardPage() {
  const state = usePartnerDashboard();
  const {
    user,
    loading,
    canOffer,
    pathname,
    legacyTab,
    tab,
    setJobsProfessionId,
    jobsProfessionId,
    appliedBookingIds,
    openQuery,
    mineQuery,
    levelQuery,
    acceptMutation,
    statusMutation,
    approveSettlementMutation,
    jobsProfessionTabs,
  } = state;

  if (loading) return <p>Đang tải...</p>;
  if (!user) return <Navigate to="/dang-nhap?redirect=/doi-tac" replace />;

  // Redirect URL cũ ?tab= sang nested path
  if (pathname === '/doi-tac' && legacyTab === 'jobs') {
    return <Navigate to="/doi-tac/viec" replace />;
  }
  if (pathname === '/doi-tac' && legacyTab === 'incoming') {
    return <Navigate to="/doi-tac/don-thue" replace />;
  }
  if (pathname === '/doi-tac' && legacyTab === 'profile') {
    return <Navigate to="/doi-tac/ho-so" replace />;
  }
  if (pathname === '/doi-tac' && legacyTab === 'level') {
    return <Navigate to="/doi-tac/cap-do" replace />;
  }

  // Chưa có hồ sơ: vẫn mở được «Hồ sơ»; tab khác gợi ý sang hồ sơ (không form «Bật nhận việc»).
  if (!canOffer && tab !== 'profile') {
    return (
      <div className="space-y-4">
        <DashboardPageHeader
          icon={
            tab === 'incoming'
              ? 'sparkles'
              : tab === 'jobs'
                ? 'briefcase'
                : tab === 'level'
                  ? 'chart'
                  : 'home'
          }
          title={
            tab === 'incoming'
              ? 'Đơn thuê'
              : tab === 'jobs'
                ? 'Việc của tôi'
                : tab === 'level'
                  ? 'Cấp độ'
                  : 'Tổng quan'
          }
          description="Điền hồ sơ người làm (SĐT, nghề, ảnh) rồi lưu — sau đó nhận việc bình thường."
        />
        <DashboardEmpty
          title="Chưa có hồ sơ người làm"
          body="Hoàn tất hồ sơ để xem đơn, việc và cấp độ của bạn."
          ctaTo="/doi-tac/ho-so"
          ctaLabel="Mở Hồ sơ"
        />
      </div>
    );
  }

  const needStartCount = (mineQuery.data ?? []).filter((b) => b.status === 'CONFIRMED').length;
  const inProgressCount = (mineQuery.data ?? []).filter((b) => b.status === 'IN_PROGRESS').length;
  const openCount = (openQuery.data ?? []).length;

  const openBookings = openQuery.data ?? [];
  const mineBookings = mineQuery.data ?? [];
  const filteredOpenBookings = (
    jobsProfessionId === 'all'
      ? openBookings
      : openBookings.filter((b) => b.service?.id === jobsProfessionId)
  )
    .slice()
    .sort((a, b) => {
      const ta = new Date(a.createdAt ?? a.scheduledAt).getTime();
      const tb = new Date(b.createdAt ?? b.scheduledAt).getTime();
      return tb - ta;
    });
  return (
    <div className={tab === 'incoming' ? 'min-w-0' : 'space-y-1 pb-6'}>
      {tab === 'level' ? (
        <DashboardPageHeader
          icon="chart"
          title="Cấp độ"
          description="Cấp merit 1–100 từ giờ online, đơn, đánh giá và hồ sơ."
        />
      ) : null}

      {(tab === 'overview' || !tab) && (
        <>
          <PartnerStatsBar
            mine={mineQuery.data ?? []}
            openCount={openCount}
          />

          {needStartCount + inProgressCount > 0 ? (
            <div className="flex flex-wrap gap-2">
              {needStartCount > 0 ? (
                <Link
                  to="/doi-tac/viec"
                  className="rounded-full bg-sky-100 px-3.5 py-1.5 text-sm font-semibold text-sky-900 hover:bg-sky-200"
                >
                  {needStartCount} việc chờ bắt đầu
                </Link>
              ) : null}
              {inProgressCount > 0 ? (
                <Link
                  to="/doi-tac/viec"
                  className="rounded-full bg-violet-100 px-3.5 py-1.5 text-sm font-semibold text-violet-900 hover:bg-violet-200"
                >
                  {inProgressCount} đang làm
                </Link>
              ) : null}
            </div>
          ) : null}

          <PartnerScheduleBoard enabled={canOffer} />
        </>
      )}

      {tab === 'incoming' && (
        <div className="min-w-0">
          <PartnerIncomingList
            bookings={filteredOpenBookings}
            sourceTotal={openBookings.length}
            loading={openQuery.isLoading}
            applyingId={acceptMutation.isPending ? (acceptMutation.variables ?? null) : null}
            appliedIds={appliedBookingIds}
            onApply={(id) => acceptMutation.mutate(id)}
            professionTabs={jobsProfessionTabs}
            professionId={jobsProfessionId}
            onProfessionChange={setJobsProfessionId}
            emptyHint={
              jobsProfessionId !== 'all' && openBookings.length > 0
                ? 'Không có đơn mở thuộc nghề đang chọn.'
                : undefined
            }
          />
        </div>
      )}

      {tab === 'jobs' && (
        <div className="min-w-0">
          <PartnerJobsList
            bookings={mineBookings}
            sourceTotal={mineBookings.length}
            loading={mineQuery.isLoading}
            currentUserId={user.id}
            statusPending={statusMutation.isPending}
            statusVariables={statusMutation.variables ?? null}
            statusError={statusMutation.isError ? (statusMutation.error as Error) : null}
            settlementPending={approveSettlementMutation.isPending}
            settlementBookingId={approveSettlementMutation.variables ?? null}
            settlementError={
              approveSettlementMutation.isError
                ? (approveSettlementMutation.error as Error)
                : null
            }
            onStart={(id) => statusMutation.mutate({ id, status: 'IN_PROGRESS' })}
            onComplete={(id) =>
              statusMutation.mutate({ id, status: 'AWAITING_CONFIRM' })
            }
            onApproveSettlement={(id) => approveSettlementMutation.mutate(id)}
          />
        </div>
      )}

      {tab === 'level' && canOffer ? (
        levelQuery.isLoading ? (
          <p className="text-sm text-[var(--color-muted)]">Đang tải cấp độ…</p>
        ) : levelQuery.isError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {(levelQuery.error as Error).message || 'Không tải được cấp độ'}
          </p>
        ) : levelQuery.data ? (
          <PartnerLevelPanel data={levelQuery.data} />
        ) : null
      ) : null}

      {tab === 'profile' && <PartnerProfileTab state={state} user={user} />}
    </div>
  );
}
