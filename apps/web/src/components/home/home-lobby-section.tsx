import { Link } from 'react-router-dom';
import type { HomeShoutKind } from '../../types/home-lobby';
import { Icon } from '../ui/icon';
import { LobbyFeed } from './lobby/lobby-feed';
import { LobbySmilePanel } from './lobby/lobby-smile-panel';
import { kindRainbowColor } from './lobby/lobby-utils';
import { LobbyViewerChip } from './lobby/lobby-viewer-chip';
import { useHomeLobby } from './lobby/use-home-lobby';

/** Sảnh hô dịch vụ + smile livestream kiểu TikTok. */
export function HomeLobbySection() {
  const {
    user,
    canOffer,
    kind,
    setKind,
    servicePostId,
    setServicePostId,
    presence,
    feedQuery,
    feedRows,
    kinds,
    approvedPosts,
    lobbyColor,
    shoutMutation,
    reactError,
    smileOpen,
    setSmileOpen,
    smilePanelRef,
    onTapSmile,
  } = useHomeLobby();

  return (
    <section className="page-shell mt-4">
      <div className="section-container">
        <div className="flex h-[500px] flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-[0_8px_24px_rgba(15,39,71,0.06)] lg:grid lg:grid-cols-[minmax(200px,240px)_minmax(0,1fr)]">
          {/* Trái: người đang tham gia + tổng online */}
          <aside className="flex shrink-0 flex-col border-b border-[var(--color-line)] bg-[var(--color-canvas)]/50 lg:h-full lg:shrink lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-line)] px-3 py-2.5 sm:px-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted)]">
                Đang tham gia
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800 ring-1 ring-emerald-200">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                {presence.onlineCount} online
              </span>
            </div>

            {/* Mobile: hàng avatar ngang */}
            <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-3 py-2.5 lg:hidden">
              {presence.viewers.length === 0 ? (
                <p className="text-xs text-[var(--color-muted)]">Chưa có ai trong sảnh</p>
              ) : (
                presence.viewers.map((viewer) => (
                  <LobbyViewerChip key={viewer.key} viewer={viewer} compact />
                ))
              )}
            </div>

            {/* Desktop: danh sách dọc */}
            <ul className="hidden min-h-0 flex-1 space-y-1 overflow-y-auto p-2 lg:block">
              {presence.viewers.length === 0 ? (
                <li className="px-2 py-6 text-center text-xs text-[var(--color-muted)]">
                  Chưa có ai trong sảnh — mở trang này để vào phòng.
                </li>
              ) : (
                presence.viewers.map((viewer) => (
                  <li key={viewer.key}>
                    <LobbyViewerChip viewer={viewer} />
                  </li>
                ))
              )}
            </ul>
          </aside>

          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <LobbyFeed isLoading={feedQuery.isLoading} feedRows={feedRows} />

          <div className="relative z-[2] shrink-0 border-t border-[var(--color-line)] bg-[var(--color-canvas)]/70 px-3 py-3 sm:px-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="min-w-0 flex-1">
                {!user ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-[var(--color-muted)]">
                      Smile thì ai cũng bấm được. Đăng nhập mới hô / quảng cáo dịch vụ.
                    </p>
                    <Link
                      to="/dang-nhap?redirect=/"
                      className="btn-primary inline-flex h-11 items-center gap-1.5 px-3 text-xs sm:text-sm"
                    >
                      Đăng nhập để hô
                      <Icon name="chevronRight" className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : !canOffer ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-[var(--color-muted)]">
                      Cần mở hồ sơ người làm trước khi quảng cáo dịch vụ.
                    </p>
                    <Link
                      to="/doi-tac"
                      className="inline-flex h-11 items-center gap-1.5 rounded-[14px] border border-[var(--color-line)] bg-white px-3 text-xs font-semibold text-[var(--color-ink)] sm:text-sm"
                    >
                      Mở hồ sơ người làm
                    </Link>
                  </div>
                ) : approvedPosts.length === 0 ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-[var(--color-muted)]">
                      Cần ít nhất một bài dịch vụ đã duyệt để hô trên sảnh.
                    </p>
                    <Link
                      to="/doi-tac/dich-vu"
                      className="inline-flex h-11 items-center gap-1.5 rounded-[14px] border border-[var(--color-line)] bg-white px-3 text-xs font-semibold text-[var(--color-ink)] sm:text-sm"
                    >
                      Quản lý bài đăng
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(9.5rem,11rem)_minmax(0,1fr)_auto] sm:items-stretch">
                      <select
                        value={kind}
                        onChange={(e) => setKind(e.target.value as HomeShoutKind)}
                        aria-label="Loại thông báo"
                        className="field-input h-11 w-full text-sm font-semibold"
                        style={{ color: kindRainbowColor(kind) }}
                      >
                        {kinds.map((item) => (
                          <option key={item.kind} value={item.kind}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={servicePostId}
                        onChange={(e) => setServicePostId(e.target.value)}
                        aria-label="Bài dịch vụ"
                        className="field-input h-11 min-w-0 w-full text-sm font-semibold"
                        style={{ color: lobbyColor.ink }}
                      >
                        {approvedPosts.map((post) => (
                          <option key={post.id} value={post.id}>
                            {post.title || post.service.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={
                          shoutMutation.isPending || !servicePostId || !kind
                        }
                        onClick={() => shoutMutation.mutate()}
                        className="btn-primary inline-flex h-11 w-full items-center justify-center px-4 text-sm disabled:opacity-60 sm:w-auto sm:min-w-[8.5rem]"
                      >
                        {shoutMutation.isPending ? 'Đang gửi…' : 'Hô lên sảnh'}
                      </button>
                    </div>
                    {shoutMutation.isError ? (
                      <p className="text-sm text-red-600">
                        {(shoutMutation.error as Error).message ||
                          'Không gửi được thông báo'}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Bấm smile: chat chữ :)) lên sảnh */}
              <LobbySmilePanel
                smilePanelRef={smilePanelRef}
                smileOpen={smileOpen}
                setSmileOpen={setSmileOpen}
                onTapSmile={onTapSmile}
                reactError={reactError}
              />
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
