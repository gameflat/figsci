// -*- coding: utf-8 -*-
/**
 * 模板加载工具
 * 从模板数据中提取模板信息，供 AI Agents 使用
 */

import { DIAGRAM_TEMPLATES } from "@/data/templates";

/**
 * 获取所有可用模板的简化信息（用于 AI 匹配）
 * 
 * @returns {Array<{id: string, title: string, description: string, category: string, tags: string[], prompt: string, brief: Object}>}
 */
export function getAllTemplatesForMatching() {
  return DIAGRAM_TEMPLATES.map(template => ({
    id: template.id,
    title: template.title,
    description: template.description,
    category: template.category,
    tags: template.tags,
    prompt: template.prompt,
    brief: template.brief,
    useCases: template.useCases || [],
    features: template.features || [],
  }));
}

/**
 * 根据模板 ID 获取完整模板信息
 * 
 * @param {string} templateId - 模板 ID
 * @returns {import("@/types/template").DiagramTemplate | null}
 */
export function getTemplateById(templateId) {
  return DIAGRAM_TEMPLATES.find(t => t.id === templateId) || null;
}

/**
 * 构建模板匹配的上下文信息（用于 AI 分析）
 * 
 * @param {import("@/types/template").DiagramTemplate} template - 模板对象
 * @returns {string} 格式化的模板描述
 */
export function buildTemplateContext(template) {
  const parts = [
    `标题: ${template.title}`,
    `描述: ${template.description}`,
    `分类: ${template.category}`,
    `标签: ${template.tags.join(", ")}`,
  ];
  
  if (template.useCases && template.useCases.length > 0) {
    parts.push(`适用场景: ${template.useCases.join(", ")}`);
  }
  
  if (template.features && template.features.length > 0) {
    parts.push(`核心功能: ${template.features.join(", ")}`);
  }
  
  if (template.brief) {
    parts.push(`Brief 配置: ${JSON.stringify(template.brief)}`);
  }
  
  return parts.join("\n");
}

