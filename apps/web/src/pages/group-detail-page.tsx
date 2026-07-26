import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ServiceCard } from '../components/common/service-card';
import { api } from '../services/api';
import { groupColor } from '../utils/catalog-colors';
import { groupImage } from '../utils/catalog-images';

export function GroupDetailPage() {
  const { slug = '' } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['group', slug],
    queryFn: () => api.getGroup(slug),
    enabled: Boolean(slug),
  });

  if (isLoading) return <p>Đang tải nhóm...</p>;
  if (isError || !data) {
    return (
      <div>
        <p className="text-red-600">Không tìm thấy nhóm dịch vụ.</p>
        <Link to="/nhom" className="mt-3 inline-block text-[var(--color-brand-deep)]">
          Quay lại danh mục
        </Link>
      </div>
    );
  }

  const color = groupColor(data.slug);
  const categories = data.categories;

  return (
    <div className="space-y-8">
      <div
        className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
        style={{ borderTop: `4px solid ${color.main}` }}
      >
        <img
          src={groupImage(data.slug)}
          alt={data.name}
          className="aspect-[21/7] w-full object-cover"
        />
        <div className="p-5 sm:p-6">
          <Link
            to="/nhom"
            className="inline-flex rounded-md px-2 py-1 text-[15px] font-semibold"
            style={{ backgroundColor: color.soft, color: color.ink }}
          >
            ← Danh mục
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">{data.name}</h1>
          <p className="mt-2 max-w-2xl text-base text-[var(--color-muted)]">{data.description}</p>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            Chỉ liệt kê nghề làm được hoàn toàn online.
          </p>
        </div>
      </div>

      {categories.map((category) => (
        <section key={category.id}>
          <h2
            className="mb-4 border-l-4 pl-3 text-xl font-extrabold sm:text-2xl"
            style={{ borderColor: color.main }}
          >
            {category.name}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {category.services.map((service) => (
              <ServiceCard
                key={service.id}
                service={{
                  ...service,
                  category: {
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    group: {
                      id: data.id,
                      name: data.name,
                      slug: data.slug,
                    },
                  },
                }}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
