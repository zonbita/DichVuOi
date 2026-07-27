import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/auth-context';
import { api } from '../../services/api';
import { Icon } from '../ui/icon';

type Props = {
  partnerUserId: string;
  className?: string;
  showLabel?: boolean;
};

export function FavoritePartnerButton({
  partnerUserId,
  className = '',
  showLabel = true,
}: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const idsQuery = useQuery({
    queryKey: ['partner-favorites', 'ids'],
    queryFn: api.getFavoritePartnerIds,
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  const saved = (idsQuery.data ?? []).includes(partnerUserId);

  const toggleMutation = useMutation({
    mutationFn: () =>
      saved
        ? api.removeFavoritePartner(partnerUserId)
        : api.addFavoritePartner(partnerUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-favorites'] });
    },
  });

  if (!user) {
    return (
      <Link
        to="/dang-nhap"
        className={`inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-brand-deep)] ${className}`}
      >
        <Icon name="heart" className="h-4 w-4" />
        {showLabel ? 'Đăng nhập để lưu' : null}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggleMutation.mutate()}
      disabled={toggleMutation.isPending}
      aria-pressed={saved}
      aria-label={saved ? 'Bỏ lưu người làm' : 'Lưu người làm quen'}
      className={`inline-flex items-center gap-1.5 text-sm font-semibold transition disabled:opacity-50 ${
        saved
          ? 'text-[var(--color-brand-deep)]'
          : 'text-[var(--color-muted)] hover:text-[var(--color-brand-deep)]'
      } ${className}`}
    >
      <Icon
        name="heart"
        className={`h-4 w-4 ${saved ? 'fill-current' : ''}`}
      />
      {showLabel ? (saved ? 'Đã lưu' : 'Lưu người làm') : null}
    </button>
  );
}
