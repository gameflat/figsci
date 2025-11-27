/**
 * 单个可调用模型配置
 * @typedef {Object} EndpointModelConfig
 * @property {string} id
 * @property {string} modelId
 * @property {string} label
 * @property {string} [description]
 * @property {boolean} [isStreaming] 是否启用流式输出
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

export {};
