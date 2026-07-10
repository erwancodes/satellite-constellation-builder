import { Vector3 } from "three";
import type { CelestialBody } from "../../types/mission";
import type { Satellite } from "../../types/satellite";

const TWO_PI = Math.PI * 2;

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function calculateOrbitalPeriodSeconds(
  altitudeKm: number,
  body: CelestialBody,
): number {
  const orbitalRadiusKm = body.radiusKm + Math.max(0, altitudeKm);
  return TWO_PI * Math.sqrt((orbitalRadiusKm ** 3) / body.gravitationalParameter);
}

export function calculateSceneOrbitRadius(
  altitudeKm: number,
  body: CelestialBody,
): number {
  return body.sceneRadius * (1 + Math.max(0, altitudeKm) / body.radiusKm);
}

export function calculateOrbitPoint(
  angleRadians: number,
  orbitRadius: number,
  inclinationRadians: number,
  ascendingNodeRadians: number,
  target: Vector3,
): Vector3 {
  const cosAngle = Math.cos(angleRadians);
  const sinAngle = Math.sin(angleRadians);
  const cosInclination = Math.cos(inclinationRadians);
  const sinInclination = Math.sin(inclinationRadians);
  const cosAscendingNode = Math.cos(ascendingNodeRadians);
  const sinAscendingNode = Math.sin(ascendingNodeRadians);

  const orbitalX = orbitRadius * cosAngle;
  const inclinedY = orbitRadius * sinAngle * sinInclination;
  const inclinedZ = orbitRadius * sinAngle * cosInclination;

  target.set(
    orbitalX * cosAscendingNode - inclinedZ * sinAscendingNode,
    inclinedY,
    orbitalX * sinAscendingNode + inclinedZ * cosAscendingNode,
  );

  return target;
}

export function calculateSatelliteScenePosition(
  satellite: Satellite,
  elapsedSeconds: number,
  body: CelestialBody,
  target: Vector3,
): Vector3 {
  const periodSeconds = calculateOrbitalPeriodSeconds(satellite.altitudeKm, body);
  const phaseRadians = degreesToRadians(satellite.phaseDeg);
  const simulatedAngle =
    phaseRadians +
    (elapsedSeconds / Math.max(periodSeconds, 1)) * TWO_PI * satellite.speedMultiplier;

  return calculateOrbitPoint(
    simulatedAngle,
    calculateSceneOrbitRadius(satellite.altitudeKm, body),
    degreesToRadians(satellite.inclinationDeg),
    degreesToRadians(satellite.ascendingNodeDeg),
    target,
  );
}

export function isLineOfSightClear(
  start: Vector3,
  end: Vector3,
  occluderRadius: number,
): boolean {
  const segmentX = end.x - start.x;
  const segmentY = end.y - start.y;
  const segmentZ = end.z - start.z;
  const segmentLengthSquared =
    segmentX * segmentX + segmentY * segmentY + segmentZ * segmentZ;

  if (segmentLengthSquared === 0) return false;

  const projection = Math.min(
    1,
    Math.max(
      0,
      -(
        start.x * segmentX +
        start.y * segmentY +
        start.z * segmentZ
      ) / segmentLengthSquared,
    ),
  );

  const closestX = start.x + segmentX * projection;
  const closestY = start.y + segmentY * projection;
  const closestZ = start.z + segmentZ * projection;
  const closestDistanceSquared =
    closestX * closestX + closestY * closestY + closestZ * closestZ;

  return closestDistanceSquared > occluderRadius * occluderRadius;
}
