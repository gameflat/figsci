import { features } from "process";

const DIAGRAM_TEMPLATES = [
  // 1. Graphical Abstract 
  {
    id: "graphical-abstract-template",
    title: "通用图形化摘要模板",
    description: "适用于各类期刊的标准图形化摘要布局，概括研究背景、方法和结论",
    category: "schematic",
    tags: ["图形摘要", "概述", "布局"],
    difficulty: "beginner",
    isPopular: true,
    icon: "UserPlus",
    gradient: {
      from: "#3b82f6",
      to: "#1d4ed8"
    },
    estimatedTime: "5 分钟",
    usageCount: 5420,
    rating: 4.9,
    author: "Figsci 团队",
    useCases: [
      "论文投稿",
      "海报展示",
      "项目汇报"
    ],
    features: [
      "左中右三段式布局",
      "背景-方法-结果流线",
      "关键图标高亮",
      "结论强调框"
    ],
    prompt: `创建一个高水平的图形摘要（Graphical Abstract）：
      - 布局：采用横向三段式结构（左：问题背景，中：核心策略/机制，右：主要成果/应用）
      - 视觉流：使用粗箭头引导视线从左至右
      - 风格：扁平化矢量风格（Flat Vector），配色采用Elsevier或Nature标准的蓝灰色调
      - 元素：左侧画出带有问号的现状图，中间画出带有齿轮或反应瓶的机制图，右侧画出带有向上增长趋势箭头或复选标记的结果图
      - 细节：底部添加一行总结性的文字（Take-home message）
      - 保持整洁专业，适当的间距`,
    brief: {
      intent: "summary",
      tone: "academic",
      focus: ["layout", "storytelling"],
      diagramTypes: ["schematic"]
    }
  },
  // 2. Technical Roadmap
  {
    id: "technical-roadmap",
    title: "技术路线图",
    description: "展示研究项目的整体规划、阶段划分和技术路径",
    category: "process",
    tags: ["路线图", "规划", "流程"],
    difficulty: "intermediate",
    isPopular: true,
    icon: "Map",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "5 分钟",
    usageCount: 4300,
    rating: 4.8,
    author: "Figsci 团队",
    useCases: [
      "开题报告", 
      "基金申请书", 
      "项目建议书"
    ],
    features: [
      "垂直或水平分层", 
      "阶段性里程碑", 
      "并行任务流", 
      "输入输出连接"
    ],
    prompt: `绘制一张专业的技术路线图（Technical Roadmap）：
      - 结构：自上而下的流程图，分为三个主要阶段（如：基础研究、关键技术突破、系统集成与应用）
      - 形状：使用圆角矩形表示具体研究内容，菱形表示关键节点或决策点
      - 连接：实线箭头表示数据/物质流，虚线箭头表示反馈/优化流
      - 分组：使用浅色背景框将同一阶段的任务归类
      - 风格：商务科技风，深蓝与橙色搭配，字体清晰（如Arial），线条规整`,
    brief: {
      intent: "planning",
      tone: "professional",
      focus: ["flow", "hierarchy"],
      diagramTypes: ["flowchart"]
    }
  },
  // 3. Experimental Process Flow
  {
    id: "experimental-process-flow",
    title: "实验流程图",
    description: "详细描述实验步骤、处理方法和分析逻辑的线性流程",
    category: "process",
    tags: ["实验", "步骤", "方法学"],
    difficulty: "beginner",
    isPopular: true,
    icon: "Workflow",
    gradient: {
      from: "#3b82f6",
      to: "#1d4ed8"
    },
    estimatedTime: "5 分钟",
    usageCount: 3800,
    rating: 4.7,
    author: "Figsci 团队",
    useCases: [
      "材料与方法章节", 
      "实验记录", 
      "操作指南"
    ],
    features: [
      "顺序步骤编号", 
      "仪器/试剂图标", 
      "参数标注", 
      "逻辑分支"
    ],
    prompt: `创建一个清晰的实验操作流程图：
      - 形式：水平序列（Step 1 → Step 2 → Step 3...）
      - 内容：每个步骤包含一个代表性图标（如离心机、显微镜、代码块）和简短说明文字
      - 参数：在箭头上方标注关键实验条件（如“4°C, 10min”或“lr=0.01”）
      - 风格：图标风格统一（线性或面性），使用灰色连接线，重点步骤用高亮色（如红色）边框强调
      - 布局：整齐对齐，间距一致`,
    brief: {
      intent: "instruction",
      tone: "scientific",
      focus: ["sequence", "detail"],
      diagramTypes: ["flowchart"]
    }
  },
  // 4. System Architecture (Layered)
  {
    id: "system-architecture-layered",
    title: "分层系统架构图",
    description: "展示系统、模型或软件的层次结构（如感知层、网络层、应用层）",
    category: "structure",
    tags: ["架构", "分层", "系统"],
    difficulty: "intermediate",
    isPopular: true,
    icon: "Server",
    gradient: {
      from: "#3b82f6",
      to: "#1d4ed8"
    },
    estimatedTime: "5 分钟",
    usageCount: 2900,
    rating: 4.8,
    author: "Figsci 团队",
    useCases: [
      "计算机系统论文", 
      "工程设计", 
      "模型框架"
    ],
    features: [
      "堆叠的矩形块", 
      "层级标签", 
      "层间交互箭头", 
      "3D透视效果"
    ],
    prompt: `绘制一个分层系统架构图（Layered Architecture Diagram）：
      - 视角：2.5D等距视角（Isometric）或正面平视
      - 结构：底部为基础设施/数据层，中间为处理/算法层，顶部为应用/用户层
      - 元素：每一层作为一个大的立体板或容器，内部包含多个小的功能模块（立方体）
      - 连接：层与层之间用双向宽箭头连接，表示数据交换
      - 配色：底部使用深色重色，顶部使用浅色亮色，体现稳重感。背景简洁`,
    brief: {
      intent: "architecture",
      tone: "technical",
      focus: ["structure", "hierarchy"],
      diagramTypes: ["architecture"]
    }
  },
  // 5. Taxonomy Classification Tree
  {
    id: "taxonomy-classification-tree",
    title: "分类树状图",
    description: "用于展示概念、物种、算法或方法的层级分类关系",
    category: "hierarchy",
    tags: ["分类", "树状图", "层级"],
    difficulty: "beginner",
    isPopular: true,
    icon: "GitBranch",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "5 分钟",
    usageCount: 2100,
    rating: 4.6,
    author: "Figsci 团队",
    useCases: [
      "综述文章", 
      "物种分类", 
      "算法归类"
    ],
    features: [
      "根节点与子节点", 
      "连接线", 
      "层级深度", 
      "类别注释"
    ],
    prompt: `创建一个层级分类图（Taxonomy Diagram）：
      - 结构：从左向右发散的树状结构，或自上而下的组织结构图
      - 节点：根节点在最左/上（如“深度学习方法”），分支到一级子类（如“监督学习”、“无监督学习”），再分支到具体算法（如“CNN”、“GAN”）
      - 样式：节点使用胶囊形或圆角矩形，线条使用直角折线（Orthogonal lines）
      - 颜色：不同层级使用不同深度的同色系（如深蓝→中蓝→浅蓝），或者不同分支使用对比色区分`,
    brief: {
      intent: "categorization",
      tone: "structured",
      focus: ["hierarchy", "clarity"],
      diagramTypes: ["mindmap"]
    }
  },
  // 6. Network Topology Graph
  {
    id: "network-topology-graph",
    title: "网络拓扑/关系图",
    description: "展示节点之间的复杂连接关系、相互作用或通信网络",
    category: "network",
    tags: ["网络", "节点", "关系"],
    difficulty: "intermediate",
    isPopular: true,
    icon: "Network",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "5 分钟",
    usageCount: 1800,
    rating: 4.7,
    author: "Figsci 团队",
    useCases: [
      "社交网络分析", 
      "蛋白互作网络", 
      "通信拓扑"
    ],
    features: [
      "节点(Nodes)", 
      "边(Edges)", 
      "集线器(Hubs)", 
      "聚类(Clusters)"
    ],
    prompt: `绘制一个网络拓扑图（Network Topology Diagram）：
      - 布局：力导向布局（Force-directed）或环形布局，中心有关键的核心节点（Hub）
      - 元素：圆形节点代表实体，连线代表关系。根据权重调整节点大小和连线粗细
      - 颜色：根据模块度（Modularity）或类别对节点进行着色（如3-4种颜色）
      - 细节：关键节点旁添加标签，背景洁白，连线半透明以避免视觉混乱`,
    brief: {
      intent: "analysis",
      tone: "scientific",
      focus: ["connectivity", "cluster"],
      diagramTypes: ["network"]
    }
  },
  // 7. Causal Loop Diagram
  {
    id: "causal-loop-diagram",
    title: "因果回路/反馈循环图",
    description: "展示系统内部变量之间的正负反馈调节机制",
    category: "logic",
    tags: ["反馈", "循环", "机制"],
    difficulty: "intermediate",
    isPopular: true,
    icon: "Repeat",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "5 分钟",
    usageCount: 1500,
    rating: 4.5,
    author: "Figsci 团队",
    useCases: [
      "控制理论", 
      "生态系统平衡", 
      "生理调节"
    ],
    features: [
      "闭环结构", 
      "增强/抑制符号", 
      "延迟标记", 
      "平衡点"
    ],
    prompt: `设计一个闭环反馈示意图（Closed-loop Feedback Diagram）：
      - 形状：圆形或圆角矩形的循环路径
      - 节点：包含至少三个关键要素（如：传感器 → 控制器 → 执行器 → 被控对象）
      - 连接：使用弧形箭头连接各节点，形成闭环
      - 标注：在连线旁标记“+”（正反馈/激活）或“-”（负反馈/抑制/Loss）
      - 风格：极简线条风格，重点突出循环流动的动态感，关键环节可用发光效果强调`,
    brief: {
      intent: "mechanism",
      tone: "technical",
      focus: ["cycle", "regulation"],
      diagramTypes: ["schematic"]
    }
  },
  // 8. Multi-scale Zoom Diagram
  {
    id: "multi-scale-zoom",
    title: "多尺度放大图",
    description: "通过放大镜效果展示从宏观到微观（或整体到局部）的结构",
    category: "structure",
    tags: ["多尺度", "放大", "细节"],
    difficulty: "advanced",
    isPopular: true,
    icon: "Lightbulb",
    gradient: {
      from: "#3b82f6",
      to: "#1d4ed8"
    },
    estimatedTime: "5 分钟",
    usageCount: 2600,
    rating: 4.9,
    author: "Figsci 团队",
    useCases: [
      "材料微观结构", 
      "生物组织切片", 
      "地图局部展示"
    ],
    features: [
      "宏观全景图", 
      "放大镜/选框", 
      "引导虚线", 
      "微观细节图"
    ],
    prompt: `制作一个多尺度放大示意图（Zoom-in Schematic）：
      - 左侧：宏观物体（如整个器件、人体器官或地图），画一个虚线框选定特定区域
      - 中间：两条扩散的虚线引导视线向右
      - 右侧：圆形或方形的放大视图，展示微观细节（如晶格结构、细胞内部或局部电路）
      - 层次：可以做两级放大（宏观 → 介观 → 微观）
      - 风格：左侧逼真或写实，右侧可以更抽象或模式化，强调内部机理`,
    brief: {
      intent: "illustration",
      tone: "detailed",
      focus: ["hierarchy", "detail"],
      diagramTypes: ["schematic"]
    }
  },
  // 9. Comparison Matrix
  {
    id: "comparison-matrix",
    title: "对比矩阵/表格",
    description: "直观对比不同方法、模型或样本在多个维度上的差异",
    category: "data",
    tags: ["对比", "矩阵", "分析"],
    difficulty: "beginner",
    isPopular: true,
    icon: "BarChart",
    gradient: {
      from: "#64748b",
      to: "#475569"
    },
    estimatedTime: "5 分钟",
    usageCount: 3200,
    rating: 4.5,
    author: "Figsci 团队",
    useCases: [
      "性能对比", 
      "功能特性表", 
      "优缺点分析"
    ],
    features: [
      "行列表头", 
      "复选/叉号图标", 
      "热力图色块", 
      "高亮优胜者"
    ],
    prompt: `创建一个可视化的对比矩阵图（Comparison Matrix）：
      - 结构：表格形式，列为不同方法（Method A, Method B, Ours），行为评估指标（Accuracy, Speed, Cost）
      - 内容：使用图标代替纯文本（如实心圆表示好，空心圆表示差；或使用对勾和叉）
      - 强调：将你的方法（Ours）所在的列用淡底色高亮，并加粗边框
      - 风格：清洁、现代的表格设计，去除非必要的纵向分割线，保留横向分割线`,
    brief: {
      intent: "comparison",
      tone: "persuasive",
      focus: ["contrast", "clarity"],
      diagramTypes: ["matrix"]
    }
  },
  // 10. State Transition Diagram
  {
    id: "state-transition-diagram",
    title: "状态转换图",
    description: "描述对象在不同状态之间的转换条件和路径",
    category: "logic",
    tags: ["状态机", "逻辑", "转换"],
    difficulty: "intermediate",
    isPopular: true,
    icon: "Activity",
    gradient: {
      from: "#3b82f6",
      to: "#1d4ed8"
    },
    estimatedTime: "5 分钟",
    usageCount: 1600,
    rating: 4.6,
    author: "Figsci 团队",
    useCases: [
      "算法逻辑", 
      "化学相变", 
      "疾病进展模型"
    ],
    features: [
      "状态节点", 
      "有向边", 
      "触发条件", 
      "初始/终止状态"
    ],
    prompt: `绘制一个有限状态机或状态转换图（State Transition Diagram）：
      - 节点：圆形表示各种状态（State 1, State 2, State 3）
      - 连接：带箭头的弧线表示状态跃迁（Transition）
      - 标签：在弧线上方标注触发转换的条件或概率（Probability）
      - 布局：环形或多边形布局，避免连线过度交叉
      - 风格：数学化的简洁风格，节点内文字居中，线条流畅`,
    brief: {
      intent: "logic",
      tone: "technical",
      focus: ["flow", "condition"],
      diagramTypes: ["network"]
    }
  },
  // 11. Data Pipeline Flow
  {
    id: "data-pipeline-flow",
    title: "数据处理流水线",
    description: "展示数据从输入到输出经过的一系列处理模块",
    category: "process",
    tags: ["数据流", "流水线", "处理"],
    difficulty: "intermediate",
    isPopular: true,
    icon: "Link",
    gradient: {
      from: "#f59e0b",
      to: "#d97706"
    },
    estimatedTime: "5 分钟",
    usageCount: 2400,
    rating: 4.7,
    author: "Figsci 团队",
    useCases: [
      "机器学习预处理", 
      "生物信生分析", 
      "信号处理"
    ],
    features: [
      "管道连接", 
      "处理模块图标", 
      "输入输出形态", 
      "自动化流"
    ],
    prompt: `绘制一个数据处理流水线图（Data Processing Pipeline）：
      - 形状：一系列水平排列的圆柱体（数据库）和矩形（处理算法）
      - 流程：Raw Data → Cleaning → Feature Extraction → Analysis → Visualization
      - 连接：使用宽箭头（Chevron arrows）表示数据流动的方向和阶段
      - 视觉：每个阶段配一个相关的小图标（如漏斗表示过滤，齿轮表示处理），颜色从左到右渐变（如浅蓝到深蓝）`,
    brief: {
      intent: "process",
      tone: "technical",
      focus: ["flow", "transformation"],
      diagramTypes: ["flowchart"]
    }
  },
  // 12. Sankey Diagram
  {
    id: "sankey-diagram-template",
    title: "桑基图",
    description: "通过流的宽度展示能量、物质或资金的分配与流向",
    category: "data",
    tags: ["流量", "分配", "能量"],
    difficulty: "intermediate",
    icon: "Gauge",
    gradient: {
      from: "#ec4899",
      to: "#be185d"
    },
    estimatedTime: "5 分钟",
    usageCount: 1300,
    rating: 4.8,
    author: "Figsci 团队",
    useCases: [
      "能量平衡", 
      "预算分配", 
      "患者流转"
    ],
    features: [
      "流宽度成比例", 
      "节点分叉与汇聚", 
      "多级流动", 
      "颜色编码"
    ],
    prompt: `创建一个桑基图（Sankey Diagram）示意：
      - 结构：左侧为总输入（Source），右侧为多个输出（Target）
      - 线条：使用平滑的贝塞尔曲线连接左右节点，线条宽度代表流量大小（Quantity）
      - 颜色：不同的分支使用不同的颜色（透明度50%-70%），以便在重叠或分叉时看清走向
      - 标签：在节点两侧清晰标注类别名称和数值/百分比
      - 风格：现代数据可视化风格，无边框，强调流动的视觉冲击力`,
    brief: {
      intent: "data",
      tone: "analytical",
      focus: ["quantity", "flow"],
      diagramTypes: ["chart"]
    }
  },
  // 13. Pyramid Hierarchy
  {
    id: "pyramid-hierarchy",
    title: "金字塔层级图",
    description: "展示从基础到顶层的层级依赖关系或数量分布",
    category: "structure",
    tags: ["金字塔", "层级", "基础"],
    difficulty: "beginner",
    isPopular: true,
    icon: "Building",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "5 分钟",
    usageCount: 2000,
    rating: 4.5,
    author: "Figsci 团队",
    useCases: [
      "需求层次", 
      "生态金字塔", 
      "能力模型"
    ],
    features: [
      "分层切片", 
      "底部宽顶部窄", 
      "层级说明", 
      "向上箭头"
    ],
    prompt: `绘制一个层级金字塔图（Pyramid Diagram）：
      - 形状：一个大的等腰三角形，被水平分割成4-5层
      - 内容：底部为最基础/最广泛的内容（Foundation），顶部为最高级/最核心的内容（Peak）
      - 视觉：每一层使用不同的颜色或同一颜色的渐变。在金字塔右侧引出线条对每一层进行说明
      - 效果：可以添加简单的3D阴影效果，使其看起来有立体感`,
    brief: {
      intent: "concept",
      tone: "structured",
      focus: ["hierarchy", "foundation"],
      diagramTypes: ["chart"]
    }
  },
  // 14. Venn Set Diagram
  {
    id: "venn-set-diagram",
    title: "韦恩/集合图",
    description: "展示不同集合之间的重叠、交叉和逻辑关系",
    category: "logic",
    tags: ["集合", "逻辑", "交叉"],
    difficulty: "beginner",
    isPopular: true,
    icon: "CheckCircle",
    gradient: {
      from: "#ec4899",
      to: "#be185d"
    },
    estimatedTime: "5 分钟",
    usageCount: 4100,
    rating: 4.6,
    author: "Figsci 团队",
    useCases: [
      "基因重叠", 
      "方法共性", 
      "多因素分析"
    ],
    features: [
      "重叠圆圈", 
      "交集区域", 
      "差异区域", 
      "透明度混合"
    ],
    prompt: `绘制一个韦恩图（Venn Diagram）：
      - 结构：3个圆形部分重叠（三叶草形状）
      - 填充：每个圆使用不同的颜色（如红、蓝、黄），设置50%透明度，使得重叠部分（交集）呈现混合色
      - 标注：清晰标注每个圆代表的集合名称，以及交集区域的含义或数值
      - 风格：扁平化，边缘清晰，适用于展示共性与个性`,
    brief: {
      intent: "logic",
      tone: "simple",
      focus: ["overlap", "relationship"],
      diagramTypes: ["chart"]
    }
  },
  // 15. Decision Tree Logic
  {
    id: "decision-tree-logic",
    title: "决策树/逻辑分支图",
    description: "展示基于条件的逻辑判断路径和最终结果",
    category: "logic",
    tags: ["决策", "分支", "条件"],
    difficulty: "intermediate",
    isPopular: true,
    icon: "Shield",
    gradient: {
      from: "#10b981",
      to: "#059669"
    },
    estimatedTime: "5 分钟",
    usageCount: 2200,
    rating: 4.7,
    author: "Figsci 团队",
    useCases: [
      "医疗诊断", 
      "算法流程", 
      "故障排查"
    ],
    features: [
      "根节点", 
      "判断条件", 
      "Yes/No分支", 
      "叶节点结果"
    ],
    prompt: `绘制一个决策树（Decision Tree）：
      - 节点：菱形代表判断条件（Condition），矩形代表结果/动作（Action）
      - 路径：每个菱形引出“Yes”和“No”两条分支线
      - 布局：自上而下或从左到右，保持层级对齐
      - 颜色：Yes路径用绿色或实线，No路径用红色或虚线
      - 风格：清晰的流程图风格，节点内文字简练`,
    brief: {
      intent: "decision",
      tone: "logical",
      focus: ["branching", "outcome"],
      diagramTypes: ["flowchart"]
    }
  },
  // 16. Fishbone Root Cause Analysis
  {
    id: "fishbone-root-cause",
    title: "鱼骨图/因果分析图",
    description: "系统分析导致某一结果的多种潜在原因",
    category: "logic",
    tags: ["因果", "分析", "鱼骨"],
    difficulty: "intermediate",
    isPopular: true,
    icon: "Star",
    gradient: {
      from: "#10b981",
      to: "#059669"
    },
    estimatedTime: "5 分钟",
    usageCount: 1100,
    rating: 4.8,
    author: "Figsci 团队",
    useCases: [
      "质量控制", 
      "事故分析", 
      "影响因素探讨"
    ],
    features: [
      "鱼头(结果)", 
      "脊柱", 
      "大骨(主类)", 
      "小刺(细节)"
    ],
    prompt: `绘制一个鱼骨图（Ishikawa Diagram）：
      - 结构：右侧为鱼头（标写最终问题或结果）。中间一条水平主干线（脊柱）
      - 分支：上下引出4-6条大骨（代表主要类别，如人、机、料、法、环、测）
      - 细节：在大骨上引出小刺，代表具体原因
      - 风格：线条简洁，文字清晰，适合用于结构化思维展示`,
    brief: {
      intent: "analysis",
      tone: "structured",
      focus: ["cause-effect", "brainstorming"],
      diagramTypes: ["chart"]
    }
  },
  // 17. Timeline Milestone
  {
    id: "timeline-milestone",
    title: "时间轴/里程碑图",
    description: "按时间顺序展示事件发展、历史演变或未来计划",
    category: "process",
    tags: ["时间", "里程碑", "历史"],
    difficulty: "beginner",
    isPopular: true,
    icon: "Clock",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "5 分钟",
    usageCount: 3500,
    rating: 4.8,
    author: "Figsci 团队",
    useCases: [
      "研究背景", 
      "技术演进", 
      "项目排期"
    ],
    features: [
      "主轴线", 
      "时间点刻度", 
      "事件说明框", 
      "阶段划分"
    ],
    prompt: `设计一个水平时间轴（Timeline）：
      - 核心：中间一条水平粗线或箭头。上方和下方交替引出节点
      - 节点：圆点表示时间点（年份/日期），延伸出的线连接到矩形说明框
      - 内容：标注关键事件（Key Events）或里程碑（Milestones）
      - 风格：现代简约，使用品牌色，说明框整齐排列。可添加背景色块区分不同历史阶段`,
    brief: {
      intent: "history",
      tone: "narrative",
      focus: ["sequence", "evolution"],
      diagramTypes: ["timeline"]
    }
  },
  // 18. Exploded View Model
  {
    id: "exploded-view-model",
    title: "爆炸视图/分解图",
    description: "展示复杂装配体或系统的内部组件及其空间关系",
    category: "structure",
    tags: ["爆炸图", "组件", "结构"],
    difficulty: "advanced",
    isPopular: true,
    icon: "Layers",
    gradient: {
      from: "#3b82f6",
      to: "#1d4ed8"
    },
    estimatedTime: "5 分钟",
    usageCount: 1400,
    rating: 4.9,
    author: "Figsci 团队",
    useCases: [
      "机械结构", 
      "多层膜材料", 
      "设备拆解"
    ],
    features: [
      "部件分离", 
      "装配路径线", 
      "3D立体感", 
      "对齐轴线"
    ],
    prompt: `绘制一个3D爆炸分解图（Exploded View Diagram）：
      - 对象：一个多层结构（如传感器、电池或机械零件）
      - 动作：将各层部件沿中心轴线向上或向下拉开，保持相对位置不变
      - 辅助：使用虚线（Trace lines）连接分离的部件，表示装配关系
      - 渲染：给部件添加厚度和阴影，体现立体感。清晰标注每一层的名称`,
    brief: {
      intent: "illustration",
      tone: "technical",
      focus: ["assembly", "component"],
      diagramTypes: ["model"]
    }
  },
  // 19. Funnel Screening
  {
    id: "funnel-screening",
    title: "漏斗/筛选图",
    description: "展示从大量初始样本中逐步筛选出最终目标的过程",
    category: "process",
    tags: ["筛选", "漏斗", "过滤"],
    difficulty: "beginner",
    isPopular: true,
    icon: "TestTube",
    gradient: {
      from: "#ec4899",
      to: "#be185d"
    },
    estimatedTime: "5 分钟",
    usageCount: 2100,
    rating: 4.7,
    author: "Figsci 团队",
    useCases: [
      "药物筛选",
      "文献过滤", 
      "客户转化"
    ],
    features: [
      "倒梯形结构", 
      "各层数量变化", 
      "过滤标准",
      "最终产出"
    ],
    prompt: `"绘制一个筛选漏斗图（Funnel Diagram）：
      - 形状：上宽下窄的倒锥形，分为N个水平切片
      - 流程：顶部是“初始库（N=10000）”，经过几层过滤（Criteria 1, Criteria 2），底部是“最终候选（N=5）”
      - 视觉：每一层用不同颜色，旁边标注该层排除的原因和剩余数量
      - 风格：扁平化，强调数量的急剧减少`,
    brief: {
      intent: "process",
      tone: "analytical",
      focus: ["reduction", "selection"],
      diagramTypes: ["chart"]
    }
  },
  // 20. Mind Map Concept
  {
    id: "mind-map-concept",
    title: "思维导图",
    description: "发散性地展示中心主题与子主题之间的关联",
    category: "concept",
    tags: ["思维导图", "头脑风暴", "关联"],
    difficulty: "beginner",
    isPopular: true,
    icon: "Database",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "5 分钟",
    usageCount: 6000,
    rating: 4.8,
    author: "Figsci 团队",
    useCases: [
      "文献整理", 
      "知识谱系", 
      "研究构思"
    ],
    features: [
      "中心主题", 
      "辐射分支", 
      "关键词", 
      "层级节点"
    ],
    prompt: `创建一个思维导图（Mind Map）：
      - 中心：核心概念或研究题目（Central Idea）
      - 分支：从中心向四周发散出粗线条的一级分支（Main Topics）
      - 细分：一级分支末端继续发散出细线条的二级分支（Sub-topics）
      - 样式：使用曲线连接，节点使用简单的文本或胶囊框。不同分支使用不同颜色区分逻辑块`,
    brief: {
      intent: "brainstorming",
      tone: "creative",
      focus: ["association", "structure"],
      diagramTypes: ["mindmap"]
    }
  },
  // 21. Sequence Interaction
  {
    id: "sequence-interaction",
    title: "时序/序列图",
    description: "展示多个对象之间随时间发生的交互顺序",
    category: "process",
    tags: ["时序", "交互", "UML"],
    difficulty: "intermediate",
    isPopular: true,
    icon: "ShieldCheck",
    gradient: {
      from: "#10b981",
      to: "#059669"
    },
    estimatedTime: "5 分钟",
    usageCount: 1700,
    rating: 4.7,
    author: "Figsci 团队",
    useCases: [
      "通信协议", 
      "分子信号传递", 
      "交易流程"
    ],
    features: [
      "参与者生命线", 
      "时间垂直向下", 
      "消息箭头", 
      "激活条"
    ],
    prompt: `绘制一个时序图（Sequence Diagram）：
      - 顶部：水平排列参与者（Participant A, Participant B, Participant C）
      - 垂直线：每个参与者下方延伸出一条虚线（生命线 Lifeline）
      - 交互：使用水平实线箭头表示消息发送（Request），虚线箭头表示返回（Response）
      - 顺序：箭头按时间顺序从上到下排列
      - 风格：UML标准风格或简化版，清晰展示“谁在什么时候对谁做了什么”`,
    brief: {
      intent: "interaction",
      tone: "technical",
      focus: ["timing", "message"],
      diagramTypes: ["sequence"]
    }
  },
  // 22. Radar Spider Chart
  {
    id: "radar-spider-chart",
    title: "雷达/蜘蛛图",
    description: "多维度评估和展示对象的综合性能或特征",
    category: "data",
    tags: ["雷达图", "多维", "评估"],
    difficulty: "beginner",
    isPopular: true,
    icon: "Lock",
    gradient: {
      from: "#10b981",
      to: "#059669"
    },
    estimatedTime: "5 分钟",
    usageCount: 2800,
    rating: 4.8,
    author: "Figsci 团队",
    useCases: [
      "模型性能评估", 
      "材料特性", 
      "能力分析"
    ],
    features: [
      "多轴辐射", 
      "多边形区域", 
      "覆盖对比", 
      "维度标签"
    ],
    prompt: `绘制一个雷达图（Radar Chart）：
      - 轴线：从中心向外辐射出5-8条轴，代表不同指标（如Accuracy, Robustness, Efficiency, Speed）
      - 数据：用线条连接各轴上的数据点，形成一个封闭的多边形
      - 对比：绘制两个或多个多边形（如Ours vs SOTA），使用不同颜色的半透明填充（如蓝色和红色），以便比较覆盖面积
      - 风格：背景有同心多边形网格，坐标轴清晰`,
    brief: {
      intent: "evaluation",
      tone: "comparative",
      focus: ["multivariate", "balance"],
      diagramTypes: ["chart"]
    }
  },
  // 23. Functional Block Diagram
  {
    id: "functional-block-diagram",
    title: "功能框图",
    description: "高度抽象地展示系统的主要功能模块及其连接",
    category: "structure",
    tags: ["框图", "模块", "抽象"],
    difficulty: "beginner",
    isPopular: true,
    icon: "Users",
    gradient: {
      from: "#f59e0b",
      to: "#d97706"
    },
    estimatedTime: "5 分钟",
    usageCount: 3300,
    rating: 4.6,
    author: "Figsci 团队",
    useCases: [
      "电子电路", 
      "控制系统", 
      "软件模块"
    ],
    features: [
      "矩形模块", 
      "输入输出线", 
      "无细节内部", 
      "清晰标签"
    ],
    prompt: `绘制一个功能框图（Block Diagram）：
      - 元素：简单的矩形框代表功能单元（Function Unit）
      - 布局：按照信号或逻辑流向（通常从左到右）排列
      - 连接：单线箭头表示信号/数据传输
      - 标注：框内写明功能名称（如 Amplifier, Filter, Controller）
      - 风格：高对比度黑白线条，或简单的蓝白配色，强调逻辑结构而非物理外观`,
    brief: {
      intent: "overview",
      tone: "technical",
      focus: ["function", "connection"],
      diagramTypes: ["schematic"]
    }
  },
  // 24. Spiral Iterative Model
  {
    id: "spiral-iterative-model",
    title: "螺旋/迭代模型图",
    description: "展示随时间推移不断循环迭代、逐步完善的过程",
    category: "process",
    tags: ["螺旋", "迭代", "进化"],
    difficulty: "intermediate",
    isPopular: true,
    icon: "Link2",
    gradient: {
      from: "#f59e0b",
      to: "#d97706"
    },
    estimatedTime: "5 分钟",
    usageCount: 1200,
    rating: 4.6,
    author: "Figsci 团队",
    useCases: [
      "软件开发", 
      "产品进化", 
      "知识积累"
    ],
    features: [
      "螺旋线路径", 
      "象限划分", 
      "半径代表成本/时间", 
      "循环阶段"
    ],
    prompt: `绘制一个螺旋模型图（Spiral Diagram）：
      - 路径：从中心向外扩散的螺旋线
      - 区域：背景被十字线分为四个象限（如：Planning, Risk Analysis, Engineering, Evaluation）
      - 流程：螺旋线依次穿过这四个区域，每旋转一圈代表一个迭代周期（Cycle）
      - 标注：在螺旋线上标记关键节点或版本号（v1.0, v2.0）
      - 风格：现代扁平风格，使用渐变色线条增强动态感`,
    brief: {
      intent: "process",
      tone: "dynamic",
      focus: ["iteration", "growth"],
      diagramTypes: ["chart"]
    }
  },
  // 25. Ontology Concept Graph
  {
    id: "ontology-concept-graph",
    title: "本体/概念图",
    description: "展示概念之间的语义关系，强调“是什么”和“属于”",
    category: "concept",
    tags: ["本体", "概念", "语义"],
    difficulty: "intermediate",
    isPopular: true,
    icon: "Palette",
    gradient: {
      from: "#ec4899",
      to: "#be185d"
    },
    estimatedTime: "5 分钟",
    usageCount: 1800,
    rating: 4.7,
    author: "Figsci 团队",
    useCases: [
      "知识图谱", 
      "教学原理", 
      "逻辑推导"
    ],
    features: [
      "概念节点", 
      "关系连线", 
      "连接词", 
      "网状结构"
    ],
    prompt: `绘制一个概念图（Concept Map）：
      - 节点：矩形或椭圆框包含概念词（Concept）
      - 连接：带箭头的连线
      - 关键点：在连线上方必须标注连接词（Linking Words），如“导致”、“包含”、“属于”、“影响”
      - 结构：通常为层级结构（从上到下：最一般概念 → 具体概念）或网状结构
      - 风格：简洁明了，注重语义逻辑的表达`,
    brief: {
      intent: "education",
      tone: "informative",
      focus: ["relationship", "meaning"],
      diagramTypes: ["mindmap"]
    }
  },
  // 26. Gantt Schedule Chart
  {
    id: "gantt-schedule-chart",
    title: "甘特图/进度表",
    description: "可视化的项目进度管理工具，展示任务时间跨度和依赖",
    category: "planning",
    tags: ["甘特图", "进度", "管理"],
    difficulty: "beginner",
    isPopular: true,
    icon: "Calendar",
    gradient: {
      from: "#ec4899",
      to: "#be185d"
    },
    estimatedTime: "5 分钟",
    usageCount: 4500,
    rating: 4.8,
    author: "Figsci 团队",
    useCases: [
      "项目管理", 
      "实验排期", 
      "论文计划"
    ],
    features: [
      "时间横轴", 
      "任务纵轴", 
      "条形长度", 
      "进度填充"
    ],
    prompt: `绘制一个项目甘特图（Gantt Chart）：
      - 坐标：横轴为时间（月份/周），纵轴为任务列表（Task List）
      - 条形：每个任务对应一个水平条，条的长度代表持续时间
      - 进度：条形内部可以用深色填充表示已完成的比例
      - 依赖：任务之间可以用细箭头连接，表示前置/后置关系（Dependency）
      - 风格：专业的商务风格，交替颜色的行背景（Zebra striping）易于阅读`,
    brief: {
      intent: "planning",
      tone: "professional",
      focus: ["schedule", "duration"],
      diagramTypes: ["gantt"]
    }
  },
  // 27. Circuit Pathway Schematic
  {
    id: "circuit-pathway-schematic",
    title: "通路/电路原理图",
    description: "使用标准化符号展示电子或生物信号的传导路径",
    category: "network",
    tags: ["通路", "电路", "连接"],
    difficulty: "bintermediate",
    isPopular: true,
    icon: "Zap",
    gradient: {
      from: "#3b82f6",
      to: "#1d4ed8"
    },
    estimatedTime: "5 分钟",
    usageCount: 1900,
    rating: 4.7,
    author: "Figsci 团队",
    useCases: [
      "电路设计", 
      "神经环路", 
      "代谢通路"
    ],
    features: [
      "标准符号", 
      "连接线", 
      "节点交叉", 
      "流向"
    ],
    prompt: `绘制一个原理通路图（Schematic Diagram）：
      - 符号：使用行业标准的矢量图标（如电阻/电容符号，或生物学的受体/酶符号）
      - 连接：直角折线（Orthogonal）连接各元件，线条清晰，交叉点处理规范（跳线或实点）
      - 布局：遵循信号从输入到输出的逻辑流向
      - 风格：黑白线条图（工程风）或彩色扁平图（生物风），标签字体统一`,
    brief: {
      intent: "schematic",
      tone: "technical",
      focus: ["connection", "component"],
      diagramTypes: ["schematic"]
    }
  },
  // 28. Quadrant Analysis Chart
  {
    id: "quadrant-analysis-chart",
    title: "象限分析图",
    description: "通过两个维度将对象划分为四类，进行定位分析",
    category: "analysis",
    tags: ["象限", "矩阵", "定位"],
    difficulty: "beginner",
    isPopular: true,
    icon: "Beaker",
    gradient: {
      from: "#6366f1",
      to: "#4f46e5"
    },
    estimatedTime: "5 分钟",
    usageCount: 2300,
    rating: 4.5,
    author: "Figsci 团队",
    useCases: [
      "SWOT分析", 
      "重要-紧急矩阵", 
      "Gartner魔力象限"
    ],
    features: [
      "XY轴", 
      "四个区域", 
      "散点分布", 
      "区域标签"
    ],
    prompt: `绘制一个四象限分析图（Quadrant Chart）：
      - 坐标轴：中心十字交叉的X轴和Y轴，定义两个维度（如：影响力 vs 难易度）
      - 区域：四个象限分别命名（如：高影响易实施、低影响难实施等）
      - 内容：将项目或对象作为散点分布在象限中
      - 视觉：不同象限可以使用不同的淡背景色区分。右上角通常是“最佳”区域，可用星号标记`,
    brief: {
      intent: "analysis",
      tone: "strategic",
      focus: ["classification", "position"],
      diagramTypes: ["chart"]
    }
  },
  // 29. Lifecycle Circular Diagram
  {
    id: "lifecycle-circular-diagram",
    title: "生命周期/循环图",
    description: "展示对象从产生到消亡再到再生的闭环全过程",
    category: "process",
    tags: ["生命周期", "循环", "闭环"],
    difficulty: "intermediate",
    isPopular: true,
    icon: "BookMarked",
    gradient: {
      from: "#10b981",
      to: "#047857"
    },
    estimatedTime: "5 分钟",
    usageCount: 2300,
    rating: 4.6,
    author: "Figsci 团队",
    useCases: [
      "产品生命周期", 
      "碳循环", 
      "敏捷开发循环"
    ],
    features: [
      "环形布局", 
      "阶段箭头", 
      "中心核心", 
      "连续性"
    ],
    prompt: `绘制一个圆形生命周期图（Circular Lifecycle Diagram）：
      - 形状：由多个弧形箭头首尾相连组成的圆环
      - 阶段：圆环被分为4-6个阶段（如：Design → Build → Test → Release）
      - 中心：圆环中间留白或放置核心目标/图标
      - 风格：扁平化图标风格，色彩沿顺时针方向渐变，体现流动性和无限循环的概念`,
    brief: {
      intent: "process",
      tone: "holistic",
      focus: ["cycle", "continuity"],
      diagramTypes: ["chart"]
    }
  },
  // 30. Isometric Platform View
  {
    id: "isometric-platform-view",
    title: "2.5D等距平台图",
    description: "以立体平台的形式展示多模块集成的系统或生态",
    category: "structure",
    tags: ["2.5D", "平台", "展示"],
    difficulty: "advanced",
    isPopular: true,
    icon: "Box",
    gradient: {
      from: "#3b82f6",
      to: "#1d4ed8"
    },
    estimatedTime: "5 分钟",
    usageCount: 1800,
    rating: 4.9,
    author: "Figsci 团队",
    useCases: [
      "智慧城市架构", 
      "云平台展示", 
      "物联网生态"
    ],
    features: [
      "等距视角", 
      "立体基座", 
      "悬浮元素", 
      "科技感"
    ],
    prompt: `绘制一个2.5D等距平台示意图（Isometric Platform）：
      - 视角：45度俯视角的等距投影
      - 基座：底座是一个厚实的立体方块或圆盘，代表基础设施（Infrastructure）
      - 模块：在基座上方悬浮多个立体图标或小平台，代表不同的应用或服务（Services）
      - 连接：使用发光的细线或垂直虚线连接各层
      - 风格：高科技感，使用渐变蓝紫色调，添加投影和发光效果（Glow effects）`,
    brief: {
      intent: "presentation",
      tone: "futuristic",
      focus: ["platform", "integration"],
      diagramTypes: ["illustration"]
    }
  }
];
function getTemplateById(id) {
  return DIAGRAM_TEMPLATES.find((template) => template.id === id);
}
function getTemplatesByCategory(category) {
  if (category === "all") {
    return DIAGRAM_TEMPLATES;
  }
  return DIAGRAM_TEMPLATES.filter(
    (template) => template.category === category
  );
}
function getPopularTemplates() {
  return DIAGRAM_TEMPLATES.filter((template) => template.isPopular);
}
function getNewTemplates() {
  return DIAGRAM_TEMPLATES.filter((template) => template.isNew);
}
function searchTemplates(query) {
  const lowerQuery = query.toLowerCase();
  return DIAGRAM_TEMPLATES.filter(
    (template) => template.title.toLowerCase().includes(lowerQuery) || template.description.toLowerCase().includes(lowerQuery) || template.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}
export {
  DIAGRAM_TEMPLATES,
  getNewTemplates,
  getPopularTemplates,
  getTemplateById,
  getTemplatesByCategory,
  searchTemplates
};
