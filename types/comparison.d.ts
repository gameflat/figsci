/**
 * 对比结果状态
 * @typedef {"loading"|"ok"|"error"|"cancelled"} ComparisonResultStatus
 */

/**
 * 对比配置
 * @typedef {Object} ComparisonModelConfig
 * @property {string[]} models 最多 5 个模型 key
 */

/**
 * 对比模型元信息
 * @typedef {Object} ComparisonModelMeta
 * @property {string} key
 * @property {string} id
 * @property {string} label
 * @property {string} provider
 * @property {string} slot
 * @property {import("@/types/model-config").RuntimeModelConfig} runtime
 */

/**
 * 单个对比结果卡片
 * @typedef {Object} ComparisonCardResult
 * @property {string} id
 * @property {string} modelId
 * @property {string} label
 * @property {string} provider
 * @property {string} slot
 * @property {ComparisonResultStatus} status
 * @property {import("@/types/model-config").RuntimeModelConfig} [runtime]
 * @property {string} [summary]
 * @property {string} [xml]
 * @property {string} [svg]
 * @property {"drawio"|"svg"} [mode]
 * @property {string} [encodedXml]
 * @property {string} [previewSvg]
 * @property {string} [previewImage]
 * @property {string} [error]
 * @property {string} [branchId]
 * @property {{inputTokens?: number, outputTokens?: number, totalTokens?: number}} [usage]
 * @property {number} [durationMs]
}

/**
 * 对比历史记录
 * @typedef {Object} ComparisonHistoryEntry
 * @property {string} requestId
 * @property {string} prompt
 * @property {string} timestamp
 * @property {string[]} badges
 * @property {ComparisonModelMeta[]} models
 * @property {"loading"|"ready"|"cancelled"} status
 * @property {ComparisonCardResult[]} results
 * @property {string|null} [anchorMessageId]
 * @property {string|null} [adoptedResultId]
 */

export {};
