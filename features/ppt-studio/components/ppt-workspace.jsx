"use client";
import { useState } from "react";
import JSZip from "jszip";
import { AlertTriangle } from "lucide-react";
import { usePptStudio } from "@/contexts/ppt-studio-context";
import { PptStepper } from "./ppt-stepper";
import { BriefForm } from "./brief-form";
import { BlueprintEditor } from "./blueprint-editor";
import { SlideComposer } from "./slide-composer";
import { useSlideGeneration } from "../hooks/use-slide-generation";
import { requestPptBlueprint } from "../utils/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
const sanitizeFileName = (value) => value.replace(/[^a-zA-Z0-9\u4e00-\u9fa5-_]+/g, "-").slice(0, 60);
function PptWorkspace({
  models,
  selectedModelKey,
  onModelChange,
  onManageModels
}) {
  const {
    step,
    setStep,
    brief,
    blueprint,
    setBlueprint,
    slideJobs
  } = usePptStudio();
  const selectedModel = models.find((model) => model.key === selectedModelKey);
  const modelRuntime = selectedModel ? {
    modelId: selectedModel.modelId,
    baseUrl: selectedModel.baseUrl,
    apiKey: selectedModel.apiKey,
    label: selectedModel.label
  } : void 0;
  const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);
  const [blueprintError, setBlueprintError] = useState(null);
  const [exportError, setExportError] = useState(null);
  const [renderError, setRenderError] = useState(null);
  const [isBundling, setIsBundling] = useState(false);
  const [isExportingPptx, setIsExportingPptx] = useState(false);
  const [renderMode, setRenderMode] = useState("drawio");
  const {
    generateSlides,
    generatePendingSlides,
    isRunning: isRendering
  } = useSlideGeneration({
    modelRuntime
  });
  const handleBlueprintRequest = async () => {
    if (!modelRuntime) {
      setBlueprintError("\u8BF7\u5148\u914D\u7F6E\u6A21\u578B\u63A5\u53E3\u3002");
      return;
    }
    setBlueprintError(null);
    setIsGeneratingBlueprint(true);
    try {
      const result = await requestPptBlueprint({
        brief,
        modelRuntime
      });
      setBlueprint(result);
      setStep("blueprint");
      setRenderError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "\u751F\u6210\u9AA8\u67B6\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002";
      setBlueprintError(message);
    } finally {
      setIsGeneratingBlueprint(false);
    }
  };
  const handleProceedToRender = () => {
    if (!blueprint) return;
    setStep("render");
  };
  const withRenderError = async (runner) => {
    try {
      setRenderError(null);
      await runner();
    } catch (error) {
      const message = error instanceof Error ? error.message : "\u751F\u6210\u8FC7\u7A0B\u4E2D\u51FA\u73B0\u9519\u8BEF\u3002";
      setRenderError(message);
    }
  };
  const handleExportBundle = async () => {
    if (!blueprint) return;
    const readySlides = blueprint.slides.filter(
      (slide) => slideJobs[slide.id]?.result?.xml
    );
    if (readySlides.length === 0) {
      setExportError("\u6682\u672A\u6709\u5B8C\u6210\u7684\u5E7B\u706F\u7247\u53EF\u5BFC\u51FA\u3002");
      return;
    }
    setExportError(null);
    setIsBundling(true);
    try {
      const zip = new JSZip();
      readySlides.forEach((slide, index) => {
        const job = slideJobs[slide.id];
        const xml = job?.result?.xml;
        if (!xml) return;
        const filename = `${String(index + 1).padStart(2, "0")}-${sanitizeFileName(slide.title)}.drawio`;
        zip.file(filename, xml);
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${sanitizeFileName(brief.topic || "FlowPilot")}-slides.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Failed to export PPT bundle:", error);
      setExportError("\u5BFC\u51FA\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u6216\u4E0B\u8F7D\u5355\u9875 XML\u3002");
    } finally {
      setIsBundling(false);
    }
  };
  const handleExportPptx = async () => {
    if (!blueprint) return;
    const readySlides = blueprint.slides.filter(
      (slide) => slideJobs[slide.id]?.result?.xml
    );
    if (readySlides.length === 0) {
      setExportError("\u6682\u672A\u6709\u5B8C\u6210\u7684\u5E7B\u706F\u7247\u53EF\u5BFC\u51FA\u3002");
      return;
    }
    setExportError(null);
    setIsExportingPptx(true);
    try {
      const response = await fetch("/api/ppt/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          topic: brief.topic || "FlowPilot Deck",
          slides: readySlides.map((slide) => ({
            id: slide.id,
            title: slide.title,
            bullets: slide.bullets,
            narrative: slide.narrative,
            xml: slideJobs[slide.id]?.result?.xml
          }))
        })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "\u5BFC\u51FA PPTX \u5931\u8D25");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${sanitizeFileName(brief.topic || "FlowPilot")}.pptx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export PPTX:", error);
      setExportError(
        error instanceof Error ? error.message : "\u5BFC\u51FA PPTX \u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002"
      );
    } finally {
      setIsExportingPptx(false);
    }
  };
  return <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-6">
            <aside className="hidden w-[260px] lg:block">
                <PptStepper />
            </aside>
            <section className="flex-1 space-y-4 pb-8">
                {blueprintError && <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-3 text-sm text-rose-600">
                        <AlertTriangle className="mr-2 inline h-4 w-4" />
                        {blueprintError}
                    </div>}
                {exportError && <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-700">
                        <AlertTriangle className="mr-2 inline h-4 w-4" />
                        {exportError}
                    </div>}
                {step === "brief" && <BriefForm
    onGenerateBlueprint={handleBlueprintRequest}
    isGenerating={isGeneratingBlueprint}
    models={models}
    selectedModelKey={selectedModelKey}
    onModelChange={onModelChange}
    onManageModels={onManageModels}
    hasBlueprint={Boolean(blueprint)}
  />}
                {step === "blueprint" && <BlueprintEditor
    onProceed={handleProceedToRender}
    onRegenerate={handleBlueprintRequest}
    isBusy={isGeneratingBlueprint}
  />}
                {step === "render" && <SlideComposer
    onGenerateAll={() => withRenderError(() => generateSlides(void 0, renderMode))}
    onGeneratePending={() => withRenderError(() => generatePendingSlides(renderMode))}
    onGenerateSingle={(slideId) => withRenderError(() => generateSlides([slideId], renderMode))}
    isGenerating={isRendering}
    onExportBundle={handleExportBundle}
    onExportPptx={handleExportPptx}
    isBundling={isBundling}
    isExportingPptx={isExportingPptx}
    models={models}
    selectedModelKey={selectedModelKey}
    onModelChange={onModelChange}
    onManageModels={onManageModels}
    renderError={renderError}
    renderMode={renderMode}
    onRenderModeChange={setRenderMode}
  />}
                {!blueprint && step !== "brief" && <Card className="border-dashed border-slate-300 bg-white/50 p-6 text-center text-sm text-slate-500">
                        当前没有可编辑的骨架，请返回第一步生成 PPT 草案。
                        <Button
    type="button"
    className="mt-3 rounded-full"
    onClick={() => setStep("brief")}
  >
                            返回资料填写
                        </Button>
                    </Card>}
            </section>
        </div>;
}
export {
  PptWorkspace
};
