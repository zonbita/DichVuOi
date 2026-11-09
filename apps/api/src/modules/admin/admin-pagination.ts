import { AdminPageQueryDto } from './dto';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export type Page = {
  skip: number;
  take: number;
  page: number;
  pageSize: number;
};

export function resolvePage(query: AdminPageQueryDto): Page {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE),
  );
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}

export function paginated<T>(items: T[], total: number, page: Page) {
  return {
    items,
    total,
    page: page.page,
    pageSize: page.pageSize,
    pageCount: Math.max(1, Math.ceil(total / page.pageSize)),
  };
}
