"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy path — COA logging moved to /performance. */
export default function FieldWorkRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/performance");
  }, [router]);
  return null;
}
