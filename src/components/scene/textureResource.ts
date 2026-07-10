import { useMemo } from "react";
import { Texture, TextureLoader } from "three";
import type { CelestialBody } from "../../types/mission";

export interface SceneTextureSet {
  color: Texture | null;
  normal: Texture | null;
  night: Texture | null;
  clouds: Texture | null;
}

interface TextureResource {
  read: () => SceneTextureSet;
}

const resourceCache = new Map<string, TextureResource>();

function loadOptionalTexture(path: string | undefined): Promise<Texture | null> {
  if (!path || typeof document === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    const loader = new TextureLoader();
    loader.load(path, resolve, undefined, () => resolve(null));
  });
}

function createTextureResource(
  paths: CelestialBody["texturePaths"],
): TextureResource {
  let status: "pending" | "ready" = "pending";
  let result: SceneTextureSet = {
    color: null,
    normal: null,
    night: null,
    clouds: null,
  };

  const pending = Promise.all([
    loadOptionalTexture(paths.color),
    loadOptionalTexture(paths.normal),
    loadOptionalTexture(paths.night),
    loadOptionalTexture(paths.clouds),
  ]).then(([color, normal, night, clouds]) => {
    result = { color, normal, night, clouds };
    status = "ready";
  });

  return {
    read: () => {
      if (status === "pending") throw pending;
      return result;
    },
  };
}

function getTextureResource(
  paths: CelestialBody["texturePaths"],
): TextureResource {
  const key = [paths.color, paths.normal, paths.night, paths.clouds]
    .map((value) => value ?? "")
    .join("|");
  const cached = resourceCache.get(key);
  if (cached) return cached;

  const resource = createTextureResource(paths);
  resourceCache.set(key, resource);
  return resource;
}

export function useSceneTextures(
  paths: CelestialBody["texturePaths"],
): SceneTextureSet {
  const key = [paths.color, paths.normal, paths.night, paths.clouds]
    .map((value) => value ?? "")
    .join("|");
  const resource = useMemo(() => getTextureResource(paths), [key, paths]);
  return resource.read();
}

