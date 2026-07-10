import { useEffect } from "react";
import { useConstellationStore } from "../store/constellationStore";

export function useSimulation(): void {
  useEffect(() => {
    let frameId = 0;
    let previous = performance.now();
    let accumulator = 0;

    const frame = (now: number) => {
      const delta = Math.min((now - previous) / 1_000, 0.25);
      previous = now;
      accumulator += delta;

      if (accumulator >= 0.04) {
        useConstellationStore.getState().advanceTime(accumulator);
        accumulator = 0;
      }

      frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameId);
  }, []);
}
