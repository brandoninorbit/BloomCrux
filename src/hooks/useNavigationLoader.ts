
'use client';

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function useNavigationLoader() {
  const [isLoading, startTransition] = useTransition();
  const router = useRouter();

  const push = (href: string) => {
    startTransition(() => {
      router.push(href);
    });
  };

  return { isLoading, push };
}
