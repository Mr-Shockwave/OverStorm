"use client";

import dynamic from "next/dynamic";
import type { StormMapData } from "@/components/storm-map-inner";

const StormMapInner = dynamic(
  () =>
    import("@/components/storm-map-inner").then((mod) => mod.StormMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-sky-500" />
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Loading storm map…
          </p>
        </div>
      </div>
    ),
  },
);

type StormIntelligenceMapProps = {
  stormName: string;
  stormLocation: string;
  hoursUntilLandfall: number;
  projectedRevenue: number;
  propertiesAtRisk: number;
  map: StormMapData;
};

export function StormIntelligenceMap(props: StormIntelligenceMapProps) {
  return (
    <section
      aria-label="Storm intelligence map"
      className="h-full w-full overflow-hidden border-b border-slate-800 bg-slate-950"
    >
      <StormMapInner {...props} />
    </section>
  );
}
