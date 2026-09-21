import type { ListQuery, Paginated } from "@/types";

export function paginate<T>(
  items: T[],
  query: ListQuery = {},
): Paginated<T> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, query.pageSize ?? 10);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;

  return {
    data: items.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    totalPages,
  };
}

export function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

export function matchesSearch(haystack: string, search?: string) {
  if (!search?.trim()) return true;
  return haystack.toLowerCase().includes(search.trim().toLowerCase());
}
