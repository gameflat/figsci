"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
    ChevronDown,
    ChevronUp,
    Figma,
    LayoutDashboard,
    Settings2,
    Sparkles,
    Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

/**
 * @typedef {"guided" | "free"} BriefModeId
 * @typedef {"draft" | "polish" | "explain"} BriefIntentId
 * @typedef {"balanced" | "playful" | "enterprise" | "sketch" | "blueprint"} BriefToneId
 * @typedef {"clarity" | "flow" | "hierarchy"} BriefFocusId
 * @typedef {"auto" | "sequence" | "activity" | "component" | "state" | "deployment" | "mindmap" | "journey" | "gantt"} BriefDiagramTypeId
 */

/**
 * @typedef {Object} FigsciBriefState
 * @property {BriefModeId} [mode]
 * @property {BriefIntentId} intent
 * @property {BriefToneId} tone
 * @property {BriefFocusId[]} focus
 * @property {BriefDiagramTypeId[]} diagramTypes
 */

export const DEFAULT_BRIEF_STATE = {
    mode: "guided",
    intent: "draft",
    tone: "balanced",
    focus: ["clarity"],
    diagramTypes: ["auto"],
};

/**
 * @template {string} T
 * @typedef {Object} Option
 * @property {T} id
 * @property {string} title
 * @property {string} description
 * @property {string} prompt
 */

const BRIEF_MODE_OPTIONS = [
    {
        id: "guided",
        title: "Figsci Brief",
        description: "基于科研绘图最佳实践的智能配置",
        helper: "自动优化图表以符合学术期刊标准",
    },
    {
        id: "free",
        title: "自由模式",
        description: "AI自主选择，仅保留基础规范",
        helper: "适合探索性绘图和自定义需求",
    },
];

export const Figsci_FREEFORM_GUARDRAILS = [
    "保持画面干净美观，优先单屏阅读，不要堆叠或线路缠绕。",
    "输出语法必须正确，连线完整、标签清晰，避免损坏的 XML/SVG。",
    "完全依据用户输入自由选择图型与布局，不擅自添加科学假设。",
    "确保图表符合学术期刊发表标准，使用专业术语和规范符号。",
];

export const Figsci_FREEFORM_PROMPT = `默认出图守则（不附加 FlowBrief 偏好）：
- Keep the canvas clean, readable, and balanced; avoid cluttered crossings.
- Ensure syntax validity and connected arrows/labels; no broken XML/SVG/mermaid.
- Choose whichever diagram type/layout best fits the user's text without adding extra assumptions.`;

// INTENT - 科研绘图任务模式
export const INTENT_OPTIONS = [
    {
        id: "draft",
        title: "新建图表",
        description: "从研究描述构建全新的科研图表",
        prompt: "Create a complete scientific diagram from scratch with clear structure, accurate scientific terminology, meaningful labels, and logical organization following academic standards.",
    },
    {
        id: "polish",
        title: "优化改进",
        description: "保持科学内容，优化布局和可读性",
        prompt: "Preserve all existing scientific information and data while improving alignment, grouping, spacing, visual flow, and readability for publication standards.",
    },
    {
        id: "explain",
        title: "机制解析",
        description: "分析科学逻辑并建议改进方案",
        prompt: "Analyze the current diagram's scientific logic, identify potential improvements for clarity and accuracy, and suggest enhancements that better represent the research concepts.",
    },
];

