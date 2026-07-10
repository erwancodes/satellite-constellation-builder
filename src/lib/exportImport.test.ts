import { describe, expect, it } from "vitest";
import { PRESETS } from "../data/presets";
import {
  exportMissionJson,
  MissionImportError,
  parseMissionJson,
  type MissionExportInput,
} from "./exportImport";

function getExampleMission(): MissionExportInput {
  const satellite = PRESETS[0]?.satellites[0];
  if (!satellite) throw new Error("The basic preset must include a satellite.");

  return {
    missionName: "Unit Test Mission",
    bodyId: "earth",
    satellites: [{ ...satellite }],
    simulation: {
      isPlaying: false,
      timeScale: 20,
      elapsedSeconds: 1_234,
    },
    display: {
      coverageMode: "selected",
      showLinks: true,
      showAllOrbits: true,
      autoRotate: false,
    },
    activePreset: "basic-equatorial",
  };
}

describe("mission export/import", () => {
  it("round-trips a complete mission through formatted JSON", () => {
    const mission = getExampleMission();
    const json = exportMissionJson(mission);
    const imported = parseMissionJson(json);

    expect(json).toContain("\n  \"schemaVersion\"");
    expect(imported.schemaVersion).toBe(1);
    expect(imported.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(imported.missionName).toBe(mission.missionName);
    expect(imported.bodyId).toBe(mission.bodyId);
    expect(imported.satellites).toEqual(mission.satellites);
    expect(imported.simulation).toEqual(mission.simulation);
    expect(imported.display).toEqual(mission.display);
  });

  it("rejects malformed JSON and unsupported schema versions", () => {
    expect(() => parseMissionJson("{not-json}")).toThrow(MissionImportError);
    expect(() =>
      parseMissionJson(
        JSON.stringify({
          ...getExampleMission(),
          schemaVersion: 2,
          exportedAt: "2026-07-10T10:00:00.000Z",
        }),
      ),
    ).toThrow(/schemaVersion/);
  });

  it("strictly validates satellite fields and unique identifiers", () => {
    const validJson = exportMissionJson(getExampleMission());
    expect(() =>
      parseMissionJson(validJson.replace('"Communication"', '"Weather"')),
    ).toThrow(/satellite type/);

    const mission = getExampleMission();
    const satellite = mission.satellites[0];
    if (!satellite) throw new Error("Expected an example satellite.");
    expect(() =>
      parseMissionJson(
        JSON.stringify({
          ...mission,
          schemaVersion: 1,
          exportedAt: "2026-07-10T10:00:00.000Z",
          satellites: [satellite, { ...satellite }],
        }),
      ),
    ).toThrow(/duplicate id/);
  });
});
