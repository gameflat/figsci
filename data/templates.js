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
<<<<<<< HEAD
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
=======
    prompt: `\u521B\u5EFA\u4E00\u4E2A\u65B0\u5458\u5DE5\u5165\u804C\u6D41\u7A0B\u56FE\uFF0C\u4ECE\u63A5\u53D7Offer\u5230\u7B2C\u4E00\u5929\u4E0A\u73ED\uFF1A
- \u5165\u804C\u524D\uFF1A\u80CC\u666F\u8C03\u67E5 \u2192 \u7B7E\u7F72\u5408\u540C \u2192 IT\u8BBE\u5907\u7533\u8BF7
- \u7B2C\u4E00\u5929\uFF1A\u6B22\u8FCE\u4F1A \u2192 \u529E\u516C\u5BA4\u53C2\u89C2 \u2192 \u8BBE\u5907\u8BBE\u7F6E \u2192 \u6743\u9650\u5F00\u901A
- \u7B2C\u4E00\u5468\uFF1A\u56E2\u961F\u4ECB\u7ECD \u2192 \u57F9\u8BAD\u8BFE\u7A0B \u2192 \u76EE\u6807\u8BBE\u5B9A
- \u6CF3\u9053\uFF1AHR\u3001IT\u3001\u7ECF\u7406\u3001\u65B0\u5458\u5DE5
- \u51B3\u7B56\u70B9\uFF1A\u80CC\u666F\u8C03\u67E5\u901A\u8FC7/\u5931\u8D25\u3001\u8BBE\u5907\u51C6\u5907\u597D \u662F/\u5426
- \u4F7F\u7528\u67D4\u548C\u7684\u84DD/\u7EFF\u8272\u8C03\uFF0C\u6E05\u6670\u7684\u65F6\u95F4\u7EBF\u6307\u793A
- \u4FDD\u6301\u6574\u6D01\u4E13\u4E1A\uFF0C\u9002\u5F53\u7684\u95F4\u8DDD`,
>>>>>>> origin/figsci_1209
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
<<<<<<< HEAD
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
=======
    prompt: `\u521B\u5EFAAPI\u8BF7\u6C42/\u54CD\u5E94\u65F6\u5E8F\u56FE\uFF1A
- \u53C2\u4E0E\u8005\uFF1A\u5BA2\u6237\u7AEF\u3001API\u7F51\u5173\u3001\u8BA4\u8BC1\u670D\u52A1\u3001\u540E\u7AEF\u670D\u52A1\u3001\u6570\u636E\u5E93
- \u6D41\u7A0B\uFF1A
  1. \u5BA2\u6237\u7AEF \u2192 API\u7F51\u5173\uFF1APOST /api/users (\u5E26JWT\u4EE4\u724C)
  2. API\u7F51\u5173 \u2192 \u8BA4\u8BC1\u670D\u52A1\uFF1A\u9A8C\u8BC1\u4EE4\u724C
  3. \u8BA4\u8BC1\u670D\u52A1 \u2192 API\u7F51\u5173\uFF1A\u4EE4\u724C\u6709\u6548 (200 OK)
  4. API\u7F51\u5173 \u2192 \u540E\u7AEF\u670D\u52A1\uFF1A\u8F6C\u53D1\u8BF7\u6C42
  5. \u540E\u7AEF\u670D\u52A1 \u2192 \u6570\u636E\u5E93\uFF1A\u67E5\u8BE2\u7528\u6237\u6570\u636E
  6. \u6570\u636E\u5E93 \u2192 \u540E\u7AEF\u670D\u52A1\uFF1A\u8FD4\u56DE\u7ED3\u679C
  7. \u540E\u7AEF\u670D\u52A1 \u2192 API\u7F51\u5173\uFF1A\u54CD\u5E94\u8F7D\u8377
  8. API\u7F51\u5173 \u2192 \u5BA2\u6237\u7AEF\uFF1A200 OK \u5E26\u6570\u636E
- \u6DFB\u52A0\u9519\u8BEF\u8DEF\u5F84\uFF1A\u65E0\u6548\u4EE4\u724C (401)\u3001\u670D\u52A1\u8D85\u65F6 (504)
- \u5305\u542B\u8BF7\u6C42/\u54CD\u5E94\u5934\u3001\u5EF6\u8FDF\u6307\u793A\u5668
- \u4F7F\u7528\u5E26\u6709\u751F\u547D\u7EBF\u7684\u65F6\u5E8F\u56FE\u98CE\u683C`,
>>>>>>> origin/figsci_1209
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
<<<<<<< HEAD
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
=======
    prompt: `\u521B\u5EFA\u4E00\u4E2A\u5546\u4E1A\u51B3\u7B56\u6811\uFF0C\u4E3B\u9898\u4E3A\u201C\u662F\u5426\u5728\u5E02\u573A\u63A8\u51FA\u65B0\u4EA7\u54C1\uFF1F\u201D\uFF1A
- \u6839\u51B3\u7B56\uFF1A\u5E02\u573A\u89C4\u6A21 > $10M\uFF1F(\u662F/\u5426)
- \u5206\u652F 1 (\u662F)\uFF1A\u7ADE\u4E89\u7A0B\u5EA6\uFF1F(\u9AD8/\u4E2D/\u4F4E)
  - \u9AD8\uFF1AROI\u8BA1\u7B97 \u2192 \u8FDB\u884C/\u653E\u5F03
  - \u4E2D\uFF1A\u98CE\u9669\u8BC4\u4F30 \u2192 \u8FDB\u884C/\u653E\u5F03
  - \u4F4E\uFF1A\u5FEB\u901F\u901A\u9053\u53D1\u5E03
- \u5206\u652F 2 (\u5426)\uFF1A\u66FF\u4EE3\u5E02\u573A\u5206\u6790
- \u5305\u542B\u6982\u7387\u767E\u5206\u6BD4\u3001\u9884\u671F\u7ED3\u679C
- \u4F7F\u7528\u77E9\u5F62\u51B3\u7B56\u8282\u70B9\uFF0C\u83F1\u5F62\u8868\u793A\u95EE\u9898
- \u7ED3\u679C\u989C\u8272\u7F16\u7801\uFF1A\u7EFF\u8272 (\u8FDB\u884C)\u3001\u7EA2\u8272 (\u653E\u5F03)\u3001\u9EC4\u8272 (\u590D\u5BA1)
- \u6DFB\u52A0\u6E05\u6670\u7684\u6807\u7B7E\u548C\u51B3\u7B56\u6807\u51C6`,
  },
  // 4. Customer Journey Map
  {
    id: "customer-journey",
    title: "\u5BA2\u6237\u65C5\u7A0B\u5730\u56FE",
    description: "\u5BA2\u6237\u4F53\u9A8C\u65C5\u7A0B\uFF0C\u5305\u542B\u9636\u6BB5\u3001\u89E6\u70B9\u3001\u60C5\u7EEA\u66F2\u7EBF",
    category: "business",
    tags: ["\u5BA2\u6237\u4F53\u9A8C", "\u65C5\u7A0B", "\u89E6\u70B9"],
    difficulty: "intermediate",
    icon: "Route",
    gradient: {
      from: "#3b82f6",
      to: "#1d4ed8"
    },
    estimatedTime: "10 \u5206\u949F",
    prompt: `\u4E3ASaaS\u4EA7\u54C1\u521B\u5EFA\u5BA2\u6237\u65C5\u7A0B\u5730\u56FE\uFF1A
- \u9636\u6BB5\uFF1A\u8BA4\u77E5 \u2192 \u8003\u8651 \u2192 \u8D2D\u4E70 \u2192 \u5165\u804C \u2192 \u7559\u5B58
- \u6BCF\u4E2A\u9636\u6BB5\uFF1A
  - \u5BA2\u6237\u884C\u4E3A\uFF08\u4F8B\u5982\uFF0C\u201C\u641C\u7D22\u89E3\u51B3\u65B9\u6848\u201D\uFF0C\u201C\u9605\u8BFB\u8BC4\u8BBA\u201D\uFF09
  - \u89E6\u70B9\uFF08\u4F8B\u5982\uFF0C\u201C\u8C37\u6B4C\u5E7F\u544A\u201D\uFF0C\u201C\u4EA7\u54C1\u7F51\u7AD9\u201D\uFF0C\u201C\u7535\u5B50\u90AE\u4EF6\u201D\uFF09
  - \u60C5\u7EEA\uFF08\u79EF\u6781/\u4E2D\u6027/\u6D88\u6781\u6307\u6807\uFF09
  - \u75DB\u70B9\uFF08\u7528\u7EA2\u8272\u7A81\u51FA\u663E\u793A\uFF09
  - \u673A\u4F1A\uFF08\u7528\u7EFF\u8272\u7A81\u51FA\u663E\u793A\uFF09
- \u5728\u6240\u6709\u9636\u6BB5\u6DFB\u52A0\u60C5\u7EEA\u66F2\u7EBF
- \u4F7F\u7528\u65F6\u95F4\u7EBF\u53EF\u89C6\u5316\uFF0C\u53CB\u597D\u7684\u56FE\u6807
- \u4FDD\u6301\u591A\u5F69\u4F46\u4E13\u4E1A`,
  },
  // 5. Agile Sprint Workflow
  {
    id: "agile-sprint",
    title: "\u654F\u6377 Sprint \u5DE5\u4F5C\u6D41",
    description: "Scrum\u654F\u6377\u5F00\u53D1\u7684\u5B8C\u6574Sprint\u6D41\u7A0B",
    category: "development",
    tags: ["\u654F\u6377", "Scrum", "Sprint"],
    difficulty: "beginner",
    icon: "Repeat",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "8 \u5206\u949F",
    prompt: `\u521B\u5EFA\u654F\u6377 Sprint \u5DE5\u4F5C\u6D41\uFF082\u5468\u5468\u671F\uFF09\uFF1A
- Sprint \u89C4\u5212\uFF1ABacklog \u68B3\u7406 \u2192 \u6545\u4E8B\u9009\u62E9 \u2192 \u4EFB\u52A1\u5206\u89E3 \u2192 \u5BB9\u91CF\u89C4\u5212
- \u65E5\u5E38\u6D3B\u52A8\uFF1A\u6BCF\u65E5\u7AD9\u4F1A \u2192 \u5F00\u53D1 \u2192 \u4EE3\u7801\u5BA1\u67E5 \u2192 \u6D4B\u8BD5
- Sprint \u4EEA\u5F0F\u65F6\u95F4\u7EBF\uFF1A
  - \u7B2C\u4E00\u5929\uFF1ASprint \u89C4\u5212\uFF082-4\u5C0F\u65F6\uFF09
  - \u6BCF\u65E5\uFF1A\u7AD9\u4F1A\uFF0815\u5206\u949F\uFF09
  - Sprint \u4E2D\u671F\uFF1ABacklog \u68B3\u7406
  - \u6700\u540E\u4E00\u5929\uFF1ASprint \u8BC4\u5BA1 \u2192 Sprint \u56DE\u987E
- \u4EA4\u4ED8\u7269\uFF1A\u6F5C\u5728\u53EF\u53D1\u5E03\u589E\u91CF
- \u6CF3\u9053\uFF1APO\u3001Scrum Master\u3001\u5F00\u53D1\u56E2\u961F\u3001QA
- \u5305\u542B\u901F\u5EA6\u8DDF\u8E2A\u3001\u71C3\u5C3D\u56FE\u53C2\u8003
- \u4F7F\u7528\u8FED\u4EE3\u6D41\u7A0B\u53EF\u89C6\u5316`,
  },
  // 6. Bug Triage Process
  {
    id: "bug-triage",
    title: "Bug \u5904\u7406\u6D41\u7A0B",
    description: "Bug\u5904\u7406\u6D41\u7A0B\uFF0C\u4ECE\u62A5\u544A\u5230\u4FEE\u590D\u9A8C\u8BC1",
    category: "development",
    tags: ["QA", "Bug \u8FFD\u8E2A", "\u6D41\u7A0B"],
    difficulty: "beginner",
    icon: "Bug",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "8 \u5206\u949F",
    prompt: `\u521B\u5EFA Bug \u5904\u7406\u5DE5\u4F5C\u6D41\uFF1A
- \u62A5\u544A\uFF1A\u7528\u6237/QA \u62A5\u544A Bug \u2192 \u81EA\u52A8\u521B\u5EFA\u5DE5\u5355
- \u5206\u6D41\uFF1AQA \u8D1F\u8D23\u4EBA\u5BA1\u6838
  - \u91CD\u590D\uFF1F\u2192 \u5173\u95ED\u5E76\u94FE\u63A5\u5230\u539F\u59CB\u5DE5\u5355
  - \u6709\u6548 Bug\uFF1F\u2192 \u7EE7\u7EED
- \u4E25\u91CD\u7A0B\u5EA6\u8BC4\u4F30\uFF1A
  - \u4E25\u91CD (P0)\uFF1A\u7ACB\u5373\u4FEE\u590D\uFF0C\u5347\u7EA7\u5230\u5F85\u547D\u72B6\u6001
  - \u9AD8 (P1)\uFF1A\u5206\u914D\u5230\u5F53\u524D Sprint
  - \u4E2D (P2)\uFF1A\u6DFB\u52A0\u5230 Backlog
  - \u4F4E (P3)\uFF1A\u6DFB\u52A0\u5230\u6280\u672F\u503A\u52A1\u5217\u8868
- \u5206\u914D\uFF1A\u6309\u7EC4\u4EF6\u81EA\u52A8\u5206\u914D \u2192 \u5DE5\u7A0B\u5E08\u8BA4\u9886
- \u5F00\u53D1\uFF1A\u4FEE\u590D \u2192 \u521B\u5EFA PR \u2192 \u4EE3\u7801\u5BA1\u67E5 \u2192 \u5408\u5E76
- \u9A8C\u8BC1\uFF1A\u90E8\u7F72\u5230 Staging \u2192 QA \u9A8C\u8BC1 \u2192 \u90E8\u7F72\u5230\u751F\u4EA7
- \u5173\u95ED\uFF1A\u5728\u751F\u4EA7\u73AF\u5883\u9A8C\u8BC1 \u2192 \u66F4\u65B0\u5DE5\u5355 \u2192 \u901A\u77E5\u62A5\u544A\u4EBA
- \u6CF3\u9053\uFF1A\u62A5\u544A\u4EBA\u3001QA \u8D1F\u8D23\u4EBA\u3001\u5DE5\u7A0B\u3001DevOps
- \u6309\u4F18\u5148\u7EA7\u989C\u8272\u7F16\u7801`,
  },
  // 7. Git Branching Strategy
  {
    id: "git-branching",
    title: "Git \u5206\u652F\u7B56\u7565",
    description: "Git\u5DE5\u4F5C\u6D41\uFF0C\u5305\u542Bfeature\u3001develop\u3001release\u3001hotfix\u5206\u652F",
    category: "development",
    tags: ["Git", "\u7248\u672C\u63A7\u5236", "DevOps"],
    difficulty: "intermediate",
    isPopular: true,
    icon: "GitBranch",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "10 \u5206\u949F",
    prompt: `\u521B\u5EFA Git \u5206\u652F\u7B56\u7565\u56FE (Gitflow)\uFF1A
- \u4E3B\u8981\u5206\u652F\uFF1Amain (\u751F\u4EA7), develop (\u96C6\u6210)
- \u652F\u6301\u5206\u652F\uFF1A
  - Feature \u5206\u652F\uFF1A\u4ECE develop \u5206\u51FA \u2192 \u5408\u5E76\u56DE develop
  - Release \u5206\u652F\uFF1A\u4ECE develop \u5206\u51FA \u2192 \u5408\u5E76\u5230 main + develop
  - Hotfix \u5206\u652F\uFF1A\u4ECE main \u5206\u51FA \u2192 \u5408\u5E76\u5230 main + develop
- \u5178\u578B\u6D41\u7A0B\uFF1A
  1. \u4ECE develop \u521B\u5EFA feature/new-feature
  2. \u5F00\u53D1 \u2192 \u63D0\u4EA4 \u2192 \u63A8\u9001
  3. Pull Request \u2192 \u4EE3\u7801\u5BA1\u67E5 \u2192 \u5408\u5E76\u5230 develop
  4. \u4ECE develop \u521B\u5EFA release/v1.2.0
  5. \u6D4B\u8BD5 \u2192 Bug \u4FEE\u590D \u2192 \u5408\u5E76\u5230 main
  6. \u6253\u6807\u7B7E v1.2.0 \u2192 \u90E8\u7F72
- \u4F7F\u7528\u4E0D\u540C\u989C\u8272\u533A\u5206\u5206\u652F\u7C7B\u578B\uFF0C\u663E\u793A\u5408\u5E76\u65B9\u5411
- \u4E3A\u6BCF\u79CD\u5206\u652F\u7C7B\u578B\u6DFB\u52A0\u6E05\u6670\u6807\u7B7E
- \u5305\u542B\u65F6\u95F4\u7EBF/\u987A\u5E8F\u6307\u793A\u5668`,
  },
  // 8. Approval Workflow
  {
    id: "approval-workflow",
    title: "\u5BA1\u6279\u5DE5\u4F5C\u6D41",
    description: "\u591A\u5C42\u7EA7\u5BA1\u6279\u6D41\u7A0B\uFF0C\u9002\u7528\u4E8E\u91C7\u8D2D\u3001\u8BF7\u5047\u3001\u62A5\u9500\u7B49\u573A\u666F",
    category: "business",
    tags: ["\u5DE5\u4F5C\u6D41", "\u5BA1\u6279", "\u6D41\u7A0B"],
    difficulty: "beginner",
    icon: "CheckCircle",
    gradient: {
      from: "#3b82f6",
      to: "#1d4ed8"
    },
    estimatedTime: "5 \u5206\u949F",
    prompt: `\u521B\u5EFA\u4E00\u4E2A\u591A\u5C42\u7EA7\u91C7\u8D2D\u7533\u8BF7\u5BA1\u6279\u5DE5\u4F5C\u6D41\uFF1A
- \u5F00\u59CB\uFF1A\u5458\u5DE5\u63D0\u4EA4\u7533\u8BF7
- \u51B3\u7B56 1\uFF1A\u91D1\u989D < $1,000\uFF1F
  - \u662F\uFF1A\u76F4\u63A5\u7ECF\u7406\u5BA1\u6279 \u2192 \u7ED3\u675F
  - \u5426\uFF1A\u7EE7\u7EED\u5230\u51B3\u7B56 2
- \u51B3\u7B56 2\uFF1A\u91D1\u989D < $10,000\uFF1F
  - \u662F\uFF1A\u90E8\u95E8\u4E3B\u7BA1\u5BA1\u6279 \u2192 \u8D22\u52A1\u5BA1\u6838 \u2192 \u7ED3\u675F
  - \u5426\uFF1AVP \u5BA1\u6279 \u2192 CFO \u5BA1\u6279 \u2192 CEO \u5BA1\u6279 \u2192 \u7ED3\u675F
- \u6BCF\u4E2A\u5BA1\u6279\u90FD\u53EF\u4EE5\u62D2\u7EDD\uFF08\u9000\u56DE\u7ED9\u5458\u5DE5\uFF09\u6216\u6279\u51C6\uFF08\u7EE7\u7EED\uFF09
- \u6CF3\u9053\uFF1A\u5458\u5DE5\u3001\u7ECF\u7406\u3001\u90E8\u95E8\u4E3B\u7BA1\u3001\u8D22\u52A1\u3001\u9AD8\u7BA1
- \u4E3A\u7D27\u6025\u8BF7\u6C42\u6DFB\u52A0\u5E76\u884C\u8DEF\u5F84
- \u989C\u8272\u7F16\u7801\uFF1A\u7EFF\u8272\u8868\u793A\u6279\u51C6\uFF0C\u7EA2\u8272\u8868\u793A\u62D2\u7EDD\uFF0C\u9EC4\u8272\u8868\u793A\u5F85\u5B9A
- \u5305\u542B\u6E05\u6670\u7684\u51B3\u7B56\u6807\u51C6\u548C\u5BA1\u6279\u9650\u989D`,
  },
  // 9. CI/CD Pipeline
  {
    id: "cicd-pipeline",
    title: "CI/CD \u6D41\u6C34\u7EBF",
    description: "\u6301\u7EED\u96C6\u6210/\u6301\u7EED\u90E8\u7F72\u6D41\u6C34\u7EBF\uFF0C\u4ECE\u4EE3\u7801\u63D0\u4EA4\u5230\u751F\u4EA7\u53D1\u5E03",
    category: "development",
    tags: ["CI/CD", "DevOps", "\u81EA\u52A8\u5316"],
    difficulty: "advanced",
    icon: "Zap",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "15 \u5206\u949F",
    prompt: `\u521B\u5EFA\u4E00\u4E2A\u5168\u9762\u7684 CI/CD \u6D41\u6C34\u7EBF\uFF1A
- \u89E6\u53D1\uFF1AGit \u63A8\u9001\u5230 main \u5206\u652F
- CI \u9636\u6BB5\uFF1A
  - \u68C0\u51FA\u4EE3\u7801
  - \u5B89\u88C5\u4F9D\u8D56
  - \u8FD0\u884C Lint \u68C0\u67E5
  - \u8FD0\u884C\u5355\u5143\u6D4B\u8BD5\uFF08\u5E76\u884C\uFF09
  - \u8FD0\u884C\u96C6\u6210\u6D4B\u8BD5\uFF08\u5E76\u884C\uFF09
  - \u6784\u5EFA\u5236\u54C1
  - \u5B89\u5168\u626B\u63CF (SAST/DAST)
- CD \u9636\u6BB5\uFF1A
  - \u90E8\u7F72\u5230 Staging \u73AF\u5883
  - \u8FD0\u884C\u5192\u70DF\u6D4B\u8BD5
  - \u624B\u52A8\u6279\u51C6\u95E8\u7981
  - \u90E8\u7F72\u5230\u751F\u4EA7\u73AF\u5883\uFF08\u84DD\u7EFF\u90E8\u7F72\uFF09
  - \u5065\u5EB7\u68C0\u67E5
  - \u56DE\u6EDA\u80FD\u529B
- \u5305\u542B\u6210\u529F/\u5931\u8D25\u8DEF\u5F84\uFF0C\u901A\u77E5\u6B65\u9AA4
- \u5C3D\u53EF\u80FD\u663E\u793A\u5E76\u884C\u6267\u884C
- \u4E3A\u6BCF\u4E2A\u5DE5\u5177\u6DFB\u52A0\u56FE\u6807\uFF08Jenkins, Docker, K8s \u7B49\uFF09
- \u6309\u72B6\u6001\u989C\u8272\u7F16\u7801\u9636\u6BB5`,
  },
  // 10. Organizational Chart
  {
    id: "org-chart",
    title: "\u7EC4\u7EC7\u67B6\u6784\u56FE",
    description: "\u516C\u53F8\u7EC4\u7EC7\u67B6\u6784\u56FE\uFF0C\u5C55\u793A\u5C42\u7EA7\u5173\u7CFB\u548C\u6C47\u62A5\u7EBF",
    category: "business",
    tags: ["\u7EC4\u7EC7\u67B6\u6784", "\u7ED3\u6784", "\u5C42\u7EA7"],
    difficulty: "beginner",
    icon: "Building",
    gradient: {
      from: "#3b82f6",
      to: "#1d4ed8"
    },
    estimatedTime: "5 \u5206\u949F",
    prompt: `\u4E3A\u79D1\u6280\u521D\u521B\u516C\u53F8\u521B\u5EFA\u4E00\u4E2A\u6E05\u6670\u7684\u7EC4\u7EC7\u67B6\u6784\u56FE\uFF1A
- CEO \u5728\u9876\u90E8
- C-Level\uFF1ACTO, CPO, CFO, CMO (\u5411 CEO \u6C47\u62A5)
- \u5DE5\u7A0B (CTO \u4E0B)\uFF1A\u524D\u7AEF\u56E2\u961F\u3001\u540E\u7AEF\u56E2\u961F\u3001DevOps \u56E2\u961F
- \u4EA7\u54C1 (CPO \u4E0B)\uFF1A\u4EA7\u54C1\u7ECF\u7406\u3001\u8BBE\u8BA1\u5E08\u3001\u7814\u7A76\u5458
- \u8D22\u52A1 (CFO \u4E0B)\uFF1A\u4F1A\u8BA1\u3001FP&A
- \u5E02\u573A (CMO \u4E0B)\uFF1A\u589E\u957F\u3001\u5185\u5BB9\u3001\u54C1\u724C
- \u4F7F\u7528\u5C42\u7EA7\u6811\u5E03\u5C40\uFF0C\u4E00\u81F4\u7684\u95F4\u8DDD
- \u6309\u90E8\u95E8\u989C\u8272\u7F16\u7801\uFF0C\u663E\u793A\u6BCF\u4E2A\u56E2\u961F\u7684\u4EBA\u6570
- \u6DFB\u52A0\u6E05\u6670\u7684\u6C47\u62A5\u7EBF
- \u4FDD\u6301\u4E13\u4E1A\u548C\u5E73\u8861`,
  },
  // 11. Mind Map (Brainstorming)
  {
    id: "mindmap-brainstorm",
    title: "\u5934\u8111\u98CE\u66B4\u601D\u7EF4\u5BFC\u56FE",
    description: "\u53D1\u6563\u601D\u7EF4\u5BFC\u56FE\uFF0C\u7528\u4E8E\u5934\u8111\u98CE\u66B4\u548C\u521B\u610F\u6574\u7406",
    category: "creative",
    tags: ["\u5934\u8111\u98CE\u66B4", "\u6784\u601D", "\u521B\u610F"],
    difficulty: "beginner",
    isNew: true,
    icon: "Lightbulb",
    gradient: {
      from: "#f59e0b",
      to: "#d97706"
    },
    estimatedTime: "5 \u5206\u949F",
    prompt: `\u4E3A\u201C\u4EA7\u54C1\u521B\u65B0\u70B9\u5B50\u201D\u521B\u5EFA\u4E00\u4E2A\u5934\u8111\u98CE\u66B4\u601D\u7EF4\u5BFC\u56FE\uFF1A
- \u4E2D\u5FC3\u8282\u70B9\uFF1A\u201C2025\u5E74\u4EA7\u54C1\u521B\u65B0\u201D
- \u4E3B\u8981\u5206\u652F\uFF08\u7B2C1\u5C42\uFF09\uFF1A
  - \u65B0\u529F\u80FD
  - \u7528\u6237\u4F53\u9A8C
  - \u5546\u4E1A\u6A21\u5F0F
  - \u6280\u672F\u6808
  - \u8425\u9500\u6E20\u9053
- \u5B50\u5206\u652F\uFF08\u7B2C2-3\u5C42\uFF09\uFF1A
  - \u65B0\u529F\u80FD\uFF1A
    - AI\u63A8\u8350 \u2192 \u4E2A\u6027\u5316\u5F15\u64CE
    - \u793E\u4EA4\u5206\u4EAB \u2192 \u75C5\u6BD2\u5F0F\u4F20\u64AD
    - \u79FB\u52A8\u5E94\u7528 \u2192 \u79BB\u7EBF\u6A21\u5F0F
  - \u7528\u6237\u4F53\u9A8C\uFF1A
    - \u5165\u804C\u91CD\u8BBE\u8BA1 \u2192 \u4EA4\u4E92\u5F0F\u6559\u7A0B
    - \u65E0\u969C\u788D \u2192 \u5C4F\u5E55\u9605\u8BFB\u5668\u652F\u6301
    - \u6027\u80FD \u2192 \u4E9A\u79D2\u7EA7\u52A0\u8F7D
  - \u5546\u4E1A\u6A21\u5F0F\uFF1A
    - \u514D\u8D39\u589E\u503C\u5C42 \u2192 \u529F\u80FD\u5BF9\u6BD4
    - \u4F01\u4E1A\u8BA1\u5212 \u2192 \u81EA\u5B9A\u4E49SLA
    - \u5E02\u573A \u2192 \u6536\u5165\u5206\u6210
- \u4F7F\u7528\u6709\u673A\u5F62\u72B6\uFF0C\u591A\u6837\u7684\u989C\u8272\uFF0C\u6709\u8DA3\u7684\u56FE\u6807
- \u4E3A\u9AD8\u4F18\u5148\u7EA7\u70B9\u5B50\u6DFB\u52A0\u201C\u70ED\u95E8\u201D\u6307\u793A\u5668
- \u5305\u542B\u8DE8\u5206\u652F\u76F8\u5173\u70B9\u5B50\u4E4B\u95F4\u7684\u8FDE\u63A5`,
>>>>>>> origin/figsci_1209
  },
  // 6. Network Topology Graph
  {
    id: "network-topology-graph",
    title: "网络拓扑/关系图",
    description: "展示节点之间的复杂连接关系、相互作用或通信网络",
    category: "network",
    tags: ["网络", "节点", "关系"],
    difficulty: "intermediate",
<<<<<<< HEAD
    isPopular: true,
=======
    icon: "Package",
    gradient: {
      from: "#ec4899",
      to: "#be185d"
    },
    estimatedTime: "12 \u5206\u949F",
    prompt: `\u521B\u5EFA\u4EA7\u54C1\u5F00\u53D1\u751F\u547D\u5468\u671F\uFF1A
- \u53D1\u73B0\u9636\u6BB5\uFF1A
  - \u5E02\u573A\u8C03\u7814 \u2192 \u7528\u6237\u8BBF\u8C08 \u2192 \u7ADE\u54C1\u5206\u6790
  - \u95EE\u9898\u9A8C\u8BC1\uFF1A\u8FD9\u662F\u771F\u6B63\u7684\u95EE\u9898\u5417\uFF1F(\u662F/\u5426)
- \u5B9A\u4E49\u9636\u6BB5\uFF1A
  - \u7528\u6237\u753B\u50CF \u2192 \u7528\u6237\u6545\u4E8B \u2192 \u529F\u80FD\u4F18\u5148\u7EA7
  - PRD \u521B\u5EFA \u2192 \u8BBE\u8BA1\u89C4\u8303 \u2192 \u6280\u672F\u89C4\u8303
- \u8BBE\u8BA1\u9636\u6BB5\uFF1A
  - \u7EBF\u6846\u56FE \u2192 \u89C6\u89C9\u7A3F \u2192 \u539F\u578B \u2192 \u53EF\u7528\u6027\u6D4B\u8BD5
  - \u8BBE\u8BA1\u6279\u51C6\u95E8\u7981
- \u5F00\u53D1\u9636\u6BB5\uFF1A
  - Sprint \u89C4\u5212 \u2192 \u654F\u6377\u5F00\u53D1 \u2192 QA \u6D4B\u8BD5
- \u53D1\u5E03\u9636\u6BB5\uFF1A
  - Beta \u6D4B\u8BD5 \u2192 \u53CD\u9988\u6536\u96C6 \u2192 \u751F\u4EA7\u53D1\u5E03
  - \u8425\u9500\u6D3B\u52A8 \u2192 \u7528\u6237\u5165\u804C
- \u589E\u957F\u9636\u6BB5\uFF1A
  - \u5206\u6790\u76D1\u63A7 \u2192 A/B \u6D4B\u8BD5 \u2192 \u529F\u80FD\u8FED\u4EE3
- \u5305\u542B\u4ECE\u6BCF\u4E2A\u9636\u6BB5\u56DE\u5230\u53D1\u73B0\u9636\u6BB5\u7684\u53CD\u9988\u5FAA\u73AF
- \u6DFB\u52A0\u51B3\u7B56\u95E8\u7981\u548C\u8D28\u91CF\u68C0\u67E5\u70B9
- \u6309\u9636\u6BB5\u7C7B\u578B\u989C\u8272\u7F16\u7801`,
  },
  // 13. Microservices Communication
  {
    id: "microservices",
    title: "\u5FAE\u670D\u52A1\u901A\u4FE1",
    description: "\u5FAE\u670D\u52A1\u67B6\u6784\u7684\u670D\u52A1\u95F4\u901A\u4FE1\u6A21\u5F0F",
    category: "development",
    tags: ["\u5FAE\u670D\u52A1", "\u67B6\u6784", "\u901A\u4FE1"],
    difficulty: "advanced",
>>>>>>> origin/figsci_1209
    icon: "Network",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
<<<<<<< HEAD
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
=======
    estimatedTime: "15 \u5206\u949F",
    prompt: `\u521B\u5EFA\u5FAE\u670D\u52A1\u901A\u4FE1\u56FE\uFF1A
- \u670D\u52A1\uFF1AAPI \u7F51\u5173\u3001\u7528\u6237\u670D\u52A1\u3001\u8BA2\u5355\u670D\u52A1\u3001\u652F\u4ED8\u670D\u52A1\u3001\u901A\u77E5\u670D\u52A1\u3001\u5E93\u5B58\u670D\u52A1
- \u901A\u4FE1\u6A21\u5F0F\uFF1A
  - \u540C\u6B65\uFF1AREST API \u8C03\u7528\uFF08\u5B9E\u7EBF\uFF09
  - \u5F02\u6B65\uFF1A\u6D88\u606F\u961F\u5217\uFF08\u865A\u7EBF\uFF09
  - \u4E8B\u4EF6\u9A71\u52A8\uFF1A\u4E8B\u4EF6\u603B\u7EBF\uFF08\u70B9\u7EBF\uFF09
- \u793A\u4F8B\u6D41\u7A0B\uFF1A
  1. \u5BA2\u6237\u7AEF \u2192 API \u7F51\u5173 \u2192 \u8BA2\u5355\u670D\u52A1
  2. \u8BA2\u5355\u670D\u52A1 \u2192 \u652F\u4ED8\u670D\u52A1\uFF08\u540C\u6B65 REST\uFF09
  3. \u8BA2\u5355\u670D\u52A1 \u2192 \u5E93\u5B58\u670D\u52A1\uFF08\u540C\u6B65 REST\uFF09
  4. \u8BA2\u5355\u670D\u52A1 \u2192 \u6D88\u606F\u961F\u5217 \u2192 \u901A\u77E5\u670D\u52A1\uFF08\u5F02\u6B65\uFF09
  5. \u652F\u4ED8\u670D\u52A1 \u2192 \u4E8B\u4EF6\u603B\u7EBF \u2192 \u5206\u6790\u670D\u52A1\uFF08\u4E8B\u4EF6\uFF09
- \u663E\u793A\u534F\u8BAE\uFF08HTTP, gRPC, RabbitMQ, Kafka\uFF09
- \u5305\u542B\u670D\u52A1\u6CE8\u518C\u3001\u8D1F\u8F7D\u5747\u8861\u3001\u65AD\u8DEF\u5668\u6A21\u5F0F
- \u6309\u901A\u4FE1\u7C7B\u578B\u989C\u8272\u7F16\u7801
- \u6DFB\u52A0\u5EF6\u8FDF\u6307\u793A\u5668`,
>>>>>>> origin/figsci_1209
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
<<<<<<< HEAD
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
=======
    estimatedTime: "10 \u5206\u949F",
    prompt: `\u4E3A\u5728\u7EBF\u8D2D\u7269\u5E94\u7528\u521B\u5EFA\u7528\u6237\u6545\u4E8B\u5730\u56FE\uFF1A
- \u7528\u6237\u6D3B\u52A8\uFF08\u9876\u5C42\uFF0C\u4ECE\u5DE6\u5230\u53F3\uFF09\uFF1A
  - \u6D4F\u89C8\u5546\u54C1 \u2192 \u641C\u7D22 \u2192 \u67E5\u770B\u8BE6\u60C5 \u2192 \u52A0\u5165\u8D2D\u7269\u8F66 \u2192 \u7ED3\u8D26 \u2192 \u8DDF\u8E2A\u8BA2\u5355
- \u7528\u6237\u4EFB\u52A1\uFF08\u6BCF\u4E2A\u6D3B\u52A8\u4E0B\u65B9\uFF09\uFF1A
  - \u6D4F\u89C8\uFF1A\u6309\u7C7B\u522B\u7B5B\u9009\u3001\u6309\u4EF7\u683C\u6392\u5E8F\u3001\u67E5\u770B\u63A8\u8350
  - \u641C\u7D22\uFF1A\u5173\u952E\u8BCD\u641C\u7D22\u3001\u8BED\u97F3\u641C\u7D22\u3001\u6761\u5F62\u7801\u626B\u63CF
  - \u67E5\u770B\u8BE6\u60C5\uFF1A\u9605\u8BFB\u63CF\u8FF0\u3001\u67E5\u770B\u8BC4\u8BBA\u3001\u67E5\u770B\u76F8\u5173\u5546\u54C1
  - \u52A0\u5165\u8D2D\u7269\u8F66\uFF1A\u9009\u62E9\u6570\u91CF\u3001\u9009\u62E9\u53D8\u4F53\u3001\u4FDD\u5B58\u4EE5\u5907\u540E\u7528
  - \u7ED3\u8D26\uFF1A\u8F93\u5165\u9001\u8D27\u4FE1\u606F\u3001\u9009\u62E9\u4ED8\u6B3E\u65B9\u5F0F\u3001\u5E94\u7528\u4F18\u60E0\u5238
  - \u8DDF\u8E2A\uFF1A\u67E5\u770B\u72B6\u6001\u3001\u8054\u7CFB\u652F\u6301\u3001\u7533\u8BF7\u9000\u8D27
- \u4F18\u5148\u7EA7\u7EA7\u522B\uFF08\u5782\u76F4\uFF09\uFF1A
  - MVP\uFF08\u9876\u884C\uFF0C\u5FC5\u987B\u6709\uFF09
  - Release 2\uFF08\u4E2D\u95F4\u884C\uFF09
  - Future\uFF08\u5E95\u884C\uFF0C\u6700\u597D\u6709\uFF09
- \u4F7F\u7528\u4FBF\u5229\u8D34\u98CE\u683C\uFF0C\u6309\u4F18\u5148\u7EA7\u989C\u8272\u7F16\u7801
- \u4FDD\u6301\u7EC4\u7EC7\u6709\u5E8F\uFF0C\u6613\u4E8E\u626B\u63CF`,
>>>>>>> origin/figsci_1209
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
<<<<<<< HEAD
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
=======
    estimatedTime: "15 \u5206\u949F",
    prompt: `\u521B\u5EFA\u4E8B\u4EF6\u54CD\u5E94\u8FD0\u884C\u624B\u518C\uFF1A
- \u68C0\u6D4B\u9636\u6BB5\uFF1A
  - \u76D1\u63A7\u8B66\u62A5\u89E6\u53D1 \u6216 \u7528\u6237\u62A5\u544A
  - \u5F85\u547D\u5DE5\u7A0B\u5E08\u6536\u5230\u4F20\u547C
  - \u521D\u59CB\u8BC4\u4F30\uFF1A\u4E25\u91CD\u7A0B\u5EA6 (P0/P1/P2/P3)
- \u5206\u6D41\u9636\u6BB5\uFF1A
  - P0 (\u4E25\u91CD)\uFF1A\u7EC4\u5EFA\u4F5C\u6218\u5BA4\uFF0C\u901A\u77E5\u9AD8\u7BA1
  - P1 (\u9AD8)\uFF1A\u6307\u6D3E\u4E8B\u4EF6\u6307\u6325\u5B98\uFF0C\u521B\u5EFA\u4E8B\u4EF6\u9891\u9053
  - P2/P3\uFF1A\u6807\u51C6\u5F85\u547D\u5904\u7406
- \u8C03\u67E5\uFF1A
  - \u6536\u96C6\u65E5\u5FD7 \u2192 \u8BC6\u522B\u6839\u672C\u539F\u56E0 \u2192 \u8BC4\u4F30\u5F71\u54CD\u8303\u56F4
  - \u5E76\u884C\uFF1A\u5BA2\u6237\u6C9F\u901A\uFF0C\u72B6\u6001\u9875\u66F4\u65B0
- \u904F\u5236\uFF1A
  - \u9694\u79BB\u53D7\u5F71\u54CD\u7CFB\u7EDF \u2192 \u5B9E\u65BD\u4E34\u65F6\u4FEE\u590D
  - \u51B3\u7B56\uFF1A\u6211\u4EEC\u53EF\u4EE5\u5C31\u5730\u4FEE\u8865 \u8FD8\u662F \u9700\u8981\u56DE\u6EDA\uFF1F
- \u89E3\u51B3\uFF1A
  - \u90E8\u7F72\u4FEE\u590D \u2192 \u5728 Staging \u9A8C\u8BC1 \u2192 \u63A8\u51FA\u5230\u751F\u4EA7
  - \u76D1\u63A7\u5173\u952E\u6307\u6807 \u2192 \u786E\u8BA4\u89E3\u51B3
- \u4E8B\u540E\u603B\u7ED3\uFF1A
  - \u64B0\u5199\u4E8B\u4EF6\u62A5\u544A \u2192 \u65E0\u8D23\u5BA1\u67E5 \u2192 \u884C\u52A8\u9879
  - \u66F4\u65B0\u8FD0\u884C\u624B\u518C \u2192 \u5206\u4EAB\u7ECF\u9A8C
- \u6CF3\u9053\uFF1A\u5F85\u547D\u4EBA\u5458\u3001\u4E8B\u4EF6\u6307\u6325\u5B98\u3001\u5DE5\u7A0B\u3001\u6C9F\u901A\u3001\u9886\u5BFC\u5C42
- \u5305\u542B\u5347\u7EA7\u8DEF\u5F84\u3001\u6C9F\u901A\u6A21\u677F
- \u6309\u4E25\u91CD\u7A0B\u5EA6\u989C\u8272\u7F16\u7801`,
>>>>>>> origin/figsci_1209
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
<<<<<<< HEAD
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
=======
    estimatedTime: "15 \u5206\u949F",
    prompt: `\u521B\u5EFA\u4F01\u4E1A\u7F51\u7EDC\u67B6\u6784\uFF1A
- \u5916\u90E8\u533A\u57DF\uFF08\u4E92\u8054\u7F51\uFF09\uFF1A
  - \u7528\u6237 \u2192 CDN \u2192 WAF \u2192 \u8D1F\u8F7D\u5747\u8861\u5668
- DMZ\uFF08\u975E\u519B\u4E8B\u533A\uFF09\uFF1A
  - \u9762\u5411\u516C\u4F17\u7684 Web \u670D\u52A1\u5668
  - \u53CD\u5411\u4EE3\u7406 / API \u7F51\u5173
  - \u9632\u706B\u5899\u89C4\u5219\uFF1A\u4EC5\u5F00\u653E\u7AEF\u53E3 80/443
- \u5185\u90E8\u533A\u57DF\uFF08\u79C1\u6709 VPC\uFF09\uFF1A
  - \u5E94\u7528\u670D\u52A1\u5668\uFF08\u79C1\u6709\u5B50\u7F51\uFF09
  - \u6570\u636E\u5E93\u96C6\u7FA4\uFF08\u9694\u79BB\u5B50\u7F51\uFF09
  - \u5185\u90E8\u670D\u52A1\uFF08\u6D88\u606F\u961F\u5217\u3001\u7F13\u5B58\uFF09
- \u7BA1\u7406\u533A\u57DF\uFF1A
  - \u5821\u5792\u673A\uFF08\u8DF3\u677F\u673A\uFF09
  - \u76D1\u63A7\u548C\u65E5\u5FD7\u670D\u52A1\u5668
  - \u7BA1\u7406\u5458\u5DE5\u4F5C\u7AD9
- \u5B89\u5168\u5C42\uFF1A
  - \u6BCF\u4E2A\u533A\u57DF\u4E4B\u95F4\u7684\u9632\u706B\u5899
  - \u7528\u4E8E\u8FDC\u7A0B\u8BBF\u95EE\u7684 VPN
  - IDS/IPS \u4F20\u611F\u5668
  - \u4F7F\u7528 VLAN \u8FDB\u884C\u7F51\u7EDC\u5206\u6BB5
- \u663E\u793A IP \u8303\u56F4\u3001\u5B89\u5168\u7EC4\u3001\u6D41\u91CF\u7BAD\u5934
- \u5305\u542B\u5907\u4EFD/\u5BB9\u707E\u7AD9\u70B9\u8FDE\u63A5
- \u4F7F\u7528\u4E13\u4E1A\u7684\u7F51\u7EDC\u56FE\u7B26\u53F7`,
>>>>>>> origin/figsci_1209
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
<<<<<<< HEAD
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
=======
    estimatedTime: "10 \u5206\u949F",
    prompt: `\u521B\u5EFA\u529F\u80FD\u53D1\u5E03\u6D41\u7A0B\uFF1A
- \u5F00\u53D1\u9636\u6BB5\uFF1A
  - \u529F\u80FD\u89C4\u5212 \u2192 \u8BBE\u8BA1\u8BC4\u5BA1 \u2192 \u5F00\u53D1 \u2192 \u4EE3\u7801\u5BA1\u67E5
- \u6D4B\u8BD5\u9636\u6BB5\uFF1A
  - \u5355\u5143\u6D4B\u8BD5 \u2192 \u96C6\u6210\u6D4B\u8BD5 \u2192 QA \u6D4B\u8BD5
  - \u51B3\u7B56\uFF1A\u901A\u8FC7/\u5931\u8D25\uFF08\u5982\u679C\u5931\u8D25\uFF0C\u8FD4\u56DE\u5F00\u53D1\uFF09
- \u9884\u53D1\u5E03\uFF1A
  - \u529F\u80FD\u6807\u5FD7\u914D\u7F6E
  - \u90E8\u7F72\u5230 Staging \u2192 \u5229\u76CA\u76F8\u5173\u8005\u6F14\u793A \u2192 \u53CD\u9988
- \u53D1\u5E03\uFF1A
  - \u9010\u6B65\u63A8\u51FA\uFF1A5% \u2192 25% \u2192 50% \u2192 100%
  - \u5728\u6BCF\u4E2A\u9636\u6BB5\u76D1\u63A7\u6307\u6807
  - \u51B3\u7B56\u70B9\uFF1A\u7EE7\u7EED/\u6682\u505C/\u56DE\u6EDA
- \u53D1\u5E03\u540E\uFF1A
  - \u7528\u6237\u53CD\u9988\u6536\u96C6 \u2192 \u5206\u6790\u5BA1\u67E5 \u2192 \u8FED\u4EE3\u89C4\u5212
- \u6CF3\u9053\uFF1APM\u3001\u5DE5\u7A0B\u3001QA\u3001DevOps\u3001\u652F\u6301
- \u5305\u542B\u56DE\u6EDA\u7A0B\u5E8F
- \u6DFB\u52A0\u76D1\u63A7\u68C0\u67E5\u70B9`,
>>>>>>> origin/figsci_1209
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
<<<<<<< HEAD
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
=======
    estimatedTime: "10 \u5206\u949F",
    prompt: `\u521B\u5EFA\u4E00\u4E2A SWOT \u5206\u6790\u5E76\u8F6C\u5316\u4E3A\u884C\u52A8\u8BA1\u5212\uFF1A
- \u56DB\u4E2A\u8C61\u9650\uFF1A\u4F18\u52BF\u3001\u52A3\u52BF\u3001\u673A\u4F1A\u3001\u5A01\u80C1
- \u6BCF\u4E2A\u8C61\u9650\u6709 3-4 \u4E2A\u9879\u76EE
- \u4E2D\u5FC3\uFF1A\u6218\u7565\u76EE\u6807
- \u4ECE SWOT \u5230\u884C\u52A8\u7684\u8FDE\u63A5\uFF1A
  - \u4F18\u52BF + \u673A\u4F1A \u2192 \u589E\u957F\u6218\u7565
  - \u4F18\u52BF + \u5A01\u80C1 \u2192 \u9632\u5FA1\u6218\u7565
  - \u52A3\u52BF + \u673A\u4F1A \u2192 \u6539\u8FDB\u9886\u57DF
  - \u52A3\u52BF + \u5A01\u80C1 \u2192 \u5E94\u6025\u8BA1\u5212
- \u4F7F\u7528\u989C\u8272\u7F16\u7801\uFF0C\u4E3A\u6BCF\u4E2A\u884C\u52A8\u6DFB\u52A0\u6E05\u6670\u6807\u7B7E
- \u6DFB\u52A0\u4F18\u5148\u7EA7\u6307\u793A\u5668\uFF08\u9AD8/\u4E2D/\u4F4E\uFF09
- \u4FDD\u6301\u6218\u7565\u6027\u548C\u53EF\u64CD\u4F5C\u6027
- \u5305\u542B\u65F6\u95F4\u7EBF\u4F30\u8BA1`,
>>>>>>> origin/figsci_1209
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
<<<<<<< HEAD
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
=======
    estimatedTime: "10 \u5206\u949F",
    prompt: `\u521B\u5EFA A/B \u6D4B\u8BD5\u89C4\u5212\u6D41\u7A0B\uFF1A
- \u5047\u8BBE\uFF1A\u201C\u5C06 CTA \u6309\u94AE\u989C\u8272\u4ECE\u84DD\u8272\u6539\u4E3A\u7EFF\u8272\u5C06\u4F7F\u8F6C\u5316\u7387\u63D0\u9AD8 15%\u201D
- \u6D4B\u8BD5\u8BBE\u7F6E\uFF1A
  - \u5BF9\u7167\u7EC4 (50%)\uFF1A\u84DD\u8272\u6309\u94AE
  - \u5B9E\u9A8C\u7EC4 (50%)\uFF1A\u7EFF\u8272\u6309\u94AE
  - \u6837\u672C\u91CF\u8BA1\u7B97\uFF1A\u6BCF\u4E2A\u53D8\u4F53\u9700\u8981 10,000 \u540D\u7528\u6237
  - \u6301\u7EED\u65F6\u95F4\uFF1A\u8FD0\u884C 2 \u5468
- \u6307\u6807\uFF1A
  - \u4E3B\u8981\uFF1A\u8F6C\u5316\u7387 (%)
  - \u6B21\u8981\uFF1A\u70B9\u51FB\u7387\u3001\u9875\u9762\u505C\u7559\u65F6\u95F4\u3001\u8DF3\u51FA\u7387
- \u5B9E\u65BD\uFF1A
  - \u529F\u80FD\u6807\u5FD7\u8BBE\u7F6E \u2192 \u6D41\u91CF\u5206\u5272 \u2192 \u4E8B\u4EF6\u8DDF\u8E2A
- \u76D1\u63A7\uFF1A
  - \u6BCF\u65E5\u68C0\u67E5 \u2192 \u7EDF\u8BA1\u663E\u8457\u6027\u6D4B\u8BD5 \u2192 \u63D0\u524D\u505C\u6B62\u89C4\u5219
- \u5206\u6790\uFF1A
  - \u8BA1\u7B97\u63D0\u5347 \u2192 \u7F6E\u4FE1\u533A\u95F4 \u2192 P \u503C
  - \u51B3\u7B56\uFF1A\u53D1\u5E03\u83B7\u80DC\u8005 / \u7EE7\u7EED\u6D4B\u8BD5 / \u8FED\u4EE3
- \u63A8\u51FA\uFF1A\u9010\u6B65\u90E8\u7F72\u83B7\u80DC\u8005
- \u5305\u542B\u8FB9\u7F18\u60C5\u51B5\u7684\u51B3\u7B56\u6811\uFF08\u4F8B\u5982\uFF0C\u6CA1\u6709\u660E\u663E\u7684\u83B7\u80DC\u8005\uFF0C\u8D1F\u9762\u7ED3\u679C\uFF09`,
>>>>>>> origin/figsci_1209
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
<<<<<<< HEAD
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
=======
    estimatedTime: "10 \u5206\u949F",
    prompt: `\u521B\u5EFA\u4E00\u4E2A\u7535\u5B50\u5546\u52A1\u6570\u636E\u5E93\u67B6\u6784 (ERD)\uFF1A
- \u8868\uFF1A
  - Users: id (PK), email, password_hash, created_at
  - Products: id (PK), name, description, price, inventory
  - Orders: id (PK), user_id (FK), status, total_amount, created_at
  - OrderItems: id (PK), order_id (FK), product_id (FK), quantity, price
  - Categories: id (PK), name, parent_id (FK - \u81EA\u5F15\u7528)
  - Reviews: id (PK), product_id (FK), user_id (FK), rating, comment
- \u5173\u7CFB\uFF1A
  - Users 1:N Orders
  - Orders 1:N OrderItems
  - Products 1:N OrderItems
  - Products 1:N Reviews
  - Users 1:N Reviews
  - Categories 1:N Products (\u901A\u8FC7\u8FDE\u63A5\u8868\u591A\u5BF9\u591A)
- \u663E\u793A PK/FK\u3001\u6570\u636E\u7C7B\u578B\u3001\u7D22\u5F15\u3001\u7EA6\u675F
- \u4F7F\u7528\u6807\u51C6 ERD \u7B26\u53F7
- \u6DFB\u52A0\u57FA\u6570\u6807\u7B7E`,
>>>>>>> origin/figsci_1209
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
<<<<<<< HEAD
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
=======
    estimatedTime: "10 \u5206\u949F",
    prompt: `\u521B\u5EFA\u5B89\u5168\u5BA1\u8BA1\u5DE5\u4F5C\u6D41\uFF1A
- \u89C4\u5212\u9636\u6BB5\uFF1A
  - \u5B9A\u4E49\u5BA1\u8BA1\u8303\u56F4 \u2192 \u9009\u62E9\u6846\u67B6\uFF08SOC2, ISO27001 \u7B49\uFF09
  - \u521B\u5EFA\u5BA1\u8BA1\u6E05\u5355 \u2192 \u5B89\u6392\u8BBF\u8C08
- \u6570\u636E\u6536\u96C6\uFF1A
  - \u6587\u6863\u5BA1\u67E5\uFF1A\u653F\u7B56\u3001\u7A0B\u5E8F\u3001\u67B6\u6784\u56FE
  - \u6280\u672F\u626B\u63CF\uFF1A\u6F0F\u6D1E\u626B\u63CF\u3001\u6E17\u900F\u6D4B\u8BD5\u3001\u4EE3\u7801\u5BA1\u67E5
  - \u8BBF\u8C08\uFF1AIT \u56E2\u961F\u3001\u5B89\u5168\u56E2\u961F\u3001\u7BA1\u7406\u5C42
- \u8BC4\u4F30\uFF1A
  - \u63A7\u5236\u8BC4\u4F30\uFF1A\u6709\u6548 / \u9700\u8981\u6539\u8FDB / \u65E0\u6548
  - \u98CE\u9669\u8BC4\u7EA7\uFF1A\u4E25\u91CD / \u9AD8 / \u4E2D / \u4F4E
  - \u8BC1\u636E\u6536\u96C6\uFF1A\u622A\u56FE\u3001\u65E5\u5FD7\u3001\u914D\u7F6E
- \u53D1\u73B0\uFF1A
  - \u8BC6\u522B\u5DEE\u8DDD \u2192 \u6620\u5C04\u5230\u5408\u89C4\u8981\u6C42
  - \u5EFA\u8BAE\u8865\u6551\u63AA\u65BD \u2192 \u6309\u98CE\u9669\u786E\u5B9A\u4F18\u5148\u7EA7
- \u62A5\u544A\uFF1A
  - \u8D77\u8349\u5BA1\u8BA1\u62A5\u544A \u2192 \u4E0E\u5229\u76CA\u76F8\u5173\u8005\u5BA1\u67E5 \u2192 \u5B9A\u7A3F
  - \u5411\u9886\u5BFC\u5C42\u6F14\u793A \u2192 \u53D1\u5E03\u6B63\u5F0F\u62A5\u544A
- \u8865\u6551\u8DDF\u8E2A\uFF1A
  - \u521B\u5EFA\u884C\u52A8\u8BA1\u5212 \u2192 \u5206\u914D\u8D1F\u8D23\u4EBA \u2192 \u8BBE\u5B9A\u622A\u6B62\u65E5\u671F
  - \u540E\u7EED\u5BA1\u8BA1 \u2192 \u9A8C\u8BC1\u5173\u95ED
- \u6CF3\u9053\uFF1A\u5BA1\u8BA1\u5458\u3001IT/\u5B89\u5168\u56E2\u961F\u3001\u7BA1\u7406\u5C42`,
>>>>>>> origin/figsci_1209
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
<<<<<<< HEAD
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
=======
    estimatedTime: "10 \u5206\u949F",
    prompt: `\u521B\u5EFA RBAC \u8BBF\u95EE\u63A7\u5236\u77E9\u9635\uFF1A
- \u89D2\u8272\uFF08\u884C\uFF09\uFF1A
  - \u7BA1\u7406\u5458\uFF1A\u5B8C\u5168\u7CFB\u7EDF\u8BBF\u95EE\u6743\u9650
  - \u7ECF\u7406\uFF1A\u90E8\u95E8\u7EA7\u8BBF\u95EE\u6743\u9650
  - \u5F00\u53D1\u4EBA\u5458\uFF1A\u4EE3\u7801\u548C\u5F00\u53D1\u73AF\u5883\u8BBF\u95EE\u6743\u9650
  - \u5206\u6790\u5E08\uFF1A\u53EA\u8BFB\u6570\u636E\u8BBF\u95EE\u6743\u9650
  - \u8BBF\u5BA2\uFF1A\u6709\u9650\u7684\u516C\u5171\u8BBF\u95EE\u6743\u9650
- \u8D44\u6E90\uFF08\u5217\uFF09\uFF1A
  - \u7528\u6237\u7BA1\u7406\u3001\u914D\u7F6E\u3001\u4EE3\u7801\u4ED3\u5E93\u3001\u751F\u4EA7\u6570\u636E\u5E93
  - Staging \u73AF\u5883\u3001\u5206\u6790\u4EEA\u8868\u677F\u3001\u8D22\u52A1\u62A5\u544A\u3001\u5BA1\u8BA1\u65E5\u5FD7
- \u6743\u9650\uFF08\u5355\u5143\u683C\uFF09\uFF1A
  - C (\u521B\u5EFA)\u3001R (\u8BFB\u53D6)\u3001U (\u66F4\u65B0)\u3001D (\u5220\u9664)\u3001X (\u6267\u884C)
- \u77E9\u9635\u5E03\u5C40\uFF1A
  - \u7BA1\u7406\u5458\uFF1A\u6240\u6709\u8D44\u6E90\u7684 CRUDX
  - \u7ECF\u7406\uFF1A\u90E8\u95E8\u8D44\u6E90\u7684 CRUD\uFF0C\u5176\u4ED6\u8D44\u6E90\u7684 R
  - \u5F00\u53D1\u4EBA\u5458\uFF1A\u4EE3\u7801/Staging \u7684 CRUDX\uFF0C\u751F\u4EA7\u73AF\u5883\u7684 R
  - \u5206\u6790\u5E08\uFF1A\u5206\u6790/\u62A5\u544A\u7684 R\uFF0C\u65E0\u914D\u7F6E\u8BBF\u95EE\u6743\u9650
  - \u8BBF\u5BA2\uFF1A\u4EC5\u516C\u5171\u8D44\u6E90\u7684 R
- \u5305\u542B\u5BA1\u6279\u5DE5\u4F5C\u6D41\uFF1A
  - \u63D0\u5347\u6743\u9650\u8BF7\u6C42 \u2192 \u7ECF\u7406\u6279\u51C6 \u2192 \u9650\u65F6\u6388\u6743
  - \u663E\u793A\u89D2\u8272\u4E4B\u95F4\u7684\u7EE7\u627F\u5173\u7CFB
- \u989C\u8272\u7F16\u7801\uFF1A\u7EFF\u8272\uFF08\u5141\u8BB8\uFF09\u3001\u7EA2\u8272\uFF08\u62D2\u7EDD\uFF09\u3001\u9EC4\u8272\uFF08\u9700\u8981\u6279\u51C6\uFF09`,
>>>>>>> origin/figsci_1209
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
<<<<<<< HEAD
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
=======
    estimatedTime: "10 \u5206\u949F",
    prompt: `\u521B\u5EFA\u4E00\u4E2A 2 \u5C0F\u65F6\u7684\u5DE5\u4F5C\u574A\u5F15\u5BFC\u6D41\u7A0B\uFF1A
- \u51C6\u5907\u5DE5\u4F5C\uFF08\u5DE5\u4F5C\u574A\u524D\uFF09\uFF1A
  - \u53D1\u9001\u8BAE\u7A0B \u2192 \u51C6\u5907\u6750\u6599 \u2192 \u8BBE\u7F6E\u5DE5\u5177\uFF08Miro, Zoom\uFF09
- \u4ECB\u7ECD\uFF0815 \u5206\u949F\uFF09\uFF1A
  - \u6B22\u8FCE\u4E0E\u80CC\u666F \u2192 \u7834\u51B0\u6D3B\u52A8 \u2192 \u5BA1\u67E5\u76EE\u6807
- \u6D3B\u52A8 1\uFF1A\u95EE\u9898\u754C\u5B9A\uFF0830 \u5206\u949F\uFF09\uFF1A
  - \u4E2A\u4EBA\u5934\u8111\u98CE\u66B4\uFF085 \u5206\u949F\uFF09\u2192 \u7ED3\u5BF9\u5206\u4EAB\uFF0810 \u5206\u949F\uFF09\u2192 \u5C0F\u7EC4\u8BA8\u8BBA\uFF0815 \u5206\u949F\uFF09
  - \u4EA7\u51FA\uFF1A\u95EE\u9898\u9648\u8FF0
- \u4F11\u606F\uFF0810 \u5206\u949F\uFF09
- \u6D3B\u52A8 2\uFF1A\u89E3\u51B3\u65B9\u6848\u6784\u601D\uFF0840 \u5206\u949F\uFF09\uFF1A
  - \u75AF\u72C2 8 \u5206\u949F\u5FEB\u901F\u8349\u56FE \u2192 \u60F3\u6CD5\u6295\u7968 \u2192 \u6536\u655B\u5230\u524D 3 \u540D
  - \u4EA7\u51FA\uFF1A\u89E3\u51B3\u65B9\u6848\u6982\u5FF5
- \u6D3B\u52A8 3\uFF1A\u884C\u52A8\u8BA1\u5212\uFF0820 \u5206\u949F\uFF09\uFF1A
  - \u786E\u5B9A\u540E\u7EED\u6B65\u9AA4 \u2192 \u5206\u914D\u8D1F\u8D23\u4EBA \u2192 \u8BBE\u5B9A\u65F6\u95F4\u8868
  - \u4EA7\u51FA\uFF1A\u884C\u52A8\u8BA1\u5212
- \u603B\u7ED3\uFF085 \u5206\u949F\uFF09\uFF1A
  - \u56DE\u987E\u5173\u952E\u51B3\u7B56 \u2192 \u5206\u4EAB\u6210\u679C \u2192 \u5B89\u6392\u540E\u7EED\u8DDF\u8FDB
- \u5305\u542B\u5F15\u5BFC\u8005\u63D0\u793A\u3001\u65F6\u95F4\u63D0\u793A\u3001\u5907\u7528\u6D3B\u52A8
- \u663E\u793A\u865A\u62DF\u4E0E\u9762\u5BF9\u9762\u53D8\u5316\u7684\u5E76\u884C\u8F68\u9053`,
>>>>>>> origin/figsci_1209
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
<<<<<<< HEAD
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
=======
    estimatedTime: "15 \u5206\u949F",
    prompt: `\u521B\u5EFA\u4E00\u4E2A\u7ED3\u5408\u591A\u79CD\u6846\u67B6\u7684\u6218\u7565\u753B\u5E03\uFF1A
- \u4E2D\u5FC3\uFF1A\u516C\u53F8\u613F\u666F\u4E0E\u4F7F\u547D
- \u8C61\u9650 1\uFF08\u5DE6\u4E0A\uFF09\uFF1A\u5E02\u573A\u5206\u6790
  - TAM/SAM/SOM \u2192 \u589E\u957F\u8D8B\u52BF \u2192 \u7ADE\u4E89\u683C\u5C40
- \u8C61\u9650 2\uFF08\u53F3\u4E0A\uFF09\uFF1A\u4EF7\u503C\u4E3B\u5F20
  - \u5BA2\u6237\u7EC6\u5206 \u2192 \u5F85\u529E\u4EFB\u52A1 (Jobs-to-be-done) \u2192 \u72EC\u7279\u4EF7\u503C
- \u8C61\u9650 3\uFF08\u5DE6\u4E0B\uFF09\uFF1A\u5546\u4E1A\u6A21\u5F0F
  - \u6536\u5165\u6765\u6E90 \u2192 \u6210\u672C\u7ED3\u6784 \u2192 \u5173\u952E\u5408\u4F5C\u4F19\u4F34
- \u8C61\u9650 4\uFF08\u53F3\u4E0B\uFF09\uFF1A\u6267\u884C\u8BA1\u5212
  - OKR \u2192 \u5173\u952E\u4E3E\u63AA \u2192 \u8DEF\u7EBF\u56FE\u91CC\u7A0B\u7891
- \u8FDE\u63A5\u5143\u7D20\uFF1A
  - \u4ECE\u5E02\u573A\u5206\u6790\u5230\u4EF7\u503C\u4E3B\u5F20\uFF1A\u6D1E\u5BDF\u7BAD\u5934
  - \u4ECE\u4EF7\u503C\u4E3B\u5F20\u5230\u5546\u4E1A\u6A21\u5F0F\uFF1A\u53D8\u73B0\u8DEF\u5F84
  - \u4ECE\u5546\u4E1A\u6A21\u5F0F\u5230\u6267\u884C\uFF1A\u8D44\u6E90\u5206\u914D
- \u5305\u542B\u6BCF\u4E2A\u8C61\u9650\u7684 KPI
- \u4F7F\u7528\u4F01\u4E1A\u914D\u8272\u65B9\u6848\uFF0C\u6E05\u6670\u7684\u5C42\u7EA7
- \u4E3A\u9AD8\u98CE\u9669/\u9AD8\u56DE\u62A5\u4E3E\u63AA\u6DFB\u52A0\u201C\u6218\u7565\u62BC\u6CE8\u201D\u9AD8\u4EAE`,
>>>>>>> origin/figsci_1209
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
<<<<<<< HEAD
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
=======
    estimatedTime: "12 \u5206\u949F",
    prompt: `\u521B\u5EFA\u8BBE\u8BA1\u7CFB\u7EDF\u5DE5\u4F5C\u6D41\uFF1A
- \u57FA\u7840\u5C42\uFF1A
  - \u8BBE\u8BA1\u4EE4\u724C\uFF1A\u989C\u8272\u3001\u6392\u7248\u3001\u95F4\u8DDD\u3001\u9634\u5F71
  - \u6307\u5357\uFF1A\u65E0\u969C\u788D\u3001\u8BED\u6C14\u3001\u539F\u5219
- \u7EC4\u4EF6\u5C42\uFF1A
  - \u539F\u5B50\uFF1A\u6309\u94AE\u3001\u8F93\u5165\u6846\u3001\u56FE\u6807\u3001\u5FBD\u7AE0
  - \u5206\u5B50\uFF1A\u8868\u5355\u5B57\u6BB5\u3001\u5361\u7247\u6807\u9898\u3001\u641C\u7D22\u680F
  - \u7EC4\u7EC7\uFF1A\u5BFC\u822A\u3001\u8868\u5355\u3001\u6570\u636E\u8868
- \u6587\u6863\uFF1A
  - Storybook \u2192 \u7EC4\u4EF6\u89C4\u8303 \u2192 \u4F7F\u7528\u6307\u5357 \u2192 \u4EE3\u7801\u793A\u4F8B
- \u8D21\u732E\u6D41\u7A0B\uFF1A
  - \u8BBE\u8BA1\u5E08\u63D0\u8BAE\u65B0\u7EC4\u4EF6 \u2192 \u8BBE\u8BA1\u8BC4\u5BA1 \u2192 \u539F\u578B
  - \u5DE5\u7A0B\u5E08\u6784\u5EFA \u2192 \u4EE3\u7801\u5BA1\u67E5 \u2192 \u6D4B\u8BD5 \u2192 \u53D1\u5E03\u5230 npm
  - \u66F4\u65B0 Figma \u5E93 \u2192 \u66F4\u65B0 Storybook \u2192 \u901A\u77E5\u56E2\u961F
- \u6D88\u8D39\u5DE5\u4F5C\u6D41\uFF1A
  - \u4EA7\u54C1\u56E2\u961F\u8BF7\u6C42\u7EC4\u4EF6 \u2192 \u5148\u68C0\u67E5\u5E93
  - \u627E\u5230\uFF1A\u4F7F\u7528\u73B0\u6709 \u2192 \u901A\u8FC7 props \u81EA\u5B9A\u4E49
  - \u672A\u627E\u5230\uFF1A\u63D0\u4EA4\u8BF7\u6C42 \u6216 \u6784\u5EFA\u81EA\u5B9A\u4E49\uFF08\u9700\u8BC4\u5BA1\uFF09
- \u6CF3\u9053\uFF1A\u8BBE\u8BA1\u56E2\u961F\u3001\u5DE5\u7A0B\u3001\u4EA7\u54C1\u56E2\u961F
- \u663E\u793A\u6539\u8FDB\u7684\u53CD\u9988\u5FAA\u73AF`,
>>>>>>> origin/figsci_1209
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
<<<<<<< HEAD
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
=======
    estimatedTime: "10 \u5206\u949F",
    prompt: `\u521B\u5EFA\u5206\u6790\u4EEA\u8868\u677F\u6570\u636E\u6D41\uFF1A
- \u6570\u636E\u6E90\uFF1A
  - \u5E94\u7528\u6570\u636E\u5E93 \u2192 ETL \u6D41\u6C34\u7EBF \u2192 \u6570\u636E\u4ED3\u5E93
  - \u4E8B\u4EF6\u8DDF\u8E2A \u2192 \u5B9E\u65F6\u6D41 \u2192 \u5206\u6790\u6570\u636E\u5E93
  - \u5916\u90E8 API \u2192 \u7F13\u5B58\u5C42 \u2192 \u805A\u5408\u670D\u52A1
- \u5904\u7406\u5C42\uFF1A
  - \u8BA1\u5212\u4EFB\u52A1\uFF1A\u6BCF\u65E5/\u6BCF\u5468/\u6BCF\u6708\u805A\u5408
  - \u5B9E\u65F6\u5904\u7406\uFF1A\u7528\u6237\u4F1A\u8BDD\u3001\u5B9E\u65F6\u6307\u6807
- \u4EEA\u8868\u677F\u7EC4\u4EF6\uFF1A
  - KPI \u5361\u7247\uFF1A\u7528\u6237\u3001\u6536\u5165\u3001\u8F6C\u5316\u7387\u3001\u6D41\u5931\u7387
  - \u56FE\u8868\uFF1A\u65F6\u95F4\u5E8F\u5217\uFF08\u6298\u7EBF\uFF09\u3001\u5206\u5E03\uFF08\u67F1\u72B6\uFF09\u3001\u7FA4\u7EC4\uFF08\u70ED\u56FE\uFF09
  - \u8FC7\u6EE4\u5668\uFF1A\u65E5\u671F\u8303\u56F4\u3001\u7EC6\u5206\u3001\u5730\u533A\u3001\u5E73\u53F0
- \u4EA4\u4E92\u6D41\u7A0B\uFF1A
  - \u7528\u6237\u9009\u62E9\u8FC7\u6EE4\u5668 \u2192 \u67E5\u8BE2\u6784\u5EFA\u5668 \u2192 \u7F13\u5B58\u68C0\u67E5
  - \u7F13\u5B58\u547D\u4E2D\uFF1A\u8FD4\u56DE\u7F13\u5B58\u6570\u636E\uFF08\u5FEB\u901F\u8DEF\u5F84\uFF09
  - \u7F13\u5B58\u672A\u547D\u4E2D\uFF1A\u67E5\u8BE2\u6570\u636E\u5E93 \u2192 \u8F6C\u6362\u6570\u636E \u2192 \u66F4\u65B0\u7F13\u5B58 \u2192 \u8FD4\u56DE
- \u5305\u542B\u5EF6\u8FDF SLA\u3001\u5237\u65B0\u7B56\u7565\u3001\u4E0B\u94BB\u8DEF\u5F84
- \u6DFB\u52A0\u6570\u636E\u8D28\u91CF\u68C0\u67E5\u70B9`,
>>>>>>> origin/figsci_1209
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
<<<<<<< HEAD
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
=======
    estimatedTime: "5 \u5206\u949F",
    prompt: `\u521B\u5EFA\u4F1A\u8BAE\u51B3\u7B56\u6D41\u7A0B\uFF1A
- \u8BAE\u7A0B\u5BA1\u67E5 \u2192 \u8BA8\u8BBA \u2192 \u51B3\u7B56\u70B9
- \u51B3\u7B56\u7ED3\u679C\uFF1A
  - \u6279\u51C6\uFF1A\u521B\u5EFA\u884C\u52A8\u9879 \u2192 \u5206\u914D\u8D1F\u8D23\u4EBA \u2192 \u8BBE\u5B9A\u622A\u6B62\u65E5\u671F
  - \u9700\u8981\u66F4\u591A\u4FE1\u606F\uFF1A\u5B89\u6392\u540E\u7EED\u8DDF\u8FDB \u2192 \u5206\u914D\u7814\u7A76\u4EFB\u52A1
  - \u62D2\u7EDD\uFF1A\u8BB0\u5F55\u539F\u56E0 \u2192 \u5F52\u6863
- \u5E76\u884C\u8F68\u9053\uFF1A\u4F1A\u8BAE\u8BB0\u5F55 \u2192 \u4E0E\u5229\u76CA\u76F8\u5173\u8005\u5206\u4EAB
- \u4F1A\u8BAE\u540E\uFF1A\u8DDF\u8E2A\u884C\u52A8\u9879 \u2192 \u5728\u622A\u6B62\u65E5\u671F\u524D\u53D1\u9001\u63D0\u9192
- \u4F7F\u7528\u6CF3\u9053\u8868\u793A\u89D2\u8272\uFF1A\u5F15\u5BFC\u8005\u3001\u53C2\u4E0E\u8005\u3001\u884C\u52A8\u8D1F\u8D23\u4EBA
- \u5305\u542B\u51B3\u7B56\u6807\u51C6\u548C\u6295\u7968\u673A\u5236
- \u6DFB\u52A0\u540E\u7EED\u8DDF\u8E2A\u5FAA\u73AF`,
>>>>>>> origin/figsci_1209
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
