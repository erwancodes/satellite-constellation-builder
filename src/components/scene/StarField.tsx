import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
} from "three";

export interface StarFieldProps {
  count?: number;
  minRadius?: number;
  maxRadius?: number;
  seed?: number;
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

export function StarField({
  count = 1_800,
  minRadius = 12,
  maxRadius = 38,
  seed = 4_219,
}: StarFieldProps) {
  const starsRef = useRef<Points>(null);
  const geometry = useMemo(() => {
    const random = createSeededRandom(seed);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const starColor = new Color();

    for (let index = 0; index < count; index += 1) {
      const longitude = random() * Math.PI * 2;
      const latitude = Math.acos(2 * random() - 1);
      const radius = minRadius + Math.pow(random(), 0.38) * (maxRadius - minRadius);
      const sinLatitude = Math.sin(latitude);
      const offset = index * 3;

      positions[offset] = radius * sinLatitude * Math.cos(longitude);
      positions[offset + 1] = radius * Math.cos(latitude);
      positions[offset + 2] = radius * sinLatitude * Math.sin(longitude);

      const warmth = random();
      starColor.setHSL(0.55 + warmth * 0.09, 0.15 + warmth * 0.24, 0.72 + random() * 0.24);
      starColor.toArray(colors, offset);
    }

    const nextGeometry = new BufferGeometry();
    nextGeometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    nextGeometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    nextGeometry.computeBoundingSphere();
    return nextGeometry;
  }, [count, maxRadius, minRadius, seed]);

  const material = useMemo(
    () =>
      new PointsMaterial({
        size: 0.024,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.82,
        vertexColors: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((_state, delta) => {
    if (!starsRef.current) return;
    starsRef.current.rotation.y += delta * 0.0012;
    starsRef.current.rotation.x += delta * 0.00018;
  });

  return (
    <points
      ref={starsRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={-10}
    />
  );
}

export default StarField;
