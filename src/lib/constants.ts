export const EARTH_RADIUS_KM = 6_371;
export const EARTH_GRAVITATIONAL_PARAMETER_KM3_S2 = 398_600.4418;
export const KM_TO_SCENE_UNITS = 1 / EARTH_RADIUS_KM;
export const MAX_SATELLITES = 120;
export const DEFAULT_TIME_SCALE = 20;
export const TIME_SCALES = [0.25, 0.5, 1, 5, 20, 100] as const;

export const SATELLITE_COLORS = [
  "#55d6be",
  "#4fb3ff",
  "#ffb454",
  "#b8a1ff",
  "#f07878",
  "#7bd389",
  "#72ddf7",
  "#e6c56e",
] as const;

export const DEFAULT_DISPLAY_PREFERENCES = {
  coverageMode: "all",
  showLinks: false,
  showAllOrbits: true,
  autoRotate: false,
} as const;
