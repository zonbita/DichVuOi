import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ServiceCard } from '../components/common/service-card';
import { GroupDetailHero } from '../components/catalog/group-detail-hero';
import { api } from '../services/api';
import { groupColor } from '../utils/catalog-colors';

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
      <GroupDetailHero
        name={data.name}
        description={data.description ?? ''}
        slug={data.slug}
        color={color}
      />

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
