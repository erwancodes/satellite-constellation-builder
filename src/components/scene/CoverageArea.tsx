import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import type { CelestialBody } from "../../types/mission";
import type { Satellite as SatelliteData } from "../../types/satellite";
import { useConstellationStore } from "../../store/constellationStore";
import {
  calculateSatelliteScenePosition,
  degreesToRadians,
} from "./sceneMath";

export interface CoverageAreaProps {
  satellite: SatelliteData;
  body: CelestialBody;
  selected?: boolean;
  visible?: boolean;
}

const NORTH_VECTOR = new Vector3(0, 1, 0);

function calculateCoverageAngle(
  satellite: SatelliteData,
  body: CelestialBody,
): number {
  const orbitalRadiusKm = body.radiusKm + Math.max(0, satellite.altitudeKm);
  const horizonAngle = Math.acos(body.radiusKm / orbitalRadiusKm);
  const requestedAngle = degreesToRadians(satellite.coverageAngleDeg);
  return Math.max(degreesToRadians(1), Math.min(requestedAngle, horizonAngle));
}

function createCoverageOutline(radius: number, angle: number): BufferGeometry {
  const segments = 72;
  const positions = new Float32Array(segments * 3);
  const ringRadius = Math.sin(angle) * radius;
  const ringHeight = Math.cos(angle) * radius;

  for (let index = 0; index < segments; index += 1) {
    const azimuth = (index / segments) * Math.PI * 2;
    const offset = index * 3;
    positions[offset] = Math.cos(azimuth) * ringRadius;
    positions[offset + 1] = ringHeight;
    positions[offset + 2] = Math.sin(azimuth) * ringRadius;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

export function CoverageArea({
  satellite,
  body,
  selected = false,
  visible = true,
}: CoverageAreaProps) {
  const groupRef = useRef<Group>(null);
  const satellitePosition = useMemo(() => new Vector3(), []);
  const groundNormal = useMemo(() => new Vector3(), []);
  const coverageAngle = useMemo(
    () => calculateCoverageAngle(satellite, body),
    [body, satellite.altitudeKm, satellite.coverageAngleDeg],
  );
  const coverageRadius = body.sceneRadius * 1.008;

  const capGeometry = useMemo(
    () =>
      new SphereGeometry(
        coverageRadius,
        40,
        8,
        0,
        Math.PI * 2,
        0,
        coverageAngle,
      ),
    [coverageAngle, coverageRadius],
  );
  const capMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color(satellite.active ? satellite.color : "#64707d"),
        transparent: true,
        opacity: selected ? 0.2 : satellite.active ? 0.085 : 0.035,
        depthWrite: false,
        side: DoubleSide,
        toneMapped: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    [satellite.active, satellite.color, selected],
  );
  const outlineGeometry = useMemo(
    () => createCoverageOutline(coverageRadius * 1.001, coverageAngle),
    [coverageAngle, coverageRadius],
  );
  const outlineMaterial = useMemo(
    () =>
      new LineBasicMaterial({
        color: new Color(satellite.active ? satellite.color : "#64707d"),
        transparent: true,
        opacity: selected ? 0.82 : satellite.active ? 0.35 : 0.12,
        depthWrite: false,
        toneMapped: false,
      }),
    [satellite.active, satellite.color, selected],
  );

  const cap = useMemo(() => {
    const mesh = new Mesh(capGeometry, capMaterial);
    mesh.renderOrder = selected ? 7 : 5;
    return mesh;
  }, [capGeometry, capMaterial, selected]);
  const outline = useMemo(() => {
    const line = new LineLoop(outlineGeometry, outlineMaterial);
    line.renderOrder = selected ? 8 : 6;
    return line;
  }, [outlineGeometry, outlineMaterial, selected]);

  useEffect(() => () => capGeometry.dispose(), [capGeometry]);
  useEffect(() => () => capMaterial.dispose(), [capMaterial]);
  useEffect(() => () => outlineGeometry.dispose(), [outlineGeometry]);
  useEffect(() => () => outlineMaterial.dispose(), [outlineMaterial]);

  useFrame(() => {
    if (!visible || !groupRef.current) return;
    const elapsedSeconds = useConstellationStore.getState().elapsedSeconds;
    calculateSatelliteScenePosition(
      satellite,
      elapsedSeconds,
      body,
      satellitePosition,
    );
    groundNormal.copy(satellitePosition).normalize();
    groupRef.current.quaternion.setFromUnitVectors(NORTH_VECTOR, groundNormal);
  });

  return visible ? (
    <group ref={groupRef} name={`${satellite.name} ground coverage`}>
      <primitive object={cap} />
      <primitive object={outline} />
    </group>
  ) : null;
}

export default CoverageArea;
