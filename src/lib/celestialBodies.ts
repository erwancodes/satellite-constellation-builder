import type { CelestialBody, CelestialBodyId } from "../types/mission";

export const CELESTIAL_BODIES: Record<CelestialBodyId, CelestialBody> = {
  earth: {
    id: "earth",
    name: "Earth",
    modeName: "Earth Network",
    radiusKm: 6_371,
    gravitationalParameter: 398_600.4418,
    sceneRadius: 1,
    texturePaths: {
      color: "/textures/earth/earth-color.png",
      normal: "/textures/earth/earth-topography.png",
      night: "/textures/earth/earth-night.jpg",
      clouds: "/textures/earth/earth-clouds.jpg",
    },
    surfaceTint: "#8db7c7",
    atmosphereColor: "#5bc0eb",
    hasClouds: true,
    altitudeRangeKm: [200, 36_000],
  },
  moon: {
    id: "moon",
    name: "Moon",
    modeName: "Moon Relay",
    radiusKm: 1_737.4,
    gravitationalParameter: 4_902.8001,
    sceneRadius: 1,
    texturePaths: {
      color: "/textures/moon/moon-color.jpg",
      normal: "/textures/moon/moon-topography.jpg",
    },
    surfaceTint: "#b9b7b1",
    atmosphereColor: "#9ca3af",
    hasClouds: false,
    altitudeRangeKm: [50, 10_000],
  },
  mars: {
    id: "mars",
    name: "Mars",
    modeName: "Mars Internet",
    radiusKm: 3_389.5,
    gravitationalParameter: 42_828.3752,
    sceneRadius: 1,
    texturePaths: {
      color: "/textures/mars/mars-color.jpg",
      normal: "/textures/mars/mars-topography.jpg",
    },
    surfaceTint: "#c76d45",
    atmosphereColor: "#d5895a",
    hasClouds: false,
    altitudeRangeKm: [100, 20_000],
  },
};

export function getCelestialBody(id: CelestialBodyId): CelestialBody {
  return CELESTIAL_BODIES[id];
}
