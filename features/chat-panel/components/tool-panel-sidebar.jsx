import { TOOLBAR_ACTIONS } from "../constants";
function ToolPanelSidebar({
  activePanel,
  isOpen,
  onClose,
  children
}) {
  if (!activePanel || !isOpen) {
    return null;
  }
  const { label, description, icon: Icon } = TOOLBAR_ACTIONS[activePanel];
  return <div className="pointer-events-none absolute inset-0 flex items-start justify-end px-2 pb-3 pt-3">
            <aside className="pointer-events-auto w-full max-w-full rounded-2xl border border-slate-100/80 bg-white/95 p-4 shadow-xl ring-1 ring-slate-900/5 sm:max-w-lg md:w-[600px] md:max-w-[90vw]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-900">
                            {label}
                        </span>
                    </div>
                    <button
    type="button"
    onClick={onClose}
    className="text-[11px] font-medium text-slate-400 transition hover:text-slate-600"
  >
                        收起
                    </button>
                </div>
                <p className="mt-2 text-[11px] leading-snug text-slate-500">
                    {description}
                </p>
                <div className="mt-3 max-h-[55vh] overflow-y-auto pr-1">
                    {children}
                </div>
            </aside>
        </div>;
}
export {
  ToolPanelSidebar
};
