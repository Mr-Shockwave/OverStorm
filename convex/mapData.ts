/** Static demo map data for Hurricane Milton — Miami Beach. */

export const MIAMI_BEACH_CENTER = {
  lat: 25.7907,
  lng: -80.13,
  zoom: 14,
};

export const HURRICANE_MILTON_TRACK = [
  { lat: 25.48, lng: -79.75, label: "Now", hoursOffset: 0 },
  { lat: 25.58, lng: -79.92, label: "12h", hoursOffset: 12 },
  { lat: 25.69, lng: -80.05, label: "24h", hoursOffset: 24 },
  { lat: 25.7907, lng: -80.13, label: "36h", hoursOffset: 36 },
] as const;

export const MIAMI_BEACH_RISK_ZONES = [
  {
    level: "low" as const,
    centerLat: 25.7907,
    centerLng: -80.13,
    radiusMeters: 4500,
  },
  {
    level: "medium" as const,
    centerLat: 25.7907,
    centerLng: -80.13,
    radiusMeters: 2800,
  },
  {
    level: "high" as const,
    centerLat: 25.7907,
    centerLng: -80.13,
    radiusMeters: 1200,
  },
];

export const OPPORTUNITY_MAP_COORDS: Record<
  string,
  { latitude: number; longitude: number }
> = {
  "Ocean View Plaza": { latitude: 25.7934, longitude: -80.1278 },
  "Bayfront Towers": { latitude: 25.7862, longitude: -80.1335 },
  "Sunset Residences": { latitude: 25.7818, longitude: -80.1242 },
  "Palm Grove Center": { latitude: 25.7885, longitude: -80.1215 },
};
