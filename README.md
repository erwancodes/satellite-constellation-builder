# Satellite Constellation Builder

Satellite Constellation Builder is an interactive mission-control workbench for designing, simulating, and comparing satellite constellations around Earth, the Moon, and Mars. The Earth workflow is the primary MVP; Moon and Mars reuse the same orbital engine with body-specific radii, gravitational parameters, textures, and altitude limits.

> The orbital propagation, ground coverage, link budget, and scoring models are deliberate interactive approximations. This application must not be used to prepare, validate, or operate a real mission.

Screenshots can be added to this README as the product evolves.

## What works

- Textured React Three Fiber scene with day color, topography, night lights, clouds, atmosphere, stars, and directional sunlight.
- Clickable primitive-built satellite models, inclined orbit traces, moving coverage footprints, and optional line-of-sight links.
- Live editing of altitude, inclination, ascending node, phase, velocity factor, coverage cone, visibility, and active state.
- Fleet CRUD, inline renaming, duplication, five presets, and a Walker-style automatic constellation generator.
- Play/pause, time reset, and `x0.25` through `x100` time acceleration.
- Coverage, overlap, efficiency, orbital, network, telemetry, and advisory panels.
- Strict JSON import/export, validation, reset confirmation, and automatic `localStorage` persistence.
- Desktop three-column mission-control layout plus tablet/mobile drawers.
- Earth, Moon, and Mars body configurations with recalculated periods, velocity, radius, and coverage.

## Install and run

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## Commands

```bash
npm run dev          # Vite development server
npm run build        # strict TypeScript project build + production bundle
npm run preview      # preview the production bundle
npm run typecheck    # TypeScript project references only
npm test             # run the Vitest suite once
npm run test:watch   # interactive Vitest watch mode
```

## Keyboard controls

| Key | Action |
| --- | --- |
| `Space` | Play or pause simulation |
| `A` | Add a satellite |
| `R` | Recenter the camera |
| `Delete` | Delete the selected satellite |
| `1` | Set time scale to `x1` |
| `2` | Set time scale to `x20` |
| `3` | Set time scale to `x100` |

Shortcuts are ignored while an input, select, or dialog is active.

## Architecture

```text
src/
  components/
    analytics/       score, metrics, chart, telemetry, alerts
    common/          shared mission-control primitives
    layout/          top bar, side panels, HUD, timeline
    presets/         preset selection
    satellites/      list, editor, generator
    scene/           body, atmosphere, clouds, satellites, links, camera
    ui/              customized shadcn/Radix primitives
  data/              preset definitions
  hooks/             simulation clock
  lib/               orbital/coverage math, bodies, generator, JSON validation
  store/             persisted Zustand mission state
  types/             strict domain types
```

The simulation clock writes only the small runtime slice of the Zustand store. Three.js objects read the current time inside `useFrame` and mutate refs, so the React interface and the full satellite tree are not rerendered every frame. Optional inter-satellite links are paired once and updated on a throttled cadence. Geometry and materials are reused where practical.

## Simulation model

For each celestial body, the engine explicitly stores the mean radius `R`, gravitational parameter `mu`, scene radius, textures, and valid altitude range.

- Circular orbital radius: `r = R + altitude`
- Period: `T = 2 * pi * sqrt(r^3 / mu)`
- Circular velocity: `v = sqrt(mu / r)`
- Position: a circular anomaly advanced by elapsed time and velocity factor, then rotated by inclination and simplified ascending-node longitude.
- Coverage: a spherical-cap approximation limited by both the configured coverage angle and geometric horizon.
- Links: distance and unobstructed line-of-sight approximation between active satellites.
- Score: bounded heuristic combining theoretical union coverage, overlap, phase spacing, plane diversity, inclination reach, and fleet resilience.

The model omits eccentricity, perturbations, oblateness, atmosphere, station keeping, occultation detail, real antenna patterns, propagation delay, regulatory constraints, and real ephemerides.

## Presets

