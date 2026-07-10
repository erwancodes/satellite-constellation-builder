export const SATELLITE_TYPES = [
  "Internet",
  "Observation",
  "Navigation",
  "Communication",
  "Relay",
] as const;

export type SatelliteType = (typeof SATELLITE_TYPES)[number];

export interface Satellite {
  id: string;
  name: string;
  type: SatelliteType;
  color: string;
  altitudeKm: number;
  inclinationDeg: number;
  ascendingNodeDeg: number;
  phaseDeg: number;
  speedMultiplier: number;
  coverageAngleDeg: number;
  active: boolean;
  showOrbit: boolean;
  showCoverage: boolean;
}

export interface SatelliteTelemetry {
  latitudeDeg: number;
  longitudeDeg: number;
  altitudeKm: number;
  velocityKmPerSecond: number;
  periodSeconds: number;
  progress: number;
  coveragePercent: number;
  communication: "Nominal" | "Isolated" | "Offline";
}
