import { useMemo } from "react";
import {
  AdditiveBlending,
  BackSide,
  Color,
  FrontSide,
} from "three";

export interface AtmosphereProps {
  radius?: number;
  color?: string;
  intensity?: number;
}

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDirection;

  void main() {
    float fresnel = pow(1.0 - max(dot(vNormal, vViewDirection), 0.0), 2.35);
    float alpha = smoothstep(0.08, 1.0, fresnel) * uIntensity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export function Atmosphere({
  radius = 1,
  color = "#5bc0eb",
  intensity = 0.34,
}: AtmosphereProps) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(color) },
      uIntensity: { value: intensity },
    }),
    [color, intensity],
  );

  return (
    <group>
      <mesh scale={1.009} renderOrder={2}>
        <sphereGeometry args={[radius, 64, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.026}
          depthWrite={false}
          side={FrontSide}
        />
      </mesh>

      <mesh scale={1.034} renderOrder={1}>
        <sphereGeometry args={[radius, 64, 32]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          side={BackSide}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export default Atmosphere;