// TONE - 科研绘图视觉风格
export const TONE_OPTIONS = [
    {
        id: "balanced",
        title: "学术标准",
        description: "符合 Nature/Science/CVPR 等顶刊顶会风格",
        prompt:
            "Academic standard design: Clean white/light gray background with systematic neutral palette (gray-50 to gray-900). Primary accent colors following Nature/Science/EAA journal standards (typically blue/indigo for methods, green for results, orange for conclusions). 8px border-radius, 1-2px strokes, subtle shadows. 4.5:1 contrast minimum. 8px grid alignment. Clear visual hierarchy suitable for scientific publications.",
    },
    {
        id: "playful",
        title: "图形摘要",
        description: "适合 Graphical Abstract 的视觉风格",
        prompt:
            "Graphical abstract style: 2-3 complementary colors with soft gradients (10-20%) following Elsevier or Springer journal standards. Rounded corners (12-16px), generous spacing (16-24px). Engaging yet professional tone. Clear sans-serif fonts (Arial, Helvetica), line-height 1.5-1.6. Emphasize visual storytelling and research impact.",
    },
    {
        id: "enterprise",
        title: "严谨专业",
        description: "高影响因子期刊标准",
        prompt:
            "High-impact journal standard: Conservative navy/slate/black colors, minimal but strategic accents. Generous white space (≥40px margins), strong grid alignment. Bold typography hierarchy using serif or professional sans-serif. ≤10 key elements per view for clarity. Orthogonal layouts, clean arrows. 7:1 contrast for critical scientific data. Emphasize precision and credibility.",
    },
    {
        id: "sketch",
        title: "概念草图",
        description: "研究初期或提案阶段",
        prompt:
            "Conceptual sketch for early-stage research: Rough organic strokes (2-3px varied), sketch-like shapes suitable for brainstorming or grant proposals. Clear fonts, subtle texture, relaxed alignment. Muted pastels, pencil-like outlines. Annotations and arrows for conceptual development. Balance creativity with scientific accuracy.",
    },
    {
        id: "blueprint",
        title: "技术精确",
        description: "结构图、机制图、流程图的精确呈现",
        prompt:
            "Technical precision for mechanisms and structures: Off-white/light blue background, precise charcoal/dark blue lines (1px). Monospace or technical serif fonts (Times, Garamond). Tight grid (4px precision), minimal decoration. Single cyan/electric blue accent for key components. No gradients/shadows. Emphasize technical accuracy, molecular structures, reaction mechanisms, or system architectures.",
    },
];

// FOCUS - 科研绘图设计重点
export const FOCUS_OPTIONS = [
    {
        id: "clarity",
        title: "清晰可读",
        description: "确保信息传达准确，符合期刊要求",
        prompt: "Prioritize scientific clarity and readability for publication. Limit to 15-20 key elements per diagram. Use concise, accurate scientific labels (2-5 words) with proper terminology. Remove unnecessary decorative elements. Apply generous white space (≥40px margins). Focus on essential research information only. Ensure all elements are distinguishable at publication resolution.",
    },
    {
        id: "flow",
        title: "逻辑流程",
        description: "科学流程的时间顺序和因果关系",
        prompt: "Ensure consistent scientific flow direction (left-to-right for temporal, top-to-bottom for hierarchical, or circular for feedback loops). Use clear directional arrows indicating cause-effect relationships, energy transfer, or data flow. Return lines run underneath main flow. Logical progression easy to follow for readers. Annotate critical steps or decision points in scientific processes.",
    },
    {
        id: "hierarchy",
        title: "结构层次",
        description: "突出主要发现和核心机制",
        prompt: "Group related scientific concepts using visual clusters, containers, or functional regions. Clear visual hierarchy with size, color intensity, or position emphasizing main findings or core mechanisms. Consistent spacing between groups (e.g., cellular compartments, system layers, experimental conditions). Label each major section with appropriate scientific terminology. Use color coding for different experimental groups, treatments, or biological processes.",
    },
];

