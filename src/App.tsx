import { useEffect, useRef, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Toaster, toast } from "sonner";
import { LeftPanel } from "./components/layout/LeftPanel";
import { RightPanel } from "./components/layout/RightPanel";
import { SceneHUD } from "./components/layout/SceneHUD";
import { SimulationControls } from "./components/layout/SimulationControls";
import { TopBar } from "./components/layout/TopBar";
import { SceneErrorBoundary } from "./components/scene/SceneErrorBoundary";
import { SpaceScene } from "./components/scene/SpaceScene";
import { Button } from "./components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "./components/ui/sheet";
import { TooltipProvider } from "./components/ui/tooltip";
import { exportMissionJson, parseMissionJson } from "./lib/exportImport";
import { downloadTextFile } from "./lib/utils";
import { useSimulation } from "./hooks/useSimulation";
import { getMissionSnapshot, useConstellationStore } from "./store/constellationStore";

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.matches("input, textarea, select, [contenteditable='true']") || Boolean(target.closest("[role='dialog']"));
}

export default function App() {
  useSimulation();
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const webGLAvailable = supportsWebGL();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      const store = useConstellationStore.getState();

      if (event.code === "Space") {
        event.preventDefault();
        store.togglePlaying();
      } else if (event.key.toLowerCase() === "a") {
        if (store.addSatellite()) toast.success("Satellite added");
      } else if (event.key.toLowerCase() === "r") {
        window.dispatchEvent(new CustomEvent("scb:recenter"));
      } else if (event.key === "Delete" && store.selectedId) {
        store.removeSatellite(store.selectedId);
        toast.success("Satellite removed");
      } else if (event.key === "1") {
        store.setTimeScale(1);
      } else if (event.key === "2") {
        store.setTimeScale(20);
      } else if (event.key === "3") {
        store.setTimeScale(100);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleExport = () => {
    try {
      const mission = getMissionSnapshot();
      downloadTextFile(`${mission.missionName.trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "mission"}.json`, exportMissionJson(mission));
      toast.success("Mission configuration exported");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Unable to export mission");
    }
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 1_500_000) {
      toast.error("Mission file is too large");
      return;
    }
    try {
      const mission = parseMissionJson(await file.text());
      useConstellationStore.getState().importMission(mission);
      toast.success(`${mission.missionName} imported`);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Invalid mission JSON");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  return (
    <TooltipProvider delayDuration={350}>
      <div className="app-shell grid min-h-[100dvh] max-h-[100dvh] grid-rows-[66px_minmax(0,1fr)_74px] overflow-hidden bg-[#050b14] text-slate-100">
        <TopBar
          onOpenLeft={() => setLeftOpen(true)}
          onOpenRight={() => setRightOpen(true)}
          onExport={handleExport}
          onImport={() => importInputRef.current?.click()}
          onReset={() => setResetOpen(true)}
        />

        <main className="grid min-h-0 grid-cols-1 xl:grid-cols-[330px_minmax(0,1fr)_340px]">
          <div className="hidden min-h-0 border-r border-white/[0.08] xl:block"><LeftPanel /></div>

          <section className="scene-shell relative min-h-0 overflow-hidden bg-[#02070d]" aria-label="Interactive orbital scene">
            {webGLAvailable ? (
              <SceneErrorBoundary><SpaceScene /><SceneHUD /></SceneErrorBoundary>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div className="max-w-sm">
                  <AlertTriangle className="mx-auto mb-3 size-7 text-amber-300" />
                  <h2 className="text-base font-semibold">WebGL is not available</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">Enable hardware acceleration or open the app in a browser that supports WebGL to use the orbital viewport.</p>
                </div>
              </div>
            )}
          </section>

          <div className="hidden min-h-0 border-l border-white/[0.08] xl:block"><RightPanel /></div>
        </main>

        <SimulationControls />

        <input ref={importInputRef} type="file" accept="application/json,.json" className="sr-only" onChange={(event) => void handleImport(event.currentTarget.files?.[0])} />

        <Sheet open={leftOpen} onOpenChange={setLeftOpen}>
          <SheetContent side="left" className="pt-10"><SheetTitle className="sr-only">Mission controls</SheetTitle><LeftPanel /></SheetContent>
        </Sheet>
        <Sheet open={rightOpen} onOpenChange={setRightOpen}>
          <SheetContent side="right" className="pt-10"><SheetTitle className="sr-only">Mission analytics</SheetTitle><RightPanel /></SheetContent>
        </Sheet>

        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogContent className="max-w-md">
            <div className="flex size-10 items-center justify-center rounded-full border border-amber-300/20 bg-amber-300/8 text-amber-200"><RotateCcw className="size-4" /></div>
            <div>
              <DialogTitle className="text-lg font-semibold">Reset the complete mission?</DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-relaxed text-slate-500">This replaces the current fleet, display layers, celestial body, and simulation clock with the default Earth mission.</DialogDescription>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setResetOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => { useConstellationStore.getState().resetMission(); setResetOpen(false); toast.success("Mission reset"); }}>Reset mission</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!border-white/10 !bg-[#091522]/96 !text-slate-200 !shadow-2xl !backdrop-blur-xl",
              description: "!text-slate-500",
            },
          }}
        />
      </div>
    </TooltipProvider>
  );
}
