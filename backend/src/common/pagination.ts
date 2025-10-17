export type PaginationParams = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

export function parsePagination(query: any, defaultPageSize = 20, maxPageSize = 100): PaginationParams {
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10));
  const rawSize = Number.parseInt(query.pageSize ?? `${defaultPageSize}`, 10);
  const pageSize = Math.min(Math.max(1, rawSize), maxPageSize);
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { page, pageSize, skip, take };
}