// DIAGRAM_TYPE - 科研绘图图表类型
export const DIAGRAM_TYPE_OPTIONS = [
    {
        id: "auto",
        title: "智能识别",
        description: "AI自动选择最合适的科研图表类型",
        prompt: "Automatically select the most appropriate scientific diagram type based on research content and requirements. Consider: experimental procedures → process flowchart, molecular mechanisms → pathway diagram, system architectures → layered architecture, classifications → taxonomy tree, comparisons → comparison chart, timelines → Gantt/timeline, structures → exploded view or cross-section.",
    },
    {
        id: "activity",
        title: "实验流程",
        description: "实验步骤、方法学流程",
        prompt: "Experimental process flowchart with sequential steps, decision points (e.g., quality control checkpoints), parallel experimental arms, and clear start/end points. Annotate experimental conditions, parameters, and branching logic. Include icons for instruments or key procedures.",
    },
    {
        id: "sequence",
        title: "信号通路",
        description: "生物信号传递、分子级联反应",
        prompt: "Signaling pathway or molecular cascade diagram showing molecules/proteins as nodes, interactions as arrows (activation/inhibition), feedback loops, and key regulatory points. Use standard biological notation (arrows, T-bars). Emphasize temporal sequence and cause-effect relationships.",
    },
    {
        id: "component",
        title: "系统架构",
        description: "研究系统、模型框架的分层结构",
        prompt: "System architecture diagram showing subsystems, modules, or functional layers (e.g., data layer, processing layer, application layer in computational research). Indicate interfaces, data flow directions, and component dependencies. Suitable for computational biology, AI model frameworks, or engineering systems.",
    },
    {
        id: "state",
        title: "状态转换",
        description: "细胞状态、分子构象、实验阶段",
        prompt: "State transition diagram showing biological/chemical states (e.g., cell cycle phases, protein conformations, reaction intermediates), transition triggers, guard conditions, and terminal states. Use state machines for dynamic biological processes or chemical reactions.",
    },
    {
        id: "deployment",
        title: "技术路线",
        description: "研究计划、技术路线图",
        prompt: "Technical roadmap or research plan diagram with timeline stages, milestones, parallel research tracks, and dependencies. Show phases like literature review → hypothesis → methodology → experiments → analysis → conclusions. Include resource allocation or team assignments if relevant.",
    },
    {
        id: "mindmap",
        title: "概念关系",
        description: "研究概念、分类体系、知识网络",
        prompt: "Conceptual map or knowledge network with central research question/topic branching into related concepts, hypotheses, methods, or findings. Use tree or network structure. Suitable for literature reviews, conceptual frameworks, or taxonomy classifications.",
    },
    {
        id: "journey",
        title: "研究流程",
        description: "研究阶段、数据流转、工作流",
        prompt: "Research workflow or data journey diagram showing stages from data collection → processing → analysis → visualization → publication. Include touchpoints, decision nodes, and feedback loops. Emphasize data provenance and experimental traceability.",
    },
    {
        id: "gantt",
        title: "研究计划",
        description: "项目时间线、里程碑、阶段规划",
        prompt: "Research timeline or simplified Gantt chart with research phases, milestones (e.g., paper submission, conference deadlines), durations, and dependencies between tasks. Suitable for grant proposals, project management, or publication planning.",
    },
    {
        id: "schematic",
        title: "图形摘要",
        description: "论文 Graphical Abstract、研究概述",
        prompt: "Graphical abstract or schematic summary showing research background → methodology/mechanism → key findings in a horizontal three-panel layout. Use arrows to guide visual flow. Follow journal-specific style guidelines (Nature, Science, Cell, etc.). Include take-home message.",
    },
];

/**
 * @typedef {Object} FigsciBriefProps
 * @property {FigsciBriefState} state
 * @property {(state: Partial<FigsciBriefState>) => void} onChange
 * @property {boolean} [disabled]
 */

/**
 * @param {FigsciBriefProps} props
 */
