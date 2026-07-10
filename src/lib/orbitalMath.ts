import { CELESTIAL_BODIES } from "./celestialBodies";
import type { CelestialBody } from "../types/mission";
import type { Satellite, SatelliteTelemetry } from "../types/satellite";

const TWO_PI = Math.PI * 2;

export interface SatellitePosition {
  x: number;
  y: number;
  z: number;
  radiusKm: number;
  radiusScene: number;
  trueAnomalyRad: number;
  progress: number;
  latitudeDeg: number;
  longitudeDeg: number;
}

export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function calculateOrbitalRadiusKm(
  altitudeKm: number,
  body: CelestialBody = CELESTIAL_BODIES.earth,
): number {
  return body.radiusKm + Math.max(0, finiteOr(altitudeKm, 0));
}

export function calculateOrbitalRadiusScene(
  altitudeKm: number,
  body: CelestialBody = CELESTIAL_BODIES.earth,
): number {
  return (
    (calculateOrbitalRadiusKm(altitudeKm, body) / body.radiusKm) *
    body.sceneRadius
  );
}

export function calculateOrbitalPeriodSeconds(
  altitudeKm: number,
  body: CelestialBody = CELESTIAL_BODIES.earth,
): number {
  const radiusKm = calculateOrbitalRadiusKm(altitudeKm, body);
  return TWO_PI * Math.sqrt(radiusKm ** 3 / body.gravitationalParameter);
}

export function calculateOrbitalVelocityKmPerSecond(
  altitudeKm: number,
  body: CelestialBody = CELESTIAL_BODIES.earth,
): number {
  const radiusKm = calculateOrbitalRadiusKm(altitudeKm, body);
  return Math.sqrt(body.gravitationalParameter / radiusKm);
}

/**
 * Returns the maximum visible ground angle. The configured coverage angle is
 * interpreted as a central angle on the body's surface and is capped at the
 * satellite's geometric horizon.
 */
export function calculateGroundCoverageAngleDeg(
  altitudeKm: number,
  configuredCoverageAngleDeg: number,
  body: CelestialBody = CELESTIAL_BODIES.earth,
): number {
  const radiusKm = calculateOrbitalRadiusKm(altitudeKm, body);
  const horizonAngle = Math.acos(clamp(body.radiusKm / radiusKm, -1, 1));
  const configuredAngle = degToRad(
    clamp(finiteOr(configuredCoverageAngleDeg, 0), 0, 180),
  );

  return radToDeg(Math.min(horizonAngle, configuredAngle));
}

/** Percentage of the body's total surface covered by one spherical cap. */
export function calculateSatelliteCoveragePercent(
  satellite: Pick<Satellite, "altitudeKm" | "coverageAngleDeg">,
  body: CelestialBody = CELESTIAL_BODIES.earth,
): number {
  const angleRad = degToRad(
    calculateGroundCoverageAngleDeg(
      satellite.altitudeKm,
      satellite.coverageAngleDeg,
      body,
    ),
  );
  return ((1 - Math.cos(angleRad)) / 2) * 100;
}

/**
 * Computes a circular-orbit position in a Three.js-friendly Y-up frame.
 * X/Z form the equatorial plane and +Y points toward the north pole.
 */
export function calculateSatellitePosition(
  satellite: Satellite,
  elapsedSeconds: number,
  body: CelestialBody = CELESTIAL_BODIES.earth,
): SatellitePosition {
  const periodSeconds = calculateOrbitalPeriodSeconds(satellite.altitudeKm, body);
  const speedMultiplier =
    Number.isFinite(satellite.speedMultiplier) && satellite.speedMultiplier > 0
      ? satellite.speedMultiplier
      : 1;
  const elapsed = finiteOr(elapsedSeconds, 0);
  const trueAnomalyRad = positiveModulo(
    degToRad(finiteOr(satellite.phaseDeg, 0)) +
      (TWO_PI * elapsed * speedMultiplier) / periodSeconds,
    TWO_PI,
  );
  const inclinationRad = degToRad(
    clamp(finiteOr(satellite.inclinationDeg, 0), 0, 180),
  );
  const ascendingNodeRad = degToRad(
    positiveModulo(finiteOr(satellite.ascendingNodeDeg, 0), 360),
  );
  const radiusKm = calculateOrbitalRadiusKm(satellite.altitudeKm, body);
  const radiusScene = calculateOrbitalRadiusScene(satellite.altitudeKm, body);

  const cosNode = Math.cos(ascendingNodeRad);
  const sinNode = Math.sin(ascendingNodeRad);
  const cosAnomaly = Math.cos(trueAnomalyRad);
  const sinAnomaly = Math.sin(trueAnomalyRad);
  const cosInclination = Math.cos(inclinationRad);
  const sinInclination = Math.sin(inclinationRad);

  // Standard inertial Z-up coordinates mapped to Three.js Y-up coordinates.
  const x =
    radiusScene *
    (cosNode * cosAnomaly - sinNode * sinAnomaly * cosInclination);
  const z =
    radiusScene *
    (sinNode * cosAnomaly + cosNode * sinAnomaly * cosInclination);
  const y = radiusScene * sinAnomaly * sinInclination;
  const latitudeDeg = radToDeg(
    Math.asin(clamp(y / Math.max(radiusScene, Number.EPSILON), -1, 1)),
  );
  const longitudeDeg = radToDeg(Math.atan2(z, x));

  return {
    x,
    y,
    z,
    radiusKm,
    radiusScene,
    trueAnomalyRad,
    progress: trueAnomalyRad / TWO_PI,
    latitudeDeg,
    longitudeDeg,
  };
}

export function calculateSatelliteTelemetry(
  satellite: Satellite,
  elapsedSeconds: number,
  body: CelestialBody = CELESTIAL_BODIES.earth,
): SatelliteTelemetry {
  const position = calculateSatellitePosition(satellite, elapsedSeconds, body);
  const speedMultiplier =
    Number.isFinite(satellite.speedMultiplier) && satellite.speedMultiplier > 0
      ? satellite.speedMultiplier
      : 1;

  return {
    latitudeDeg: position.latitudeDeg,
    longitudeDeg: position.longitudeDeg,
    altitudeKm: satellite.altitudeKm,
    velocityKmPerSecond:
      calculateOrbitalVelocityKmPerSecond(satellite.altitudeKm, body) *
      speedMultiplier,
    periodSeconds:
      calculateOrbitalPeriodSeconds(satellite.altitudeKm, body) / speedMultiplier,
    progress: position.progress,
    coveragePercent: calculateSatelliteCoveragePercent(satellite, body),
    communication: satellite.active ? "Nominal" : "Offline",
  };
}
