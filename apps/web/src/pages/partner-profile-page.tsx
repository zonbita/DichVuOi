import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { LevelBadge, VerificationBadge } from '../components/ui/partner-badges';
import { api, formatPrice, formatWorkHours } from '../services/api';
import type { PublicPartnerProfile } from '../types/auth';
import { groupColor } from '../utils/catalog-colors';

type MainTab = 'services' | 'reviews';

function Avatar({ name, src }: { name: string; src?: string | null }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setBroken(true)}
        className="h-24 w-24 rounded-2xl object-cover ring-1 ring-[var(--color-brand)]/20"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[var(--color-brand-soft)] text-2xl font-extrabold text-[var(--color-brand-deep)]">
      {initials || '?'}
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} sao`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={n <= rating ? 'text-[var(--color-brand)]' : 'text-[var(--color-line)]'}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function RatingBreakdown({ reviews }: { reviews: PublicPartnerProfile['reviews'] }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const total = reviews.length || 1;

  return (
    <div className="space-y-1.5">
      {counts.map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2 text-sm">
          <span className="w-8 shrink-0 font-semibold text-[var(--color-muted)]">{star}★</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-line)]">
            <div
              className="h-full rounded-full bg-[var(--color-brand)]"
              style={{ width: `${(count / total) * 100}%` }}
            />
          </div>
          <span className="w-6 text-right text-xs text-[var(--color-muted)]">{count}</span>
        </div>
      ))}
    </div>
  );
}

export function PartnerProfilePage() {
  const { userId = '' } = useParams();
  const [mainTab, setMainTab] = useState<MainTab>('services');
  const [groupFilter, setGroupFilter] = useState<string>('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['partner', 'public', userId],
    queryFn: () => api.getPublicPartner(userId),
    enabled: Boolean(userId),
  });

  const groups = useMemo(() => {
    if (!data) return [] as Array<{ slug: string; name: string }>;
    const map = new Map<string, string>();
    for (const o of data.offerings) {
      const g = o.service.category?.group;
      if (g) map.set(g.slug, g.name);
    }
    return Array.from(map.entries()).map(([slug, name]) => ({ slug, name }));
  }, [data]);

  const filteredOfferings = useMemo(() => {
    if (!data) return [];
    if (groupFilter === 'all') return data.offerings;
    return data.offerings.filter(
      (o) => o.service.category?.group.slug === groupFilter,
    );
  }, [data, groupFilter]);

  if (isLoading) return <p>Đang tải hồ sơ...</p>;
  if (isError || !data) {
    return (
      <div>
        <p className="text-red-600">Không tìm thấy hồ sơ người làm.</p>
        <Link to="/" className="mt-3 inline-block text-[var(--color-brand-deep)]">
          Về trang chủ
        </Link>
      </div>
    );
  }

  const reviews = data.reviews ?? [];

  return (
    <div className="w-full space-y-6">
      <section className="surface-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar name={data.fullName} src={data.avatarUrl} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold sm:text-3xl">{data.fullName}</h1>
              <LevelBadge level={data.level} />
              <VerificationBadge verified={data.isVerified} />
            </div>
            {data.headline ? (
              <p className="mt-1 text-base font-semibold text-[var(--color-brand-deep)]">
                {data.headline}
              </p>
            ) : null}
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
              <StarRow rating={Math.round(data.ratingAvg)} />
              <span>
                {data.ratingAvg.toFixed(1)} ({data.ratingCount} đánh giá) · {data.completedJobs}{' '}
                việc hoàn thành
              </span>
            </p>
            <p className="mt-2 text-sm">
              {data.acceptingJobs ? (
                <span className="font-semibold text-[var(--color-brand-deep)]">Đang nhận việc</span>
              ) : (
                <span className="font-semibold text-amber-700">Tạm nghỉ nhận việc</span>
              )}
              {' · '}
              Phản hồi ~{data.responseMinutes} phút
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {data.city}
              {data.districts.length ? ` · ${data.districts.join(', ')}` : ''}
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Hình thức:{' '}
              {data.workModes.map((m) => (m === 'onsite' ? 'Tại chỗ' : 'Online')).join(' · ')}
            </p>
            {data.skills.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md bg-[var(--color-brand-soft)] px-2 py-0.5 text-xs font-bold text-[var(--color-brand-deep)]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        {data.bio ? (
          <p className="mt-5 text-[15px] leading-relaxed text-[var(--color-muted)]">{data.bio}</p>
        ) : null}
        {data.gallery?.length ? (
          <div className="mt-5">
            <p className="mb-2 text-sm font-bold">Portfolio</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {data.gallery.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden ring-1 ring-[var(--color-line)]"
                >
                  <img
                    src={url}
                    alt="Portfolio"
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          </div>
        ) : null}
        <p className="mt-4 text-xs text-[var(--color-muted)]">
          SĐT / email không công khai. Sau khi thuê, trao đổi qua chat đơn trên Dich Vụ Ơi — không
          liên hệ Zalo/FB ngoài sàn.
        </p>
      </section>

      {/* Tab ngang chính */}
      <div className="sticky top-[4.5rem] z-10 -mx-1 border-b border-[var(--color-line)] bg-[var(--color-canvas)]/95 px-1 backdrop-blur sm:top-[5.25rem]">
        <div className="no-scrollbar flex gap-1 overflow-x-auto py-2">
          <button
            type="button"
            onClick={() => setMainTab('services')}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
              mainTab === 'services'
                ? 'bg-[var(--color-ink)] text-white'
                : 'bg-white text-[var(--color-ink)] ring-1 ring-[var(--color-line)] hover:bg-[var(--color-brand-soft)]'
            }`}
          >
            Ngành nghề đang nhận ({data.offerings.length})
          </button>
          <button
            type="button"
            onClick={() => setMainTab('reviews')}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
              mainTab === 'reviews'
                ? 'bg-[var(--color-ink)] text-white'
                : 'bg-white text-[var(--color-ink)] ring-1 ring-[var(--color-line)] hover:bg-[var(--color-brand-soft)]'
            }`}
          >
            Đánh giá ★ {data.ratingAvg.toFixed(1)} ({reviews.length || data.ratingCount})
          </button>
        </div>
      </div>

      {mainTab === 'services' ? (
        <section>
          <p className="mb-3 text-sm text-[var(--color-muted)]">
            Dịch vụ đang nhận việc — ưu tiên nghề đã có đánh giá trên sàn.
          </p>
          {groups.length > 1 ? (
            <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setGroupFilter('all')}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${
                  groupFilter === 'all'
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'bg-white ring-1 ring-[var(--color-line)]'
                }`}
              >
                Tất cả
              </button>
              {groups.map((g) => {
                const color = groupColor(g.slug);
                const active = groupFilter === g.slug;
                return (
                  <button
                    key={g.slug}
                    type="button"
                    onClick={() => setGroupFilter(g.slug)}
                    className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition"
                    style={
                      active
                        ? { backgroundColor: color.main, color: '#fff' }
                        : { backgroundColor: color.soft, color: color.ink }
                    }
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>
          ) : null}

          {filteredOfferings.length === 0 ? (
            <p className="text-[var(--color-muted)]">
              Partner chưa gắn dịch vụ nào đang nhận việc.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredOfferings.map((item) => {
                const groupSlug = item.service.category?.group.slug;
                const color = groupSlug ? groupColor(groupSlug) : null;
                return (
                  <article key={item.id} className="surface-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {item.service.category ? (
                          <p className="mb-1 text-xs font-semibold" style={{ color: color?.main }}>
                            {item.service.category.group.name}
                            {' · '}
                            {item.service.category.name}
                          </p>
                        ) : null}
                        <Link
                          to={`/dich-vu/${item.service.slug}`}
                          className="text-lg font-bold hover:text-[var(--color-brand-deep)]"
                        >
                          {item.service.name}
                        </Link>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
                          {item.ratingCount > 0 ? (
                            <>
                              <StarRow rating={Math.round(item.ratingAvg)} />
                              <span>
                                {item.ratingAvg.toFixed(1)} ({item.ratingCount} đánh giá)
                              </span>
                            </>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                              Chưa có đánh giá
                            </span>
                          )}
                        </p>
                        {item.headline ? (
                          <p className="mt-0.5 text-sm text-[var(--color-muted)]">{item.headline}</p>
                        ) : null}
                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                          {formatWorkHours(item.hoursWorked)} làm · {item.experienceYears} năm KN
                          {item.coverageNote ? ` · ${item.coverageNote}` : ''}
                        </p>
                        {item.includes ? (
                          <p className="mt-1 text-sm text-[var(--color-muted)]">
                            Bao gồm: {item.includes}
                          </p>
                        ) : null}
                        {item.excludes ? (
                          <p className="text-sm text-[var(--color-muted)]">
                            Không gồm: {item.excludes}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                          Giá chào
                        </p>
                        <p className="text-lg font-extrabold text-[var(--color-sale)]">
                          {formatPrice(item.price)}
                          <span className="text-sm font-semibold text-[var(--color-muted)]">
                            /{item.service.unit}
                          </span>
                        </p>
                        <Link
                          to={`/dich-vu/${item.service.slug}`}
                          className="btn-primary mt-2 inline-block px-3 py-1.5 text-sm"
                        >
                          Thuê
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-5">
          <div className="surface-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="text-center sm:min-w-[7rem]">
              <p className="text-4xl font-extrabold text-[var(--color-brand-deep)]">
                {data.ratingAvg.toFixed(1)}
              </p>
              <StarRow rating={Math.round(data.ratingAvg)} />
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {data.ratingCount} đánh giá
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <RatingBreakdown reviews={reviews} />
            </div>
          </div>

          {reviews.length === 0 ? (
            <p className="text-[var(--color-muted)]">
              Chưa có đánh giá từ khách trên sàn. Điểm ★ có thể từ dữ liệu hồ sơ.
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <article key={r.id} className="surface-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">{r.fromName}</p>
                    <StarRow rating={r.rating} />
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {r.serviceName} · {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                  {r.comment ? (
                    <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-ink)]">
                      {r.comment}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
