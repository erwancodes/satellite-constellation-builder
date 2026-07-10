import { SATELLITE_COLORS } from "../lib/constants";
import type { Satellite, SatelliteType } from "../types/satellite";

export interface ConstellationPreset {
  id: string;
  name: string;
  description: string;
  satellites: Satellite[];
}

interface PresetSatelliteOptions {
  id: string;
  name: string;
  type: SatelliteType;
  colorIndex: number;
  altitudeKm: number;
  inclinationDeg: number;
  ascendingNodeDeg: number;
  phaseDeg: number;
  coverageAngleDeg: number;
}

function createPresetSatellite(options: PresetSatelliteOptions): Satellite {
  return {
    id: options.id,
    name: options.name,
    type: options.type,
    color:
      SATELLITE_COLORS[options.colorIndex % SATELLITE_COLORS.length] ??
      SATELLITE_COLORS[0],
    altitudeKm: options.altitudeKm,
    inclinationDeg: options.inclinationDeg,
    ascendingNodeDeg: options.ascendingNodeDeg,
    phaseDeg: options.phaseDeg,
    speedMultiplier: 1,
    coverageAngleDeg: options.coverageAngleDeg,
    active: true,
    showOrbit: true,
    showCoverage: true,
  };
}

const basicEquatorial = Array.from({ length: 6 }, (_, index) =>
  createPresetSatellite({
    id: `basic-equatorial-${index + 1}`,
    name: `EQ-${String(index + 1).padStart(2, "0")}`,
    type: "Communication",
    colorIndex: index,
    altitudeKm: 550,
    inclinationDeg: 5,
    ascendingNodeDeg: 0,
    phaseDeg: index * 60,
    coverageAngleDeg: 30,
  }),
);

const polarObservation = Array.from({ length: 8 }, (_, index) => {
  const plane = index % 4;
  const slot = Math.floor(index / 4);
  return createPresetSatellite({
    id: `polar-observation-${index + 1}`,
    name: `POL-${String(index + 1).padStart(2, "0")}`,
    type: "Observation",
    colorIndex: index,
    altitudeKm: 650,
    inclinationDeg: 97.6,
    ascendingNodeDeg: plane * 45,
    phaseDeg: slot * 180 + plane * 22.5,
    coverageAngleDeg: 28,
  });
});

const globalInternet = Array.from({ length: 24 }, (_, index) => {
  const plane = index % 3;
  const slot = Math.floor(index / 3);
  return createPresetSatellite({
    id: `global-internet-${index + 1}`,
    name: `NET-${String(index + 1).padStart(2, "0")}`,
    type: "Internet",
    colorIndex: plane,
    altitudeKm: 1_200,
    inclinationDeg: 53,
    ascendingNodeDeg: plane * 60,
    phaseDeg: slot * 45 + plane * 5,
    coverageAngleDeg: 34,
  });
});

const geostationaryRelay = Array.from({ length: 3 }, (_, index) =>
  createPresetSatellite({
    id: `geostationary-relay-${index + 1}`,
    name: `GEO-${index + 1}`,
    type: "Relay",
    colorIndex: index + 3,
    altitudeKm: 35_786,
    inclinationDeg: 0,
    ascendingNodeDeg: 0,
    phaseDeg: index * 120,
    coverageAngleDeg: 65,
  }),
);

export const PRESETS: ConstellationPreset[] = [
  {
    id: "basic-equatorial",
    name: "Basic Equatorial",
    description: "Six low-inclination satellites focused on equatorial service.",
    satellites: basicEquatorial,
  },
  {
    id: "polar-observation",
    name: "Polar Observation",
    description: "Eight near-polar observation satellites across four planes.",
    satellites: polarObservation,
  },
  {
    id: "global-internet",
    name: "Global Internet",
    description: "A 24-satellite, three-plane broadband constellation.",
    satellites: globalInternet,
  },
  {
    id: "geostationary-relay",
    name: "Geostationary Relay",
    description: "Three equatorial relay satellites spaced by 120 degrees.",
    satellites: geostationaryRelay,
  },
  {
    id: "empty-mission",
    name: "Empty Mission",
    description: "A clean workspace with no satellites.",
    satellites: [],
  },
];
