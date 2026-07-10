import { useEffect, useMemo } from "react";
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineLoop,
  Vector3,
} from "three";
import type { CelestialBody } from "../../types/mission";
import type { Satellite as SatelliteData } from "../../types/satellite";
import {
  calculateOrbitPoint,
  calculateSceneOrbitRadius,
  degreesToRadians,
} from "./sceneMath";

export interface SatelliteOrbitProps {
  satellite: SatelliteData;
  body: CelestialBody;
  selected?: boolean;
  visible?: boolean;
  segments?: number;
}

export function SatelliteOrbit({
  satellite,
  body,
  selected = false,
  visible = true,
  segments = 160,
}: SatelliteOrbitProps) {
  const geometry = useMemo(() => {
    const safeSegments = Math.max(48, Math.round(segments));
    const positions = new Float32Array(safeSegments * 3);
    const point = new Vector3();
    const radius = calculateSceneOrbitRadius(satellite.altitudeKm, body);
    const inclination = degreesToRadians(satellite.inclinationDeg);
    const ascendingNode = degreesToRadians(satellite.ascendingNodeDeg);

    for (let index = 0; index < safeSegments; index += 1) {
      calculateOrbitPoint(
        (index / safeSegments) * Math.PI * 2,
        radius,
        inclination,
        ascendingNode,
        point,
      );
      point.toArray(positions, index * 3);
    }

    const nextGeometry = new BufferGeometry();
    nextGeometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    nextGeometry.computeBoundingSphere();
    return nextGeometry;
  }, [
    body,
    satellite.altitudeKm,
    satellite.ascendingNodeDeg,
    satellite.inclinationDeg,
    segments,
  ]);

  const material = useMemo(
    () =>
      new LineBasicMaterial({
        color: new Color(satellite.active ? satellite.color : "#596472"),
        transparent: true,
        opacity: selected ? 0.9 : satellite.active ? 0.34 : 0.16,
        depthWrite: false,
        toneMapped: false,
      }),
    [satellite.active, satellite.color, selected],
  );

  const orbit = useMemo(() => {
    const line = new LineLoop(geometry, material);
    line.name = `${satellite.name} orbit`;
    line.renderOrder = selected ? 8 : 4;
    return line;
  }, [geometry, material, satellite.name, selected]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  return visible ? <primitive object={orbit} /> : null;
}

export default SatelliteOrbit;
