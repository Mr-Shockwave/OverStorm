import { Suspense } from "react";
import { OpportunitiesWorkspace } from "@/components/opportunities-workspace";

export default function OpportunitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
        </div>
      }
    >
      <OpportunitiesWorkspace />
    </Suspense>
  );
}
