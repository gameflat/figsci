/**
 * 单个可调用模型配置
 * @typedef {Object} EndpointModelConfig
 * @property {string} id
 * @property {string} modelId
 * @property {string} label
 * @property {string} [description]
 * @property {boolean} [isStreaming] 是否启用流式输出
 * @property {boolean} [supportsToolCalls] 是否支持工具调用（function calling），默认为 true
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * 模型端点配置
 * @typedef {Object} ModelEndpointConfig
 * @property {string} id
 * @property {string} name
 * @property {string} baseUrl
 * @property {string} apiKey
 * @property {EndpointModelConfig[]} models
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * 运行时模型配置（供调用使用）
 * @typedef {Object} RuntimeModelConfig
 * @property {string} modelId
 * @property {string} baseUrl
 * @property {string} apiKey
 * @property {string} [label]
 * @property {boolean} [enableStreaming]
 * @property {boolean} [supportsToolCalls] 是否支持工具调用（function calling），默认为 true
 */

/**
 * 在 UI 中展示的模型选项
 * @typedef {RuntimeModelConfig & {
 *   key: string;
 *   endpointId: string;
 *   endpointName: string;
 *   providerHint: string;
 *   isStreaming?: boolean;
 * }} RuntimeModelOption
 */

/**
 * 模型注册表状态
 * @typedef {Object} ModelRegistryState
 * @property {ModelEndpointConfig[]} endpoints
 * @property {string} [selectedModelKey]
 */

/**
 * 端点内模型草稿（用于表单）
 * @typedef {Object} EndpointModelDraft
 * @property {string} id
 * @property {string} modelId
 * @property {string} label
 * @property {string} [description]
 * @property {boolean} [isStreaming]
 * @property {boolean} [supportsToolCalls] 是否支持工具调用（function calling）
 * @property {number} [createdAt]
 * @property {number} [updatedAt]
 */

/**
 * 模型端点草稿（用于表单）
 * @typedef {Object} ModelEndpointDraft
 * @property {string} id
 * @property {string} name
 * @property {string} baseUrl
 * @property {string} apiKey
 * @property {EndpointModelDraft[]} models
 * @property {number} [createdAt]
 * @property {number} [updatedAt]
 */

/**
 * 系统内置模型信息（客户端可见部分，不包含 API Key）
 * @typedef {Object} SystemModelInfo
 * @property {string} id - 模型 ID
 * @property {string} label - 显示名称
 * @property {string} [description] - 模型描述
 * @property {boolean} [isStreaming] - 是否支持流式输出
 * @property {boolean} [supportsToolCalls] - 是否支持工具调用（function calling），默认为 true
 */

/**
 * 系统模型运行时选项（用于 UI 显示）
 * @typedef {Object} SystemModelOption
 * @property {string} key - 唯一标识符（格式：system:{modelId}）
 * @property {string} modelId - 模型 ID
 * @property {string} label - 显示名称
 * @property {string} [description] - 模型描述
 * @property {boolean} [isStreaming] - 是否支持流式输出
 * @property {boolean} [supportsToolCalls] - 是否支持工具调用（function calling），默认为 true
 * @property {boolean} isSystemModel - 是否为系统模型（始终为 true）
 * @property {string} endpointId - 端点 ID（系统模型固定为 "system"）
 * @property {string} endpointName - 端点名称（系统模型固定为 "系统内置"）
 * @property {string} providerHint - 提供商提示
 */

export {};