export function FigsciBrief({
    state,
    onChange,
    disabled = false,
}) {
    const [showAllDiagramTypes, setShowAllDiagramTypes] = useState(false);
    const mode = state.mode ?? "guided";
    const isFreeMode = mode === "free";
    // 确保有默认的"智能识别"
    useEffect(() => {
        const autoOption = DIAGRAM_TYPE_OPTIONS.find((opt) => opt.id === "auto");
        if (!isFreeMode && autoOption && state.diagramTypes.length === 0) {
            onChange({ diagramTypes: [autoOption.id] });
        }
    }, [isFreeMode, onChange, state.diagramTypes]);

    const handleFocusToggle = (focusId) => {
        const exists = state.focus.includes(focusId);
        const next = exists
            ? state.focus.filter((id) => id !== focusId)
            : [...state.focus, focusId];
        onChange({ focus: next });
    };

    const handleDiagramTypeToggle = (diagramTypeId) => {
        const exists = state.diagramTypes.includes(diagramTypeId);
        const next = exists
            ? state.diagramTypes.filter((id) => id !== diagramTypeId)
            : [...state.diagramTypes, diagramTypeId];
        onChange({ diagramTypes: next });
    };

    // 分离"智能识别"和其他具体类型
    const autoOption = DIAGRAM_TYPE_OPTIONS.find(opt => opt.id === "auto");
    const specificOptions = DIAGRAM_TYPE_OPTIONS.filter(opt => opt.id !== "auto");
    const displayedOptions = showAllDiagramTypes ? specificOptions : [];

    return (
        <div className="rounded-2xl border bg-gradient-to-br from-white via-slate-50 to-slate-100 p-4 shadow-sm">
            <div className="mb-3 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Figsci Brief
                </div>
            </div>

            <section className="mb-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <LayoutDashboard className="h-4 w-4" />
                    出图模式
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                    {BRIEF_MODE_OPTIONS.map((option) => {
                        const isActive = mode === option.id;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                disabled={disabled}
                                className={cn(
                                    "rounded-xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-60",
                                    isActive
                                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                        : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
                                )}
                                onClick={() => onChange({ mode: option.id })}
                            >
                                <p className="text-sm font-semibold">
                                    {option.title}
                                </p>
                                <p
                                    className={cn(
                                        "text-xs mt-0.5",
                                        isActive ? "text-slate-200" : "text-slate-500"
                                    )}
                                >
                                    {option.description}
                                </p>
                                <p
                                    className={cn(
                                        "mt-1 text-[11px]",
                                        isActive ? "text-slate-200/80" : "text-slate-400"
                                    )}
                                >
                                    {option.helper}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </section>

            {isFreeMode ? (
                <div className="space-y-3 rounded-xl border border-dashed border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-800">
                        自由模式：AI 直接按输入作图，不附加Figsci Brief偏好。
                    </p>
                    <p className="text-xs text-slate-500">
                        仅保留基础规范，确保结果清晰、整洁、语法正确，适合探索性绘图和自定义需求。
                    </p>
                    <div className="flex flex-col gap-2">
                        {Figsci_FREEFORM_GUARDRAILS.map((item, index) => (
                            <div
                                key={item}
                                className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700"
                            >
                                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                                    {index + 1}
                                </span>
                                <span className="leading-relaxed">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <section className="mb-4">
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <LayoutDashboard className="h-4 w-4" />
                            任务模式
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                            {INTENT_OPTIONS.map((option) => {
                                const isActive = state.intent === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        disabled={disabled}
                                        className={cn(
                                            "rounded-xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-60",
                                            isActive
                                                ? "border-slate-900 bg-slate-900 text-white"
                                                : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
                                        )}
                                        onClick={() => onChange({ intent: option.id })}
                                    >
                                        <p className="text-sm font-semibold">
                                            {option.title}
                                        </p>
                                        <p
                                            className={cn(
                                                "text-xs mt-0.5",
                                                isActive ? "text-slate-200" : "text-slate-500"
                                            )}
                                        >
                                            {option.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="mb-4">
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <Figma className="h-4 w-4" />
                            视觉风格
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {TONE_OPTIONS.map((option) => {
                                const isActive = state.tone === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        disabled={disabled}
                                        className={cn(
                                            "rounded-full border px-4 py-1 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-60",
                                            isActive
                                                ? "border-slate-900 bg-slate-900 text-white shadow"
                                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                                        )}
                                        onClick={() => onChange({ tone: option.id })}
                                    >
                                        {option.title}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="mb-4">
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <Sparkles className="h-4 w-4" />
                            设计重点
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                            {FOCUS_OPTIONS.map((option) => {
                                const isActive = state.focus.includes(option.id);
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        disabled={disabled}
                                        className={cn(
                                            "rounded-xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-60",
                                            isActive
                                                ? "border-emerald-500 bg-emerald-50"
                                                : "border-slate-200 bg-white hover:border-slate-400"
                                        )}
                                        onClick={() => handleFocusToggle(option.id)}
                                    >
                                        <p className="text-sm font-semibold text-slate-900">
                                            {option.title}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {option.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section>
                        <div
                            className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <Workflow className="h-4 w-4"/>
                            图表类型
                        </div>

                        {/* 智能识别选项 - 推荐 */}
                        {autoOption && (
                            <div className="mb-2">
                                <button
                                    type="button"
                                    disabled={disabled}
                                    className={cn(
                                        "w-full rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-60",
                                        state.diagramTypes.includes(autoOption.id)
                                            ? "border-indigo-500 bg-indigo-50 shadow-sm"
                                            : "border-slate-200 bg-white hover:border-slate-400"
                                    )}
                                    onClick={() => handleDiagramTypeToggle(autoOption.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {autoOption.title}
                                                </p>
                                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                                    推荐
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {autoOption.description}
                                            </p>
                                        </div>
                                        <Sparkles className="h-4 w-4 text-indigo-500" />
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* 展开/收起按钮 */}
                        <button
                            type="button"
                            onClick={() => setShowAllDiagramTypes(!showAllDiagramTypes)}
                            className="mb-2 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                            {showAllDiagramTypes ? (
                                <>
                                    <ChevronUp className="h-3.5 w-3.5" />
                                    收起具体类型
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="h-3.5 w-3.5" />
                                    显示具体类型 ({specificOptions.length}个)
                                </>
                            )}
                        </button>

                        {/* 具体图表类型 - 可折叠 */}
                        {showAllDiagramTypes && (
                            <div className="grid gap-2 sm:grid-cols-2">
                                {displayedOptions.map((option) => {
                                    const isActive = state.diagramTypes.includes(option.id);
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            disabled={disabled}
                                            className={cn(
                                                "rounded-xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-60",
                                                isActive
                                                    ? "border-indigo-500 bg-indigo-50"
                                                    : "border-slate-200 bg-white hover:border-slate-400"
                                            )}
                                            onClick={() => handleDiagramTypeToggle(option.id)}
                                        >
                                            <p className="text-sm font-semibold text-slate-900">
                                                {option.title}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {option.description}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

/**
 * @typedef {Object} FigsciBriefDialogProps
 * @property {FigsciBriefState} state
 * @property {(state: Partial<FigsciBriefState>) => void} onChange
 * @property {boolean} [disabled]
 * @property {boolean} open
 * @property {(open: boolean) => void} onOpenChange
 */

/**
 * @param {FigsciBriefDialogProps} props
 */
export function FigsciBriefDialog({
    state,
    onChange,
    disabled = false,
    open,
    onOpenChange,
}) {
    const handleOpenChange = (nextOpen) => {
        if (disabled && nextOpen) {
            return;
        }
        onOpenChange(nextOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Figsci Brief 偏好配置</DialogTitle>
                    <DialogDescription>
                        设定科研绘图任务目标、视觉风格与设计重点，优化图表以符合学术期刊发表标准，或切换到自由模式进行探索性绘图。
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto min-h-0 pr-2 -mr-2">
                    <FigsciBrief state={state} onChange={onChange} disabled={disabled} />
                </div>
                <DialogFooter className="flex-shrink-0">
                    <Button
                        type="button"
                        onClick={() => handleOpenChange(false)}
                        disabled={disabled}
                    >
                        完成
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * @typedef {Object} FigsciBriefLauncherProps
 * @property {FigsciBriefState} state
 * @property {(state: Partial<FigsciBriefState>) => void} onChange
 * @property {boolean} [disabled]
 * @property {string[]} badges
 */

/**
 * @param {FigsciBriefLauncherProps} props
 */
export function FigsciBriefLauncher({
    state,
    onChange,
    disabled,
    badges,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const [isCompact, setIsCompact] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || typeof ResizeObserver === "undefined") return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;
            setIsCompact(entry.contentRect.width < 560);
        });

        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    const renderSummaryBadges = () => {
        if (badges.length === 0) return null;
        const clipped = badges.slice(0, 5);
        const remaining = Math.max(0, badges.length - 5);
        return (
            <div
                className={cn(
                    "mt-1 flex gap-1",
                    isCompact
                        ? "flex-nowrap overflow-x-auto pr-1 scrollbar-hide"
                        : "flex-wrap"
                )}
            >
                {clipped.map((badge, index) => (
                    <span
                        key={`${badge}-${index}`}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 whitespace-nowrap"
                    >
                        {badge}
                    </span>
                ))}
                {remaining > 0 && (
                    <span className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-500">
                        +{remaining} 更多
                    </span>
                )}
            </div>
        );
    };

    return (
        <>
            <div
                ref={containerRef}
                className="rounded-2xl border bg-white/90 p-3 shadow-sm"
            >
                <div className="flex flex-wrap items-center gap-2 justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Figsci Brief 偏好
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        size={isCompact ? "icon" : "sm"}
                        disabled={disabled}
                        onClick={() => setIsOpen(true)}
                        className={cn(
                            "inline-flex items-center gap-1",
                            isCompact && "rounded-full"
                        )}
                        aria-label="调整 Figsci Brief 偏好"
                    >
                        <Settings2 className="h-4 w-4" />
                        {!isCompact && "调整偏好"}
                    </Button>
                </div>
                {renderSummaryBadges()}
            </div>
            <FigsciBriefDialog
                state={state}
                onChange={onChange}
                disabled={disabled}
                open={isOpen}
                onOpenChange={setIsOpen}
            />
        </>
    );
}

