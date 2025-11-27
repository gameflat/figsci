"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Badge,
  BarChart,
  Briefcase,
  Bug,
  Building,
  CheckCircle,
  Clock,
  Code2,
  Database,
  GitBranch,
  Layers,
  Lightbulb,
  Lock,
  Map,
  MessageSquare,
  Network,
  Package,
  Palette,
  Repeat,
  Rocket,
  Route,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TestTube,
  UserPlus,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

// Icon mapping for templates
const ICON_MAP = {
  UserPlus,
  Workflow,
  GitBranch,
  Route,
  Repeat,
  Bug,
  Briefcase,
  Code2,
  Sparkles,
  Badge,
  CheckCircle,
  Zap,
  Building,
  Lightbulb,
  Package,
  Network,
  Map,
  Shield,
  Server,
  Rocket,
  Target,
  TestTube,
  Database,
  ShieldCheck,
  Lock,
  Users,
  Layers,
  Palette,
  BarChart,
  MessageSquare,
};

/**
 * @typedef {Object} TemplateCardProps
 * @property {import("@/types/template").DiagramTemplate} template
 * @property {(template: import("@/types/template").DiagramTemplate) => void} onUse
 * @property {"grid" | "list"} [variant]
 * @property {(template: import("@/types/template").DiagramTemplate) => void} [onHover]
 * @property {(template: import("@/types/template").DiagramTemplate) => void} [onClick]
 * @property {boolean} [compact]
 */

/**
 * @param {TemplateCardProps} props
 */
