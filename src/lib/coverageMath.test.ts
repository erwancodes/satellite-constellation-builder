import { describe, expect, it } from "vitest";
import { PRESETS } from "../data/presets";
import { CELESTIAL_BODIES } from "./celestialBodies";
import {
  buildMissionAlerts,
  calculateCoverageMetrics,
  calculateCoverageScore,
  getCoverageLabel,
} from "./coverageMath";

function getPreset(id: string) {
  const preset = PRESETS.find((candidate) => candidate.id === id);
  if (!preset) throw new Error(`Missing test preset: ${id}`);
  return preset;
}

describe("coverageMath", () => {
  it("returns zeroed metrics for an empty mission", () => {
    const metrics = calculateCoverageMetrics([], CELESTIAL_BODIES.earth);

    expect(metrics.score).toBe(0);
    expect(metrics.surfaceCoveragePercent).toBe(0);
    expect(metrics.activeSatellites).toBe(0);
    expect(calculateCoverageScore([], CELESTIAL_BODIES.earth)).toBe(0);
  });

  it("rewards a distributed global constellation", () => {
    const basic = calculateCoverageMetrics(
      getPreset("basic-equatorial").satellites,
      CELESTIAL_BODIES.earth,
    );
    const global = calculateCoverageMetrics(
      getPreset("global-internet").satellites,
      CELESTIAL_BODIES.earth,
    );

    expect(global.score).toBeGreaterThan(basic.score);
    expect(global.surfaceCoveragePercent).toBeGreaterThan(
      basic.surfaceCoveragePercent,
    );
    expect(global.score).toBeGreaterThanOrEqual(51);
    expect(global.score).toBeLessThanOrEqual(100);
  });

  it("ignores inactive satellites", () => {
    const inactive = getPreset("basic-equatorial").satellites.map((satellite) => ({
      ...satellite,
      active: false,
    }));
    expect(calculateCoverageMetrics(inactive).activeSatellites).toBe(0);
    expect(calculateCoverageScore(inactive)).toBe(0);
  });

  it("maps score bands to the requested labels", () => {
    expect(getCoverageLabel(0)).toBe("Poor Coverage");
    expect(getCoverageLabel(26)).toBe("Limited Network");
    expect(getCoverageLabel(51)).toBe("Operational Constellation");
    expect(getCoverageLabel(76)).toBe("High Coverage");
    expect(getCoverageLabel(91)).toBe("Global Network");
  });

  it("reports the absence of active satellites as critical", () => {
    expect(buildMissionAlerts([])).toEqual([
      expect.objectContaining({
        id: "no-active-satellites",
        level: "critical",
      }),
    ]);
  });
});
