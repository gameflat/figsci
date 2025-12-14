/**
 * 模板分类
 */
export type TemplateCategory = "all" | "business" | "development" | "product" | "security" | "creative" | "process" | "structure" | "schematic" | "comparison" | "timeline";

/**
 * 模板难度
 */
export type TemplateDifficulty = "beginner" | "intermediate" | "advanced";

/**
 * 排序方式
 */
export type TemplateSortOption = "popular" | "newest" | "quickest" | "alphabetical";

/**
 * 模板分类元信息
 */
export interface TemplateCategoryMeta {
  id: TemplateCategory;
  label: string;
  icon: string;
  count: number;
}

/**
 * 模板筛选状态
 */
export interface TemplateFilterState {
  category: TemplateCategory;
  searchQuery: string;
  sortBy: TemplateSortOption;
  difficulty?: TemplateDifficulty;
}

/**
 * 模板渐变色配置
 */
export interface TemplateGradient {
  from: string;
  to: string;
}

/**
 * 布局方向
 */
export type LayoutDirection = "vertical" | "horizontal" | "layered" | "radial" | "grid" | "parallel" | "timeline";

/**
 * 模板布局配置
 */
export interface TemplateLayoutConfig {
  direction: LayoutDirection;
  description: string;
  startPosition?: { x: number; y: number };
  canvasSize?: { width: number; height: number };
}

/**
 * 颜色配置
 */
export interface ColorConfig {
  fill: string;
  stroke: string;
  font?: string;
}

/**
 * 模板配色方案
 */
export interface TemplateColorScheme {
  primary: ColorConfig;
  secondary?: ColorConfig;
  accent?: ColorConfig;
  success?: ColorConfig;
  warning?: ColorConfig;
  error?: ColorConfig;
}

/**
 * 节点样式配置
 */
export interface NodeStyleConfig {
  style: string;
  width: number;
  height: number;
}

/**
 * 模板节点样式集合
 */
export interface TemplateNodeStyles {
  standard?: NodeStyleConfig;
  decision?: NodeStyleConfig;
  terminal?: NodeStyleConfig;
  storage?: NodeStyleConfig;
  container?: NodeStyleConfig;
  text?: NodeStyleConfig;
}

/**
 * 模板结构定义
 */
export interface TemplateStructure {
  layout: LayoutDirection;
  sections?: string[];
  nodeTypes?: string[];
  description?: string;
}

/**
 * 绘图指导配置
 */
export interface DrawingGuidelines {
  layout?: string;
  spacing?: string;
  connections?: string;
  typography?: string;
  tips?: string[];
}

/**
 * 模板 Brief 配置
 */
export interface TemplateBrief {
  intent?: string;
  tone?: string;
  focus?: string[];
  diagramTypes?: string[];
}

/**
 * 图表模板
 */
export interface DiagramTemplate {
  id: string;
  title: string;
  description: string;
  previewUrl?: string;
  category: TemplateCategory;
  tags: string[];
  industryTags?: string[];
  scenes?: string[];
  difficulty: TemplateDifficulty;
  isPopular?: boolean;
  isNew?: boolean;
  icon: string;
  gradient: TemplateGradient;
  prompt: string;
  estimatedTime: string;
  usageCount?: number;
  createdAt?: string;
  rating?: number;
  author?: string;
  useCases?: string[];
  features?: string[];
  brief?: TemplateBrief;
  /** 结构化布局定义 */
  structure?: TemplateStructure;
  /** 配色方案 */
  colorScheme?: TemplateColorScheme;
  /** 节点样式 */
  nodeStyles?: TemplateNodeStyles;
  /** 绘图指导 */
  drawingGuidelines?: DrawingGuidelines;
  /** 示例 XML 片段 */
  exampleXml?: string;
}
