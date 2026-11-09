import { Link } from 'react-router-dom';
import type { HomeLobbyViewer } from '../../../types/home-lobby';
import { UserAvatar } from '../../ui/user-avatar';
import { PartnerHoverPreview } from '../partner-hover-preview';

export function LobbyViewerChip({
  viewer,
  compact = false,
}: {
  viewer: HomeLobbyViewer;
  compact?: boolean;
}) {
  const inner = (
    <>
      <span className="relative shrink-0">
        <UserAvatar
          name={viewer.fullName}
          src={viewer.avatarUrl}
          userId={viewer.userId}
          size="sm"
          className="!ring-2 !ring-white shadow-sm"
        />
        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
      </span>
      {compact ? (
        <span className="max-w-[4.5rem] truncate text-[10px] font-semibold text-[var(--color-navy)]">
          {viewer.fullName}
        </span>
      ) : (
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--color-navy)]">
          {viewer.fullName}
          {viewer.isGuest ? (
            <span className="ml-1 text-[10px] font-medium text-[var(--color-muted)]">
              · xem
            </span>
          ) : null}
        </span>
      )}
    </>
  );

  const linked = viewer.userId ? (
    <PartnerHoverPreview
      seed={{
        userId: viewer.userId,
        fullName: viewer.fullName,
        avatarUrl: viewer.avatarUrl,
      }}
      className={compact ? 'w-full' : 'w-full'}
    >
      {compact ? (
        <Link
          to={`/user/${viewer.userId}`}
          className="flex flex-col items-center gap-1"
        >
          {inner}
        </Link>
      ) : (
        <Link
          to={`/user/${viewer.userId}`}
          className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-white"
        >
          {inner}
        </Link>
      )}
    </PartnerHoverPreview>
  ) : (
    inner
  );

  if (compact) {
    return (
      <div className="flex w-[4.75rem] shrink-0 flex-col items-center gap-1">
        {linked}
      </div>
    );
  }

  if (viewer.userId) return linked;

  return (
    <div className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-white">
      {inner}
    </div>
  );
}
