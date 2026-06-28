"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { formatCurrency } from "@/lib/format";

export type MapOpportunity = {
  _id: string;
  propertyName: string;
  assetType?: string;
  city?: string;
  riskScore: number;
  restorationDemandScore: number;
  expectedRevenue: number;
  status: string;
  latitude: number;
  longitude: number;
  decisionMakerStatus: "discovered" | "pending";
};

export type StormTrackPoint = {
  lat: number;
  lng: number;
  label?: string;
  hoursOffset?: number;
};

export type RiskZone = {
  level: "high" | "medium" | "low";
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
};

export type StormHistoricalMeta = {
  category: string;
  peakCategory?: string;
  historicalLandfall: string;
  landfallWindSpeedMph: number;
  peakWindSpeedMph?: number;
  isHistoricalReplay: boolean;
  timeline: Array<{ label: string; description: string }>;
};

export type StormMapNarrative = {
  highRiskAssetCount: number;
  avgRestorationDemand: number;
  trackedPredictedRevenue: number;
};

export type StormMapData = {
  center: { lat: number; lng: number; zoom: number };
  stormTrack: StormTrackPoint[];
  riskZones: RiskZone[];
  opportunities: MapOpportunity[];
  storm: StormHistoricalMeta;
  narrative?: StormMapNarrative;
};

type StormMapInnerProps = {
  stormName: string;
  stormLocation: string;
  predictedRevenueOpportunity: number;
  propertiesAtRisk: number;
  map: StormMapData;
};

type ReplayPhase = "track" | "storm" | "zones" | "assets" | "complete";

const RISK_ZONE_STYLES: Record<
  RiskZone["level"],
  { color: string; fillColor: string; fillOpacity: number; className: string }
> = {
  high: {
    color: "#ef4444",
    fillColor: "#ef4444",
    fillOpacity: 0.22,
    className: "risk-zone-high",
  },
  medium: {
    color: "#f97316",
    fillColor: "#f97316",
    fillOpacity: 0.14,
    className: "risk-zone-medium",
  },
  low: {
    color: "#eab308",
    fillColor: "#eab308",
    fillOpacity: 0.08,
    className: "risk-zone-low",
  },
};

function MapInitializer({
  center,
  zoom,
  track,
  opportunities,
}: {
  center: [number, number];
  zoom: number;
  track: StormTrackPoint[];
  opportunities: MapOpportunity[];
}) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [
      ...track.map((point) => [point.lat, point.lng] as [number, number]),
      ...opportunities.map(
        (opportunity) =>
          [opportunity.latitude, opportunity.longitude] as [number, number],
      ),
    ];

    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), {
        padding: [48, 48],
        maxZoom: 10,
        animate: false,
      });
    } else {
      map.setView(center, zoom, { animate: false });
    }

    map.zoomControl.setPosition("bottomright");
  }, [map, center, zoom, track, opportunities]);

  return null;
}

function createTrackLabelIcon(label: string, isLandfall: boolean) {
  return L.divIcon({
    className: "storm-track-label-icon",
    html: `<span class="storm-track-label ${isLandfall ? "storm-track-label--landfall" : ""}">${label}</span>`,
    iconSize: [56, 20],
    iconAnchor: [28, 10],
  });
}

function createPropertyIcon(
  riskScore: number,
  revenue: number,
  assetType: string,
  highlight: boolean,
  staggerIndex: number,
) {
  const tier =
    riskScore >= 85 ? "high" : riskScore >= 70 ? "medium" : "low";
  const shortType = assetType.split(" ")[0];

  return L.divIcon({
    className: "property-marker-icon",
    html: `
      <div class="property-marker property-marker--${tier} ${highlight ? "property-marker--highlight" : ""}" style="${highlight ? `--marker-delay:${staggerIndex * 0.08}s` : ""}">
        <div class="property-marker__type">${shortType}</div>
        <div class="property-marker__row">
          <span class="property-marker__risk">${riskScore}</span>
          <span class="property-marker__revenue">${formatCurrency(revenue, true)}</span>
        </div>
        <div class="property-marker__dot"></div>
      </div>
    `,
    iconSize: [88, 52],
    iconAnchor: [44, 26],
  });
}

