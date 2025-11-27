"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { BarChart3, FileBarChart, Layers3 } from "lucide-react";

/**
 * @typedef {Object} BlueprintTemplate
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} prompt
 * @property {string[]} tags
 */

/**
 * @typedef {Object} BlueprintCategory
 * @property {string} id
 * @property {string} label
 * @property {string} hero
 * @property {string} purpose
 * @property {BlueprintTemplate[]} templates
 */

const BLUEPRINT_CATEGORIES = [
    {
        id: "okr",
        label: "高层述职",
        hero: "季度 OKR · 亮点",
        purpose: "突出目标完成度与下季度计划",
        templates: [
            {
                id: "okr-radar",
                title: "OKR 雷达舱图",
                description:
                    "展示 O、KR、指标与负责人，突出超额或滞后项。",
                prompt:
                    "请根据当前画布，绘制一张 OKR 雷达舱结构，将 O、KR、支撑指标、负责人分舱展示，并在超额/滞后项旁增加标记，整体控制在 720x520 内。",
                tags: ["领导汇报", "目标追踪"],
            },
            {
                id: "next-quarter-plan",
                title: "下季度三焦点",
                description:
                    "三列展示策略主题、关键动作、所需支持。",
                prompt:
                    '请创建一个三列的战略行动图，列名为"策略主题""关键动作""所需支持"，每列包含 3-4 个节点并用箭头串联，风格偏企业级幻灯片。',
                tags: ["计划", "策略"],
            },
        ],
    },
    {
        id: "delivery",
        label: "项目复盘",
        hero: "里程碑 · 风险",
        purpose: "对齐阶段战果与经验教训",
        templates: [
            {
                id: "milestone-timeline",
                title: "里程碑温度计",
                description:
                    "按时间线展示里程碑、成功条件与实测效果。",
                prompt:
                    "请绘制一条水平时间线，包含立项、试点、规模化、沉淀四个节点，每个节点展示目标、实测结果与关键阻塞，节点下方用红/黄/绿标记风险。",
                tags: ["项目", "复盘"],
            },
            {
                id: "risk-loop",
                title: "风险处置闭环",
                description:
                    "梳理风险来源、触发信号、处置责任与回路。",
                prompt:
                    '请构建一个四象限风险闭环图，象限依次为"风险来源""触发信号""处置动作""复盘沉淀"，每个象限至少列出两条要点并使用箭头循环连接。',
                tags: ["风险", "流程"],
            },
        ],
    },
    {
        id: "ops",
        label: "运营洞察",
        hero: "漏斗 · 流程",
        purpose: "刻画指标驱动与跨团队配合",
        templates: [
            {
                id: "growth-funnel",
                title: "增长漏斗 + 裂变点",
                description:
                    "五段漏斗展示人群流失率，右侧列出破局点。",
                prompt:
                    '请生成一张五段增长漏斗，段名为曝光、点击、激活、留存、复购，并在右侧独立列出"破局点"，每个破局点连接到影响的漏斗段。',
                tags: ["增长", "数据"],
            },
            {
                id: "handoff-lane",
                title: "跨部门交接泳道",
                description:
                    "展示产品/运营/销售/支持四条泳道的协同动作。",
                prompt:
                    "请创建四条泳道：产品、运营、销售、客户成功。将需求洞察、方案打磨、试点投放、复盘增购四个阶段放入对应泳道，标注关键交接点。",
                tags: ["泳道", "协同"],
            },
        ],
    },
    {
        id: "architecture",
        label: "架构方案",
        hero: "组件 · 部署拓扑",
        purpose: "让技术团队一次讲清依赖与环境",
        templates: [
            {
                id: "cloud-component-stack",
                title: "云上分层组件图",
                description:
                    "三层结构串联网关、服务、数据与外部依赖。",
                prompt:
                    "请绘制一个分三层（接入层、业务服务层、数据&外部）的组件图，展示网关、认证、订单、库存、通知、计费、数据仓库等组件，并标记同步/异步协议。",
                tags: ["组件图", "PlantUML"],
            },
            {
                id: "zero-trust-deployment",
                title: "零信任部署环",
                description:
                    "展示多区域部署、信任边界与观测点。",
                prompt:
                    "请生成一个部署拓扑，包含用户、CDN、WAF、API 网关、服务网格、工作负载节点、数据库、监控等节点；区分公网/DMZ/内网安全域，并注明可用区与健康探针。",
                tags: ["部署", "安全"],
            },
        ],
    },
    {
        id: "customer",
        label: "客户成功",
        hero: "旅程 · 续约",
        purpose: "帮助 CSM 把健康度与增购机会可视化",
        templates: [
            {
                id: "journey-health-map",
                title: "客户健康旅程",
                description:
                    "阶段×情绪×行动的体验蓝图。",
                prompt:
                    "请绘制发现、上线、扩散、续约四个阶段的客户旅程图，包含目标、关键触点、情绪曲线与责任团队泳道，并高亮健康预警点。",
                tags: ["旅程", "体验"],
            },
            {
                id: "expansion-matrix",
                title: "增购机会矩阵",
                description:
                    "把人群、产品、信号组成机会面。",
                prompt:
                    '请创建一个 2×3 的机会矩阵，行是"现有团队/新团队"，列是"功能深用/增值模块/服务包"，在每个格子内列出触发信号与推荐话术。',
                tags: ["续约", "策略"],
            },
        ],
    },
    {
        id: "incident",
        label: "应急预案",
        hero: "指挥链 · 跑道",
        purpose: "保障安全/稳定团队复盘与演练",
        templates: [
            {
                id: "war-room-chain",
                title: "战情室指挥链",
                description:
                    "突发事件的指挥席位与交接。",
                prompt:
                    "请绘制一张指挥链流程图，展示值班、指挥官、技术负责人、业务负责人、对外沟通的触发与信息流，标出决策节点与升级阈值。",
                tags: ["应急", "流程"],
            },
            {
                id: "sre-runbook",
                title: "SRE 处置跑道",
                description:
                    "检测→隔离→缓解→复盘的闭环。",
                prompt:
                    "请生成一个四阶段的 Runbook 流程，从告警检测到隔离、缓解、验证、复盘，每阶段列出关键动作、工具与责任角色，支持平行处理分支。",
                tags: ["SRE", "Runbook"],
            },
        ],
    },
];

