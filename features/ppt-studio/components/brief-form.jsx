"use client";
import { useEffect, useMemo, useState } from "react";
import { usePptStudio } from "@/contexts/ppt-studio-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/model-selector";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
function BriefForm({
  onGenerateBlueprint,
  isGenerating,
  models,
  selectedModelKey,
  onModelChange,
  onManageModels,
  hasBlueprint
}) {
  const { brief, updateBrief, clearAll, lastSavedAt } = usePptStudio();
  const [keywordsDraft, setKeywordsDraft] = useState(
    brief.keywords.join(", ")
  );
  const [refsDraft, setRefsDraft] = useState(
    brief.referenceAssets.join("\n")
  );
  useEffect(() => {
    setKeywordsDraft(brief.keywords.join(", "));
  }, [brief.keywords]);
  useEffect(() => {
    setRefsDraft(brief.referenceAssets.join("\n"));
  }, [brief.referenceAssets]);
  const minRequirementsMet = useMemo(
    () => Boolean(
      brief.topic.trim() && brief.audience.trim() && brief.slideCount >= 3 && selectedModelKey
    ),
    [brief.topic, brief.audience, brief.slideCount, selectedModelKey]
  );
  const handleKeywordsBlur = () => {
    const tokens = keywordsDraft.split(/[,，\n]/g).map((token) => token.trim()).filter(Boolean);
    updateBrief({ keywords: tokens });
  };
  const handleRefsBlur = () => {
    const refs = refsDraft.split("\n").map((line) => line.trim()).filter(Boolean);
    updateBrief({ referenceAssets: refs });
  };
  return <Card className="border-slate-200/70 bg-white/80 shadow-sm">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <CardTitle className="text-xl font-semibold text-slate-800">
                        配置你的 PPT 简报
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                        FlowPilot 将基于这些信息生成 PPT 骨架，随后你可以逐页微调。
                    </p>
                </div>
                <div className="flex flex-col gap-2 text-right text-xs text-slate-500">
                    <div>
                        上次保存：
                        {lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : "\u2014"}
                    </div>
                    <button
    type="button"
    className="text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
    onClick={() => clearAll()}
  >
                        重置所有设置
                    </button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-2">
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            演示主题 *
                        </span>
                        <input
    type="text"
    value={brief.topic}
    onChange={(event) => updateBrief({ topic: event.target.value })}
    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-slate-400 focus:outline-none"
    placeholder="例如：AI 驱动的业务流程自动化"
  />
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            主要受众 *
                        </span>
                        <input
    type="text"
    value={brief.audience}
    onChange={(event) => updateBrief({ audience: event.target.value })}
    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-slate-400 focus:outline-none"
    placeholder="例如：运营负责人 / 潜在客户 / 投资人"
  />
                    </label>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            演示目标 *
                        </span>
                        <select
    value={brief.goal}
    onChange={(event) => updateBrief({
      goal: event.target.value
    })}
    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-slate-400 focus:outline-none"
  >
                            <option value="inform">信息汇报</option>
                            <option value="pitch">商业提案</option>
                            <option value="training">培训/宣导</option>
                            <option value="report">复盘/报告</option>
                        </select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            语气 *
                        </span>
                        <select
    value={brief.tone}
    onChange={(event) => updateBrief({
      tone: event.target.value
    })}
    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-slate-400 focus:outline-none"
  >
                            <option value="formal">正式、稳健</option>
                            <option value="balanced">专业、平衡</option>
                            <option value="energetic">活力、说服</option>
                        </select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            预计页数 *
                        </span>
                        <input
    type="number"
    min={3}
    max={30}
    value={brief.slideCount}
    onChange={(event) => updateBrief({
      slideCount: Number(event.target.value)
    })}
    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-slate-400 focus:outline-none"
  />
                    </label>
                </div>
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        核心关键词（逗号或换行分隔）
                    </span>
                    <Textarea
    value={keywordsDraft}
    onChange={(event) => setKeywordsDraft(event.target.value)}
    onBlur={handleKeywordsBlur}
    rows={3}
    className="min-h-[120px] rounded-xl border border-slate-200 bg-white/70 text-sm focus:border-slate-400"
    placeholder="如：多云架构、自动化运维、跨团队协作"
  />
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        额外提示（场景 / 风格 / 要求）
                    </span>
                    <Textarea
    value={brief.narrativeFocus ?? ""}
    onChange={(event) => updateBrief({ narrativeFocus: event.target.value })}
    rows={4}
    className="rounded-xl border border-slate-200 bg-white/70 text-sm focus:border-slate-400"
    placeholder="例如：希望突出 ROI、强调协同、需要展示概览 + 深入案例"
  />
                </label>
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        参考链接 / 资产
                    </span>
                    <Textarea
    value={refsDraft}
    onChange={(event) => setRefsDraft(event.target.value)}
    onBlur={handleRefsBlur}
    rows={3}
    className="rounded-xl border border-slate-200 bg-white/70 text-sm focus:border-slate-400"
    placeholder="每行一个链接或文件路径"
  />
                </label>
                <div className="grid gap-4 md:grid-cols-3">
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            品牌色（Hex，逗号分隔）
                        </span>
                        <input
    type="text"
    value={brief.constraints.palette.join(", ")}
    onChange={(event) => updateBrief({
      constraints: {
        ...brief.constraints,
        palette: event.target.value.split(/[,，]/g).map((token) => token.trim()).filter(Boolean)
      }
    })}
    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-slate-400 focus:outline-none"
    placeholder="#0b5cff, #111827"
  />
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            禁用元素
                        </span>
                        <input
    type="text"
    value={brief.constraints.forbidden.join(", ")}
    onChange={(event) => updateBrief({
      constraints: {
        ...brief.constraints,
        forbidden: event.target.value.split(/[,，]/g).map((token) => token.trim()).filter(Boolean)
      }
    })}
    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-slate-400 focus:outline-none"
    placeholder="避免条形图、禁止渐变"
  />
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            必须包含
                        </span>
                        <input
    type="text"
    value={brief.constraints.mustInclude.join(", ")}
    onChange={(event) => updateBrief({
      constraints: {
        ...brief.constraints,
        mustInclude: event.target.value.split(/[,，]/g).map((token) => token.trim()).filter(Boolean)
      }
    })}
    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-inner focus:border-slate-400 focus:outline-none"
    placeholder="图标、数据、案例"
  />
                    </label>
                </div>
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            模型选择
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                            FlowPilot 需要与可用模型对接才能完成分析与绘制。
                        </p>
                    </div>
                    <ModelSelector
    selectedModelKey={selectedModelKey}
    onModelChange={onModelChange}
    models={models}
    onManage={onManageModels}
  />
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
                    {hasBlueprint && <span className="text-xs text-slate-500">
                            重新生成骨架会覆盖当前蓝图。
                        </span>}
                    <Button
    type="button"
    className={cn(
      "rounded-full px-6 py-2 text-sm font-semibold",
      !minRequirementsMet && "cursor-not-allowed opacity-60"
    )}
    disabled={!minRequirementsMet || isGenerating}
    onClick={() => onGenerateBlueprint()}
  >
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {hasBlueprint ? "\u91CD\u65B0\u751F\u6210\u9AA8\u67B6" : "\u751F\u6210 PPT \u9AA8\u67B6"}
                    </Button>
                </div>
            </CardContent>
        </Card>;
}
export {
  BriefForm
};
