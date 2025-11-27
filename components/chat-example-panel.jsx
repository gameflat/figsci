import { Button } from "@/components/ui/button";
import { Settings2, Sparkles } from "lucide-react";

/**
 * @typedef {Object} ExamplePanelProps
 * @property {(input: string) => void} setInput
 * @property {(files: File[]) => void} setFiles
 * @property {() => void} [onOpenBriefPanel]
 * @property {string[]} [briefBadges]
 * @property {string} [briefSummary]
 */

/**
 * @param {ExamplePanelProps} props
 */
export default function ExamplePanel({
    setInput,
    setFiles,
    onOpenBriefPanel,
    briefBadges,
    briefSummary,
}) {
    // New handler for the "Replicate this flowchart" button
    const handleReplicateFlowchart = async () => {
        setInput("请帮我复刻这张流程图。");

        try {
            // Fetch the example image
            const response = await fetch("/example.png");
            const blob = await response.blob();
            const file = new File([blob], "example.png", { type: "image/png" });

            // Set the file to the files state
            setFiles([file]);
        } catch (error) {
            console.error("Error loading example image:", error);
        }
    };

    // Handler for the "Replicate this in aws style" button
    const handleReplicateArchitecture = async () => {
        setInput("请使用 AWS 设计风格复刻这张架构图。");

        try {
            // Fetch the architecture image
            const response = await fetch("/architecture.png");
            const blob = await response.blob();
            const file = new File([blob], "architecture.png", {
                type: "image/png",
            });

            // Set the file to the files state
            setFiles([file]);
        } catch (error) {
            console.error("Error loading architecture image:", error);
        }
    };
    const fallbackBadges = ["模式·空白起稿", "视觉·产品规范", "护栏·单屏锁定"];
    const displayBadges =
        briefBadges && briefBadges.length > 0 ? briefBadges : fallbackBadges;
    const clippedBadges = displayBadges.slice(0, 4);
    const summaryText =
        briefSummary && briefSummary.length > 0
            ? briefSummary
            : fallbackBadges.slice(0, 3).join(" · ");

    return (
        <div className="flex w-full justify-center px-1 py-2">
            <div className="w-full max-w-[min(720px,90%)] space-y-4">
                <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                <Sparkles className="h-4 w-4 text-amber-400" />
                                FlowPilot Brief 偏好
                            </div>
                            <p className="text-base font-semibold text-slate-900">
                                {summaryText}
                            </p>
                            <p className="text-xs text-slate-500">
                                FlowPilot 会随每次生成附上这些偏好，先设定就能保持同一种风格。
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="inline-flex items-center gap-1 rounded-full border-slate-300 px-4"
                            onClick={() => onOpenBriefPanel?.()}
                            disabled={!onOpenBriefPanel}
                        >
                            <Settings2 className="h-3.5 w-3.5" />
                            配置 Brief
                        </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {clippedBadges.map((badge, index) => (
                            <span
                                key={`${badge}-${index}`}
                                className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
                            >
                                {badge}
                            </span>
                        ))}
                        {displayBadges.length > clippedBadges.length && (
                            <span className="rounded-full border border-dashed border-slate-200/80 px-2.5 py-0.5 text-[11px] text-slate-500">
                                +{displayBadges.length - clippedBadges.length}
                            </span>
                        )}
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-sm">
                    <p className="mb-1 text-sm text-slate-700">
                        FlowPilot 既可以空白起稿，也能参考上传的示例；试试下面的模板更快进入状态。
                    </p>
                    <p className="mb-3 text-xs text-slate-500">
                        点击任意选项即可自动填充输入框，必要时会附带示例附件。
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:border-slate-300 hover:bg-white whitespace-nowrap"
                            onClick={handleReplicateArchitecture}
                        >
                            复刻这份 AWS 架构
                        </button>
                        <button
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:border-slate-300 hover:bg-white whitespace-nowrap"
                            onClick={handleReplicateFlowchart}
                        >
                            复刻这张流程图截图
                        </button>
                        <button
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:border-slate-300 hover:bg-white whitespace-nowrap"
                            onClick={() => setInput("请随便画一只猫咪。")}
                        >
                            随手涂鸦（轻松一下）
                        </button>
                        <button
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:border-slate-300 hover:bg-white whitespace-nowrap"
                            onClick={() =>
                                setInput("请创建一份包含前台、后台与支撑流程三列的服务蓝图。")
                            }
                        >
                            服务蓝图排版
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

