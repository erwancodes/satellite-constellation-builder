import type { Satellite } from "./satellite";

export type CelestialBodyId = "earth" | "moon" | "mars";

export interface CelestialBody {
  id: CelestialBodyId;
  name: string;
  modeName: string;
  radiusKm: number;
  gravitationalParameter: number;
  sceneRadius: number;
  texturePaths: {
    color: string;
    normal?: string;
    night?: string;
    clouds?: string;
  };
  surfaceTint: string;
  atmosphereColor: string;
  hasClouds: boolean;
  altitudeRangeKm: [number, number];
}

export type CoverageMode = "all" | "selected" | "none";

export interface DisplayPreferences {
  coverageMode: CoverageMode;
  showLinks: boolean;
  showAllOrbits: boolean;
  autoRotate: boolean;
}

export interface SimulationSettings {
  isPlaying: boolean;
  timeScale: number;
  elapsedSeconds: number;
}

export interface MissionExport {
  schemaVersion: 1;
  exportedAt: string;
  missionName: string;
  bodyId: CelestialBodyId;
  satellites: Satellite[];
  simulation: SimulationSettings;
  display: DisplayPreferences;
  activePreset: string | null;
}

export type AlertLevel = "info" | "warning" | "critical";

export interface MissionAlert {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
}
