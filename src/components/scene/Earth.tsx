import { Suspense, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, SRGBColorSpace } from "three";
import { CELESTIAL_BODIES } from "../../lib/celestialBodies";
import type { CelestialBody } from "../../types/mission";
import { Atmosphere } from "./Atmosphere";
import { CloudLayer } from "./CloudLayer";
import { useSceneTextures } from "./textureResource";

export interface EarthProps {
  body?: CelestialBody;
  autoRotate?: boolean;
}

interface PlanetSurfaceProps {
  body: CelestialBody;
  autoRotate: boolean;
}

function PlanetLoadingFallback({ body }: { body: CelestialBody }) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[body.sceneRadius, 48, 24]} />
        <meshStandardMaterial
          color={body.surfaceTint}
          roughness={0.92}
          metalness={0.02}
        />
      </mesh>
      <mesh scale={1.003}>
        <sphereGeometry args={[body.sceneRadius, 24, 12]} />
        <meshBasicMaterial
          color={body.atmosphereColor}
          wireframe
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function PlanetSurface({ body, autoRotate }: PlanetSurfaceProps) {
  const surfaceRef = useRef<Mesh>(null);
  const { gl } = useThree();
  const textures = useSceneTextures(body.texturePaths);

  useEffect(() => {
    const colorTextures = [textures.color, textures.night, textures.clouds];
    const maximumAnisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());

    for (const texture of colorTextures) {
      if (!texture) continue;
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = maximumAnisotropy;
      texture.needsUpdate = true;
    }

    if (textures.normal) {
      textures.normal.anisotropy = maximumAnisotropy;
      textures.normal.needsUpdate = true;
    }
  }, [gl, textures]);

  useFrame((_state, delta) => {
    if (autoRotate && surfaceRef.current) {
      surfaceRef.current.rotation.y += delta * 0.012;
    }
  });

  return (
    <group>
      <mesh ref={surfaceRef} rotation={[0, -Math.PI / 2, 0]}>
        <sphereGeometry args={[body.sceneRadius, 128, 64]} />
        <meshStandardMaterial
          map={textures.color ?? undefined}
          bumpMap={textures.normal ?? undefined}
          bumpScale={textures.normal ? 0.018 : 0}
          emissiveMap={textures.night ?? undefined}
          emissive={textures.night ? "#a8b9d1" : "#05080d"}
          emissiveIntensity={textures.night ? 0.72 : 0}
          color={textures.color ? "#f4f7f8" : body.surfaceTint}
          roughness={0.88}
          metalness={0.01}
        />
      </mesh>

      {body.hasClouds ? (
        <CloudLayer
          radius={body.sceneRadius}
          texture={textures.clouds}
          opacity={0.33}
          rotationSpeed={autoRotate ? 0.019 : 0.007}
        />
      ) : null}
    </group>
  );
}

export function Earth({
  body = CELESTIAL_BODIES.earth,
  autoRotate = false,
}: EarthProps) {
  const atmosphereIntensity =
    body.id === "earth" ? 0.34 : body.id === "mars" ? 0.18 : 0.055;

  return (
    <group name={`${body.id}-celestial-body`}>
      <Suspense fallback={<PlanetLoadingFallback body={body} />}>
        <PlanetSurface body={body} autoRotate={autoRotate} />
      </Suspense>
      <Atmosphere
        radius={body.sceneRadius}
        color={body.atmosphereColor}
        intensity={atmosphereIntensity}
      />
    </group>
  );
}

export default Earth;
