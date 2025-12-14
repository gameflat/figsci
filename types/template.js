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
 * 模板布局配置
 * @typedef {Object} TemplateLayoutConfig
 * @property {"vertical"|"horizontal"|"layered"|"radial"|"grid"} direction - 布局方向
 * @property {string} description - 布局说明
 * @property {{x: number, y: number}} [startPosition] - 起始位置
 * @property {{width: number, height: number}} [canvasSize] - 画布大小
 */

/**
 * 颜色配置
 * @typedef {Object} ColorConfig
 * @property {string} fill - 填充色
 * @property {string} stroke - 边框色
 * @property {string} [font] - 字体颜色
 */

/**
 * 模板配色方案
 * @typedef {Object} TemplateColorScheme
 * @property {ColorConfig} primary - 主色
 * @property {ColorConfig} [secondary] - 次色
 * @property {ColorConfig} [accent] - 强调色
 * @property {ColorConfig} [success] - 成功色
 * @property {ColorConfig} [warning] - 警告色
 * @property {ColorConfig} [error] - 错误色
 */

/**
 * 节点样式配置
 * @typedef {Object} NodeStyleConfig
 * @property {string} style - draw.io 样式字符串
 * @property {number} width - 默认宽度
 * @property {number} height - 默认高度
 */

/**
 * 模板节点样式集合
 * @typedef {Object} TemplateNodeStyles
 * @property {NodeStyleConfig} [standard] - 标准节点
 * @property {NodeStyleConfig} [decision] - 决策节点
 * @property {NodeStyleConfig} [terminal] - 起止节点
 * @property {NodeStyleConfig} [storage] - 存储节点
 * @property {NodeStyleConfig} [container] - 容器节点
 * @property {NodeStyleConfig} [text] - 文本节点
 */

/**
 * 模板结构定义
 * @typedef {Object} TemplateStructure
 * @property {"vertical"|"horizontal"|"layered"|"parallel"|"timeline"} layout - 布局类型
 * @property {string[]} [sections] - 主要分区
 * @property {string[]} [nodeTypes] - 使用的节点类型
 * @property {string} [description] - 结构说明
 */

/**
 * 绘图指导配置
 * @typedef {Object} DrawingGuidelines
 * @property {string} [layout] - 布局说明
 * @property {string} [spacing] - 间距说明
 * @property {string} [connections] - 连接线说明
 * @property {string} [typography] - 字体说明
 * @property {string[]} [tips] - 绘图提示
 */

/**
 * 模板 Brief 配置
 * @typedef {Object} TemplateBrief
 * @property {string} [intent] - 意图
 * @property {string} [tone] - 风格
 * @property {string[]} [focus] - 关注点
 * @property {string[]} [diagramTypes] - 图表类型
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
 * @property {string} prompt - 原始提示词
 * @property {string} estimatedTime
 * @property {number} [usageCount]
 * @property {string} [createdAt]
 * @property {number} [rating]
 * @property {string} [author]
 * @property {string[]} [useCases]
 * @property {string[]} [features]
 * @property {TemplateBrief} [brief]
 * @property {TemplateStructure} [structure] - 结构化布局定义
 * @property {TemplateColorScheme} [colorScheme] - 配色方案
 * @property {TemplateNodeStyles} [nodeStyles] - 节点样式
 * @property {DrawingGuidelines} [drawingGuidelines] - 绘图指导
 * @property {string} [exampleXml] - 示例 XML 片段
 */

export {};
