import { CELESTIAL_BODIES } from "./celestialBodies";
import {
  calculateOrbitalPeriodSeconds,
  calculateSatelliteCoveragePercent,
  calculateSatellitePosition,
  degToRad,
} from "./orbitalMath";
import type { CelestialBody, MissionAlert } from "../types/mission";
import type { Satellite } from "../types/satellite";

export type CoverageLabel =
  | "Poor Coverage"
  | "Limited Network"
  | "Operational Constellation"
  | "High Coverage"
  | "Global Network";

export interface CoverageMetrics {
  score: number;
  surfaceCoveragePercent: number;
  overlapPercent: number;
  activeSatellites: number;
  averageAltitudeKm: number;
  averageInclinationDeg: number;
  averagePeriodSeconds: number;
  efficiencyPercent: number;
}

export type NetworkQuality =
  | "Offline"
  | "Poor"
  | "Fair"
  | "Good"
  | "Excellent";

export interface NetworkMetrics {
  activeLinks: number;
  averageConnectivity: number;
  isolatedSatellites: number;
  qualityPercent: number;
  quality: NetworkQuality;
}

interface CoverageSummary {
  surfaceCoveragePercent: number;
  overlapPercent: number;
  efficiencyPercent: number;
  geometryQuality: number;
  rawCoveragePercent: number;
}

