"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
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
  historicalLandfall: string;
  landfallWindSpeedMph: number;
  isHistoricalReplay: boolean;
  timeline: Array<{ label: string; description: string }>;
};

export type StormMapData = {
  center: { lat: number; lng: number; zoom: number };
  stormTrack: StormTrackPoint[];
  riskZones: RiskZone[];
  opportunities: MapOpportunity[];
  storm: StormHistoricalMeta;
};

type StormMapInnerProps = {
  stormName: string;
  stormLocation: string;
  predictedRevenueOpportunity: number;
  propertiesAtRisk: number;
  map: StormMapData;
};

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
    fillOpacity: 0.16,
    className: "risk-zone-medium",
  },
  low: {
    color: "#eab308",
    fillColor: "#eab308",
    fillOpacity: 0.1,
    className: "risk-zone-low",
  },
};


function MapInitializer({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: false });
    map.zoomControl.setPosition("bottomright");
  }, [map, center, zoom]);

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

function createPropertyIcon(riskScore: number, revenue: number) {
  const tier =
    riskScore >= 85 ? "high" : riskScore >= 70 ? "medium" : "low";
  const size = riskScore >= 85 ? 16 : riskScore >= 70 ? 13 : 10;

  return L.divIcon({
    className: "property-marker-icon",
    html: `
      <div class="property-marker property-marker--${tier}">
        <div class="property-marker__dot" style="width:${size}px;height:${size}px"></div>
        <div class="property-marker__revenue">${formatCurrency(revenue, true)}</div>
      </div>
    `,
    iconSize: [72, 44],
    iconAnchor: [36, 12],
  });
}

function createStormEyeIcon() {
  return L.divIcon({
    className: "storm-eye-icon",
    html: `<div class="storm-eye"><div class="storm-eye__core"></div><div class="storm-eye__ring"></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function StormMapInner({
  stormName,
  stormLocation,
  predictedRevenueOpportunity,
  propertiesAtRisk,
  map,
}: StormMapInnerProps) {
  const center: [number, number] = [map.center.lat, map.center.lng];
  const trackPositions = useMemo(
    () => map.stormTrack.map((point) => [point.lat, point.lng] as [number, number]),
    [map.stormTrack],
  );

  const sortedZones = useMemo(
    () =>
      [...map.riskZones].sort((a, b) => {
        const order = { low: 0, medium: 1, high: 2 };
        return order[a.level] - order[b.level];
      }),
    [map.riskZones],
  );

  const landfallPosition = map.stormTrack[map.stormTrack.length - 1];
  const lastTrackIndex = map.stormTrack.length - 1;

  return (
    <div className="storm-map-shell relative h-full w-full">
      <div className="storm-map-overlay pointer-events-none absolute inset-x-0 top-0 z-[1000] flex items-start justify-between gap-4 p-4">
        <div className="pointer-events-auto max-w-sm rounded-lg border border-slate-700/60 bg-slate-950/85 px-4 py-3 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400">
              Historical Replay
            </p>
            {map.storm.isHistoricalReplay && (
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                2024
              </span>
            )}
          </div>
          <h2 className="mt-1 text-lg font-semibold text-white">{stormName}</h2>
          <p className="text-xs text-slate-400">{stormLocation}</p>
          <p className="mt-1 text-[10px] leading-relaxed text-sky-300/80">
            Map pins show Miami Beach coastal assets in the modeled impact zone.
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <div>
              <dt className="text-slate-500">Category</dt>
              <dd className="font-semibold text-amber-200">{map.storm.category}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Wind at Landfall</dt>
              <dd className="font-semibold text-white">
                {map.storm.landfallWindSpeedMph} mph
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            {map.storm.historicalLandfall}
          </p>
        </div>

        <div className="pointer-events-auto flex gap-3">
          <div className="rounded-lg border border-slate-700/60 bg-slate-950/85 px-4 py-3 text-right shadow-xl backdrop-blur-sm">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Predicted Revenue
            </p>
            <p className="mt-0.5 text-[9px] text-slate-600">OverStorm model</p>
            <p className="mt-1 text-xl font-semibold text-emerald-400">
              {formatCurrency(predictedRevenueOpportunity, true)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700/60 bg-slate-950/85 px-4 py-3 text-right shadow-xl backdrop-blur-sm">
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Assets Tracked
            </p>
            <p className="mt-1 text-xl font-semibold text-white">
              {map.opportunities.length}
            </p>
            <p className="mt-0.5 text-[9px] text-slate-600">
              {propertiesAtRisk.toLocaleString()} in pipeline
            </p>
          </div>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={map.center.zoom}
        className="storm-map h-full w-full"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <MapInitializer center={center} zoom={map.center.zoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />

        {sortedZones.map((zone) => {
          const style = RISK_ZONE_STYLES[zone.level];
          return (
            <Circle
              key={zone.level}
              center={[zone.centerLat, zone.centerLng]}
              radius={zone.radiusMeters}
              pathOptions={{
                color: style.color,
                fillColor: style.fillColor,
                fillOpacity: style.fillOpacity,
                weight: 1.5,
                opacity: 0.55,
                className: style.className,
              }}
            />
          );
        })}

        <Polyline
          positions={trackPositions}
          pathOptions={{
            color: "#38bdf8",
            weight: 3,
            opacity: 0.85,
            dashArray: "10 8",
            className: "storm-track-line",
          }}
        />

        {map.stormTrack.map((point, index) => {
          if (!point.label) return null;
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

        {landfallPosition && (
          <Marker
            position={[landfallPosition.lat, landfallPosition.lng]}
            icon={createStormEyeIcon()}
            zIndexOffset={300}
          />
        )}

        {map.opportunities.map((opportunity) => (
          <Marker
            key={opportunity._id}
            position={[opportunity.latitude, opportunity.longitude]}
            icon={createPropertyIcon(
              opportunity.riskScore,
              opportunity.expectedRevenue,
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
                    <dd className="font-semibold text-slate-900">
                      {opportunity.riskScore}
                    </dd>
                    <dd className="text-[9px] text-slate-400">OverStorm model</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Pred. Revenue</dt>
                    <dd className="font-semibold text-emerald-700">
                      {formatCurrency(opportunity.expectedRevenue, true)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Restoration</dt>
                    <dd className="font-semibold text-amber-700">
                      {opportunity.restorationDemandScore}
                    </dd>
                    <dd className="text-[9px] text-slate-400">OverStorm model</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Contact</dt>
                    <dd className="font-medium text-slate-800">
                      {opportunity.decisionMakerStatus === "discovered"
                        ? "Discovered"
                        : "Pending"}
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

      <div className="storm-map-legend pointer-events-none absolute bottom-4 left-4 z-[1000] max-w-xs rounded-lg border border-slate-700/60 bg-slate-950/85 px-3 py-2.5 text-[10px] text-slate-400 shadow-xl backdrop-blur-sm">
        <p className="mb-1.5 font-semibold uppercase tracking-wider text-slate-500">
          Milton Timeline
        </p>
        <ul className="space-y-1">
          {map.storm.timeline.map((entry) => (
            <li key={entry.label} className="leading-snug">
              <span className="font-semibold text-sky-300">{entry.label}</span>
              <span className="text-slate-500"> — </span>
              <span className="text-slate-400">{entry.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
