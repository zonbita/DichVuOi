import { Link } from 'react-router-dom';
import type { ServiceGroupTree } from '../../types/catalog';
import { groupColor } from '../../utils/catalog-colors';
import { groupIcon } from '../../utils/catalog-display';
import { Icon } from '../ui/icon';

export function MegaPanel({ group }: { group: ServiceGroupTree }) {
  const categories = group.categories ?? [];
  const color = groupColor(group.slug);

  return (
    <div
      className="flex h-full min-h-[420px] flex-col bg-white p-5 shadow-lg"
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
              <p className="mb-2 text-[15px] font-extrabold text-[var(--color-brand-deep)]">
                {category.name}
              </p>
              <ul className="space-y-1.5">
                {category.services.map((service) => (
                  <li key={service.id}>
                    <Link
                      to={`/dich-vu/${service.slug}`}
                      className="group/item block text-[15px] text-[var(--color-ink)]/85 transition hover:text-[var(--color-brand-deep)]"
                    >
                      <span className="leading-snug group-hover/item:underline">{service.name}</span>
                    </Link>
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

export function GroupListItem({
  group,
  active,
  onEnter,
  onClick,
  showChevron = true,
}: {
  group: ServiceGroupTree;
  active: boolean;
  onEnter?: () => void;
  onClick?: () => void;
  showChevron?: boolean;
}) {
  const color = groupColor(group.slug);

  return (
    <Link
      to={`/nhom/${group.slug}`}
      onMouseEnter={onEnter}
      onFocus={onEnter}
      onClick={onClick}
      className="relative flex items-center gap-2.5 px-3 py-2.5 text-[15px] font-semibold transition"
      style={{
        backgroundColor: active ? color.soft : undefined,
        color: active ? color.ink : undefined,
        boxShadow: active ? `inset 3px 0 0 ${color.main}` : undefined,
      }}
    >
      <Icon
        name={groupIcon(group.icon)}
        className="h-[18px] w-[18px] shrink-0"
        style={{ color: color.main }}
      />
      <span className="min-w-0 flex-1 truncate">{group.name}</span>
      {showChevron ? <Icon name="chevronRight" className="h-4 w-4 shrink-0 opacity-70" /> : null}
    </Link>
  );
}

export function CatalogMobileDrawer({
  groups,
  expanded,
  onExpandedChange,
  onClose,
}: {
  groups: ServiceGroupTree[];
  expanded: string | null;
  onExpandedChange: (slug: string | null) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9990]">
      <button
        type="button"
        aria-label="Đóng menu"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 flex w-[min(100%,360px)] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-3.5">
          <p className="text-lg font-extrabold">NHÓM DỊCH VỤ</p>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 text-[15px] font-semibold text-[var(--color-muted)]"
          >
            Đóng
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {groups.map((group) => {
            const isExpanded = expanded === group.slug;
            return (
              <div key={group.id} className="border-b border-[var(--color-line)]">
                <div className="flex items-stretch">
                  <Link
                    to={`/nhom/${group.slug}`}
                    onClick={onClose}
                    className="flex min-w-0 flex-1 items-center gap-2.5 px-4 py-3.5 text-[15px] font-bold"
                  >
                    <Icon
                      name={groupIcon(group.icon)}
                      className="h-5 w-5 shrink-0"
                      style={{ color: groupColor(group.slug).main }}
                    />
                    <span className="truncate">{group.name}</span>
                  </Link>
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? 'Thu gọn' : 'Mở danh mục'}
                    onClick={() => onExpandedChange(isExpanded ? null : group.slug)}
                    className="px-4 text-[var(--color-muted)]"
                  >
                    <Icon
                      name="chevronDown"
                      className={`h-5 w-5 transition ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
                {isExpanded ? (
                  <div className="bg-[var(--color-canvas)] px-4 pb-4">
                    {(group.categories ?? []).map((category) => (
                      <div key={category.id} className="pt-3">
                        <p className="text-sm font-extrabold text-[var(--color-brand-deep)]">
                          {category.name}
                        </p>
                        <ul className="mt-1.5 space-y-1">
                          {category.services.map((service) => (
                            <li key={service.id}>
                              <Link
                                to={`/dich-vu/${service.slug}`}
                                onClick={onClose}
                                className="block py-1.5 text-[15px] text-[var(--color-ink)]/85"
                              >
                                {service.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <Link
                      to={`/nhom/${group.slug}`}
                      onClick={onClose}
                      className="mt-3 inline-block text-sm font-bold text-[var(--color-brand-deep)]"
                    >
                      Xem nhóm ›
                    </Link>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="border-t border-[var(--color-line)] p-3">
          <Link
            to="/nhom"
            onClick={onClose}
            className="flex w-full items-center justify-center bg-[var(--color-brand)] px-4 py-3 text-[15px] font-bold text-white"
          >
            Tất cả danh mục
          </Link>
        </div>
      </div>
    </div>
  );
}
