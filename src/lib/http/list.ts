import type { Paginated } from "@/types";
import { apiRequestEnvelope, type RequestOptions } from "@/lib/http/client";

interface ListEnvelope<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

/**
 * GET a paginated list. The API replies with `{ data, meta }`; the UI works
 * with the flat `Paginated<T>` shape, so the meta fields are hoisted here.
 */
export async function apiRequestList<T>(
  path: string,
  options: RequestOptions = {},
): Promise<Paginated<T>> {
  const { data, meta } = await apiRequestEnvelope<ListEnvelope<T>>(path, options);
  return { data, ...meta };
}
