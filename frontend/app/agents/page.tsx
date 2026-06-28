import { Suspense } from "react";
import { AgentsControlCenter } from "@/components/agents-control-center";

export default function AgentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
        </div>
      }
    >
      <AgentsControlCenter />
    </Suspense>
  );
}
