import { CELESTIAL_BODIES } from "./celestialBodies";
import { MAX_SATELLITES, SATELLITE_COLORS } from "./constants";
import type { CelestialBodyId } from "../types/mission";
import type { Satellite, SatelliteType } from "../types/satellite";

export const MISSION_GOALS = [
  { id: "maximum-global-coverage", label: "Maximum Global Coverage" },
  { id: "equatorial-coverage", label: "Equatorial Coverage" },
  { id: "polar-coverage", label: "Polar Coverage" },
  { id: "low-latency-internet", label: "Low Latency Internet" },
  { id: "communication-relay", label: "Communication Relay" },
] as const;

export type MissionGoal = (typeof MISSION_GOALS)[number]["id"];

export interface GenerationOptions {
  count: number;
  altitudeKm: number;
  orbitalPlanes: number;
  inclinationDeg: number;
  missionGoal: MissionGoal;
  bodyId?: CelestialBodyId;
  namePrefix?: string;
  idPrefix?: string;
}

interface MissionProfile {
  type: SatelliteType;
  coverageAngleDeg: number;
}

const GOAL_PROFILES: Record<MissionGoal, MissionProfile> = {
  "maximum-global-coverage": {
    type: "Navigation",
    coverageAngleDeg: 42,
  },
  "equatorial-coverage": {
    type: "Communication",
    coverageAngleDeg: 30,
  },
  "polar-coverage": {
    type: "Observation",
    coverageAngleDeg: 28,
  },
  "low-latency-internet": {
    type: "Internet",
    coverageAngleDeg: 25,
  },
  "communication-relay": {
    type: "Relay",
    coverageAngleDeg: 65,
  },
};

let generationSequence = 0;

function assertIntegerInRange(
  value: number,
  minimum: number,
  maximum: number,
  label: string,
): void {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be an integer from ${minimum} to ${maximum}.`);
  }
}

function assertNumberInRange(
  value: number,
  minimum: number,
  maximum: number,
  label: string,
): void {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function isMissionGoal(value: string): value is MissionGoal {
  return MISSION_GOALS.some((goal) => goal.id === value);
}

export function generateConstellation(options: GenerationOptions): Satellite[] {
  assertIntegerInRange(options.count, 0, MAX_SATELLITES, "Satellite count");
  if (options.count === 0) return [];

  assertIntegerInRange(
    options.orbitalPlanes,
    1,
    options.count,
    "Orbital plane count",
  );
  assertNumberInRange(options.inclinationDeg, 0, 180, "Inclination");

  const bodyId = options.bodyId ?? "earth";
  const body = CELESTIAL_BODIES[bodyId];
  assertNumberInRange(
    options.altitudeKm,
    body.altitudeRangeKm[0],
    body.altitudeRangeKm[1],
    `${body.name} altitude`,
  );
  if (!isMissionGoal(options.missionGoal)) {
    throw new TypeError("Unknown mission goal.");
  }

  const profile = GOAL_PROFILES[options.missionGoal];
  const generationId =
    options.idPrefix ??
    `generated-${Date.now().toString(36)}-${(generationSequence += 1).toString(36)}`;
  const namePrefix = options.namePrefix?.trim() || "SAT";
  const nameDigits = Math.max(2, String(options.count).length);

  return Array.from({ length: options.count }, (_, index) => {
    const planeIndex = index % options.orbitalPlanes;
    const slotIndex = Math.floor(index / options.orbitalPlanes);
    const satellitesInPlane = Math.ceil(
      (options.count - planeIndex) / options.orbitalPlanes,
    );
    const ascendingNodeDeg =
      (planeIndex * 360) / options.orbitalPlanes;
    // The plane offset creates a simple Walker-like phasing between planes.
    const phaseDeg =
      ((slotIndex * 360) / satellitesInPlane +
        (planeIndex * 360) / options.count) %
      360;

    return {
      id: `${generationId}-${index + 1}`,
      name: `${namePrefix}-${String(index + 1).padStart(nameDigits, "0")}`,
      type: profile.type,
      color:
        SATELLITE_COLORS[index % SATELLITE_COLORS.length] ??
        SATELLITE_COLORS[0],
      altitudeKm: options.altitudeKm,
      inclinationDeg: options.inclinationDeg,
      ascendingNodeDeg,
      phaseDeg,
      speedMultiplier: 1,
      coverageAngleDeg: profile.coverageAngleDeg,
      active: true,
      showOrbit: true,
      showCoverage: true,
    } satisfies Satellite;
  });
}
