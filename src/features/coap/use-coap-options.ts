import { getCoapFilterOptions } from "@/lib/api";
import { useUserData } from "@/lib/hooks/use-user-data";

/** Geography, coordinator and service-line options for COAP create forms. */
export function useCoapOptions() {
  return useUserData(() => getCoapFilterOptions(), "coap-options");
}
