import type { CSSProperties } from 'react';
import { useId } from 'react';
import { groupIcon } from '../../utils/catalog-display';
import { IconShape } from '../ui/icon';

type Props = {
  slug?: string | null;
  icon?: string | null;
  className?: string;
  style?: CSSProperties;
  active?: boolean;
  /** Màu nhóm khi không active — truyền từ groupColor(slug).main */
  tint?: string;
};

const strokeProps = {
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/**
 * Icon nhóm dịch vụ — minimal soft-3D monogram:
 * giữ nguyên hue (tint), depth bằng gradient + shadow mềm.
 * Không đụng background menu.
 */
export function GroupCatalogIcon({
  slug,
  icon,
  className = 'h-5 w-5 shrink-0',
  style,
  tint,
}: Props) {
  const key = icon ?? slug ?? '';
  const name = groupIcon(key);
  const uid = useId().replace(/:/g, '');
  const gradId = `gci-g-${uid}`;
  const filterId = `gci-f-${uid}`;
  const color = tint ?? 'currentColor';

  return (
    <svg
      viewBox="0 0 24 24"
      className={`catalog-icon-soft3d ${className}`}
      style={{ color, ...style }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="5"
          y1="3"
          x2="19"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="color-mix(in srgb, currentColor 48%, white)" />
          <stop offset="40%" stopColor="currentColor" />
          <stop offset="100%" stopColor="color-mix(in srgb, currentColor 78%, #0a1628)" />
        </linearGradient>
        <filter
          id={filterId}
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
          colorInterpolationFilters="sRGB"
        >
          <feDropShadow
            dx="0"
            dy="1"
            stdDeviation="0.7"
            floodColor="currentColor"
            floodOpacity="0.42"
          />
          <feDropShadow
            dx="0"
            dy="2.2"
            stdDeviation="1.5"
            floodColor="currentColor"
            floodOpacity="0.2"
          />
        </filter>
      </defs>

      <g filter={`url(#${filterId})`}>
        {/* Occlusion underlay — ribbon tuck */}
        <g
          {...strokeProps}
          stroke="currentColor"
          strokeWidth={2.35}
          opacity={0.28}
          transform="translate(0.55 0.9)"
        >
          <IconShape name={name} />
        </g>

        {/* Main soft-3D stroke */}
        <g {...strokeProps} stroke={`url(#${gradId})`} strokeWidth={2.15}>
          <IconShape name={name} />
        </g>

        {/* Top-left rim highlight */}
        <g
          {...strokeProps}
          stroke="color-mix(in srgb, currentColor 40%, white)"
          strokeWidth={1.05}
          opacity={0.5}
          transform="translate(-0.35 -0.45)"
        >
          <IconShape name={name} />
        </g>
      </g>
    </svg>
  );
}
