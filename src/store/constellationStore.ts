import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CELESTIAL_BODIES } from "../lib/celestialBodies";
import {
  DEFAULT_DISPLAY_PREFERENCES,
  DEFAULT_TIME_SCALE,
  MAX_SATELLITES,
  SATELLITE_COLORS,
} from "../lib/constants";
import { clamp } from "../lib/utils";
import type {
  CelestialBodyId,
  DisplayPreferences,
  MissionExport,
} from "../types/mission";
import type { Satellite } from "../types/satellite";

interface ConstellationState {
  missionName: string;
  bodyId: CelestialBodyId;
  satellites: Satellite[];
  selectedId: string | null;
  activePreset: string | null;
  display: DisplayPreferences;
  isPlaying: boolean;
  timeScale: number;
  elapsedSeconds: number;
  hasHydrated: boolean;
  setMissionName: (name: string) => void;
  setBodyId: (bodyId: CelestialBodyId) => void;
  addSatellite: (overrides?: Partial<Satellite>) => string | null;
  duplicateSatellite: (id: string) => string | null;
  updateSatellite: (id: string, patch: Partial<Satellite>) => void;
  removeSatellite: (id: string) => void;
  selectSatellite: (id: string | null) => void;
  replaceSatellites: (satellites: Satellite[], presetId?: string | null) => void;
  setDisplay: (patch: Partial<DisplayPreferences>) => void;
  setPlaying: (isPlaying: boolean) => void;
  togglePlaying: () => void;
  setTimeScale: (timeScale: number) => void;
  advanceTime: (realDeltaSeconds: number) => void;
  resetTime: () => void;
  resetMission: () => void;
  importMission: (mission: MissionExport) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

function createId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `sat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultSatellite(
  index: number,
  overrides: Partial<Satellite> = {},
): Satellite {
  return {
    id: createId(),
    name: `Aster ${String(index + 1).padStart(2, "0")}`,
    type: "Internet",
    color: SATELLITE_COLORS[index % SATELLITE_COLORS.length] ?? "#55d6be",
    altitudeKm: 550,
    inclinationDeg: 53,
    ascendingNodeDeg: (index % 3) * 60,
    phaseDeg: (index * 60) % 360,
    speedMultiplier: 1,
    coverageAngleDeg: 20,
    active: true,
    showOrbit: true,
    showCoverage: true,
    ...overrides,
  };
}

function createInitialSatellites(): Satellite[] {
  return Array.from({ length: 6 }, (_, index) =>
    createDefaultSatellite(index, {
      inclinationDeg: 12,
      ascendingNodeDeg: 0,
      phaseDeg: index * 60,
      coverageAngleDeg: 24,
    }),
  );
}

const INITIAL_SATELLITES = createInitialSatellites();

export const useConstellationStore = create<ConstellationState>()(
  persist(
    (set, get) => ({
      missionName: "Asteria-01",
      bodyId: "earth",
      satellites: INITIAL_SATELLITES,
      selectedId: INITIAL_SATELLITES[0]?.id ?? null,
      activePreset: "basic-equatorial",
      display: { ...DEFAULT_DISPLAY_PREFERENCES },
      isPlaying: true,
      timeScale: DEFAULT_TIME_SCALE,
      elapsedSeconds: 0,
      hasHydrated: false,

      setMissionName: (missionName) => set({ missionName }),

      setBodyId: (bodyId) => {
        const [minAltitude, maxAltitude] = CELESTIAL_BODIES[bodyId].altitudeRangeKm;
        set((state) => ({
          bodyId,
          activePreset: null,
          elapsedSeconds: 0,
          satellites: state.satellites.map((satellite) => ({
            ...satellite,
            altitudeKm: clamp(satellite.altitudeKm, minAltitude, maxAltitude),
          })),
        }));
      },

      addSatellite: (overrides = {}) => {
        const state = get();
        if (state.satellites.length >= MAX_SATELLITES) return null;
        const satellite = createDefaultSatellite(state.satellites.length, overrides);
        set({
          satellites: [...state.satellites, satellite],
          selectedId: satellite.id,
          activePreset: null,
        });
        return satellite.id;
      },

      duplicateSatellite: (id) => {
        const state = get();
        if (state.satellites.length >= MAX_SATELLITES) return null;
        const source = state.satellites.find((satellite) => satellite.id === id);
        if (!source) return null;
        const clone = createDefaultSatellite(state.satellites.length, {
          ...source,
          id: createId(),
          name: `${source.name} Copy`,
          phaseDeg: (source.phaseDeg + 18) % 360,
        });
        set({
          satellites: [...state.satellites, clone],
          selectedId: clone.id,
          activePreset: null,
        });
        return clone.id;
      },

      updateSatellite: (id, patch) => {
        const body = CELESTIAL_BODIES[get().bodyId];
        set((state) => ({
          satellites: state.satellites.map((satellite) => {
            if (satellite.id !== id) return satellite;
            const next = { ...satellite, ...patch };
            return {
              ...next,
              altitudeKm: clamp(next.altitudeKm, body.altitudeRangeKm[0], body.altitudeRangeKm[1]),
              inclinationDeg: clamp(next.inclinationDeg, 0, 180),
              ascendingNodeDeg: ((next.ascendingNodeDeg % 360) + 360) % 360,
              phaseDeg: ((next.phaseDeg % 360) + 360) % 360,
              speedMultiplier: clamp(next.speedMultiplier, 0.1, 4),
              coverageAngleDeg: clamp(next.coverageAngleDeg, 1, 85),
            };
          }),
          activePreset: null,
        }));
      },

      removeSatellite: (id) =>
        set((state) => {
          const satellites = state.satellites.filter((satellite) => satellite.id !== id);
          return {
            satellites,
            selectedId:
              state.selectedId === id ? (satellites[0]?.id ?? null) : state.selectedId,
            activePreset: null,
          };
        }),

      selectSatellite: (selectedId) => set({ selectedId }),

      replaceSatellites: (satellites, activePreset = null) => {
        const uniqueIds = new Set<string>();
        const normalized = satellites.slice(0, MAX_SATELLITES).map((satellite, index) => {
          let id = satellite.id;
          if (!id || uniqueIds.has(id)) id = createId();
          uniqueIds.add(id);
          return { ...satellite, id, name: satellite.name || `Satellite ${index + 1}` };
        });
        set({
          satellites: normalized,
          selectedId: normalized[0]?.id ?? null,
          activePreset,
          elapsedSeconds: 0,
        });
      },

      setDisplay: (patch) =>
        set((state) => ({ display: { ...state.display, ...patch } })),
      setPlaying: (isPlaying) => set({ isPlaying }),
      togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
      setTimeScale: (timeScale) => set({ timeScale }),
      advanceTime: (realDeltaSeconds) =>
        set((state) =>
          state.isPlaying
            ? {
                elapsedSeconds:
                  state.elapsedSeconds + Math.min(0.25, Math.max(0, realDeltaSeconds)) * state.timeScale,
              }
            : state,
        ),
      resetTime: () => set({ elapsedSeconds: 0 }),

      resetMission: () => {
        const satellites = createInitialSatellites();
        set({
          missionName: "Asteria-01",
          bodyId: "earth",
          satellites,
          selectedId: satellites[0]?.id ?? null,
          activePreset: "basic-equatorial",
          display: { ...DEFAULT_DISPLAY_PREFERENCES },
          isPlaying: true,
          timeScale: DEFAULT_TIME_SCALE,
          elapsedSeconds: 0,
        });
      },

      importMission: (mission) =>
        set({
          missionName: mission.missionName,
          bodyId: mission.bodyId,
          satellites: mission.satellites,
          selectedId: mission.satellites[0]?.id ?? null,
          activePreset: mission.activePreset,
          display: mission.display,
          isPlaying: mission.simulation.isPlaying,
          timeScale: mission.simulation.timeScale,
          elapsedSeconds: mission.simulation.elapsedSeconds,
        }),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "satellite-constellation-builder-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        missionName: state.missionName,
        bodyId: state.bodyId,
        satellites: state.satellites,
        selectedId: state.selectedId,
        activePreset: state.activePreset,
        display: state.display,
        isPlaying: state.isPlaying,
        timeScale: state.timeScale,
        elapsedSeconds: state.elapsedSeconds,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);

export function getMissionSnapshot(): MissionExport {
  const state = useConstellationStore.getState();
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    missionName: state.missionName,
    bodyId: state.bodyId,
    satellites: state.satellites,
    simulation: {
      isPlaying: state.isPlaying,
      timeScale: state.timeScale,
      elapsedSeconds: state.elapsedSeconds,
    },
    display: state.display,
    activePreset: state.activePreset,
  };
}
