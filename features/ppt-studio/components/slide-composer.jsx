"use client";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  Download,
  Shield
} from "lucide-react";
import { usePptStudio } from "@/contexts/ppt-studio-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { buildViewerUrl } from "../utils/viewer";
import { cn } from "@/lib/utils";
import { ModelSelector } from "@/components/model-selector";
import { SlidePreviewModal } from "./slide-preview-modal";
import { RenderModeToggle } from "@/components/render-mode-toggle";
const LAYOUT_TONE_PRESETS = [
  {
    label: "\u821E\u53F0 + \u6D6E\u5C42\u5361\u7247",
    value: "\u6DF1\u8272\u821E\u53F0\u80CC\u666F + \u4E2D\u592E\u6D6E\u5C42\u5361\u7247 + \u73BB\u7483\u62DF\u6001/\u6E10\u53D8 + \u9876\u90E8\u6807\u9898\u6761 + \u9AD8\u5149\u6309\u94AE"
  },
  {
    label: "\u65F6\u95F4\u8F74",
    value: "\u6D45\u8272\u6E10\u53D8\u80CC\u666F + \u4E1D\u5E26\u5F0F\u65F6\u95F4\u8F74 + \u5706\u5F62\u91CC\u7A0B\u7891 + \u7EBF\u6027\u8FDE\u63A5 + \u5E95\u90E8\u9875\u811A\u6761"
  },
  {
    label: "\u4E2D\u592E\u8F90\u5C04",
    value: "\u4E2D\u592E\u5FBD\u7AE0 + 4-5 \u4E2A\u73AF\u7ED5\u536B\u661F\u5361\u7247 + \u7EC6\u7EBF\u8FDE\u63A5 + \u80CC\u666F\u70B9\u9635\u7EB9\u7406"
  },
  {
    label: "\u53CC\u5217\u5BF9\u6BD4",
    value: "\u5DE6\u53F3\u5206\u680F + \u9876\u90E8\u6807\u7B7E\u6761 + \u5361\u7247\u5185\u5D4C\u56FE\u6807 + \u5E95\u90E8\u603B\u7ED3\u6761\uFF0C\u4FDD\u6301\u7559\u767D"
  }
];
const STATUS_STYLES = {
  idle: {
    label: "\u5F85\u751F\u6210",
    className: "bg-slate-100 text-slate-600",
    dotClass: "bg-slate-500"
  },
  queued: {
    label: "\u6392\u961F\u4E2D",
    className: "bg-amber-50 text-amber-700",
    dotClass: "bg-amber-500"
  },
  generating: {
    label: "\u751F\u6210\u4E2D",
    className: "bg-sky-50 text-sky-600",
    dotClass: "bg-sky-500"
  },
  ready: {
    label: "\u5DF2\u5B8C\u6210",
    className: "bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-500"
  },
  failed: {
    label: "\u5931\u8D25",
    className: "bg-rose-50 text-rose-600",
    dotClass: "bg-rose-500"
  }
};
function SlideComposer({
  onGenerateAll,
  onGeneratePending,
  onGenerateSingle,
  isGenerating,
  onExportBundle,
  onExportPptx,
  isBundling,
  isExportingPptx,
  models,
  selectedModelKey,
  onModelChange,
  onManageModels,
  renderError,
  renderMode = "drawio",
  onRenderModeChange
}) {
  const { blueprint, slideJobs, styleLocks, updateStyleLocks } = usePptStudio();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSlideId, setPreviewSlideId] = useState(null);
  const slides = blueprint?.slides ?? [];
  const readySlideCount = useMemo(
    () => slides.filter((slide) => Boolean(slideJobs[slide.id]?.result?.xml)).length,
    [slides, slideJobs]
  );
  const openPreview = (slideId = null) => {
    setPreviewSlideId(slideId);
    setIsPreviewOpen(true);
  };
  const handlePreviewOpenChange = (open) => {
    setIsPreviewOpen(open);
    if (!open) {
      setPreviewSlideId(null);
    }
  };
  const handleExportSlide = (slideId) => {
    const job = slideJobs[slideId];
    if (!job?.result?.xml) return;
    const blob = new Blob([job.result.xml], {
      type: "application/xml;charset=utf-8"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${slides.find((slide) => slide.id === slideId)?.title || slideId}.drawio`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };
  if (!blueprint) {
    return <Card className="border-slate-200/70 bg-white/80 p-6 text-center text-sm text-slate-500">
                请先确认 PPT 骨架，然后进入生成阶段。
            </Card>;
  }
  return <>
        <div className="space-y-5">
            <Card className="border-slate-200/70 bg-white/80 shadow-sm">
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold text-slate-800">
                            幻灯片渲染控制台
                        </CardTitle>
                        <p className="mt-1 text-sm text-slate-500">
                            FlowPilot 会并行绘制每一页，保持整体风格一致。
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 text-right">
                        <span className="text-xs text-slate-400">
                            优先选择具备画图能力的模型
                        </span>
                        <div className="flex items-center gap-2">
                            <RenderModeToggle
    value={renderMode}
    onChange={onRenderModeChange}
  />
                            <ModelSelector
    selectedModelKey={selectedModelKey}
    onModelChange={onModelChange}
    models={models}
    onManage={onManageModels}
  />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {renderError && <div className="rounded-2xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-sm text-rose-600">
                            <AlertTriangle className="mr-1 inline h-4 w-4" />
                            {renderError}
                        </div>}
                    <section className="grid gap-4 lg:grid-cols-2">
                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                锁定调色板
                            </span>
                            <Textarea
    rows={2}
    value={styleLocks.palette?.join(", ") || ""}
    onChange={(event) => updateStyleLocks({
      palette: event.target.value.split(/[,，]/g).map((token) => token.trim()).filter(Boolean)
    })}
    className="rounded-xl border border-slate-200 text-sm"
    placeholder="如：#0b5cff, #111827, #f97316"
  />
                        </label>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                    字体 / 版式
                                </span>
                                <input
    type="text"
    value={styleLocks.typography || ""}
    onChange={(event) => updateStyleLocks({
      typography: event.target.value
    })}
    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
    placeholder="如：San-serif, 左对齐, 双色标题"
  />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                    图标 / 布局语气
                                </span>
                                <input
    type="text"
    value={styleLocks.iconography || ""}
    onChange={(event) => updateStyleLocks({
      iconography: event.target.value
    })}
    className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
    placeholder="如：双色线性图标 / 扁平手绘"
  />
                            </label>
                            <label className="flex flex-col gap-1.5 sm:col-span-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                    全屏质感 / 布局提示
                                </span>
                                <Textarea
    rows={2}
    value={styleLocks.layoutTone || ""}
    onChange={(event) => updateStyleLocks({
      layoutTone: event.target.value
    })}
    className="rounded-xl border border-slate-200 text-sm"
    placeholder="如：深色舞台背景 + 玻璃拟态内容卡片 + 顶部标题栏 + 轻微阴影"
  />
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {LAYOUT_TONE_PRESETS.map((preset) => <button
    key={preset.label}
    type="button"
    onClick={() => updateStyleLocks({
      layoutTone: preset.value
    })}
    className={cn(
      "rounded-full border px-3 py-1 text-xs transition",
      styleLocks.layoutTone === preset.value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
    )}
  >
                                            {preset.label}
                                        </button>)}
                                </div>
                            </label>
                        </div>
                    </section>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="text-xs text-slate-500">
                            <Shield className="mr-1 inline h-4 w-4 text-slate-400" />
                            风格锁定会在每个请求中传递给模型，确保多页保持统一视觉。
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
    type="button"
    variant="outline"
    className="rounded-full"
    onClick={() => openPreview(null)}
    disabled={readySlideCount === 0}
  >
                                幻灯片预览
                            </Button>
                            <Button
    type="button"
    onClick={onGeneratePending}
    disabled={isGenerating}
    className="rounded-full"
    variant="outline"
  >
                                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                生成未完成页
                            </Button>
                            <Button
    type="button"
    onClick={onGenerateAll}
    disabled={isGenerating}
    className="rounded-full"
  >
                                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                并行生成全部
                            </Button>
                            <Button
    type="button"
    variant="outline"
    className="rounded-full"
    onClick={onExportBundle}
    disabled={isBundling}
  >
                                {isBundling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {!isBundling && <Download className="mr-2 h-4 w-4" />}
                                导出 draw.io 套件
                            </Button>
                            <Button
    type="button"
    variant="outline"
    className="rounded-full"
    onClick={onExportPptx}
    disabled={isExportingPptx}
  >
                                {isExportingPptx && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {!isExportingPptx && <Download className="mr-2 h-4 w-4" />}
                                导出 PPTX
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="grid gap-4 lg:grid-cols-2">
                {slides.map((slide) => {
    const job = slideJobs[slide.id];
    const statusMeta = STATUS_STYLES[job?.status || "idle"];
    const viewerUrl = job?.result?.xml && buildViewerUrl(job.result.xml, slide.title);
    return <Card
      key={slide.id}
      className="flex h-full flex-col border-slate-200/70 bg-white/90 shadow-sm"
    >
                            <CardHeader className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold text-slate-800">
                                        {slide.title}
                                    </CardTitle>
                                    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        statusMeta.className
      )}
    >
                                        <span
      className={cn(
        "h-1.5 w-1.5 rounded-full",
        statusMeta.dotClass
      )}
    />
                                        {statusMeta.label}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {slide.narrative}
                                </p>
                            </CardHeader>
                            <CardContent className="flex flex-1 flex-col gap-3">
                                {viewerUrl ? <iframe
      src={viewerUrl}
      title={slide.title}
      className="h-56 w-full rounded-xl border border-slate-200"
    /> : <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
                                        生成完成后将展示预览
                                    </div>}
                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-sm text-slate-600">
                                    <div className="font-semibold text-slate-500">
                                        要点
                                    </div>
                                    <ul className="mt-1 list-disc pl-5">
                                        {slide.bullets.map((bullet, index) => <li key={index}>{bullet}</li>)}
                                    </ul>
                                </div>
                                {job?.result?.reasoning && <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-3 text-xs text-violet-600">
                                        {job.result.reasoning}
                                    </div>}
                                {job?.error && <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-600">
                                        <AlertTriangle className="h-4 w-4" />
                                        {job.error}
                                    </div>}
                                <div className="mt-auto flex flex-wrap items-center gap-2">
                                    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="rounded-full text-slate-500 hover:text-slate-800"
      onClick={() => openPreview(slide.id)}
      disabled={!job?.result?.xml}
    >
                                        全屏预览
                                    </Button>
                                    <Button
      type="button"
      size="sm"
      variant="outline"
      className="rounded-full"
      onClick={() => onGenerateSingle(slide.id)}
      disabled={isGenerating}
    >
                                        <RefreshCcw className="mr-1 h-4 w-4" />
                                        {job?.status === "ready" ? "\u91CD\u751F\u6210" : "\u751F\u6210\u6B64\u9875"}
                                    </Button>
                                    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="rounded-full text-slate-500 hover:text-slate-700"
      onClick={() => handleExportSlide(slide.id)}
      disabled={!job?.result?.xml}
    >
                                        <Download className="mr-1 h-4 w-4" />
                                        导出 XML
                                    </Button>
                                    {job?.status === "ready" && <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600">
                                            <CheckCircle2 className="h-4 w-4" />
                                            {job.finishedAt ? new Date(job.finishedAt).toLocaleTimeString() : "\u5DF2\u5B8C\u6210"}
                                        </span>}
                                </div>
                            </CardContent>
                        </Card>;
  })}
            </div>
        </div>
        <SlidePreviewModal
    open={isPreviewOpen}
    onOpenChange={handlePreviewOpenChange}
    slides={slides}
    slideJobs={slideJobs}
    initialSlideId={previewSlideId}
  />
        </>;
}
export {
  SlideComposer
};
