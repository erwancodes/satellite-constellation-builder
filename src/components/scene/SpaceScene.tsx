import {
  memo,
  useEffect,
  useMemo,
  useRef,
  type ComponentRef,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  ACESFilmicToneMapping,
  SRGBColorSpace,
  Vector3,
} from "three";
import { CELESTIAL_BODIES } from "../../lib/celestialBodies";
import { useConstellationStore } from "../../store/constellationStore";
import type { CelestialBody } from "../../types/mission";
import { CoverageArea } from "./CoverageArea";
import { Earth } from "./Earth";
import { Satellite } from "./Satellite";
import { SatelliteLinks } from "./SatelliteLinks";
import { SatelliteOrbit } from "./SatelliteOrbit";
import { StarField } from "./StarField";
import { calculateSatelliteScenePosition } from "./sceneMath";

export interface SpaceSceneProps {
  className?: string;
  ariaLabel?: string;
  onReady?: () => void;
}

export type SceneCameraCommand =
  | { action: "recenter" }
  | { action: "focus"; satelliteId?: string };

export const SCENE_CAMERA_EVENT = "constellation-builder:camera";

function dispatchCameraCommand(command: SceneCameraCommand): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<SceneCameraCommand>(SCENE_CAMERA_EVENT, { detail: command }),
  );
}

export function recenterScene(): void {
  dispatchCameraCommand({ action: "recenter" });
}

export function focusSatellite(satelliteId?: string): void {
  dispatchCameraCommand({ action: "focus", satelliteId });
}

export function focusSelectedSatellite(): void {
  focusSatellite();
}

const DEFAULT_CAMERA_POSITION = new Vector3(0.12, 1.28, 4.35);
const DEFAULT_CAMERA_TARGET = new Vector3(0, 0, 0);
const MemoSatellite = memo(Satellite);
const MemoSatelliteOrbit = memo(SatelliteOrbit);
const MemoCoverageArea = memo(CoverageArea);

interface CameraRigProps {
  body: CelestialBody;
}

