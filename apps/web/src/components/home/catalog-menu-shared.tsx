import { Link } from 'react-router-dom';
import type { ServiceGroupTree } from '../../types/catalog';
import { GroupCatalogIcon } from '../catalog/group-catalog-icon';
import { CATALOG_MENU_DARK, groupColor } from '../../utils/catalog-colors';
import { Icon } from '../ui/icon';

export type CatalogServicePick = {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  groupSlug: string;
  groupName: string;
};

export function MegaPanel({
  group,
  onServiceSelect,
  selectedServiceSlug,
  fitContent = false,
  glass = false,
}: {
  group: ServiceGroupTree;
  onServiceSelect?: (pick: CatalogServicePick) => void;
  selectedServiceSlug?: string | null;
  /** Header mega-menu: không ép min-height, cao theo danh sách nhóm. */
  fitContent?: boolean;
  /** Nền glass-page / frosted thay vì trắng đặc. */
  glass?: boolean;
}) {
  const categories = group.categories ?? [];
  const color = groupColor(group.slug);

  return (
    <div
      className={`flex h-full flex-col p-5 ${
        glass
          ? 'mega-menu-panel text-[var(--glass-ink,#172033)]'
          : 'bg-white text-[var(--color-ink)] shadow-lg'
      } ${fitContent ? 'min-h-0' : 'min-h-[420px]'}`}
      style={{ borderTop: `3px solid ${color.main}` }}
    >
      <div
        className={`mb-4 flex items-start justify-between gap-3 border-b pb-3 ${
          glass ? 'border-[var(--glass-line,rgba(23,32,51,0.08))]' : 'border-[var(--color-line)]'
        }`}
      >
        <div>
          <p className="text-lg font-extrabold" style={{ color: color.ink }}>
            {group.name}
          </p>
          {group.description ? (
            <p
              className={`mt-1 text-sm ${
                glass ? 'text-[var(--glass-muted,#7c8799)]' : 'text-[var(--color-muted)]'
              }`}
            >
              {group.description}
            </p>
          ) : null}
        </div>
        <Link
          to={`/nhom/${group.slug}`}
          className={`shrink-0 text-[15px] font-bold hover:underline ${
            glass ? 'text-[var(--glass-accent,#4977e8)]' : 'text-[var(--color-brand-deep)]'
          }`}
        >
          Xem tất cả ›
        </Link>
      </div>

      {categories.length === 0 ? (
        <p
          className={`text-[15px] ${
            glass ? 'text-[var(--glass-muted,#7c8799)]' : 'text-[var(--color-muted)]'
          }`}
        >
          Đang cập nhật danh mục...
        </p>
      ) : (
        <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-5 xl:grid-cols-3">
          {categories.map((category) => (
            <div key={category.id}>
              <p className="mb-2 text-[15px] font-extrabold" style={{ color: color.ink }}>
                {category.name}
              </p>
              <ul className="space-y-1.5">
                {category.services.map((service) => (
                  <li key={service.id}>
                    {onServiceSelect ? (
                      <button
                        type="button"
                        onClick={() =>
                          onServiceSelect({
                            id: service.id,
                            slug: service.slug,
                            name: service.name,
                            categoryName: category.name,
                            groupSlug: group.slug,
                            groupName: group.name,
                          })
                        }
                        className={`group/item block w-full text-left text-[15px] transition ${
                          glass
                            ? selectedServiceSlug === service.slug
                              ? 'font-semibold text-[var(--glass-accent,#4977e8)]'
                              : 'text-[var(--glass-ink,#172033)]/85 hover:text-[var(--glass-accent,#4977e8)]'
                            : selectedServiceSlug === service.slug
                              ? 'font-semibold text-[var(--color-brand-deep)]'
                              : 'text-[var(--color-ink)]/85 hover:text-[var(--color-brand-deep)]'
                        }`}
                      >
                        <span className="leading-snug group-hover/item:underline">{service.name}</span>
                      </button>
                    ) : (
                      <Link
                        to={`/dich-vu/${service.slug}`}
                        className={`group/item block text-[15px] transition ${
                          glass
                            ? 'text-[var(--glass-ink,#172033)]/85 hover:text-[var(--glass-accent,#4977e8)]'
                            : 'text-[var(--color-ink)]/85 hover:text-[var(--color-brand-deep)]'
                        }`}
                      >
                        <span className="leading-snug group-hover/item:underline">{service.name}</span>
                      </Link>
                    )}
                  </li>
                ))}
                {category.services.length === 0 ? (
                  <li
                    className={`text-sm ${
                      glass ? 'text-[var(--glass-muted,#7c8799)]' : 'text-[var(--color-muted)]'
                    }`}
                  >
                    Sắp ra mắt
                  </li>
                ) : null}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const itemTransition =
  'transition-[background,color,border-color,box-shadow,transform] duration-200 ease-out';

export function GroupListItem({
  group,
  active,
  onEnter,
  onClick,
  showChevron = true,
  tone = 'dark',
  showSeparator = false,
}: {
  group: ServiceGroupTree;
  active: boolean;
  onEnter?: (anchor: HTMLElement) => void;
  onClick?: () => void;
  showChevron?: boolean;
  /** dark = sidebar navy; light = nền sáng; glass = mega-menu glass-page. */
  tone?: 'dark' | 'light' | 'glass';
  showSeparator?: boolean;
}) {
  const color = groupColor(group.slug);
  const isDark = tone === 'dark';
  const isGlass = tone === 'glass';

  return (
    <Link
      to={`/nhom/${group.slug}`}
      onMouseEnter={(event) => onEnter?.(event.currentTarget)}
      onFocus={(event) => onEnter?.(event.currentTarget)}
      onClick={onClick}
      className={`relative mx-2.5 flex min-h-[48px] items-center gap-3.5 rounded-[14px] px-3.5 text-[15px] font-semibold outline-none ${itemTransition} ${
        isDark
          ? `focus-visible:ring-2 focus-visible:ring-[#22d3ee]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061a30] ${
              active
                ? 'catalog-menu-item-active text-white'
                : 'border border-transparent text-white/90 hover:bg-[rgba(56,189,248,0.1)] hover:text-white'
            }`
          : isGlass
            ? `focus-visible:ring-2 focus-visible:ring-[var(--glass-accent,#4977e8)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                active
                  ? 'mega-menu-item-active font-semibold'
                  : 'border border-transparent text-[var(--glass-muted,#7c8799)] hover:bg-white/50 hover:text-[var(--glass-ink,#172033)]'
              }`
            : `focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/40 focus-visible:ring-offset-2 ${
                active
                  ? 'font-semibold'
                  : 'text-[var(--color-muted)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]'
              }`
      } ${
        showSeparator && !active
          ? isGlass
            ? 'after:absolute after:right-3 after:bottom-0 after:left-3 after:h-px after:bg-[rgba(23,32,51,0.06)]'
            : 'after:absolute after:right-3 after:bottom-0 after:left-3 after:h-px after:bg-[rgba(148,163,184,0.12)]'
          : ''
      }`}
      style={
        isDark
          ? undefined
          : isGlass
            ? active
              ? { color: color.ink }
              : undefined
            : active
              ? { backgroundColor: color.soft, color: color.ink }
              : { color: 'var(--color-muted)' }
      }
    >
      {active ? (
        <span
          aria-hidden
          className="absolute top-1/2 left-0 h-8 w-1 -translate-y-1/2 rounded-r-full"
          style={{
            backgroundColor: isDark ? CATALOG_MENU_DARK.indicator : color.main,
          }}
        />
      ) : null}
      <GroupCatalogIcon
        slug={group.slug}
        icon={group.icon}
        className="h-6 w-6 shrink-0"
        active={active}
        tint={
          isDark
            ? active
              ? '#e0f2fe'
              : color.main
            : color.main
        }
      />
      <span
        className="min-w-0 flex-1 truncate leading-snug"
        style={
          isDark
            ? { color: active ? '#fff' : 'rgba(255,255,255,0.92)' }
            : isGlass
              ? { color: active ? color.ink : 'var(--glass-ink, #172033)' }
              : { color: active ? color.ink : undefined }
        }
      >
        {group.name}
      </span>
      {showChevron ? (
        <Icon
          name="chevronRight"
          className="h-4 w-4 shrink-0"
          style={{
            color: isDark
              ? 'rgba(148, 163, 184, 0.7)'
              : active
                ? color.main
                : isGlass
                  ? 'var(--glass-muted, #7c8799)'
                  : 'var(--color-muted)',
            opacity: active || isDark ? 1 : 0.55,
          }}
        />
      ) : null}
    </Link>
  );
}

export function CatalogAllCategoriesLink({
  onClick,
  className = '',
  tone = 'dark',
}: {
  onClick?: () => void;
  className?: string;
  tone?: 'dark' | 'glass';
}) {
  const isGlass = tone === 'glass';

  return (
    <Link
      to="/nhom"
      onClick={onClick}
      className={`relative mx-2.5 flex min-h-[48px] items-center gap-3.5 rounded-[14px] border border-transparent px-3.5 text-[15px] font-semibold outline-none ${itemTransition} ${
        isGlass
          ? 'text-[var(--glass-ink,#172033)] hover:bg-white/55 focus-visible:ring-2 focus-visible:ring-[var(--glass-accent,#4977e8)]/40'
          : 'text-white/90 hover:bg-[rgba(56,189,248,0.1)] hover:text-white focus-visible:ring-2 focus-visible:ring-[#22d3ee]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061a30]'
      } ${className}`}
    >
      <Icon
        name="grid"
        className="h-6 w-6 shrink-0"
        style={{
          color: isGlass ? 'var(--glass-accent, #4977e8)' : 'rgba(148, 163, 184, 0.9)',
        }}
      />
      <span className="min-w-0 flex-1 truncate leading-snug">
        Xem tất cả danh mục
      </span>
      <Icon
        name="chevronRight"
        className="h-4 w-4 shrink-0"
        style={{
          color: isGlass ? 'var(--glass-muted, #7c8799)' : 'rgba(148, 163, 184, 0.7)',
        }}
      />
    </Link>
  );
}

export function CatalogMenuHeader({
  onClose,
  size = 'lg',
  tone = 'dark',
}: {
  onClose?: () => void;
  size?: 'sm' | 'lg';
  tone?: 'dark' | 'glass';
}) {
  const isGlass = tone === 'glass';

  return (
    <div
      className={`flex shrink-0 items-center justify-between border-b ${
        size === 'lg' ? 'px-5 py-4' : 'px-4 py-3.5'
      }`}
      style={{
        borderColor: isGlass
          ? 'var(--glass-line, rgba(23, 32, 51, 0.08))'
          : CATALOG_MENU_DARK.border,
      }}
    >
      <p
        className={`flex items-center gap-3 font-bold tracking-[0.04em] uppercase ${
          size === 'lg' ? 'text-[18px]' : 'text-[16px]'
        } ${isGlass ? 'text-[var(--glass-ink,#172033)]' : 'text-white'}`}
      >
        <Icon
          name="menu"
          className={`h-5 w-5 shrink-0 ${
            isGlass ? 'text-[var(--glass-accent,#4977e8)]' : 'text-white'
          }`}
        />
        NHÓM DỊCH VỤ
      </p>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className={`rounded-lg px-2 py-1 text-[14px] font-semibold outline-none transition focus-visible:ring-2 ${
            isGlass
              ? 'text-[var(--glass-muted,#7c8799)] hover:text-[var(--glass-ink,#172033)] focus-visible:ring-[var(--glass-accent,#4977e8)]/40'
              : 'text-white/55 hover:text-white focus-visible:ring-[#22d3ee]/60'
          }`}
        >
          Đóng
        </button>
      ) : null}
    </div>
  );
}

export function CatalogMobileDrawer({
  groups,
  expanded,
  onExpandedChange,
  onClose,
  pickerMode = false,
  onServiceSelect,
  selectedServiceSlug,
}: {
  groups: ServiceGroupTree[];
  expanded: string | null;
  onExpandedChange: (slug: string | null) => void;
  onClose: () => void;
  pickerMode?: boolean;
  onServiceSelect?: (pick: CatalogServicePick) => void;
  selectedServiceSlug?: string | null;
}) {
  /** Cùng soft-3D glass với mega-menu desktop (navbar «NHÓM DỊCH VỤ»). */
  return (
    <div className="fixed inset-0 z-[9990]">
      <button
        type="button"
        aria-label="Đóng menu"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={onClose}
      />
      <div className="mega-menu-shell absolute inset-y-0 left-0 flex w-[min(100%,360px)] flex-col overflow-hidden !rounded-none !rounded-r-[22px] border-l-0 shadow-[12px_0_40px_rgba(5,45,71,0.18)]">
        <CatalogMenuHeader onClose={onClose} size="sm" tone="glass" />
        <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain py-2">
          {groups.map((group, index) => {
            const isExpanded = expanded === group.slug;
            const color = groupColor(group.slug);
            const rowClass = `relative mx-2.5 flex min-h-[48px] min-w-0 flex-1 items-center gap-3.5 rounded-[14px] px-3.5 text-[15px] font-semibold outline-none ${itemTransition} focus-visible:ring-2 focus-visible:ring-[var(--glass-accent,#4977e8)]/40 ${
              isExpanded
                ? 'mega-menu-item-active'
                : 'border border-transparent text-[var(--glass-ink,#172033)] hover:bg-white/50'
            }`;
            return (
              <div key={group.id}>
                <div className="flex items-stretch">
                  {pickerMode ? (
                    <button
                      type="button"
                      onClick={() => onExpandedChange(isExpanded ? null : group.slug)}
                      className={`${rowClass} text-left`}
                      style={isExpanded ? { color: color.ink } : undefined}
                    >
                      <GroupCatalogIcon
                        slug={group.slug}
                        icon={group.icon}
                        className="h-6 w-6 shrink-0"
                        active={isExpanded}
                        tint={color.main}
                      />
                      <span className="truncate">{group.name}</span>
                    </button>
                  ) : (
                    <Link
                      to={`/nhom/${group.slug}`}
                      onClick={onClose}
                      className={rowClass}
                      style={isExpanded ? { color: color.ink } : undefined}
                    >
                      <GroupCatalogIcon
                        slug={group.slug}
                        icon={group.icon}
                        className="h-6 w-6 shrink-0"
                        active={isExpanded}
                        tint={color.main}
                      />
                      <span className="truncate">{group.name}</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? 'Thu gọn' : 'Mở danh mục'}
                    onClick={() => onExpandedChange(isExpanded ? null : group.slug)}
                    className="px-3 text-[var(--glass-muted,#7c8799)] outline-none transition hover:text-[var(--glass-ink,#172033)] focus-visible:text-[var(--glass-ink,#172033)]"
                  >
                    <Icon
                      name="chevronRight"
                      className={`h-4 w-4 transition duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </button>
                </div>
                {index < groups.length - 1 && !isExpanded ? (
                  <div
                    className="mx-6 h-px"
                    style={{ backgroundColor: 'var(--glass-line, rgba(23, 32, 51, 0.08))' }}
                  />
                ) : null}
                {isExpanded ? (
                  <div className="mx-2.5 mb-1 rounded-[14px] border border-white/70 bg-white/55 px-3.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                    {(group.categories ?? []).map((category) => (
                      <div key={category.id} className="pt-2 first:pt-1">
                        <p className="text-sm font-bold" style={{ color: color.main }}>
                          {category.name}
                        </p>
                        <ul className="mt-1 space-y-0.5">
                          {category.services.map((service) => (
                            <li key={service.id}>
                              {pickerMode && onServiceSelect ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onServiceSelect({
                                      id: service.id,
                                      slug: service.slug,
                                      name: service.name,
                                      categoryName: category.name,
                                      groupSlug: group.slug,
                                      groupName: group.name,
                                    });
                                    onClose();
                                  }}
                                  className={`block w-full py-1.5 text-left text-[14px] transition ${
                                    selectedServiceSlug === service.slug
                                      ? 'font-semibold text-[var(--glass-accent,#4977e8)]'
                                      : 'text-[var(--glass-ink,#172033)]/85 hover:text-[var(--glass-accent,#4977e8)]'
                                  }`}
                                >
                                  {service.name}
                                </button>
                              ) : (
                                <Link
                                  to={`/dich-vu/${service.slug}`}
                                  onClick={onClose}
                                  className="block py-1.5 text-[14px] text-[var(--glass-ink,#172033)]/85 transition hover:text-[var(--glass-accent,#4977e8)]"
                                >
                                  {service.name}
                                </Link>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {!pickerMode ? (
                      <Link
                        to={`/nhom/${group.slug}`}
                        onClick={onClose}
                        className="mt-2 inline-block text-sm font-semibold text-[var(--glass-accent,#4977e8)] hover:opacity-90"
                      >
                        Xem nhóm ›
                      </Link>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        {!pickerMode ? (
          <div
            className="relative z-10 shrink-0 border-t py-2"
            style={{ borderColor: 'var(--glass-line, rgba(23, 32, 51, 0.08))' }}
          >
            <CatalogAllCategoriesLink onClick={onClose} tone="glass" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
