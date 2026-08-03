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
}: {
  group: ServiceGroupTree;
  onServiceSelect?: (pick: CatalogServicePick) => void;
  selectedServiceSlug?: string | null;
}) {
  const categories = group.categories ?? [];
  const color = groupColor(group.slug);

  return (
    <div
      className="flex h-full min-h-[420px] flex-col bg-white p-5 text-[var(--color-ink)] shadow-lg"
      style={{ borderTop: `3px solid ${color.main}` }}
    >
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-[var(--color-line)] pb-3">
        <div>
          <p className="text-lg font-extrabold" style={{ color: color.ink }}>
            {group.name}
          </p>
          {group.description ? (
            <p className="mt-1 text-sm text-[var(--color-muted)]">{group.description}</p>
          ) : null}
        </div>
        <Link
          to={`/nhom/${group.slug}`}
          className="shrink-0 text-[15px] font-bold text-[var(--color-brand-deep)] hover:underline"
        >
          Xem tất cả ›
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className="text-[15px] text-[var(--color-muted)]">Đang cập nhật danh mục...</p>
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
                        className={`group/item block w-full text-left text-[15px] transition hover:text-[var(--color-brand-deep)] ${
                          selectedServiceSlug === service.slug
                            ? 'font-semibold text-[var(--color-brand-deep)]'
                            : 'text-[var(--color-ink)]/85'
                        }`}
                      >
                        <span className="leading-snug group-hover/item:underline">{service.name}</span>
                      </button>
                    ) : (
                      <Link
                        to={`/dich-vu/${service.slug}`}
                        className="group/item block text-[15px] text-[var(--color-ink)]/85 transition hover:text-[var(--color-brand-deep)]"
                      >
                        <span className="leading-snug group-hover/item:underline">{service.name}</span>
                      </Link>
                    )}
                  </li>
                ))}
                {category.services.length === 0 ? (
                  <li className="text-sm text-[var(--color-muted)]">Sắp ra mắt</li>
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
  /** dark = sidebar menu nhóm (mặc định, khớp UI hình). */
  tone?: 'dark' | 'light';
  showSeparator?: boolean;
}) {
  const color = groupColor(group.slug);
  const isDark = tone === 'dark';

  return (
    <Link
      to={`/nhom/${group.slug}`}
      onMouseEnter={(event) => onEnter?.(event.currentTarget)}
      onFocus={(event) => onEnter?.(event.currentTarget)}
      onClick={onClick}
      className={`relative mx-2.5 flex min-h-[48px] items-center gap-3.5 rounded-[14px] px-3.5 text-[15px] font-semibold outline-none ${itemTransition} focus-visible:ring-2 focus-visible:ring-[#22d3ee]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061a30] ${
        isDark
          ? active
            ? 'catalog-menu-item-active text-white'
            : 'border border-transparent text-white/90 hover:bg-[rgba(56,189,248,0.1)] hover:text-white'
          : active
            ? 'font-semibold'
            : 'text-[var(--color-muted)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]'
      } ${showSeparator && !active ? 'after:absolute after:right-3 after:bottom-0 after:left-3 after:h-px after:bg-[rgba(148,163,184,0.12)]' : ''}`}
      style={
        isDark
          ? undefined
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
}: {
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      to="/nhom"
      onClick={onClick}
      className={`relative mx-2.5 flex min-h-[48px] items-center gap-3.5 rounded-[14px] border border-transparent px-3.5 text-[15px] font-semibold text-white/90 outline-none ${itemTransition} hover:bg-[rgba(56,189,248,0.1)] hover:text-white focus-visible:ring-2 focus-visible:ring-[#22d3ee]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#061a30] ${className}`}
    >
      <Icon
        name="grid"
        className="h-6 w-6 shrink-0"
        style={{ color: 'rgba(148, 163, 184, 0.9)' }}
      />
      <span className="min-w-0 flex-1 truncate leading-snug">
        Xem tất cả danh mục
      </span>
      <Icon
        name="chevronRight"
        className="h-4 w-4 shrink-0"
        style={{ color: 'rgba(148, 163, 184, 0.7)' }}
      />
    </Link>
  );
}

export function CatalogMenuHeader({
  onClose,
  size = 'lg',
}: {
  onClose?: () => void;
  size?: 'sm' | 'lg';
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-between border-b ${
        size === 'lg' ? 'px-5 py-4' : 'px-4 py-3.5'
      }`}
      style={{ borderColor: CATALOG_MENU_DARK.border }}
    >
      <p
        className={`flex items-center gap-3 font-bold tracking-[0.04em] text-white uppercase ${
          size === 'lg' ? 'text-[18px]' : 'text-[16px]'
        }`}
      >
        <Icon name="menu" className="h-5 w-5 shrink-0 text-white" />
        NHÓM DỊCH VỤ
      </p>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-[14px] font-semibold text-white/55 outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-[#22d3ee]/60"
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
  return (
    <div className="fixed inset-0 z-[9990]">
      <button
        type="button"
        aria-label="Đóng menu"
        className="absolute inset-0 bg-black/50 transition-opacity duration-200"
        onClick={onClose}
      />
      <div
        className={`absolute inset-y-0 left-0 flex w-[min(100%,360px)] flex-col overflow-hidden shadow-2xl ${CATALOG_MENU_DARK.surfaceClass}`}
      >
        <CatalogMenuHeader onClose={onClose} size="sm" />
        <div className="flex-1 overflow-y-auto py-2">
          {groups.map((group, index) => {
            const isExpanded = expanded === group.slug;
            const color = groupColor(group.slug);
            return (
              <div key={group.id}>
                <div className="flex items-stretch">
                  {pickerMode ? (
                    <button
                      type="button"
                      onClick={() => onExpandedChange(isExpanded ? null : group.slug)}
                      className={`relative mx-2.5 flex min-h-[48px] min-w-0 flex-1 items-center gap-3.5 rounded-[14px] px-3.5 text-left text-[15px] font-semibold text-white/90 outline-none ${itemTransition} hover:bg-[rgba(56,189,248,0.1)] focus-visible:ring-2 focus-visible:ring-[#22d3ee]/60`}
                    >
                      <GroupCatalogIcon
                        slug={group.slug}
                        icon={group.icon}
                        className="h-6 w-6 shrink-0"
                        tint={color.main}
                      />
                      <span className="truncate">{group.name}</span>
                    </button>
                  ) : (
                    <Link
                      to={`/nhom/${group.slug}`}
                      onClick={onClose}
                      className={`relative mx-2.5 flex min-h-[48px] min-w-0 flex-1 items-center gap-3.5 rounded-[14px] px-3.5 text-[15px] font-semibold text-white/90 outline-none ${itemTransition} hover:bg-[rgba(56,189,248,0.1)] focus-visible:ring-2 focus-visible:ring-[#22d3ee]/60`}
                    >
                      <GroupCatalogIcon
                        slug={group.slug}
                        icon={group.icon}
                        className="h-6 w-6 shrink-0"
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
                    className="px-3 text-[rgba(148,163,184,0.75)] outline-none focus-visible:text-white"
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
                    style={{ backgroundColor: CATALOG_MENU_DARK.separator }}
                  />
                ) : null}
                {isExpanded ? (
                  <div
                    className="mx-2.5 mb-1 rounded-[14px] px-3.5 py-2"
                    style={{ backgroundColor: CATALOG_MENU_DARK.active }}
                  >
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
                                  className={`block w-full py-1.5 text-left text-[14px] ${
                                    selectedServiceSlug === service.slug
                                      ? 'font-semibold text-white'
                                      : 'text-white/70 hover:text-white'
                                  }`}
                                >
                                  {service.name}
                                </button>
                              ) : (
                                <Link
                                  to={`/dich-vu/${service.slug}`}
                                  onClick={onClose}
                                  className="block py-1.5 text-[14px] text-white/70 hover:text-white"
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
                        className="mt-2 inline-block text-sm font-semibold text-white/80 hover:text-white"
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
            className="shrink-0 border-t py-2"
            style={{
              borderColor: CATALOG_MENU_DARK.border,
              background:
                'linear-gradient(180deg, rgba(6,26,48,0.35) 0%, rgba(4,18,34,0.85) 100%)',
            }}
          >
            <CatalogAllCategoriesLink onClick={onClose} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
