import { Link } from 'react-router-dom';
import { UserAvatar } from '../../ui/user-avatar';
import { PartnerHoverPreview } from '../partner-hover-preview';
import { ShoutMessage } from './shout-message';
import type { LobbyFeedRow } from './use-home-lobby';

export function LobbyFeed({
  isLoading,
  feedRows,
}: {
  isLoading: boolean;
  feedRows: LobbyFeedRow[];
}) {
  return (
      <div className="relative z-[1] min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-2.5 sm:px-3.5">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">
            Đang tải sảnh…
          </p>
        ) : feedRows.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">
            Chưa có ai chat — bấm smile để gửi :)) lên sảnh.
          </p>
        ) : (
          feedRows.map((row) =>
            row.type === 'smile' ? (
              <div
                key={row.id}
                className="flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1"
              >
                {row.chat.userId ? (
                  <PartnerHoverPreview
                    seed={{
                      userId: row.chat.userId,
                      fullName: row.chat.fromName,
                    }}
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <Link
                        to={`/user/${row.chat.userId}`}
                        className="shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <UserAvatar
                          name={row.chat.fromName}
                          userId={row.chat.userId}
                          size="sm"
                          className="!h-7 !w-7 shrink-0 !ring-1 !ring-[var(--color-line)]"
                        />
                      </Link>
                      <Link
                        to={`/user/${row.chat.userId}`}
                        className="truncate font-extrabold text-[var(--color-navy)] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {row.chat.fromName}
                      </Link>
                    </span>
                  </PartnerHoverPreview>
                ) : (
                  <>
                    <UserAvatar
                      name={row.chat.fromName}
                      size="sm"
                      className="!h-7 !w-7 shrink-0 !ring-1 !ring-[var(--color-line)]"
                    />
                    <span className="truncate font-extrabold text-[var(--color-navy)]">
                      {row.chat.fromName}
                    </span>
                  </>
                )}
                <p className="min-w-0 flex-1 truncate text-sm leading-snug text-[var(--color-ink)]">
                  <span className="mx-1 font-semibold text-[var(--color-muted)]">
                    :
                  </span>
                  <span className="font-semibold tracking-wide">
                    {row.chat.text}
                  </span>
                </p>
              </div>
            ) : (
              <div
                key={row.id}
                className="flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-[var(--color-canvas)]/80"
              >
                <PartnerHoverPreview
                  seed={{
                    userId: row.shout.user.id,
                    fullName: row.shout.user.fullName,
                    avatarUrl: row.shout.user.avatarUrl,
                    level: row.shout.user.level,
                    acceptingJobs: row.shout.user.acceptingJobs,
                  }}
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <Link
                      to={
                        row.shout.servicePost.profileHref ||
                        `/user/${row.shout.user.id}`
                      }
                      className="shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <UserAvatar
                        name={row.shout.user.fullName}
                        src={row.shout.user.avatarUrl}
                        userId={row.shout.user.id}
                        size="sm"
                        className="!h-7 !w-7 shrink-0 !ring-1 !ring-[var(--color-line)]"
                      />
                    </Link>
                    <Link
                      to={
                        row.shout.servicePost.profileHref ||
                        `/user/${row.shout.user.id}`
                      }
                      className="truncate font-extrabold text-[var(--color-navy)] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.shout.user.fullName}
                    </Link>
                  </span>
                </PartnerHoverPreview>
                <Link
                  to={row.shout.servicePost.href}
                  className="min-w-0 flex-1 truncate text-sm leading-snug text-[var(--color-ink)]"
                  title={row.shout.message}
                >
                  <span className="mx-1 font-semibold text-[var(--color-muted)]">
                    :
                  </span>
                  <ShoutMessage
                    message={row.shout.message}
                    groupSlug={row.shout.servicePost.groupSlug}
                    kind={row.shout.kind}
                  />
                </Link>
              </div>
            ),
          )
        )}
      </div>
  );
}
