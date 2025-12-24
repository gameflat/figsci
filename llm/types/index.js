// -*- coding: utf-8 -*-
/**
 * AI Agents 工作流类型定义
 */

/**
 * @typedef {Object} WorkflowInput
 * @property {string} userInput - 用户输入的原始内容
 * @property {string} [currentXml] - 当前画布的 XML（可选）
 * @property {Object} [modelRuntime] - 默认模型运行时配置（可选）
 * @property {Object} [architectModel] - Architect模型配置（可选，覆盖默认配置）
 * @property {Object} [rendererModel] - Renderer模型配置（可选，覆盖默认配置）
 */

/**
 * @typedef {Object} WorkflowOutput
 * @property {string} xml - 生成的 Draw.io XML 代码
 * @property {string} [formattedPrompt] - 格式化后的提示词
 * @property {string} [mermaid] - 生成的 Mermaid 代码
 * @property {string} [visualSchema] - VISUAL SCHEMA
 * @property {Object} [metadata] - 元数据信息
 */

/**
 * @typedef {Object} VisualSchema
 * @property {string} content - VISUAL SCHEMA 内容（---BEGIN PROMPT--- 到 ---END PROMPT--- 之间的内容）
 * @property {string} rawOutput - Architect 的原始输出
 */

/**
 * @typedef {Object} ArchitectConfig
 * @property {string} [modelId] - 模型 ID
 * @property {string} [baseUrl] - API Base URL
 * @property {string} [apiKey] - API Key
 * @property {string} [label] - 模型标签
 */

/**
 * @typedef {Object} RendererConfig
 * @property {string} [modelId] - 模型 ID
 * @property {string} [baseUrl] - API Base URL
 * @property {string} [apiKey] - API Key
 * @property {string} [label] - 模型标签
 */

/**
 * @typedef {Object} PromptFormatterResult
 * @property {string} formattedPrompt - 格式化后的 Markdown 提示词
 */

/**
 * @typedef {Object} MermaidGeneratorResult
 * @property {string} mermaid - Mermaid 图表代码
 */

/**
 * @typedef {Object} ArchitectResult
 * @property {string} visualSchema - VISUAL SCHEMA 内容
 * @property {string} rawOutput - 原始输出
 */

/**
 * @typedef {Object} RendererResult
 * @property {string} xml - Draw.io XML 代码
 */