interface Vector3Km {
  x: number;
  y: number;
  z: number;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function circularUniformity(valuesDeg: number[], multiplier = 1): number {
  if (valuesDeg.length < 2) return 0;
  const components = valuesDeg.reduce(
    (result, value) => {
      const angle = degToRad(value * multiplier);
      return {
        x: result.x + Math.cos(angle),
        y: result.y + Math.sin(angle),
      };
    },
    { x: 0, y: 0 },
  );
  const meanVectorLength =
    Math.hypot(components.x, components.y) / valuesDeg.length;
  return clamp(1 - meanVectorLength, 0, 1);
}

function inclinationTilt(inclinationDeg: number): number {
  const normalized = ((inclinationDeg % 180) + 180) % 180;
  return Math.min(normalized, 180 - normalized);
}

function summarizeCoverage(
  activeSatellites: Satellite[],
  body: CelestialBody,
): CoverageSummary {
  if (activeSatellites.length === 0) {
    return {
      surfaceCoveragePercent: 0,
      overlapPercent: 0,
      efficiencyPercent: 0,
      geometryQuality: 0,
      rawCoveragePercent: 0,
    };
  }

  const individualFractions = activeSatellites.map(
    (satellite) => calculateSatelliteCoveragePercent(satellite, body) / 100,
  );
  const rawCoveragePercent =
    individualFractions.reduce((sum, fraction) => sum + fraction, 0) * 100;
  const independentUnion =
    1 -
    individualFractions.reduce(
      (remaining, fraction) => remaining * (1 - fraction),
      1,
    );
  const phaseUniformity = circularUniformity(
    activeSatellites.map((satellite) => satellite.phaseDeg),
  );
  // RAAN values 180 degrees apart describe the same geometric orbital plane.
  const planeUniformity = circularUniformity(
    activeSatellites.map((satellite) => satellite.ascendingNodeDeg),
    2,
  );
  const polarReach = average(
    activeSatellites.map((satellite) =>
      Math.sin(degToRad(inclinationTilt(satellite.inclinationDeg))),
    ),
  );
  const resilience = Math.min(activeSatellites.length / 12, 1);
  const geometryQuality = clamp(
    phaseUniformity * 0.4 +
      planeUniformity * 0.25 +
      polarReach * 0.25 +
      resilience * 0.1,
    0,
    1,
  );
  const surfaceCoveragePercent = clamp(
    independentUnion * 100 * (0.7 + geometryQuality * 0.3),
    0,
    100,
  );
  const overlapPercent =
    rawCoveragePercent === 0
      ? 0
      : clamp(
          ((rawCoveragePercent - surfaceCoveragePercent) / rawCoveragePercent) *
            100,
          0,
          100,
        );
  const usefulPotential = Math.min(rawCoveragePercent, 100);
  const efficiencyPercent =
    usefulPotential === 0
      ? 0
      : clamp((surfaceCoveragePercent / usefulPotential) * 100, 0, 100);

  return {
    surfaceCoveragePercent,
    overlapPercent,
    efficiencyPercent,
    geometryQuality,
    rawCoveragePercent,
  };
}

function scoreFromSummary(
  summary: CoverageSummary,
  activeSatelliteCount: number,
): number {
  if (activeSatelliteCount === 0 || summary.rawCoveragePercent === 0) return 0;

  const overlapPenalty = Math.max(0, summary.overlapPercent - 65) * 0.15;
  return clamp(
    Math.round(
      summary.surfaceCoveragePercent * 0.72 +
        summary.geometryQuality * 20 +
        Math.min(activeSatelliteCount / 12, 1) * 8 -
        overlapPenalty,
    ),
    0,
    100,
  );
}

export function calculateCoverageScore(
  satellites: Satellite[],
  body: CelestialBody = CELESTIAL_BODIES.earth,
): number {
  const activeSatellites = satellites.filter((satellite) => satellite.active);
  return scoreFromSummary(
    summarizeCoverage(activeSatellites, body),
    activeSatellites.length,
  );
}

export function calculateCoverageMetrics(
  satellites: Satellite[],
  body: CelestialBody = CELESTIAL_BODIES.earth,
): CoverageMetrics {
  const activeSatellites = satellites.filter((satellite) => satellite.active);
  const summary = summarizeCoverage(activeSatellites, body);

  return {
    score: scoreFromSummary(summary, activeSatellites.length),
    surfaceCoveragePercent: round(summary.surfaceCoveragePercent),
    overlapPercent: round(summary.overlapPercent),
    activeSatellites: activeSatellites.length,
    averageAltitudeKm: round(
      average(activeSatellites.map((satellite) => satellite.altitudeKm)),
    ),
    averageInclinationDeg: round(
      average(activeSatellites.map((satellite) => satellite.inclinationDeg)),
    ),
    averagePeriodSeconds: round(
      average(
        activeSatellites.map((satellite) =>
          calculateOrbitalPeriodSeconds(satellite.altitudeKm, body),
        ),
      ),
    ),
    efficiencyPercent: round(summary.efficiencyPercent),
  };
}

function toKilometerVector(
  satellite: Satellite,
  elapsedSeconds: number,
  body: CelestialBody,
): Vector3Km {
  const position = calculateSatellitePosition(satellite, elapsedSeconds, body);
  const kilometersPerSceneUnit = body.radiusKm / body.sceneRadius;
  return {
    x: position.x * kilometersPerSceneUnit,
    y: position.y * kilometersPerSceneUnit,
    z: position.z * kilometersPerSceneUnit,
  };
}

function distanceBetween(a: Vector3Km, b: Vector3Km): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function hasLineOfSight(
  a: Vector3Km,
  b: Vector3Km,
  bodyRadiusKm: number,
): boolean {
  const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const denominator = ab.x ** 2 + ab.y ** 2 + ab.z ** 2;
  if (denominator === 0) return true;

  const projection = clamp(
    -(a.x * ab.x + a.y * ab.y + a.z * ab.z) / denominator,
    0,
    1,
  );
  const closest = {
    x: a.x + ab.x * projection,
    y: a.y + ab.y * projection,
    z: a.z + ab.z * projection,
  };

  return Math.hypot(closest.x, closest.y, closest.z) > bodyRadiusKm * 1.002;
}

function getNetworkQuality(qualityPercent: number): NetworkQuality {
  if (qualityPercent <= 0) return "Offline";
  if (qualityPercent < 30) return "Poor";
  if (qualityPercent < 55) return "Fair";
  if (qualityPercent < 80) return "Good";
  return "Excellent";
}

export function calculateNetworkMetrics(
  satellites: Satellite[],
  body: CelestialBody = CELESTIAL_BODIES.earth,
  elapsedSeconds = 0,
): NetworkMetrics {
  const activeSatellites = satellites.filter((satellite) => satellite.active);
  const count = activeSatellites.length;
  if (count === 0) {
    return {
      activeLinks: 0,
      averageConnectivity: 0,
      isolatedSatellites: 0,
      qualityPercent: 0,
      quality: "Offline",
    };
  }

  const positions = activeSatellites.map((satellite) =>
    toKilometerVector(satellite, elapsedSeconds, body),
  );
  const degrees = Array.from({ length: count }, () => 0);
  let activeLinks = 0;

  for (let first = 0; first < count; first += 1) {
    for (let second = first + 1; second < count; second += 1) {
      const firstSatellite = activeSatellites[first];
      const secondSatellite = activeSatellites[second];
      const firstPosition = positions[first];
      const secondPosition = positions[second];
      if (
        !firstSatellite ||
        !secondSatellite ||
        !firstPosition ||
        !secondPosition
      ) {
        continue;
      }

      const maximumRangeKm = Math.max(
        body.radiusKm * 2.2,
        Math.min(
          Math.max(firstSatellite.altitudeKm, secondSatellite.altitudeKm) * 2.2,
          body.radiusKm * 12,
        ),
      );
      if (
        distanceBetween(firstPosition, secondPosition) <= maximumRangeKm &&
        hasLineOfSight(firstPosition, secondPosition, body.radiusKm)
      ) {
        activeLinks += 1;
        degrees[first] = (degrees[first] ?? 0) + 1;
        degrees[second] = (degrees[second] ?? 0) + 1;
      }
    }
  }

  const isolatedSatellites = degrees.filter((degree) => degree === 0).length;
  const maximumLinks = (count * (count - 1)) / 2;
  const density = maximumLinks === 0 ? 0 : activeLinks / maximumLinks;
  const connectedRatio = (count - isolatedSatellites) / count;
  const averageConnectivity =
    count <= 1 ? 0 : (average(degrees) / (count - 1)) * 100;
  const qualityPercent = clamp(density * 70 + connectedRatio * 30, 0, 100);

  return {
    activeLinks,
    averageConnectivity: round(averageConnectivity),
    isolatedSatellites,
    qualityPercent: round(qualityPercent),
    quality: getNetworkQuality(qualityPercent),
  };
}

export function getCoverageLabel(score: number): CoverageLabel {
  const normalizedScore = clamp(Number.isFinite(score) ? score : 0, 0, 100);
  if (normalizedScore <= 25) return "Poor Coverage";
  if (normalizedScore <= 50) return "Limited Network";
  if (normalizedScore <= 75) return "Operational Constellation";
  if (normalizedScore <= 90) return "High Coverage";
  return "Global Network";
}

export function buildMissionAlerts(
  satellites: Satellite[],
  body: CelestialBody = CELESTIAL_BODIES.earth,
  coverageMetrics = calculateCoverageMetrics(satellites, body),
  networkMetrics = calculateNetworkMetrics(satellites, body),
): MissionAlert[] {
  const activeSatellites = satellites.filter((satellite) => satellite.active);
  const alerts: MissionAlert[] = [];

  if (activeSatellites.length === 0) {
    return [
      {
        id: "no-active-satellites",
        level: "critical",
        title: "No active satellites",
        message: "Activate or add a satellite to begin network analysis.",
      },
    ];
  }

  const reentryRisk = activeSatellites.filter(
    (satellite) => satellite.altitudeKm < 180,
  );
  if (reentryRisk.length > 0) {
    alerts.push({
      id: "reentry-risk",
      level: "critical",
      title: "Re-entry risk",
      message: `${reentryRisk.length} satellite${reentryRisk.length === 1 ? " is" : "s are"} below 180 km.`,
    });
  } else {
    const lowSatellites = activeSatellites.filter(
      (satellite) => satellite.altitudeKm < body.altitudeRangeKm[0],
    );
    if (lowSatellites.length > 0) {
      alerts.push({
        id: "low-altitude",
        level: "warning",
        title: "Very low orbit",
        message: `${lowSatellites.length} satellite${lowSatellites.length === 1 ? " is" : "s are"} below the recommended ${body.altitudeRangeKm[0]} km floor.`,
      });
    }
  }

  const highLatencySatellites = activeSatellites.filter(
    (satellite) => satellite.altitudeKm > body.radiusKm * 3,
  );
  if (highLatencySatellites.length > 0) {
    alerts.push({
      id: "high-latency",
      level: "info",
      title: "High latency",
      message: `${highLatencySatellites.length} high-altitude satellite${highLatencySatellites.length === 1 ? " may" : "s may"} add communication delay.`,
    });
  }

  if (coverageMetrics.score <= 25) {
    alerts.push({
      id: "insufficient-coverage",
      level: coverageMetrics.score < 10 ? "critical" : "warning",
      title: "Insufficient coverage",
      message: `Estimated surface coverage is ${coverageMetrics.surfaceCoveragePercent.toFixed(1)}%.`,
    });
  }

  if (coverageMetrics.overlapPercent > 65) {
    alerts.push({
      id: "excessive-overlap",
      level: "warning",
      title: "Excessive overlap",
      message: "Redistribute orbital planes or phases to improve efficiency.",
    });
  }

  const inclinationValues = activeSatellites.map((satellite) =>
    inclinationTilt(satellite.inclinationDeg),
  );
  if (
    activeSatellites.length >= 4 &&
    Math.max(...inclinationValues) - Math.min(...inclinationValues) < 5
  ) {
    alerts.push({
      id: "similar-inclinations",
      level: "info",
      title: "Similar inclinations",
      message: "A more diverse plane geometry may improve regional coverage.",
    });
  }

  if (Math.max(...inclinationValues) < 60) {
    alerts.push({
      id: "no-polar-coverage",
      level: "warning",
      title: "No polar coverage",
      message: "Add a high-inclination orbit to reach polar regions.",
    });
  }

  if (networkMetrics.isolatedSatellites > 0) {
    alerts.push({
      id: "isolated-satellites",
      level: "warning",
      title: "Isolated satellites",
      message: `${networkMetrics.isolatedSatellites} satellite${networkMetrics.isolatedSatellites === 1 ? " has" : "s have"} no inter-satellite link.`,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "network-nominal",
      level: "info",
      title: "Network nominal",
      message: "No major geometry or coverage issue has been detected.",
    });
  }

  return alerts;
}
