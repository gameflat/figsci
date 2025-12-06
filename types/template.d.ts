/**
 * 模板分类
 * @typedef {"all"|"business"|"development"|"product"|"security"|"creative"} TemplateCategory
 */

/**
 * 模板难度
 * @typedef {"beginner"|"intermediate"|"advanced"} TemplateDifficulty
 */

/**
 * 排序方式
 * @typedef {"popular"|"newest"|"quickest"|"alphabetical"} TemplateSortOption
 */

/**
 * 模板分类元信息
 * @typedef {Object} TemplateCategoryMeta
 * @property {TemplateCategory} id
 * @property {string} label
 * @property {string} icon
 * @property {number} count
 */

/**
 * 模板筛选状态
 * @typedef {Object} TemplateFilterState
 * @property {TemplateCategory} category
 * @property {string} searchQuery
 * @property {TemplateSortOption} sortBy
 * @property {TemplateDifficulty} [difficulty]
 */

/**
 * @typedef {Object} TemplateGradient
 * @property {string} from
 * @property {string} to
 */

/**
 * @typedef {Object} DiagramTemplate
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} [previewUrl]
 * @property {TemplateCategory} category
 * @property {string[]} tags
 * @property {string[]} [industryTags]
 * @property {string[]} [scenes]
 * @property {TemplateDifficulty} difficulty
 * @property {boolean} [isPopular]
 * @property {boolean} [isNew]
 * @property {string} icon
 * @property {TemplateGradient} gradient
 * @property {string} prompt
 * @property {import("@/components/figsci-brief").FigsciBriefState} brief
 * @property {string} estimatedTime
 * @property {number} [usageCount]
 * @property {string} [createdAt]
 * @property {number} [rating]
 * @property {string} [author]
 * @property {string[]} [useCases]
 * @property {string[]} [features]
 */

export {};
