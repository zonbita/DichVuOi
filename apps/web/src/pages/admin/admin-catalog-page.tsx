import { zodResolver } from '@hookform/resolvers/zod';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { api, formatPrice, formatPriceNumber } from '../../services/api';
import type { AdminService } from '../../types/admin';
import { formatMarketPriceRange } from '../../utils/market-price';
import {
  Badge,
  EmptyState,
  FilterBar,
  PageHeader,
  Pagination,
  Panel,
  SearchInput,
  SelectFilter,
} from './admin-ui';
import {
  useAdminViewportPageSize,
  useFilterParams,
  useSearchFilter,
} from './admin-utils';

const schema = z.object({
  name: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
  slug: z.string().optional(),
  categoryId: z.string().min(1, 'Chọn danh mục'),
  basePrice: z.coerce.number().int().min(0, 'Giá đơn không hợp lệ'),
  priceMin: z.coerce.number().int().min(0, 'Giá min không hợp lệ'),
  priceMax: z.coerce.number().int().min(0, 'Giá max không hợp lệ'),
  unit: z.string().min(1, 'Nhập đơn vị'),
  supportsOnline: z.boolean(),
  durationMin: z.coerce.number().int().min(5, 'Tối thiểu 5 phút'),
  description: z.string().optional(),
  isActive: z.boolean(),
});

/** `z.coerce` khiến giá trị gõ vào form (input) khác giá trị đã parse (output). */
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

const emptyValues: FormInput = {
  name: '',
  slug: '',
  categoryId: '',
  basePrice: 0,
  priceMin: 0,
  priceMax: 0,
  unit: 'giờ',
  supportsOnline: false,
  durationMin: 60,
  description: '',
  isActive: true,
};

const ACTIVE_OPTIONS = [
  { value: 'true', label: 'Đang bật' },
  { value: 'false', label: 'Đang tắt' },
];

