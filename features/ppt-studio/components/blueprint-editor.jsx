"use client";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ListPlus,
  Trash2
} from "lucide-react";
import { usePptStudio } from "@/contexts/ppt-studio-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
function BlueprintEditor({
  onProceed,
  onRegenerate,
  isBusy
}) {
  const {
    blueprint,
    updateSlideBlueprint,
    reorderSlides,
    addSlideAfter,
    removeSlide
  } = usePptStudio();
  if (!blueprint) {
    return <Card className="border-slate-200/70 bg-white/70 p-8 text-center text-sm text-slate-500">
                请先填写资料并生成 PPT 骨架，随后可以在此处逐页编辑内容。
            </Card>;
  }
  return <div className="space-y-5">
            <Card className="border-slate-200/70 bg-gradient-to-br from-slate-50 to-white">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-slate-800">
                        幻灯片骨架
                    </CardTitle>
                    <p className="text-sm text-slate-500">
                        FlowPilot 根据你的 Brief 生成了故事线、视觉风格和每页结构。你可以在此微调。
                    </p>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-600">
                    <section className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                            故事主线
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-slate-700">
                            {blueprint.storyArc}
                        </p>
                    </section>
                    <section className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                            主题风格
                        </div>
                        <dl className="mt-3 grid gap-3 md:grid-cols-3">
                            <div>
                                <dt className="text-xs text-slate-400">调色建议</dt>
                                <dd className="mt-1 text-slate-700">
                                    {blueprint.themeGuidelines.palette.join(", ")}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-slate-400">字体 / 排版</dt>
                                <dd className="mt-1 text-slate-700">
                                    {blueprint.themeGuidelines.typography}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs text-slate-400">图标 / 图形</dt>
                                <dd className="mt-1 text-slate-700">
                                    {blueprint.themeGuidelines.iconography || "\u4E0D\u9650"}
                                </dd>
                            </div>
                        </dl>
                        {blueprint.themeGuidelines.layoutPrinciples.length > 0 && <div className="mt-4 text-xs text-slate-500">
                                {blueprint.themeGuidelines.layoutPrinciples.join(" \xB7 ")}
                            </div>}
                    </section>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
                        <Button
    type="button"
    variant="outline"
    disabled={isBusy}
    onClick={onRegenerate}
    className="rounded-full border-dashed"
  >
                            重新生成骨架
                        </Button>
                        <Button
    type="button"
    className="rounded-full"
    onClick={onProceed}
    disabled={isBusy}
  >
                            确认骨架，进入绘制
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <div className="space-y-4">
                {blueprint.slides.map((slide, index) => <Card
    key={slide.id}
    className="border-slate-200/80 bg-white/80 shadow-sm"
  >
                        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
                                    Slide {index + 1}
                                </p>
                                <input
    type="text"
    value={slide.title}
    onChange={(event) => updateSlideBlueprint(slide.id, {
      title: event.target.value
    })}
    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-lg font-semibold text-slate-800 focus:border-slate-400 focus:outline-none"
  />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <button
    type="button"
    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500 hover:border-slate-300"
    onClick={() => reorderSlides(
      index,
      Math.max(0, index - 1)
    )}
    disabled={index === 0}
  >
                                    <ArrowUpCircle className="h-4 w-4" />
                                    上移
                                </button>
                                <button
    type="button"
    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500 hover:border-slate-300"
    onClick={() => reorderSlides(
      index,
      Math.min(
        blueprint.slides.length - 1,
        index + 1
      )
    )}
    disabled={index === blueprint.slides.length - 1}
  >
                                    <ArrowDownCircle className="h-4 w-4" />
                                    下移
                                </button>
                                <button
    type="button"
    className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-red-500 hover:bg-red-50"
    onClick={() => removeSlide(slide.id)}
    disabled={blueprint.slides.length <= 1}
  >
                                    <Trash2 className="h-4 w-4" />
                                    删除
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 lg:grid-cols-2">
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                                        叙事重点
                                    </span>
                                    <Textarea
    value={slide.narrative}
    onChange={(event) => updateSlideBlueprint(slide.id, {
      narrative: event.target.value
    })}
    rows={3}
    className="rounded-xl border border-slate-200 text-sm focus:border-slate-400"
  />
                                </label>
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                                        可视化提醒
                                    </span>
                                    <Textarea
    value={slide.visualIdea}
    onChange={(event) => updateSlideBlueprint(slide.id, {
      visualIdea: event.target.value
    })}
    rows={3}
    className="rounded-xl border border-slate-200 text-sm focus:border-slate-400"
  />
                                </label>
                            </div>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                                    要点（每行一个）
                                </span>
                                <Textarea
    value={slide.bullets.join("\n")}
    onChange={(event) => updateSlideBlueprint(slide.id, {
      bullets: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean)
    })}
    rows={3}
    className="rounded-xl border border-slate-200 text-sm focus:border-slate-400"
  />
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                                    与上一页衔接
                                </span>
                                <Textarea
    value={slide.transitionNote ?? ""}
    onChange={(event) => updateSlideBlueprint(slide.id, {
      transitionNote: event.target.value
    })}
    rows={2}
    className="rounded-xl border border-slate-200 text-sm focus:border-slate-400"
  />
                            </label>
                        </CardContent>
                    </Card>)}
                <Button
    type="button"
    variant="outline"
    onClick={() => addSlideAfter(blueprint.slides.at(-1)?.id ?? null)}
    className="flex w-full items-center justify-center gap-2 rounded-2xl border-dashed py-6 text-slate-600"
  >
                    <ListPlus className="h-5 w-5" />
                    添加幻灯片
                </Button>
            </div>
        </div>;
}
export {
  BlueprintEditor
};
