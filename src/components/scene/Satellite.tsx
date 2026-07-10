import { useEffect, useMemo, useRef } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import type { CelestialBody } from "../../types/mission";
import type { Satellite as SatelliteData } from "../../types/satellite";
import { useConstellationStore } from "../../store/constellationStore";
import {
  calculateSatelliteScenePosition,
  calculateSceneOrbitRadius,
} from "./sceneMath";

export interface SatelliteProps {
  satellite: SatelliteData;
  body: CelestialBody;
  selected?: boolean;
}

const BODY_GEOMETRY = new BoxGeometry(0.034, 0.028, 0.034);
const PANEL_GEOMETRY = new BoxGeometry(0.052, 0.0035, 0.027);
const HINGE_GEOMETRY = new CylinderGeometry(0.003, 0.003, 0.065, 8);
const MAST_GEOMETRY = new CylinderGeometry(0.002, 0.002, 0.025, 8);
const DISH_GEOMETRY = new ConeGeometry(0.014, 0.011, 18, 1, true);
const HIT_GEOMETRY = new SphereGeometry(0.072, 12, 8);
const SELECTION_GEOMETRY = new TorusGeometry(0.058, 0.0015, 8, 48);

const ACTIVE_PANEL_MATERIAL = new MeshStandardMaterial({
  color: "#173c62",
  emissive: "#0e263f",
  emissiveIntensity: 0.32,
  roughness: 0.3,
  metalness: 0.34,
});
const INACTIVE_PANEL_MATERIAL = new MeshStandardMaterial({
  color: "#343c46",
  roughness: 0.72,
  metalness: 0.14,
});
const HARDWARE_MATERIAL = new MeshStandardMaterial({
  color: "#c4cbd1",
  roughness: 0.26,
  metalness: 0.72,
});
const HIT_MATERIAL = new MeshBasicMaterial({
  transparent: true,
  opacity: 0,
  depthWrite: false,
});
const RADIAL_AXIS = new Vector3(0, 1, 0);

export function Satellite({
  satellite,
  body,
  selected = false,
}: SatelliteProps) {
  const rootRef = useRef<Group>(null);
  const selectionRef = useRef<Mesh>(null);
  const scenePosition = useMemo(() => new Vector3(), []);
  const radialDirection = useMemo(() => new Vector3(), []);
  const orbitRadius = calculateSceneOrbitRadius(satellite.altitudeKm, body);
  const visualScale = Math.min(1.5, Math.max(0.82, 0.78 + orbitRadius * 0.095));

  const busMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(satellite.active ? satellite.color : "#68727d"),
        emissive: new Color(selected && satellite.active ? satellite.color : "#111820"),
        emissiveIntensity: selected ? 0.36 : 0.08,
        roughness: 0.42,
        metalness: 0.58,
      }),
    [satellite.active, satellite.color, selected],
  );
  const selectionMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color(satellite.color),
        transparent: true,
        opacity: 0.84,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      }),
    [satellite.color],
  );

  useEffect(() => () => busMaterial.dispose(), [busMaterial]);
  useEffect(() => () => selectionMaterial.dispose(), [selectionMaterial]);
  useEffect(
    () => () => {
      if (typeof document !== "undefined") document.body.style.cursor = "";
    },
    [],
  );

  useFrame((state) => {
    const root = rootRef.current;
    if (!root) return;

    const elapsedSeconds = useConstellationStore.getState().elapsedSeconds;
    calculateSatelliteScenePosition(
      satellite,
      elapsedSeconds,
      body,
      scenePosition,
    );
    root.position.copy(scenePosition);
    radialDirection.copy(scenePosition).normalize();
    root.quaternion.setFromUnitVectors(RADIAL_AXIS, radialDirection);

    if (selectionRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3.1) * 0.08;
      selectionRef.current.scale.setScalar(pulse);
      selectionRef.current.rotation.z += 0.008;
    }
  });

  const handleSelect = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    useConstellationStore.getState().selectSatellite(satellite.id);
  };

  return (
    <group
      ref={rootRef}
      name={satellite.name}
      scale={visualScale}
      userData={{ satelliteId: satellite.id }}
      dispose={null}
    >
      <mesh geometry={BODY_GEOMETRY} material={busMaterial} />

      <mesh
        geometry={HINGE_GEOMETRY}
        material={HARDWARE_MATERIAL}
        rotation={[0, 0, Math.PI / 2]}
      />
      <mesh
        geometry={PANEL_GEOMETRY}
        material={satellite.active ? ACTIVE_PANEL_MATERIAL : INACTIVE_PANEL_MATERIAL}
        position={[-0.052, 0, 0]}
      />
      <mesh
        geometry={PANEL_GEOMETRY}
        material={satellite.active ? ACTIVE_PANEL_MATERIAL : INACTIVE_PANEL_MATERIAL}
        position={[0.052, 0, 0]}
      />

      <mesh
        geometry={MAST_GEOMETRY}
        material={HARDWARE_MATERIAL}
        position={[0, 0.025, 0]}
      />
      <mesh
        geometry={DISH_GEOMETRY}
        material={HARDWARE_MATERIAL}
        position={[0, 0.043, 0]}
      />

      {selected ? (
        <mesh
          ref={selectionRef}
          geometry={SELECTION_GEOMETRY}
          material={selectionMaterial}
          rotation={[Math.PI / 2, 0, 0]}
          renderOrder={12}
        />
      ) : null}

      <mesh
        geometry={HIT_GEOMETRY}
        material={HIT_MATERIAL}
        onClick={handleSelect}
        onPointerOver={(event) => {
          event.stopPropagation();
          if (typeof document !== "undefined") document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          if (typeof document !== "undefined") document.body.style.cursor = "";
        }}
      />
    </group>
  );
}

export default Satellite;
