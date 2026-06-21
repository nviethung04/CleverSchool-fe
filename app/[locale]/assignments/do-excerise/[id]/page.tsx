"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "@/lib/i18n/routing";

/** Redirect legacy typo URL do-excerise → do-exercise */
export default function DoExceriseTypoRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = params.id;
    const query = searchParams.toString();
    router.replace(
      `/assignments/do-exercise/${id}${query ? `?${query}` : ""}`
    );
  }, [params.id, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Đang chuyển hướng...
    </div>
  );
}
