import type { CSSProperties } from 'react';
import { groupIcon } from '../../utils/catalog-display';
import { Icon } from '../ui/icon';

type Props = {
  slug?: string | null;
  icon?: string | null;
  className?: string;
  style?: CSSProperties;
  active?: boolean;
  /** Màu nhóm khi không active — truyền từ groupColor(slug).main */
  tint?: string;
};

/** Icon nhóm dịch vụ — hiện dùng SVG line; có thể thay bằng asset PNG sau. */
export function GroupCatalogIcon({
  slug,
  icon,
  className = 'h-5 w-5 shrink-0',
  style,
  tint,
}: Props) {
  const key = icon ?? slug ?? '';

  return (
    <Icon
      name={groupIcon(key)}
      className={className}
      style={tint ? { color: tint, ...style } : style}
    />
  );
}
