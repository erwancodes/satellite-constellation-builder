import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Texture } from "three";

export interface CloudLayerProps {
  radius?: number;
  texture?: Texture | null;
  opacity?: number;
  rotationSpeed?: number;
}

export function CloudLayer({
  radius = 1,
  texture = null,
  opacity = 0.34,
  rotationSpeed = 0.008,
}: CloudLayerProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame((_state, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * rotationSpeed;
  });

  if (!texture) return null;

  return (
    <mesh ref={meshRef} scale={1.006} renderOrder={3}>
      <sphereGeometry args={[radius, 96, 48]} />
      <meshStandardMaterial
        map={texture}
        alphaMap={texture}
        color="#eef6f8"
        transparent
        opacity={opacity}
        roughness={0.92}
        metalness={0}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  );
}

export default CloudLayer;