function CameraRig({ body }: CameraRigProps) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const transitionActive = useRef(false);
  const destinationPosition = useRef(DEFAULT_CAMERA_POSITION.clone());
  const destinationTarget = useRef(DEFAULT_CAMERA_TARGET.clone());
  const temporaryPosition = useMemo(() => new Vector3(), []);
  const radialOffset = useMemo(() => new Vector3(), []);
  const { camera } = useThree();

  useEffect(() => {
    destinationPosition.current.copy(DEFAULT_CAMERA_POSITION);
    destinationTarget.current.copy(DEFAULT_CAMERA_TARGET);
    transitionActive.current = true;
  }, [body.id]);

  useEffect(() => {
    const applyCameraCommand = (command: SceneCameraCommand | undefined) => {
      if (!command) return;

      if (command.action === "recenter") {
        destinationPosition.current.copy(DEFAULT_CAMERA_POSITION);
        destinationTarget.current.copy(DEFAULT_CAMERA_TARGET);
        transitionActive.current = true;
        return;
      }

      const state = useConstellationStore.getState();
      const satelliteId = command.satelliteId ?? state.selectedId;
      const satellite = state.satellites.find((item) => item.id === satelliteId);
      if (!satellite) return;

      const currentBody = CELESTIAL_BODIES[state.bodyId];
      calculateSatelliteScenePosition(
        satellite,
        state.elapsedSeconds,
        currentBody,
        temporaryPosition,
      );
      radialOffset.copy(temporaryPosition).normalize();
      destinationTarget.current.copy(temporaryPosition);
      destinationPosition.current
        .copy(temporaryPosition)
        .addScaledVector(radialOffset, Math.max(1.52, currentBody.sceneRadius * 1.52))
        .addScaledVector(camera.up, 0.2);
      transitionActive.current = true;
    };

    const handleCameraCommand = (event: Event) => {
      applyCameraCommand((event as CustomEvent<SceneCameraCommand>).detail);
    };
    const handleLegacyRecenter = () => applyCameraCommand({ action: "recenter" });
    const handleLegacyFocus = (event: Event) =>
      applyCameraCommand({
        action: "focus",
        satelliteId: (event as CustomEvent<string>).detail,
      });

    window.addEventListener(SCENE_CAMERA_EVENT, handleCameraCommand);
    window.addEventListener("scb:recenter", handleLegacyRecenter);
    window.addEventListener("scb:focus-satellite", handleLegacyFocus);
    return () => {
      window.removeEventListener(SCENE_CAMERA_EVENT, handleCameraCommand);
      window.removeEventListener("scb:recenter", handleLegacyRecenter);
      window.removeEventListener("scb:focus-satellite", handleLegacyFocus);
    };
  }, [camera.up, radialOffset, temporaryPosition]);

  useFrame((_state, delta) => {
    const controls = controlsRef.current;
    if (!controls || !transitionActive.current) return;

    const interpolation = 1 - Math.exp(-delta * 5.2);
    camera.position.lerp(destinationPosition.current, interpolation);
    controls.target.lerp(destinationTarget.current, interpolation);
    controls.update();

    if (
      camera.position.distanceToSquared(destinationPosition.current) < 0.00008 &&
      controls.target.distanceToSquared(destinationTarget.current) < 0.00008
    ) {
      camera.position.copy(destinationPosition.current);
      controls.target.copy(destinationTarget.current);
      transitionActive.current = false;
      controls.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      enablePan
      panSpeed={0.42}
      rotateSpeed={0.58}
      zoomSpeed={0.72}
      minDistance={1.34}
      maxDistance={20}
      minPolarAngle={0.08}
      maxPolarAngle={Math.PI - 0.08}
      onStart={() => {
        transitionActive.current = false;
      }}
    />
  );
}

function SceneContent() {
  const bodyId = useConstellationStore((state) => state.bodyId);
  const satellites = useConstellationStore((state) => state.satellites);
  const selectedId = useConstellationStore((state) => state.selectedId);
  const display = useConstellationStore((state) => state.display);
  const body = CELESTIAL_BODIES[bodyId];

  return (
    <>
      <color attach="background" args={["#030812"]} />
      <fog attach="fog" args={["#030812", 24, 58]} />

      <StarField />

      <ambientLight intensity={0.14} color="#b7ccdc" />
      <hemisphereLight args={["#9ec9df", "#07101d", 0.26]} />
      <directionalLight
        position={[5.4, 2.8, 4.6]}
        color="#fff3dd"
        intensity={3.15}
      />
      <directionalLight
        position={[-4.5, -1.4, -3.2]}
        color="#5f83a3"
        intensity={0.22}
      />

      <Earth body={body} autoRotate={display.autoRotate} />

      {satellites.map((satellite) => {
        const selected = selectedId === satellite.id;
        const showOrbit =
          satellite.showOrbit && (display.showAllOrbits || selected);
        const showCoverage =
          satellite.active &&
          satellite.showCoverage &&
          (display.coverageMode === "all" ||
            (display.coverageMode === "selected" && selected));

        return (
          <group key={satellite.id}>
            {showOrbit ? (
              <MemoSatelliteOrbit
                satellite={satellite}
                body={body}
                selected={selected}
              />
            ) : null}
            {showCoverage ? (
              <MemoCoverageArea
                satellite={satellite}
                body={body}
                selected={selected}
              />
            ) : null}
            <MemoSatellite satellite={satellite} body={body} selected={selected} />
          </group>
        );
      })}

      {display.showLinks ? (
        <SatelliteLinks satellites={satellites} body={body} />
      ) : null}

      <CameraRig body={body} />
    </>
  );
}

export function SpaceScene({
  className,
  ariaLabel = "Interactive satellite constellation view",
  onReady,
}: SpaceSceneProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 320,
        overflow: "hidden",
        background: "#030812",
      }}
    >
      <Canvas
        role="application"
        aria-label={ariaLabel}
        camera={{ position: DEFAULT_CAMERA_POSITION.toArray(), fov: 42, near: 0.01, far: 80 }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        performance={{ min: 0.55 }}
        onPointerMissed={() => useConstellationStore.getState().selectSatellite(null)}
        onCreated={({ gl }) => {
          gl.outputColorSpace = SRGBColorSpace;
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.04;
          onReady?.();
        }}
      >
        <SceneContent />
      </Canvas>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 50% 44%, transparent 48%, rgba(2, 7, 15, 0.38) 100%)",
          boxShadow: "inset 0 0 0 1px rgba(164, 204, 222, 0.06)",
        }}
      />
    </div>
  );
}

export default SpaceScene;