function createStormEyeIcon() {
  return L.divIcon({
    className: "storm-eye-icon",
    html: `<div class="storm-eye storm-eye--animated"><div class="storm-eye__core"></div><div class="storm-eye__ring"></div></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export function StormMapInner({
  stormName,
  stormLocation,
  predictedRevenueOpportunity,
  map,
}: StormMapInnerProps) {
  const center: [number, number] = [map.center.lat, map.center.lng];
  const trackPositions = useMemo(
    () =>
      map.stormTrack.map(
        (point) => [point.lat, point.lng] as [number, number],
      ),
    [map.stormTrack],
  );

  const [phase, setPhase] = useState<ReplayPhase>("track");
  const [stormIndex, setStormIndex] = useState(0);
  const [zoneScale, setZoneScale] = useState(0);

  const sortedZones = useMemo(
    () =>
      [...map.riskZones].sort((a, b) => {
        const order = { low: 0, medium: 1, high: 2 };
        return order[a.level] - order[b.level];
      }),
    [map.riskZones],
  );

  const labeledTrackIndices = useMemo(
    () =>
      map.stormTrack
        .map((point, index) => (point.label ? index : -1))
        .filter((index) => index >= 0),
    [map.stormTrack],
  );

  const lastTrackIndex = map.stormTrack.length - 1;
  const stormPosition = map.stormTrack[stormIndex] ?? map.stormTrack[0];
  const narrative = map.narrative;

  useEffect(() => {
    const stormTimer = window.setInterval(() => {
      setStormIndex((current) => {
        if (current >= lastTrackIndex) {
          window.clearInterval(stormTimer);
          return current;
        }
        return current + 1;
      });
    }, 180);

    const phaseTimers = [
      window.setTimeout(() => setPhase("storm"), 400),
      window.setTimeout(() => setPhase("zones"), 2200),
      window.setTimeout(() => {
        setPhase("assets");
        setZoneScale(1);
      }, 3200),
      window.setTimeout(() => setPhase("complete"), 4200),
    ];

    return () => {
      window.clearInterval(stormTimer);
      phaseTimers.forEach(window.clearTimeout);
    };
  }, [lastTrackIndex, map.stormTrack]);

  useEffect(() => {
    if (phase !== "zones") return;

    let frame = 0;
    const totalFrames = 24;
    const interval = window.setInterval(() => {
      frame += 1;
      setZoneScale(Math.min(frame / totalFrames, 1));
      if (frame >= totalFrames) window.clearInterval(interval);
    }, 40);

    return () => window.clearInterval(interval);
  }, [phase]);

  const showTrack = true;
  const showZones =
    phase === "zones" || phase === "assets" || phase === "complete";
  const highlightAssets =
    phase === "assets" || phase === "complete";

  const effectiveZoneScale =
    phase === "zones"
      ? zoneScale
      : phase === "assets" || phase === "complete"
        ? 1
        : 0;

  return (
    <div
      className={`storm-map-shell storm-map-shell--phase-${phase} relative h-full w-full`}
    >
      <div className="storm-map-overlay pointer-events-none absolute inset-x-0 top-0 z-[1000] flex items-start justify-between gap-3 p-4">
        <div className="pointer-events-auto max-w-md rounded-lg border border-slate-200/90 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-600">
              Historical Replay
            </p>
            {map.storm.isHistoricalReplay && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800">
                Wilma 2005
              </span>
            )}
          </div>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">{stormName}</h2>
          <p className="text-xs text-slate-500">{stormLocation}</p>
          <dl className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1 text-xs">
            <div>
              <dt className="text-slate-500">Landfall</dt>
              <dd className="font-semibold text-amber-700">{map.storm.category}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Peak</dt>
              <dd className="font-semibold text-red-600">
                {map.storm.peakCategory ?? "Cat 5"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Wind</dt>
              <dd className="font-semibold text-slate-900">
                {map.storm.peakWindSpeedMph ?? 180}→
                {map.storm.landfallWindSpeedMph} mph
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
            {map.storm.historicalLandfall}
          </p>
        </div>

        <div className="pointer-events-auto flex flex-col gap-2 sm:flex-row">
          <div className="rounded-lg border border-slate-200/90 bg-white/95 px-3 py-2.5 text-right shadow-lg backdrop-blur-sm">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              High-Risk Assets
            </p>
            <p className="text-xl font-semibold text-red-600">
              {narrative?.highRiskAssetCount ?? "—"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200/90 bg-white/95 px-3 py-2.5 text-right shadow-lg backdrop-blur-sm">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Restoration Demand
            </p>
            <p className="text-xl font-semibold text-amber-600">
              {narrative?.avgRestorationDemand ?? "—"}
            </p>
            <p className="text-[9px] text-slate-400">OverStorm avg</p>
          </div>
          <div className="rounded-lg border border-emerald-200/80 bg-white/95 px-3 py-2.5 text-right shadow-lg backdrop-blur-sm">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Predicted Revenue
            </p>
            <p className="text-xl font-semibold text-emerald-600">
              {formatCurrency(
                narrative?.trackedPredictedRevenue ??
                  predictedRevenueOpportunity,
                true,
              )}
            </p>
            <p className="text-[9px] text-slate-400">
              {map.opportunities.length} assets tracked
            </p>
          </div>
        </div>
      </div>

      <div className="storm-narrative-bar pointer-events-none absolute bottom-4 right-4 z-[1000] flex items-center gap-2 rounded-lg border border-slate-200/90 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-sm">
        <NarrativeStep label="Storm" active={phase !== "track"} />
        <span className="text-slate-600">→</span>
        <NarrativeStep
          label="Risk"
          active={showZones}
        />
        <span className="text-slate-600">→</span>
        <NarrativeStep label="Revenue" active={highlightAssets} />
      </div>

      <MapContainer
        center={center}
        zoom={map.center.zoom}
        className="storm-map h-full w-full"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <MapInitializer
          center={center}
          zoom={map.center.zoom}
          track={map.stormTrack}
          opportunities={map.opportunities}
        />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        {showZones &&
          sortedZones.map((zone, index) => {
            const style = RISK_ZONE_STYLES[zone.level];
            return (
              <Circle
                key={`${zone.level}-${zone.centerLat}-${index}`}
                center={[zone.centerLat, zone.centerLng]}
                radius={zone.radiusMeters * effectiveZoneScale}
                pathOptions={{
                  color: style.color,
                  fillColor: style.fillColor,
                  fillOpacity: style.fillOpacity * effectiveZoneScale,
                  weight: 1.5,
                  opacity: 0.35 + effectiveZoneScale * 0.35,
                  className: `${style.className} risk-zone--expanding`,
                }}
              />
            );
          })}

        {showTrack && (
          <Polyline
            positions={trackPositions}
            pathOptions={{
              color: "#38bdf8",
              weight: 3,
              opacity: 0.9,
              className: `storm-track-line storm-track-line--replay`,
            }}
          />
        )}

        {labeledTrackIndices.map((index) => {
          const point = map.stormTrack[index];
          if (!point.label) return null;
          const visible = stormIndex >= index || phase === "complete";
          if (!visible) return null;
          return (
            <Marker
              key={`${point.lat}-${point.lng}-${point.label}`}
              position={[point.lat, point.lng]}
              icon={createTrackLabelIcon(
                point.label,
                index === lastTrackIndex,
              )}
              zIndexOffset={200}
            />
          );
        })}

        {stormPosition && phase !== "track" && (
          <Marker
            position={[stormPosition.lat, stormPosition.lng]}
            icon={createStormEyeIcon()}
            zIndexOffset={300}
          />
        )}

        {map.opportunities.map((opportunity, index) => (
          <Marker
            key={opportunity._id}
            position={[opportunity.latitude, opportunity.longitude]}
            icon={createPropertyIcon(
              opportunity.riskScore,
              opportunity.expectedRevenue,
              opportunity.assetType ?? "Hotel",
              highlightAssets,
              index,
            )}
            zIndexOffset={400 + opportunity.riskScore}
          >
            <Popup className="property-popup" closeButton={true}>
              <div className="min-w-[220px] space-y-3 p-1">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {opportunity.assetType ?? "Coastal Asset"}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {opportunity.propertyName}
                  </p>
                  {opportunity.city && (
                    <p className="text-xs text-slate-500">{opportunity.city}</p>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-slate-400">Risk Score</dt>
                    <dd className="font-semibold text-red-700">
                      {opportunity.riskScore}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Pred. Revenue</dt>
                    <dd className="font-semibold text-emerald-700">
                      {formatCurrency(opportunity.expectedRevenue, true)}
                    </dd>
                  </div>
                </dl>
                <Link
                  href={`/opportunities?id=${opportunity._id}`}
                  className="flex w-full items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  Open Opportunity
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="storm-map-legend pointer-events-none absolute bottom-4 left-4 z-[1000] max-w-sm rounded-lg border border-slate-200/90 bg-white/95 px-3 py-2.5 text-[10px] text-slate-500 shadow-lg backdrop-blur-sm">
        <p className="mb-1.5 font-semibold uppercase tracking-wider text-slate-600">
          Wilma Timeline
        </p>
        <ul className="max-h-24 space-y-1 overflow-y-auto">
          {map.storm.timeline.map((entry) => (
            <li key={entry.label} className="leading-snug">
              <span className="font-semibold text-sky-700">{entry.label}</span>
              <span className="text-slate-500"> — </span>
              <span className="text-slate-400">{entry.description}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-3 border-t border-slate-200 pt-2">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" /> High
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-orange-500" /> Med
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-yellow-500" /> Low
          </span>
        </div>
      </div>
    </div>
  );
}

function NarrativeStep({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <span
      className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
        active ? "text-sky-700" : "text-slate-400"
      }`}
    >
      {label}
    </span>
  );
}
