import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Vector3,
} from "three";
import type { CelestialBody } from "../../types/mission";
import type { Satellite } from "../../types/satellite";
import { useConstellationStore } from "../../store/constellationStore";
import {
  calculateSatelliteScenePosition,
  isLineOfSightClear,
} from "./sceneMath";

export interface SatelliteLinksProps {
  satellites: Satellite[];
  body: CelestialBody;
  visible?: boolean;
  maxLinks?: number;
}

export function SatelliteLinks({
  satellites,
  body,
  visible = true,
  maxLinks = 720,
}: SatelliteLinksProps) {
  const updateAccumulator = useRef(0);
  const pairCapacity = (satellites.length * (satellites.length - 1)) / 2;
  const linkCapacity = Math.max(1, Math.min(maxLinks, pairCapacity));
  const scenePositions = useMemo(
    () => satellites.map(() => new Vector3()),
    [satellites.length],
  );

  const geometry = useMemo(() => {
    const nextGeometry = new BufferGeometry();
    const positions = new Float32BufferAttribute(
      new Float32Array(linkCapacity * 6),
      3,
    );
    const colors = new Float32BufferAttribute(
      new Float32Array(linkCapacity * 6),
      3,
    );
    positions.setUsage(DynamicDrawUsage);
    colors.setUsage(DynamicDrawUsage);
    nextGeometry.setAttribute("position", positions);
    nextGeometry.setAttribute("color", colors);
    nextGeometry.setDrawRange(0, 0);
    return nextGeometry;
  }, [linkCapacity]);

  const material = useMemo(
    () =>
      new LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );
  const links = useMemo(() => {
    const object = new LineSegments(geometry, material);
    object.name = "inter-satellite links";
    object.frustumCulled = false;
    object.renderOrder = 10;
    return object;
  }, [geometry, material]);

  const colorA = useMemo(() => new Color(), []);
  const colorB = useMemo(() => new Color(), []);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((_state, delta) => {
    if (!visible) {
      geometry.setDrawRange(0, 0);
      return;
    }

    updateAccumulator.current += delta;
    if (updateAccumulator.current < 1 / 24) return;
    updateAccumulator.current = 0;

    const elapsedSeconds = useConstellationStore.getState().elapsedSeconds;
    for (let index = 0; index < satellites.length; index += 1) {
      const satellite = satellites[index];
      const position = scenePositions[index];
      if (satellite && position) {
        calculateSatelliteScenePosition(satellite, elapsedSeconds, body, position);
      }
    }

    const positionAttribute = geometry.getAttribute("position") as Float32BufferAttribute;
    const colorAttribute = geometry.getAttribute("color") as Float32BufferAttribute;
    const positionBuffer = positionAttribute.array as Float32Array;
    const colorBuffer = colorAttribute.array as Float32Array;
    const occluderRadius = body.sceneRadius * 1.002;
    let linkCount = 0;

    outer: for (let firstIndex = 0; firstIndex < satellites.length; firstIndex += 1) {
      const firstSatellite = satellites[firstIndex];
      const firstPosition = scenePositions[firstIndex];
      if (!firstSatellite?.active || !firstPosition) continue;

      for (
        let secondIndex = firstIndex + 1;
        secondIndex < satellites.length;
        secondIndex += 1
      ) {
        const secondSatellite = satellites[secondIndex];
        const secondPosition = scenePositions[secondIndex];
        if (!secondSatellite?.active || !secondPosition) continue;
        const maximumRangeKm = Math.max(
          body.radiusKm * 2.2,
          Math.min(
            Math.max(firstSatellite.altitudeKm, secondSatellite.altitudeKm) * 2.2,
            body.radiusKm * 12,
          ),
        );
        const maximumDistance =
          (maximumRangeKm / body.radiusKm) * body.sceneRadius;
        if (
          firstPosition.distanceToSquared(secondPosition) >
          maximumDistance * maximumDistance
        ) {
          continue;
        }
        if (!isLineOfSightClear(firstPosition, secondPosition, occluderRadius)) continue;

        const positionOffset = linkCount * 6;
        firstPosition.toArray(positionBuffer, positionOffset);
        secondPosition.toArray(positionBuffer, positionOffset + 3);

        colorA.set(firstSatellite.color).toArray(colorBuffer, positionOffset);
        colorB.set(secondSatellite.color).toArray(colorBuffer, positionOffset + 3);

        linkCount += 1;
        if (linkCount >= linkCapacity) break outer;
      }
    }

    geometry.setDrawRange(0, linkCount * 2);
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
  });

  return <primitive object={links} visible={visible} />;
}

export default SatelliteLinks;
