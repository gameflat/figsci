import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOOLBAR_ACTIONS, TOOLBAR_PANELS } from "../constants";
function IntelligenceToolbar({
  activePanel,
  isSidebarOpen,
  onToggle
}) {
  return <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100/70 bg-white/60 px-3 py-2">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                <Sparkles className="h-3.5 w-3.5 text-slate-300" />
                智能工具
            </div>
            <div className="flex items-center gap-1.5">
                {TOOLBAR_PANELS.map((panel) => {
    const { label, icon: Icon } = TOOLBAR_ACTIONS[panel];
    const isActive = activePanel === panel && isSidebarOpen;
    return <button
      key={panel}
      type="button"
      onClick={() => onToggle(panel)}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-1 text-[11px] font-medium transition",
        isActive ? "border-slate-900 bg-slate-900 text-white shadow-sm" : "border-slate-200/60 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-white"
      )}
    >
                            <Icon className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{label}</span>
                        </button>;
  })}
            </div>
        </div>;
}
export {
  IntelligenceToolbar
};
