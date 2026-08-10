import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { ServiceCard } from '../components/common/service-card';
import { GroupDetailHero } from '../components/catalog/group-detail-hero';
import { SectionHeaderBar } from '../components/home/section-header-bar';
import { api } from '../services/api';
import { groupColor } from '../utils/catalog-colors';
import { groupIcon } from '../utils/catalog-display';

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
  const icon = groupIcon(data.slug);

  return (
    <div className="space-y-8">
      <GroupDetailHero
        name={data.name}
        description={data.description ?? ''}
        slug={data.slug}
        color={color}
      />

      {categories.map((category) => {
        const services = category.services.slice(0, 5);
        return (
          <section key={category.id}>
            <SectionHeaderBar icon={icon} title={category.name} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
              {services.map((service) => (
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
        );
      })}
    </div>
  );
}