export function AdminCatalogPage() {
  const { get, page, setParam, setPage } = useFilterParams();
  const [search, setSearch] = useSearchFilter(get, setParam);
  const [editing, setEditing] = useState<AdminService | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const queryClient = useQueryClient();
  const pageSize = useAdminViewportPageSize({ rowPx: 64, chromePx: 360 });

  const q = get('q');
  const groupId = get('groupId');
  const isActive = get('isActive');

  const catalogQuery = useQuery({
    queryKey: ['admin', 'catalog'],
    queryFn: api.adminCatalog,
  });
  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: api.adminCategories,
  });
  const servicesQuery = useQuery({
    queryKey: ['admin', 'services', { q, groupId, isActive, page, pageSize }],
    queryFn: () =>
      api.adminServices({
        q,
        page,
        pageSize,
        groupId: groupId || undefined,
        isActive: isActive === '' ? undefined : isActive === 'true',
      }),
    placeholderData: keepPreviousData,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!formOpen) return;
    reset(
      editing
        ? {
            name: editing.name,
            slug: editing.slug,
            categoryId: editing.category.id,
            basePrice: editing.basePrice,
            priceMin: editing.priceMin,
            priceMax: editing.priceMax,
            unit: editing.unit,
            supportsOnline: editing.supportsOnline,
            durationMin: editing.durationMin,
            description: editing.description ?? '',
            isActive: editing.isActive,
          }
        : emptyValues,
    );
  }, [editing, formOpen, reset]);

  function invalidateCatalog() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'catalog'] });
    // Menu / trang chủ đọc cùng catalog nên phải làm mới luôn.
    queryClient.invalidateQueries({ queryKey: ['services'] });
    queryClient.invalidateQueries({ queryKey: ['groups'] });
  }

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        slug: values.slug?.trim() || undefined,
        description: values.description ?? '',
      };
      return editing
        ? api.adminUpdateService(editing.id, payload)
        : api.adminCreateService(payload);
    },
    onSuccess: () => {
      invalidateCatalog();
      setFormOpen(false);
      setEditing(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      api.adminUpdateService(id, { isActive: next }),
    onSuccess: invalidateCatalog,
  });

  const services = servicesQuery.data;
  const groups = catalogQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dịch vụ & catalog"
        description="CRUD nghề (Service), bật/tắt và chỉnh giá trên catalog."
        actions={
          <button
            type="button"
            className="rounded-xl bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-brand-deep)]"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            + Thêm dịch vụ
          </button>
        }
      />

      <section>
        {formOpen ? (
          <form
            onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
            className="mb-4 space-y-3 rounded-2xl border border-[var(--color-line)] bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">
                {editing ? `Sửa «${editing.name}»` : 'Dịch vụ mới'}
              </h3>
              <button
                type="button"
                className="text-sm font-semibold text-[var(--color-muted)]"
                onClick={() => {
                  setFormOpen(false);
                  setEditing(null);
                }}
              >
                Đóng
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold" htmlFor="service-name">
                  Tên dịch vụ
                </label>
                <input
                  id="service-name"
                  {...register('name')}
                  className="field-input mt-1"
                  placeholder="Dọn nhà theo ca"
                />
                {errors.name ? (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-semibold" htmlFor="service-slug">
                  Slug (bỏ trống để tự sinh)
                </label>
                <input
                  id="service-slug"
                  {...register('slug')}
                  className="field-input mt-1"
                  placeholder="don-nha-theo-ca"
                />
              </div>

              <div>
                <label
                  className="text-sm font-semibold"
                  htmlFor="service-category"
                >
                  Danh mục
                </label>
                <select
                  id="service-category"
                  {...register('categoryId')}
                  className="field-input mt-1"
                >
                  <option value="">— Chọn danh mục —</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.group.name} › {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId ? (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.categoryId.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-semibold" htmlFor="service-price">
                  Giá đơn (VNĐ) — khi tạo booking
                </label>
                <input
                  id="service-price"
                  type="number"
                  {...register('basePrice')}
                  className="field-input mt-1"
                />
                {errors.basePrice ? (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.basePrice.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-semibold" htmlFor="service-price-min">
                  Giá tham khảo min (VNĐ)
                </label>
                <input
                  id="service-price-min"
                  type="number"
                  {...register('priceMin')}
                  className="field-input mt-1"
                />
                {errors.priceMin ? (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.priceMin.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-semibold" htmlFor="service-price-max">
                  Giá tham khảo max (VNĐ)
                </label>
                <input
                  id="service-price-max"
                  type="number"
                  {...register('priceMax')}
                  className="field-input mt-1"
                />
                {errors.priceMax ? (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.priceMax.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-semibold" htmlFor="service-unit">
                  Đơn vị
                </label>
                <input
                  id="service-unit"
                  {...register('unit')}
                  className="field-input mt-1"
                  placeholder="giờ / buổi / gói"
                />
                {errors.unit ? (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.unit.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  className="text-sm font-semibold"
                  htmlFor="service-duration"
                >
                  Thời lượng (phút)
                </label>
                <input
                  id="service-duration"
                  type="number"
                  {...register('durationMin')}
                  className="field-input mt-1"
                />
                {errors.durationMin ? (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.durationMin.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold" htmlFor="service-desc">
                Mô tả
              </label>
              <textarea
                id="service-desc"
                {...register('description')}
                rows={3}
                className="field-input mt-1"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" {...register('supportsOnline')} />
              Có thể thực hiện hoàn toàn online
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" {...register('isActive')} />
              Đang bật (hiện trên sàn)
            </label>

            {saveMutation.isError ? (
              <p className="text-sm text-red-600">
                {(saveMutation.error as Error).message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || saveMutation.isPending}
              className="rounded-xl bg-[var(--color-brand)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saveMutation.isPending ? 'Đang lưu…' : 'Lưu dịch vụ'}
            </button>
          </form>
        ) : null}

        <div className="mt-4">
          <FilterBar>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Tên dịch vụ, slug, danh mục…"
            />
            <SelectFilter
              label="Mọi nhóm"
              value={groupId}
              onChange={(value) => setParam('groupId', value)}
              options={groups.map((group) => ({
                value: group.id,
                label: group.name,
              }))}
            />
            <SelectFilter
              label="Mọi trạng thái"
              value={isActive}
              onChange={(value) => setParam('isActive', value)}
              options={ACTIVE_OPTIONS}
            />
          </FilterBar>
        </div>

        {servicesQuery.isLoading ? <p className="mt-6">Đang tải…</p> : null}

        {services && services.items.length === 0 ? (
          <EmptyState>Không có dịch vụ khớp bộ lọc.</EmptyState>
        ) : null}

        {services && services.items.length > 0 ? (
          <>
            <Panel className="mt-4 overflow-x-auto p-0 sm:p-0">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-line)] text-[var(--color-muted)]">
                    <th className="px-4 py-3 pr-3 font-semibold">Dịch vụ</th>
                    <th className="py-3 pr-3 font-semibold">Nhóm / danh mục</th>
                    <th className="py-3 pr-3 font-semibold">Giá tham khảo</th>
                    <th className="py-3 pr-3 font-semibold">Người làm</th>
                    <th className="py-3 pr-3 font-semibold">Đơn</th>
                    <th className="px-4 py-3 font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {services.items.map((service) => (
                    <tr
                      key={service.id}
                      className="border-b border-[var(--color-line)]/70 last:border-0"
                    >
                      <td className="px-4 py-3 pr-3">
                        <p className="flex items-center gap-2 font-medium">
                          {service.name}
                          {service.isActive ? null : (
                            <Badge tone="red">Đã tắt</Badge>
                          )}
                        </p>
                        <span className="text-xs text-[var(--color-muted)]">
                          /{service.slug} · {service.durationMin} phút
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-[var(--color-muted)]">
                        {service.category.group.name} › {service.category.name}
                      </td>
                      <td className="py-3 pr-3">
                        {formatMarketPriceRange(service, formatPrice, formatPriceNumber)}/
                        {service.unit}
                      </td>
                      <td className="py-3 pr-3">{service._count.partners}</td>
                      <td className="py-3 pr-3">{service._count.bookings}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="font-semibold text-[var(--color-brand-deep)]"
                            onClick={() => {
                              setEditing(service);
                              setFormOpen(true);
                            }}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            disabled={toggleActiveMutation.isPending}
                            className="font-semibold text-[var(--color-muted)] disabled:opacity-50"
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                id: service.id,
                                next: !service.isActive,
                              })
                            }
                          >
                            {service.isActive ? 'Tắt' : 'Bật'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <Pagination
              page={services.page}
              pageCount={services.pageCount}
              total={services.total}
              onChange={setPage}
            />
          </>
        ) : null}
      </section>
    </div>
  );
}
