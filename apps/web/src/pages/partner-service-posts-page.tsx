import { Link } from 'react-router-dom';
import { DashboardPageHeader } from '../components/dashboard/dashboard-chrome';
import { Icon } from '../components/ui/icon';
import { ProfessionSelect } from './partner-service-posts/profession-select';
import { ServicePostCard } from './partner-service-posts/service-post-card';
import { ServicePostForm } from './partner-service-posts/service-post-form';
import { usePartnerServicePosts } from './partner-service-posts/use-partner-service-posts';

export function PartnerServicePostsPage() {
  const state = usePartnerServicePosts();
  const {
    user,
    professionId,
    formOpen,
    error,
    postsQuery,
    offeringOptions,
    existingPostForProfession,
    posts,
    onProfessionChange,
    deleteMutation,
    openCreate,
    openEdit,
    primaryActionDisabled,
    primaryActionLabel,
  } = state;

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        icon="pencil"
        title="Dịch vụ của tôi"
        description="Chọn nghề rồi viết / sửa bài. Mỗi nghề chỉ một bài — đã có bài thì chỉ được sửa. Bài hiện công khai sau khi BQT duyệt."
        actions={
          <div className="flex flex-wrap gap-2">
            {user?.id ? (
              <Link
                to={`/user/${user.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-navy)] shadow-[0_4px_16px_rgba(24,49,63,0.05)]"
              >
                <Icon name="eye" className="h-4 w-4" />
                Xem hồ sơ công khai
              </Link>
            ) : null}
            <button
              type="button"
              onClick={openCreate}
              disabled={primaryActionDisabled}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-navy)] px-3 py-2 text-sm font-bold !text-white transition hover:bg-[var(--color-navy-deep)] disabled:opacity-50"
              title={
                professionId === 'all'
                  ? 'Chọn một nghề ở bộ lọc trước'
                  : primaryActionLabel
              }
            >
              <Icon name="pencil" className="h-4 w-4 !text-white" />
              {primaryActionLabel}
            </button>
          </div>
        }
      />

      {offeringOptions.length === 0 ? (
        <div className="glass-card p-5 text-sm text-[var(--glass-muted,#7c8799)] !rounded-2xl">
          Bạn chưa gắn nghề nào trên hồ sơ.{' '}
          <Link
            to="/doi-tac/ho-so"
            className="font-semibold text-[var(--color-brand-deep)]"
          >
            Cập nhật Hồ sơ
          </Link>{' '}
          trước khi đăng bài.
        </div>
      ) : (
        <label className="block w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2.5 text-sm">
          <span className="text-sm font-extrabold tracking-wide text-[var(--color-brand-deep)]">
            Chọn nghề để viết / sửa bài
          </span>
          <ProfessionSelect
            offerings={offeringOptions}
            value={professionId}
            onChange={onProfessionChange}
            includeAll
          />
          {professionId === 'all' ? (
            <p className="mt-1.5 text-xs text-amber-700">
              Chọn một nghề cụ thể để viết bài mới hoặc sửa bài đã có.
            </p>
          ) : existingPostForProfession ? (
            <p className="mt-1.5 text-xs text-[var(--color-muted)]">
              Nghề này đã có bài — chỉ được sửa, không tạo thêm.
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-[var(--color-muted)]">
              Nghề này chưa có bài — bấm «Viết bài mới».
            </p>
          )}
        </label>
      )}

      {formOpen ? <ServicePostForm state={state} /> : null}

      {!formOpen && error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      {postsQuery.isLoading ? (
        <p className="text-sm text-[var(--color-muted)]">Đang tải bài đăng…</p>
      ) : null}

      {!postsQuery.isLoading && posts.length === 0 ? (
        <div className="glass-card border-dashed p-8 text-center text-sm text-[var(--glass-muted,#7c8799)] !rounded-2xl">
          {professionId === 'all'
            ? 'Chọn nghề ở trên để xem / viết bài.'
            : 'Chưa có bài đăng cho nghề này.'}
        </div>
      ) : null}

      <div className="space-y-3">
        {posts.map((post) => (
          <ServicePostCard
            key={post.id}
            post={post}
            onEdit={openEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
}
