import { describe, expect, it } from "vitest";
import { CELESTIAL_BODIES } from "./celestialBodies";
import {
  calculateOrbitalPeriodSeconds,
  calculateSatellitePosition,
  calculateSatelliteTelemetry,
  degToRad,
  radToDeg,
} from "./orbitalMath";
import type { Satellite } from "../types/satellite";

const satellite: Satellite = {
  id: "test-satellite",
  name: "Test Satellite",
  type: "Observation",
  color: "#55d6be",
  altitudeKm: 400,
  inclinationDeg: 0,
  ascendingNodeDeg: 0,
  phaseDeg: 0,
  speedMultiplier: 1,
  coverageAngleDeg: 30,
  active: true,
  showOrbit: true,
  showCoverage: true,
};

describe("orbitalMath", () => {
  it("converts between degrees and radians", () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI);
    expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
  });

  it("calculates credible circular-orbit periods", () => {
    const lowEarthOrbitPeriod = calculateOrbitalPeriodSeconds(
      400,
      CELESTIAL_BODIES.earth,
    );
    const geostationaryPeriod = calculateOrbitalPeriodSeconds(
      35_786,
      CELESTIAL_BODIES.earth,
    );

    expect(lowEarthOrbitPeriod).toBeGreaterThan(5_500);
    expect(lowEarthOrbitPeriod).toBeLessThan(5_600);
    // The configured mean Earth radius is 6,371 km, so the result is slightly
    // below the conventional value based on Earth's equatorial radius.
    expect(geostationaryPeriod).toBeCloseTo(86_164, -2);
  });

  it("advances an equatorial satellite by a quarter orbit", () => {
    const period = calculateOrbitalPeriodSeconds(
      satellite.altitudeKm,
      CELESTIAL_BODIES.earth,
    );
    const start = calculateSatellitePosition(
      satellite,
      0,
      CELESTIAL_BODIES.earth,
    );
    const quarter = calculateSatellitePosition(
      satellite,
      period / 4,
      CELESTIAL_BODIES.earth,
    );

    expect(start.x).toBeCloseTo(start.radiusScene, 8);
    expect(start.y).toBeCloseTo(0, 8);
    expect(start.z).toBeCloseTo(0, 8);
    expect(quarter.x).toBeCloseTo(0, 8);
    expect(quarter.y).toBeCloseTo(0, 8);
    expect(quarter.z).toBeCloseTo(quarter.radiusScene, 8);
    expect(quarter.progress).toBeCloseTo(0.25, 8);
  });

  it("applies inclination and exposes latitude/longitude telemetry", () => {
    const polarSatellite = { ...satellite, inclinationDeg: 90 };
    const period = calculateOrbitalPeriodSeconds(
      polarSatellite.altitudeKm,
      CELESTIAL_BODIES.earth,
    );
    const position = calculateSatellitePosition(
      polarSatellite,
      period / 4,
      CELESTIAL_BODIES.earth,
    );
    const telemetry = calculateSatelliteTelemetry(
      polarSatellite,
      period / 4,
      CELESTIAL_BODIES.earth,
    );

    expect(position.y).toBeCloseTo(position.radiusScene, 8);
    expect(position.x).toBeCloseTo(0, 8);
    expect(position.z).toBeCloseTo(0, 8);
    expect(telemetry.latitudeDeg).toBeCloseTo(90, 8);
    expect(telemetry.periodSeconds).toBeCloseTo(period, 8);
    expect(telemetry.velocityKmPerSecond).toBeGreaterThan(7);
  });
});
