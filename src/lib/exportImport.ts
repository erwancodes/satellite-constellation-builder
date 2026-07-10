import { getCelestialBody } from "./celestialBodies";
import { MAX_SATELLITES } from "./constants";
import type {
  CelestialBodyId,
  CoverageMode,
  DisplayPreferences,
  MissionExport,
  SimulationSettings,
} from "../types/mission";
import {
  SATELLITE_TYPES,
  type Satellite,
  type SatelliteType,
} from "../types/satellite";

export type MissionExportInput = Omit<
  MissionExport,
  "schemaVersion" | "exportedAt"
> & {
  schemaVersion?: 1;
  exportedAt?: string;
};

export class MissionImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissionImportError";
  }
}

type UnknownRecord = Record<string, unknown>;

function fail(path: string, expectation: string): never {
  throw new MissionImportError(`${path} ${expectation}.`);
}

function readRecord(value: unknown, path: string): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fail(path, "must be an object");
  }
  return value as UnknownRecord;
}

function readString(
  value: unknown,
  path: string,
  options: { allowEmpty?: boolean; maximumLength?: number } = {},
): string {
  if (typeof value !== "string") return fail(path, "must be a string");
  const trimmed = value.trim();
  if (!options.allowEmpty && trimmed.length === 0) {
    return fail(path, "must not be empty");
  }
  if (trimmed.length > (options.maximumLength ?? 200)) {
    return fail(path, `must contain at most ${options.maximumLength ?? 200} characters`);
  }
  return trimmed;
}

function readBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") return fail(path, "must be a boolean");
  return value;
}

function readNumber(
  value: unknown,
  path: string,
  minimum: number,
  maximum: number,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    return fail(path, `must be a finite number from ${minimum} to ${maximum}`);
  }
  return value;
}

function isBodyId(value: string): value is CelestialBodyId {
  return value === "earth" || value === "moon" || value === "mars";
}

function readBodyId(value: unknown): CelestialBodyId {
  const bodyId = readString(value, "bodyId");
  if (!isBodyId(bodyId)) {
    return fail("bodyId", "must be earth, moon, or mars");
  }
  return bodyId;
}

function isSatelliteType(value: string): value is SatelliteType {
  return (SATELLITE_TYPES as readonly string[]).includes(value);
}

function readSatellite(
  value: unknown,
  index: number,
  bodyId: CelestialBodyId,
): Satellite {
  const path = `satellites[${index}]`;
  const record = readRecord(value, path);
  const type = readString(record.type, `${path}.type`);
  if (!isSatelliteType(type)) {
    return fail(`${path}.type`, "contains an unsupported satellite type");
  }

  const color = readString(record.color, `${path}.color`, { maximumLength: 7 });
  if (!/^#[0-9a-f]{6}$/i.test(color)) {
    return fail(`${path}.color`, "must be a six-digit hexadecimal color");
  }

  const body = getCelestialBody(bodyId);
  return {
    id: readString(record.id, `${path}.id`, { maximumLength: 100 }),
    name: readString(record.name, `${path}.name`, { maximumLength: 100 }),
    type,
    color,
    altitudeKm: readNumber(
      record.altitudeKm,
      `${path}.altitudeKm`,
      body.altitudeRangeKm[0],
      body.altitudeRangeKm[1],
    ),
    inclinationDeg: readNumber(
      record.inclinationDeg,
      `${path}.inclinationDeg`,
      0,
      180,
    ),
    ascendingNodeDeg: readNumber(
      record.ascendingNodeDeg,
      `${path}.ascendingNodeDeg`,
      0,
      360,
    ),
    phaseDeg: readNumber(record.phaseDeg, `${path}.phaseDeg`, 0, 360),
    speedMultiplier: readNumber(
      record.speedMultiplier,
      `${path}.speedMultiplier`,
      0.01,
      100,
    ),
    coverageAngleDeg: readNumber(
      record.coverageAngleDeg,
      `${path}.coverageAngleDeg`,
      0,
      180,
    ),
    active: readBoolean(record.active, `${path}.active`),
    showOrbit: readBoolean(record.showOrbit, `${path}.showOrbit`),
    showCoverage: readBoolean(record.showCoverage, `${path}.showCoverage`),
  };
}

function readSatellites(
  value: unknown,
  bodyId: CelestialBodyId,
): Satellite[] {
  if (!Array.isArray(value)) return fail("satellites", "must be an array");
  if (value.length > MAX_SATELLITES) {
    return fail("satellites", `must contain no more than ${MAX_SATELLITES} entries`);
  }

  const satellites = value.map((satellite, index) =>
    readSatellite(satellite, index, bodyId),
  );
  const ids = new Set<string>();
  for (const satellite of satellites) {
    if (ids.has(satellite.id)) {
      return fail("satellites", `contains the duplicate id ${satellite.id}`);
    }
    ids.add(satellite.id);
  }
  return satellites;
}

function readSimulation(value: unknown): SimulationSettings {
  const record = readRecord(value, "simulation");
  return {
    isPlaying: readBoolean(record.isPlaying, "simulation.isPlaying"),
    timeScale: readNumber(record.timeScale, "simulation.timeScale", 0.01, 1_000),
    elapsedSeconds: readNumber(
      record.elapsedSeconds,
      "simulation.elapsedSeconds",
      0,
      Number.MAX_SAFE_INTEGER,
    ),
  };
}

function isCoverageMode(value: string): value is CoverageMode {
  return value === "all" || value === "selected" || value === "none";
}

function readDisplay(value: unknown): DisplayPreferences {
  const record = readRecord(value, "display");
  const coverageMode = readString(record.coverageMode, "display.coverageMode");
  if (!isCoverageMode(coverageMode)) {
    return fail("display.coverageMode", "must be all, selected, or none");
  }

  return {
    coverageMode,
    showLinks: readBoolean(record.showLinks, "display.showLinks"),
    showAllOrbits: readBoolean(
      record.showAllOrbits,
      "display.showAllOrbits",
    ),
    autoRotate: readBoolean(record.autoRotate, "display.autoRotate"),
  };
}

export function validateMissionExport(value: unknown): MissionExport {
  const record = readRecord(value, "Mission");
  if (record.schemaVersion !== 1) {
    return fail("schemaVersion", "must equal 1");
  }

  const exportedAt = readString(record.exportedAt, "exportedAt");
  if (Number.isNaN(Date.parse(exportedAt))) {
    return fail("exportedAt", "must be a valid ISO date");
  }
  const bodyId = readBodyId(record.bodyId);
  const activePreset =
    record.activePreset === null
      ? null
      : readString(record.activePreset, "activePreset", { maximumLength: 100 });

  return {
    schemaVersion: 1,
    exportedAt,
    missionName: readString(record.missionName, "missionName", {
      maximumLength: 120,
    }),
    bodyId,
    satellites: readSatellites(record.satellites, bodyId),
    simulation: readSimulation(record.simulation),
    display: readDisplay(record.display),
    activePreset,
  };
}

export function exportMissionJson(mission: MissionExportInput): string {
  const normalized = validateMissionExport({
    ...mission,
    schemaVersion: 1,
    exportedAt: mission.exportedAt ?? new Date().toISOString(),
  });
  return JSON.stringify(normalized, null, 2);
}

export function parseMissionJson(json: string): MissionExport {
  if (typeof json !== "string" || json.trim().length === 0) {
    throw new MissionImportError("Mission JSON must not be empty.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    throw new MissionImportError("Mission file is not valid JSON.");
  }
  return validateMissionExport(parsed);
}