/**
 * @typedef {Object} ReportBlueprintTrayProps
 * @property {boolean} [disabled]
 * @property {(template: BlueprintTemplate) => void} onUseTemplate
 */

/**
 * @param {ReportBlueprintTrayProps} props
 */
export function ReportBlueprintTray({
    disabled = false,
    onUseTemplate,
}) {
    const [activeCategoryId, setActiveCategoryId] = useState(
        BLUEPRINT_CATEGORIES[0]?.id ?? ""
    );

    const activeCategory = useMemo(
        () =>
            BLUEPRINT_CATEGORIES.find(
                (category) => category.id === activeCategoryId
            ) ?? BLUEPRINT_CATEGORIES[0],
        [activeCategoryId]
    );

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                <FileBarChart className="h-4 w-4" />
                汇报模板
            </div>
            <div className="flex flex-wrap gap-2">
                {BLUEPRINT_CATEGORIES.map((category) => {
                    const isActive = category.id === activeCategoryId;
                    return (
                        <button
                            key={category.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => setActiveCategoryId(category.id)}
                            className={cn(
                                "rounded-full border px-3 py-1 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-60",
                                isActive
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                            )}
                        >
                            {category.label}
                        </button>
                    );
                })}
            </div>
            {activeCategory && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-800">
                                {activeCategory.hero}
                            </p>
                            <p className="text-xs text-slate-600">
                                {activeCategory.purpose}
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                            <Layers3 className="h-3.5 w-3.5" />
                            智能分类
                        </div>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {activeCategory.templates.map((template) => (
                            <button
                                key={template.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => onUseTemplate(template)}
                                className={cn(
                                    "flex h-full flex-col rounded-xl border border-white/70 bg-white p-3 text-left shadow-sm transition hover:border-slate-900 hover:shadow-md",
                                    disabled && "cursor-not-allowed opacity-60"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-900">
                                        {template.title}
                                    </p>
                                    <BarChart3 className="h-4 w-4 text-slate-400" />
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                    {template.description}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {template.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <span className="mt-3 text-xs font-semibold text-slate-600">
                                    点击立即填充指令
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

