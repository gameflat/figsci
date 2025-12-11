// -*- coding: utf-8 -*-
/**
 * AI Agents 类型定义
 */

/**
 * @typedef {Object} TemplateMatchResult
 * @property {string} templateId - 匹配到的模板 ID
 * @property {string} templateTitle - 模板标题
 * @property {number} confidence - 匹配置信度 (0-1)
 * @property {string} reason - 匹配原因说明
 */

/**
 * @typedef {Object} FormattedPromptResult
 * @property {string} formattedPrompt - 格式化后的提示词
 * @property {string} templateId - 使用的模板 ID
 * @property {string} templateTitle - 模板标题
 * @property {Object} brief - 应用的 Brief 配置
 */

/**
 * @typedef {Object} TemplateMatchingInput
 * @property {string} userInput - 用户输入的原始内容
 * @property {string} [currentXml] - 当前画布的 XML（可选）
 * @property {Object[]} availableTemplates - 可用的模板列表
 */

/**
 * @typedef {Object} PromptFormattingInput
 * @property {string} userInput - 用户输入的原始内容
 * @property {string} templateId - 选中的模板 ID
 * @property {string} templatePrompt - 模板的原始提示词
 * @property {Object} templateBrief - 模板的 Brief 配置
 * @property {string} [currentXml] - 当前画布的 XML（可选）
 */

