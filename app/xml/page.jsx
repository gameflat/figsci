// XML 代码页面已注释掉，不再使用
// 整个文件内容已注释，如需恢复请取消注释

/*
"use client";

import { useEffect, useMemo, useState } from "react";
import { WorkspaceNav } from "@/components/workspace-nav";
import { Button } from "@/components/ui/button";
import { useDiagram } from "@/contexts/diagram-context";
import { cn } from "@/lib/utils";
import { Copy, Download, RefreshCcw, FileCode2 } from "lucide-react";

function formatTimestamp(date) {
    if (!date) return "暂无同步记录";
    try {
        return new Intl.DateTimeFormat("zh-CN", {
            hour12: false,
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(date);
    } catch {
        return date.toLocaleString();
    }
}

function XmlCodePanel() {
    const { chartXML, fetchDiagramXml } = useDiagram();
    const [xmlPreview, setXmlPreview] = useState("");
    const [copyState, setCopyState] = useState("idle");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [infoMessage, setInfoMessage] = useState("");

    useEffect(() => {
        if (chartXML) {
            setXmlPreview(chartXML);
            setLastUpdated(new Date());
        }
    }, [chartXML]);

    const lineCount = useMemo(() => {
        if (!xmlPreview) return 0;
        return xmlPreview.split("\n").length;
    }, [xmlPreview]);

    const handleCopy = async () => {
        if (!xmlPreview) return;
        try {
            await navigator.clipboard.writeText(xmlPreview);
            setCopyState("copied");
            setTimeout(() => setCopyState("idle"), 1500);
        } catch {
            setCopyState("failed");
            setTimeout(() => setCopyState("idle"), 1500);
        }
    };

    const handleDownload = () => {
        if (!xmlPreview) return;
        const blob = new Blob([xmlPreview], { type: "application/xml" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "Figsci-diagram.xml";
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        setErrorMessage("");
        setInfoMessage("");
        try {
            const xml = await fetchDiagramXml({ saveHistory: false });
            setXmlPreview(xml);
            setLastUpdated(new Date());
            setInfoMessage("已同步画布，XML 已更新。");
            setTimeout(() => setInfoMessage(""), 2000);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "同步失败，请稍后重试。";
            setErrorMessage(message);
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:flex-row">
            <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-6 lg:w-1/3 lg:min-w-[320px]">
                <div className="flex items-center gap-3">
                    <div className="rounded-full bg-slate-900/90 p-2 text-white">
                        <FileCode2 className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">
                            XML 代码实时预览
                        </h2>
                        <p className="text-sm text-slate-500">
                            Figsci 会将 draw.io 画布中的最新 mxGraph XML
                            同步到此处，方便调试、复制或集成其他系统。
                        </p>
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
                    <p className="font-medium text-slate-900">当前状态</p>
                    <ul className="mt-2 space-y-1 text-xs text-slate-500">
                        <li>• {xmlPreview ? "已同步" : "尚未检测到 XML 数据"}</li>
                        <li>• 行数：{lineCount}</li>
                        <li>• 更新时间：{formatTimestamp(lastUpdated)}</li>
                    </ul>
                </div>
                <div className="flex flex-col gap-2 text-xs text-slate-500">
                    <p>操作说明：</p>
                    <ol className="space-y-1">
                        <li>1. 在画图工作室中生成或编辑图表。</li>
                        <li>2. 点击"同步画布"确保获取最新 XML。</li>
                        <li>3. 可复制或下载 XML 文件，集成到其他系统。</li>
                    </ol>
                </div>
            </section>

            <section className="flex flex-1 flex-col rounded-3xl border border-slate-200 bg-white/95 shadow-sm lg:min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 sm:px-4 sm:py-3">
                    <div>
                        <p className="text-sm font-medium text-slate-900">
                            draw.io mxGraph XML
                        </p>
                        <p className="text-xs text-slate-500">
                            {xmlPreview
                                ? "已同步的代码片段，可直接复制使用。"
                                : "暂无数据，请返回画图工作室生成图表后再试。"}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCcw className="h-4 w-4" />
                            {isRefreshing ? "同步中..." : "同步画布"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            disabled={!xmlPreview}
                        >
                            <Download className="h-4 w-4" />
                            下载 XML
                        </Button>
                        <Button
    type="button"
    size="sm"
                            onClick={handleCopy}
                            disabled={!xmlPreview}
                        >
                            <Copy className="h-4 w-4" />
                            {copyState === "copied"
                                ? "已复制"
                                : copyState === "failed"
                                ? "复制失败"
                                : "复制代码"}
                        </Button>
                    </div>
        </div>

                {                (errorMessage || infoMessage) && (
                    <div
                        className={cn(
                            "mx-3 mt-2 rounded-2xl px-3 py-2 text-xs sm:mx-4 sm:mt-3 sm:px-4",
                            infoMessage
                                ? "border border-emerald-200 bg-emerald-50/80 text-emerald-700"
                                : "border border-red-200 bg-red-50/80 text-red-700"
                        )}
                    >
                        {infoMessage || errorMessage}
                    </div>
                )}

                <div className="flex-1 overflow-hidden px-3 py-3 sm:px-4 sm:py-4">
                    <pre className="h-full overflow-auto rounded-2xl bg-slate-950 p-3 text-xs text-slate-100 sm:p-4">
                        {xmlPreview
                            ? xmlPreview
                            : "等待来自画图工作室的 XML，同步后将在此处展示。"}
                    </pre>
                </div>
            </section>
            </div>
    );
}

export default function XmlCodePage() {
    return (
        <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
            <WorkspaceNav />
            <div className="flex-1">
                <XmlCodePanel />
            </div>
        </div>
    );
}
*/

// 临时导出空组件以避免路由错误（Next.js 需要导出默认组件）
export default function XmlCodePage() {
    return null;
}
