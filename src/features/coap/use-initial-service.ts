import { useSearchParams } from "next/navigation";
import { SERVICE_LINES } from "@/lib/coap/catalog";
import type { ServiceLine } from "@/types";

/**
 * Reads `?service=<line>` (set by the service cockpit links) and returns it
 * only when it is a known service line; otherwise `fallback`.
 */
export function useInitialService<T extends ServiceLine | "all">(
  fallback: T,
): ServiceLine | T {
  const param = useSearchParams().get("service");
  const match = SERVICE_LINES.find((line) => line.id === param);
  return match ? match.id : fallback;
}