export function TemplateCard({
  template,
  onUse,
  variant = "grid",
  onHover,
  onClick,
  compact = false,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const Icon = ICON_MAP[template.icon] || Sparkles;

  const difficultyConfig = {
    beginner: { label: "初级", color: "text-green-600 bg-green-50" },
    intermediate: { label: "中级", color: "text-blue-600 bg-blue-50" },
    advanced: { label: "高级", color: "text-purple-600 bg-purple-50" },
  };

  const difficulty = difficultyConfig[template.difficulty];

  const badges = (
    <div className="flex gap-1">
      {template.isPopular && (
        <div className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 shadow-sm">
          <Star className="inline h-3 w-3 fill-amber-500 text-amber-500" /> 热门
        </div>
      )}
      {template.isNew && (
        <div className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 shadow-sm">
          ✨ 新品
        </div>
      )}
    </div>
  );

  const previewBlock = (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-md"
      style={{
        background: `linear-gradient(135deg, ${template.gradient.from} 0%, ${template.gradient.to} 100%)`,
      }}
    >
      {template.previewUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-90"
          style={{ backgroundImage: `url(${template.previewUrl})` }}
        />
      ) : null}
      <Icon className="relative h-8 w-8 text-white drop-shadow-sm" strokeWidth={1.5} />
    </div>
  );

  if (variant === "list") {
    return (
      <div
        className={cn(
          "group relative flex items-center gap-3 rounded-lg border bg-white px-3 py-3 transition-all duration-150 cursor-pointer",
          "hover:-translate-y-[1px] hover:shadow-sm hover:border-slate-300"
        )}
        onClick={() => onClick?.(template)}
        onMouseEnter={() => {
          setIsHovered(true);
          onHover?.(template);
        }}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="h-14 w-14 shrink-0">{previewBlock}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">
              {template.title}
            </h3>
            {badges}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
            {template.description}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
              <Clock className="h-3 w-3" />
              <span>{template.estimatedTime}</span>
            </div>
            <div className={cn("rounded-full px-2 py-0.5", difficulty.color)}>
              {difficulty.label}
            </div>
            {template.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onUse(template);
          }}
        >
          使用
        </Button>
      </div>
    );
  }

  // Compact Mode (Sample Room Style)
  if (compact) {
    return (
      <div
        className={cn(
          "group flex h-full flex-col rounded-2xl border border-slate-200 bg-white/80 p-3 text-left shadow-sm transition hover:border-slate-900 hover:shadow-md cursor-pointer",
        )}
        onClick={() => onClick?.(template)}
        onMouseEnter={() => {
          setIsHovered(true);
          onHover?.(template);
        }}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
          <div
            className="aspect-[16/9] w-full relative"
            style={{
              background: `linear-gradient(135deg, ${template.gradient.from} 0%, ${template.gradient.to} 100%)`,
            }}
          >
            {template.previewUrl && (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-90"
                style={{ backgroundImage: `url(${template.previewUrl})` }}
              />
            )}

            <div className="absolute inset-0 flex flex-col justify-between p-3 text-white">
              <div className="flex justify-between items-start">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-white/80 bg-black/20 px-1.5 py-0.5 rounded backdrop-blur-sm">
                  {template.estimatedTime}
                </div>
                {template.isPopular && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 drop-shadow-sm" />}
              </div>
              <Icon className="h-6 w-6 text-white drop-shadow-sm opacity-80" />
            </div>
            <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-white/20 blur-xl" />
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <p className="text-sm font-semibold text-slate-900 line-clamp-1">
            {template.title}
          </p>
          <p className="text-xs text-slate-600 line-clamp-2">
            {template.description}
          </p>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {template.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onUse(template);
          }}
          className="mt-3 inline-flex w-fit items-center gap-1 rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[11px] font-semibold text-slate-600 transition group-hover:border-slate-900 group-hover:text-slate-900 hover:bg-slate-50"
        >
          一键套用
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border bg-white shadow-sm transition-all duration-200 cursor-pointer",
        "hover:shadow-lg hover:-translate-y-1",
        isHovered && "border-slate-300"
      )}
      onClick={() => onClick?.(template)}
      onMouseEnter={() => {
        setIsHovered(true);
        onHover?.(template);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badges */}
      <div className="absolute right-3 top-3 z-10 flex gap-1">{badges}</div>

      {/* Gradient Header / Preview */}
      <div className={cn(
        "flex items-center justify-center rounded-t-xl",
        "h-[120px]"
      )}>
        {previewBlock}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <h3 className="mb-1.5 line-clamp-1 text-base font-semibold text-slate-900">
          {template.title}
        </h3>

        {/* Description */}

        <p className="mb-3 line-clamp-2 text-sm text-slate-600">
          {template.description}
        </p>


        {/* Metadata */}
        <div className="mb-3 flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{template.estimatedTime}</span>
          </div>
          <div className={cn("rounded-full px-2 py-0.5", difficulty.color)}>
            {difficulty.label}
          </div>
        </div>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 transition-colors hover:bg-slate-200"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onUse(template);
          }}
          className={cn(
            "group/btn mt-auto w-full transition-all duration-200",
            "bg-gradient-to-r hover:shadow-md",
            isHovered && "translate-x-0.5"
          )}
          style={{
            backgroundImage: `linear-gradient(to right, ${template.gradient.from}, ${template.gradient.to})`,
          }}
        >
          <span>使用模板</span>
          <span
            className={cn(
              "ml-1 inline-block transition-transform duration-200",
              isHovered && "translate-x-1"
            )}
          >
            →
          </span>
        </Button>

        {/* Click to view hint */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/5 rounded-xl flex items-center justify-center backdrop-blur-[0.5px] pointer-events-none">
            <div className="bg-white/95 px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-slate-700">
              点击查看详情
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton loader for template card
 */
export function TemplateCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border bg-white shadow-sm">
      {/* Gradient Header Skeleton */}
      <div className="h-[120px] animate-pulse rounded-t-xl bg-gradient-to-br from-slate-200 to-slate-300" />

      {/* Content Skeleton */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 h-5 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="mb-1 h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="mb-3 h-4 w-5/6 animate-pulse rounded bg-slate-100" />
        <div className="mb-3 flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-12 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="mb-4 flex gap-1.5">
          <div className="h-6 w-14 animate-pulse rounded bg-slate-100" />
          <div className="h-6 w-16 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="mt-auto h-9 w-full animate-pulse rounded-md bg-slate-200" />
      </div>
    </div>
  );
}

