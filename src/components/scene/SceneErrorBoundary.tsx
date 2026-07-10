import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("3D scene failed to initialize", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[320px] items-center justify-center bg-[#040b13] p-6">
          <div className="max-w-sm text-center">
            <AlertTriangle className="mx-auto mb-4 size-7 text-amber-300" strokeWidth={1.5} />
            <h2 className="text-base font-semibold text-slate-100">Unable to initialize the 3D viewport</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              WebGL or one of the local mission textures could not be loaded. Your constellation data is still safe.
            </p>
            {this.state.message ? <p className="mt-3 font-mono text-[9px] text-slate-600">{this.state.message}</p> : null}
            <Button variant="secondary" className="mt-5" onClick={() => window.location.reload()}><RefreshCw /> Reload viewport</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
