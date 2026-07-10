import { describe, expect, it } from "vitest";
import { PRESETS } from "./presets";

describe("constellation presets", () => {
  it("contains the five requested configurations and satellite counts", () => {
    expect(PRESETS.map((preset) => preset.id)).toEqual([
      "basic-equatorial",
      "polar-observation",
      "global-internet",
      "geostationary-relay",
      "empty-mission",
    ]);
    expect(PRESETS.map((preset) => preset.satellites.length)).toEqual([
      6, 8, 24, 3, 0,
    ]);
  });

  it("spaces geostationary relays by 120 degrees", () => {
    const preset = PRESETS.find(
      (candidate) => candidate.id === "geostationary-relay",
    );
    expect(preset?.satellites.map((satellite) => satellite.phaseDeg)).toEqual([
      0, 120, 240,
    ]);
    expect(
      preset?.satellites.every(
        (satellite) =>
          satellite.altitudeKm === 35_786 && satellite.inclinationDeg === 0,
      ),
    ).toBe(true);
  });
});
