import { describe, expect, it } from "vitest";
import { MAX_SATELLITES } from "./constants";
import { generateConstellation } from "./constellationGenerator";

describe("generateConstellation", () => {
  it("builds a Walker-like constellation across the requested planes", () => {
    const satellites = generateConstellation({
      count: 12,
      altitudeKm: 1_200,
      orbitalPlanes: 3,
      inclinationDeg: 53,
      missionGoal: "low-latency-internet",
      idPrefix: "test-network",
    });

    expect(satellites).toHaveLength(12);
    expect(new Set(satellites.map((satellite) => satellite.id)).size).toBe(12);
    expect(
      [...new Set(satellites.map((satellite) => satellite.ascendingNodeDeg))].sort(
        (a, b) => a - b,
      ),
    ).toEqual([0, 120, 240]);
    expect(satellites.every((satellite) => satellite.altitudeKm === 1_200)).toBe(
      true,
    );
    expect(satellites.every((satellite) => satellite.type === "Internet")).toBe(
      true,
    );
  });

  it("returns an empty constellation when zero satellites are requested", () => {
    expect(
      generateConstellation({
        count: 0,
        altitudeKm: 550,
        orbitalPlanes: 0,
        inclinationDeg: 0,
        missionGoal: "equatorial-coverage",
      }),
    ).toEqual([]);
  });

  it("rejects unsafe counts and invalid orbital parameters", () => {
    expect(() =>
      generateConstellation({
        count: MAX_SATELLITES + 1,
        altitudeKm: 550,
        orbitalPlanes: 1,
        inclinationDeg: 53,
        missionGoal: "maximum-global-coverage",
      }),
    ).toThrow(RangeError);
    expect(() =>
      generateConstellation({
        count: 6,
        altitudeKm: 550,
        orbitalPlanes: 7,
        inclinationDeg: 53,
        missionGoal: "maximum-global-coverage",
      }),
    ).toThrow(RangeError);
  });
});