- **Basic Equatorial** — 6 low-inclination satellites.
- **Polar Observation** — 8 near-polar satellites across four planes.
- **Global Internet** — 24 satellites across three planes.
- **Geostationary Relay** — 3 Earth satellites at 35,786 km, spaced by 120 degrees.
- **Empty Mission** — a blank mission.

When an Earth preset is loaded for Moon or Mars, altitude is scaled and clamped to that body's configured operating range.

## Texture sources and usage rights

All runtime textures are vendored in `public/textures` so the scene does not depend on third-party CORS behavior. Paths are centralized in [`src/lib/celestialBodies.ts`](./src/lib/celestialBodies.ts), making it straightforward to replace a file without changing scene components.

| Local asset | Exact source | Credit / status |
| --- | --- | --- |
| `earth/earth-color.png` | [NASA SVS Blue Marble 2048](https://svs.gsfc.nasa.gov/vis/a000000/a002900/a002915/bluemarble-2048.png) | NASA/GSFC SVS; Blue Marble data courtesy Reto Stöckli, NASA/GSFC and NASA Earth Observatory. [Source page](https://svs.gsfc.nasa.gov/2915/) |
| `earth/earth-topography.png` | [NASA NEO SRTM topography](https://neo.gsfc.nasa.gov/archive/gs/SRTM_RAMP2_TOPO/SRTM_RAMP2_TOPO_2000.PNG) | NASA Earth Observations team, based on USGS data. [Dataset page](https://neo.gsfc.nasa.gov/view.php?datasetId=SRTM_RAMP2_TOPO) |
| `earth/earth-night.jpg` | [NASA Earth Observatory Night Lights 2012](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/79000/79765/dnb_land_ocean_ice.2012.3600x1800.jpg) | NASA Earth Observatory / Robert Simmon; Suomi NPP VIIRS data courtesy Chris Elvidge/NOAA. [Source page](https://science.nasa.gov/earth/earth-observatory/night-lights-2012-map-79765/) |
| `earth/earth-clouds.jpg` | [NASA Earth Observatory Blue Marble clouds](https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg) | NASA GSFC; image by Reto Stöckli, enhancements by Robert Simmon. Used as both color and luminance alpha map. [Blue Marble credits](https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/) |
| `moon/moon-color.jpg` | [NASA SVS CGI Moon Kit color](https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_2k.jpg) | NASA SVS; Ernie Wright/USRA, Noah Petro/NASA GSFC; LRO LROC/LOLA data. [Source page](https://svs.gsfc.nasa.gov/4720/) |
| `moon/moon-topography.jpg` | [NASA SVS CGI Moon Kit displacement](https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg) | Same CGI Moon Kit attribution. |
| `mars/mars-color.jpg` | [JPL Mars texture map](https://space.jpl.nasa.gov/tmaps/pix/mar0kuu2.jpg) | Caltech/JPL/USGS. [Source page](https://space.jpl.nasa.gov/tmaps/mars.html) |

NASA states that its image and media content is generally not subject to copyright in the United States when used consistently with its guidelines; NASA must be acknowledged, protected identifiers must not be used as endorsement, and third-party material may have separate restrictions. See the [NASA image and media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/). JPL media is subject to the [JPL image use policy](https://www.jpl.nasa.gov/jpl-image-use-policy/). Font files are distributed under the SIL Open Font License through Fontsource.

## Testing

Vitest covers:

- orbital position and rotation geometry;
- orbital period and velocity;
- constellation generation and phase distribution;
- strict JSON export/import and invalid payload rejection;
- coverage scoring, empty fleets, and bounded results.

The browser verification pass also exercises page startup, WebGL rendering, add/preset/pause controls, the generator with 50 satellites, responsive drawers, and texture loading.

## Known limits and future work

- Replace the simplified propagator with Keplerian elements and optional SGP4/TLE ingestion.
- Add ground stations, real antenna cones, latency contours, and visibility windows.
- Add scenario version migrations and optional cloud synchronization.
- Add instanced satellite meshes for fleets far beyond the current 120-vehicle product limit.
- Add higher-resolution texture packs behind an opt-in download.
- Add end-to-end Playwright tests and quantitative frame-time telemetry.
