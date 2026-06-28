"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import type { Id } from "../../convex/_generated/dataModel";

const AGENTS_PATH = "/agents";

export function useOpportunityDrawer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlOpportunityId = searchParams.get("id") as Id<"opportunities"> | null;
  const [clickedId, setClickedId] = useState<Id<"opportunities"> | null>(null);
  const selectedId = clickedId ?? urlOpportunityId;

  const openOpportunity = useCallback(
    (id: Id<"opportunities">) => {
      setClickedId(id);
      router.replace(`${AGENTS_PATH}?id=${id}`, { scroll: false });
    },
    [router],
  );

  const closeDrawer = useCallback(() => {
    setClickedId(null);
    if (urlOpportunityId) {
      router.replace(AGENTS_PATH, { scroll: false });
    }
  }, [router, urlOpportunityId]);

  return { selectedId, openOpportunity, closeDrawer };
}
