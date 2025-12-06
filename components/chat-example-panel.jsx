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
            </div>
        </div>
    );
}

