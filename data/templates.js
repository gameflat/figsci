const DIAGRAM_TEMPLATES = [
  // 1. Employee Onboarding Flow
  {
    id: "employee-onboarding",
    title: "新员工入职流程",
    description: "新员工入职流程，从Offer到正式开始工作",
    category: "business",
    tags: ["人力资源", "入职", "流程"],
    difficulty: "beginner",
    isPopular: true,
    icon: "UserPlus",
    gradient: {
      from: "#3b82f6",
      to: "#1d4ed8"
    },
    estimatedTime: "5 分钟",
    usageCount: 1247,
    rating: 4.8,
    author: "Figsci 团队",
    useCases: [
      "人力资源部门标准化入职流程",
      "跨部门协作入职项目管理",
      "新员工入职体验优化",
      "远程入职流程设计"
    ],
    features: [
      "完整的入职时间线规划",
      "多部门协作泳道设计",
      "关键决策点标注",
      "自动化任务提醒节点"
    ],
    prompt: `创建一个新员工入职流程图，从接受Offer到第一天上班：
- 入职前：背景调查 → 签署合同 → IT设备申请
- 第一天：欢迎会 → 办公室参观 → 设备设置 → 权限开通
- 第一周：团队介绍 → 培训课程 → 目标设定
- 泳道：HR、IT、经理、新员工
- 决策点：背景调查通过/失败、设备准备好 是/否
- 使用柔和的蓝/绿色调，清晰的时间线指示
- 保持整洁专业，适当的间距`,
    brief: {
      intent: "draft",
      tone: "balanced",
      focus: ["flow", "clarity"],
      diagramTypes: ["activity"]
    }
  },
  // 2. API Request/Response Flow
  {
    id: "api-flow",
    title: "API 请求/响应流程",
    description: "API调用的完整生命周期，包含认证、请求、响应",
    category: "development",
    tags: ["API", "后端", "集成"],
    difficulty: "intermediate",
    isPopular: true,
    icon: "Workflow",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "10 分钟",
    usageCount: 892,
    rating: 4.7,
    author: "DevOps 团队",
    useCases: [
      "API文档可视化",
      "微服务架构设计",
      "系统集成方案展示",
      "开发团队技术培训"
    ],
    features: [
      "完整的请求-响应时序图",
      "多层认证流程展示",
      "错误处理路径标注",
      "性能指标可视化"
    ],
    prompt: `创建API请求/响应时序图：
- 参与者：客户端、API网关、认证服务、后端服务、数据库
- 流程：
  1. 客户端 → API网关：POST /api/users (带JWT令牌)
  2. API网关 → 认证服务：验证令牌
  3. 认证服务 → API网关：令牌有效 (200 OK)
  4. API网关 → 后端服务：转发请求
  5. 后端服务 → 数据库：查询用户数据
  6. 数据库 → 后端服务：返回结果
  7. 后端服务 → API网关：响应载荷
  8. API网关 → 客户端：200 OK 带数据
- 添加错误路径：无效令牌 (401)、服务超时 (504)
- 包含请求/响应头、延迟指示器
- 使用带有生命线的时序图风格`,
    brief: {
      intent: "draft",
      tone: "enterprise",
      focus: ["flow", "clarity"],
      diagramTypes: ["sequence"]
    }
  },
  // 3. Business Decision Tree
  {
    id: "decision-tree",
    title: "商业决策树",
    description: "商业决策流程，包含多个决策节点和结果评估",
    category: "business",
    tags: ["战略", "决策", "分析"],
    difficulty: "intermediate",
    isPopular: true,
    icon: "GitBranch",
    gradient: {
      from: "#3b82f6",
      to: "#1d4ed8"
    },
    estimatedTime: "10 分钟",
    usageCount: 1056,
    rating: 4.6,
    author: "战略团队",
    useCases: [
      "战略规划决策分析",
      "投资项目评估",
      "市场进入策略制定",
      "风险管理框架设计"
    ],
    features: [
      "多层级决策树结构",
      "概率权重计算",
      "结果可视化评分",
      "风险等级色彩编码"
    ],
    prompt: `创建一个商业决策树，主题为“是否在市场推出新产品？”：
- 根决策：市场规模 > $10M？(是/否)
- 分支 1 (是)：竞争程度？(高/中/低)
  - 高：ROI计算 → 进行/放弃
  - 中：风险评估 → 进行/放弃
  - 低：快速通道发布
- 分支 2 (否)：替代市场分析
- 包含概率百分比、预期结果
- 使用矩形决策节点，菱形表示问题
- 结果颜色编码：绿色 (进行)、红色 (放弃)、黄色 (复审)
- 添加清晰的标签和决策标准`,
    brief: {
      intent: "draft",
      tone: "enterprise",
      focus: ["hierarchy", "clarity"],
      diagramTypes: ["activity"]
    }
  },
  // 4. Customer Journey Map
  {
    id: "customer-journey",
    title: "客户旅程地图",
    description: "客户体验旅程，包含阶段、触点、情绪曲线",
    category: "business",
    tags: ["客户体验", "旅程", "触点"],
    difficulty: "intermediate",
    icon: "Route",
    gradient: {
      from: "#3b82f6",
      to: "#1d4ed8"
    },
    estimatedTime: "10 分钟",
    prompt: `为SaaS产品创建客户旅程地图：
- 阶段：认知 → 考虑 → 购买 → 入职 → 留存
- 每个阶段：
  - 客户行为（例如，“搜索解决方案”，“阅读评论”）
  - 触点（例如，“谷歌广告”，“产品网站”，“电子邮件”）
  - 情绪（积极/中性/消极指标）
  - 痛点（用红色突出显示）
  - 机会（用绿色突出显示）
- 在所有阶段添加情绪曲线
- 使用时间线可视化，友好的图标
- 保持多彩但专业`,
    brief: {
      intent: "draft",
      tone: "playful",
      focus: ["flow", "hierarchy"],
      diagramTypes: ["journey"]
    }
  },
  // 5. Agile Sprint Workflow
  {
    id: "agile-sprint",
    title: "敏捷 Sprint 工作流",
    description: "Scrum敏捷开发的完整Sprint流程",
    category: "development",
    tags: ["敏捷", "Scrum", "Sprint"],
    difficulty: "beginner",
    icon: "Repeat",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "8 分钟",
    prompt: `创建敏捷 Sprint 工作流（2周周期）：
- Sprint 规划：Backlog 梳理 → 故事选择 → 任务分解 → 容量规划
- 日常活动：每日站会 → 开发 → 代码审查 → 测试
- Sprint 仪式时间线：
  - 第一天：Sprint 规划（2-4小时）
  - 每日：站会（15分钟）
  - Sprint 中期：Backlog 梳理
  - 最后一天：Sprint 评审 → Sprint 回顾
- 交付物：潜在可发布增量
- 泳道：PO、Scrum Master、开发团队、QA
- 包含速度跟踪、燃尽图参考
- 使用迭代流程可视化`,
    brief: {
      intent: "draft",
      tone: "balanced",
      focus: ["flow", "hierarchy"],
      diagramTypes: ["activity"]
    }
  },
  // 6. Bug Triage Process
  {
    id: "bug-triage",
    title: "Bug 处理流程",
    description: "Bug处理流程，从报告到修复验证",
    category: "development",
    tags: ["QA", "Bug 追踪", "流程"],
    difficulty: "beginner",
    icon: "Bug",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "8 分钟",
    prompt: `创建 Bug 处理工作流：
- 报告：用户/QA 报告 Bug → 自动创建工单
- 分流：QA 负责人审核
  - 重复？→ 关闭并链接到原始工单
  - 有效 Bug？→ 继续
- 严重程度评估：
  - 严重 (P0)：立即修复，升级到待命状态
  - 高 (P1)：分配到当前 Sprint
  - 中 (P2)：添加到 Backlog
  - 低 (P3)：添加到技术债务列表
- 分配：按组件自动分配 → 工程师认领
- 开发：修复 → 创建 PR → 代码审查 → 合并
- 验证：部署到 Staging → QA 验证 → 部署到生产
- 关闭：在生产环境验证 → 更新工单 → 通知报告人
- 泳道：报告人、QA 负责人、工程、DevOps
- 按优先级颜色编码`,
    brief: {
      intent: "draft",
      tone: "balanced",
      focus: ["flow", "clarity"],
      diagramTypes: ["activity"]
    }
  },
  // 7. Git Branching Strategy
  {
    id: "git-branching",
    title: "Git 分支策略",
    description: "Git工作流，包含feature、develop、release、hotfix分支",
    category: "development",
    tags: ["Git", "版本控制", "DevOps"],
    difficulty: "intermediate",
    isPopular: true,
    icon: "GitBranch",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "10 分钟",
    prompt: `创建 Git 分支策略图 (Gitflow)：
- 主要分支：main (生产), develop (集成)
- 支持分支：
  - Feature 分支：从 develop 分出 → 合并回 develop
  - Release 分支：从 develop 分出 → 合并到 main + develop
  - Hotfix 分支：从 main 分出 → 合并到 main + develop
- 典型流程：
  1. 从 develop 创建 feature/new-feature
  2. 开发 → 提交 → 推送
  3. Pull Request → 代码审查 → 合并到 develop
  4. 从 develop 创建 release/v1.2.0
  5. 测试 → Bug 修复 → 合并到 main
  6. 打标签 v1.2.0 → 部署
- 使用不同颜色区分分支类型，显示合并方向
- 为每种分支类型添加清晰标签
- 包含时间线/顺序指示器`,
    brief: {
      intent: "draft",
      tone: "enterprise",
      focus: ["flow", "hierarchy"],
      diagramTypes: ["activity"]
    }
  },
  // 8. Approval Workflow
  {
    id: "approval-workflow",
    title: "审批工作流",
    description: "多层级审批流程，适用于采购、请假、报销等场景",
    category: "business",
    tags: ["工作流", "审批", "流程"],
    difficulty: "beginner",
    icon: "CheckCircle",
    gradient: {
      from: "#3b82f6",
      to: "#1d4ed8"
    },
    estimatedTime: "5 分钟",
    prompt: `创建一个多层级采购申请审批工作流：
- 开始：员工提交申请
- 决策 1：金额 < $1,000？
  - 是：直接经理审批 → 结束
  - 否：继续到决策 2
- 决策 2：金额 < $10,000？
  - 是：部门主管审批 → 财务审核 → 结束
  - 否：VP 审批 → CFO 审批 → CEO 审批 → 结束
- 每个审批都可以拒绝（退回给员工）或批准（继续）
- 泳道：员工、经理、部门主管、财务、高管
- 为紧急请求添加并行路径
- 颜色编码：绿色表示批准，红色表示拒绝，黄色表示待定
- 包含清晰的决策标准和审批限额`,
    brief: {
      intent: "draft",
      tone: "balanced",
      focus: ["flow", "clarity"],
      diagramTypes: ["activity"]
    }
  },
  // 9. CI/CD Pipeline
  {
    id: "cicd-pipeline",
    title: "CI/CD 流水线",
    description: "持续集成/持续部署流水线，从代码提交到生产发布",
    category: "development",
    tags: ["CI/CD", "DevOps", "自动化"],
    difficulty: "advanced",
    icon: "Zap",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "15 分钟",
    prompt: `创建一个全面的 CI/CD 流水线：
- 触发：Git 推送到 main 分支
- CI 阶段：
  - 检出代码
  - 安装依赖
  - 运行 Lint 检查
  - 运行单元测试（并行）
  - 运行集成测试（并行）
  - 构建制品
  - 安全扫描 (SAST/DAST)
- CD 阶段：
  - 部署到 Staging 环境
  - 运行冒烟测试
  - 手动批准门禁
  - 部署到生产环境（蓝绿部署）
  - 健康检查
  - 回滚能力
- 包含成功/失败路径，通知步骤
- 尽可能显示并行执行
- 为每个工具添加图标（Jenkins, Docker, K8s 等）
- 按状态颜色编码阶段`,
    brief: {
      intent: "draft",
      tone: "enterprise",
      focus: ["flow", "clarity"],
      diagramTypes: ["activity"]
    }
  },
  // 10. Organizational Chart
  {
    id: "org-chart",
    title: "组织架构图",
    description: "公司组织架构图，展示层级关系和汇报线",
    category: "business",
    tags: ["组织架构", "结构", "层级"],
    difficulty: "beginner",
    icon: "Building",
    gradient: {
      from: "#3b82f6",
      to: "#1d4ed8"
    },
    estimatedTime: "5 分钟",
    prompt: `为科技初创公司创建一个清晰的组织架构图：
- CEO 在顶部
- C-Level：CTO, CPO, CFO, CMO (向 CEO 汇报)
- 工程 (CTO 下)：前端团队、后端团队、DevOps 团队
- 产品 (CPO 下)：产品经理、设计师、研究员
- 财务 (CFO 下)：会计、FP&A
- 市场 (CMO 下)：增长、内容、品牌
- 使用层级树布局，一致的间距
- 按部门颜色编码，显示每个团队的人数
- 添加清晰的汇报线
- 保持专业和平衡`,
    brief: {
      intent: "draft",
      tone: "enterprise",
      focus: ["hierarchy", "clarity"],
      diagramTypes: ["component"]
    }
  },
  // 11. Mind Map (Brainstorming)
  {
    id: "mindmap-brainstorm",
    title: "头脑风暴思维导图",
    description: "发散思维导图，用于头脑风暴和创意整理",
    category: "creative",
    tags: ["头脑风暴", "构思", "创意"],
    difficulty: "beginner",
    isNew: true,
    icon: "Lightbulb",
    gradient: {
      from: "#f59e0b",
      to: "#d97706"
    },
    estimatedTime: "5 分钟",
    prompt: `为“产品创新点子”创建一个头脑风暴思维导图：
- 中心节点：“2025年产品创新”
- 主要分支（第1层）：
  - 新功能
  - 用户体验
  - 商业模式
  - 技术栈
  - 营销渠道
- 子分支（第2-3层）：
  - 新功能：
    - AI推荐 → 个性化引擎
    - 社交分享 → 病毒式传播
    - 移动应用 → 离线模式
  - 用户体验：
    - 入职重设计 → 交互式教程
    - 无障碍 → 屏幕阅读器支持
    - 性能 → 亚秒级加载
  - 商业模式：
    - 免费增值层 → 功能对比
    - 企业计划 → 自定义SLA
    - 市场 → 收入分成
- 使用有机形状，多样的颜色，有趣的图标
- 为高优先级点子添加“热门”指示器
- 包含跨分支相关点子之间的连接`,
    brief: {
      intent: "draft",
      tone: "playful",
      focus: ["hierarchy", "flow"],
      diagramTypes: ["mindmap"]
    }
  },
  // 12. Product Development Lifecycle
  {
    id: "product-lifecycle",
    title: "产品开发生命周期",
    description: "产品从概念到发布的完整生命周期",
    category: "product",
    tags: ["产品", "生命周期", "开发"],
    difficulty: "intermediate",
    icon: "Package",
    gradient: {
      from: "#ec4899",
      to: "#be185d"
    },
    estimatedTime: "12 分钟",
    prompt: `创建产品开发生命周期：
- 发现阶段：
  - 市场调研 → 用户访谈 → 竞品分析
  - 问题验证：这是真正的问题吗？(是/否)
- 定义阶段：
  - 用户画像 → 用户故事 → 功能优先级
  - PRD 创建 → 设计规范 → 技术规范
- 设计阶段：
  - 线框图 → 视觉稿 → 原型 → 可用性测试
  - 设计批准门禁
- 开发阶段：
  - Sprint 规划 → 敏捷开发 → QA 测试
- 发布阶段：
  - Beta 测试 → 反馈收集 → 生产发布
  - 营销活动 → 用户入职
- 增长阶段：
  - 分析监控 → A/B 测试 → 功能迭代
- 包含从每个阶段回到发现阶段的反馈循环
- 添加决策门禁和质量检查点
- 按阶段类型颜色编码`,
    brief: {
      intent: "draft",
      tone: "balanced",
      focus: ["flow", "hierarchy"],
      diagramTypes: ["activity"]
    }
  },
  // 13. Microservices Communication
  {
    id: "microservices",
    title: "微服务通信",
    description: "微服务架构的服务间通信模式",
    category: "development",
    tags: ["微服务", "架构", "通信"],
    difficulty: "advanced",
    icon: "Network",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "15 分钟",
    prompt: `创建微服务通信图：
- 服务：API 网关、用户服务、订单服务、支付服务、通知服务、库存服务
- 通信模式：
  - 同步：REST API 调用（实线）
  - 异步：消息队列（虚线）
  - 事件驱动：事件总线（点线）
- 示例流程：
  1. 客户端 → API 网关 → 订单服务
  2. 订单服务 → 支付服务（同步 REST）
  3. 订单服务 → 库存服务（同步 REST）
  4. 订单服务 → 消息队列 → 通知服务（异步）
  5. 支付服务 → 事件总线 → 分析服务（事件）
- 显示协议（HTTP, gRPC, RabbitMQ, Kafka）
- 包含服务注册、负载均衡、断路器模式
- 按通信类型颜色编码
- 添加延迟指示器`,
    brief: {
      intent: "draft",
      tone: "enterprise",
      focus: ["flow", "hierarchy"],
      diagramTypes: ["component"]
    }
  },
  // 14. User Story Mapping
  {
    id: "user-story-mapping",
    title: "用户故事地图",
    description: "用户故事地图，按用户旅程组织功能需求",
    category: "product",
    tags: ["敏捷", "用户故事", "规划"],
    difficulty: "intermediate",
    icon: "Map",
    gradient: {
      from: "#ec4899",
      to: "#be185d"
    },
    estimatedTime: "10 分钟",
    prompt: `为在线购物应用创建用户故事地图：
- 用户活动（顶层，从左到右）：
  - 浏览商品 → 搜索 → 查看详情 → 加入购物车 → 结账 → 跟踪订单
- 用户任务（每个活动下方）：
  - 浏览：按类别筛选、按价格排序、查看推荐
  - 搜索：关键词搜索、语音搜索、条形码扫描
  - 查看详情：阅读描述、查看评论、查看相关商品
  - 加入购物车：选择数量、选择变体、保存以备后用
  - 结账：输入送货信息、选择付款方式、应用优惠券
  - 跟踪：查看状态、联系支持、申请退货
- 优先级级别（垂直）：
  - MVP（顶行，必须有）
  - Release 2（中间行）
  - Future（底行，最好有）
- 使用便利贴风格，按优先级颜色编码
- 保持组织有序，易于扫描`,
    brief: {
      intent: "draft",
      tone: "playful",
      focus: ["hierarchy", "flow"],
      diagramTypes: ["mindmap"]
    }
  },
  // 15. Incident Response Runbook
  {
    id: "incident-response",
    title: "事件响应运行手册",
    description: "安全事件响应流程，从检测到恢复",
    category: "security",
    tags: ["安全", "事件", "SRE"],
    difficulty: "advanced",
    icon: "Shield",
    gradient: {
      from: "#10b981",
      to: "#059669"
    },
    estimatedTime: "15 分钟",
    prompt: `创建事件响应运行手册：
- 检测阶段：
  - 监控警报触发 或 用户报告
  - 待命工程师收到传呼
  - 初始评估：严重程度 (P0/P1/P2/P3)
- 分流阶段：
  - P0 (严重)：组建作战室，通知高管
  - P1 (高)：指派事件指挥官，创建事件频道
  - P2/P3：标准待命处理
- 调查：
  - 收集日志 → 识别根本原因 → 评估影响范围
  - 并行：客户沟通，状态页更新
- 遏制：
  - 隔离受影响系统 → 实施临时修复
  - 决策：我们可以就地修补 还是 需要回滚？
- 解决：
  - 部署修复 → 在 Staging 验证 → 推出到生产
  - 监控关键指标 → 确认解决
- 事后总结：
  - 撰写事件报告 → 无责审查 → 行动项
  - 更新运行手册 → 分享经验
- 泳道：待命人员、事件指挥官、工程、沟通、领导层
- 包含升级路径、沟通模板
- 按严重程度颜色编码`,
    brief: {
      intent: "draft",
      tone: "enterprise",
      focus: ["flow", "clarity"],
      diagramTypes: ["activity"]
    }
  },
  // 16. Network Architecture
  {
    id: "network-architecture",
    title: "网络架构",
    description: "企业网络拓扑，包含DMZ、防火墙、VPC等",
    category: "security",
    tags: ["网络", "基础设施", "安全"],
    difficulty: "advanced",
    icon: "Server",
    gradient: {
      from: "#10b981",
      to: "#059669"
    },
    estimatedTime: "15 分钟",
    prompt: `创建企业网络架构：
- 外部区域（互联网）：
  - 用户 → CDN → WAF → 负载均衡器
- DMZ（非军事区）：
  - 面向公众的 Web 服务器
  - 反向代理 / API 网关
  - 防火墙规则：仅开放端口 80/443
- 内部区域（私有 VPC）：
  - 应用服务器（私有子网）
  - 数据库集群（隔离子网）
  - 内部服务（消息队列、缓存）
- 管理区域：
  - 堡垒机（跳板机）
  - 监控和日志服务器
  - 管理员工作站
- 安全层：
  - 每个区域之间的防火墙
  - 用于远程访问的 VPN
  - IDS/IPS 传感器
  - 使用 VLAN 进行网络分段
- 显示 IP 范围、安全组、流量箭头
- 包含备份/容灾站点连接
- 使用专业的网络图符号`,
    brief: {
      intent: "draft",
      tone: "enterprise",
      focus: ["hierarchy", "clarity"],
      diagramTypes: ["deployment"]
    }
  },
  // 17. Feature Release Process
  {
    id: "feature-release",
    title: "功能发布流程",
    description: "新功能发布的完整流程，从开发到上线",
    category: "development",
    tags: ["发布", "功能", "部署"],
    difficulty: "intermediate",
    icon: "Rocket",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "10 分钟",
    prompt: `创建功能发布流程：
- 开发阶段：
  - 功能规划 → 设计评审 → 开发 → 代码审查
- 测试阶段：
  - 单元测试 → 集成测试 → QA 测试
  - 决策：通过/失败（如果失败，返回开发）
- 预发布：
  - 功能标志配置
  - 部署到 Staging → 利益相关者演示 → 反馈
- 发布：
  - 逐步推出：5% → 25% → 50% → 100%
  - 在每个阶段监控指标
  - 决策点：继续/暂停/回滚
- 发布后：
  - 用户反馈收集 → 分析审查 → 迭代规划
- 泳道：PM、工程、QA、DevOps、支持
- 包含回滚程序
- 添加监控检查点`,
    brief: {
      intent: "draft",
      tone: "balanced",
      focus: ["flow", "clarity"],
      diagramTypes: ["activity"]
    }
  },
  // 18. SWOT to Action Plan
  {
    id: "swot-analysis",
    title: "SWOT 转行动计划",
    description: "SWOT分析转化为可执行的行动计划",
    category: "business",
    tags: ["战略", "规划", "分析"],
    difficulty: "intermediate",
    icon: "Target",
    gradient: {
      from: "#3b82f6",
      to: "#1d4ed8"
    },
    estimatedTime: "10 分钟",
    prompt: `创建一个 SWOT 分析并转化为行动计划：
- 四个象限：优势、劣势、机会、威胁
- 每个象限有 3-4 个项目
- 中心：战略目标
- 从 SWOT 到行动的连接：
  - 优势 + 机会 → 增长战略
  - 优势 + 威胁 → 防御战略
  - 劣势 + 机会 → 改进领域
  - 劣势 + 威胁 → 应急计划
- 使用颜色编码，为每个行动添加清晰标签
- 添加优先级指示器（高/中/低）
- 保持战略性和可操作性
- 包含时间线估计`,
    brief: {
      intent: "draft",
      tone: "enterprise",
      focus: ["hierarchy", "clarity"],
      diagramTypes: ["mindmap"]
    }
  },
  // 19. A/B Test Planning
  {
    id: "ab-testing",
    title: "A/B 测试规划",
    description: "A/B测试设计，包含假设、变量、成功指标",
    category: "product",
    tags: ["测试", "实验", "分析"],
    difficulty: "intermediate",
    icon: "TestTube",
    gradient: {
      from: "#ec4899",
      to: "#be185d"
    },
    estimatedTime: "10 分钟",
    prompt: `创建 A/B 测试规划流程：
- 假设：“将 CTA 按钮颜色从蓝色改为绿色将使转化率提高 15%”
- 测试设置：
  - 对照组 (50%)：蓝色按钮
  - 实验组 (50%)：绿色按钮
  - 样本量计算：每个变体需要 10,000 名用户
  - 持续时间：运行 2 周
- 指标：
  - 主要：转化率 (%)
  - 次要：点击率、页面停留时间、跳出率
- 实施：
  - 功能标志设置 → 流量分割 → 事件跟踪
- 监控：
  - 每日检查 → 统计显著性测试 → 提前停止规则
- 分析：
  - 计算提升 → 置信区间 → P 值
  - 决策：发布获胜者 / 继续测试 / 迭代
- 推出：逐步部署获胜者
- 包含边缘情况的决策树（例如，没有明显的获胜者，负面结果）`,
    brief: {
      intent: "draft",
      tone: "balanced",
      focus: ["clarity", "hierarchy"],
      diagramTypes: ["activity"]
    }
  },
  // 20. Database Schema Design
  {
    id: "database-schema",
    title: "数据库架构设计",
    description: "数据库关系模型，包含表、字段、关系",
    category: "development",
    tags: ["数据库", "ERD", "架构"],
    difficulty: "intermediate",
    icon: "Database",
    gradient: {
      from: "#8b5cf6",
      to: "#6d28d9"
    },
    estimatedTime: "10 分钟",
    prompt: `创建一个电子商务数据库架构 (ERD)：
- 表：
  - Users: id (PK), email, password_hash, created_at
  - Products: id (PK), name, description, price, inventory
  - Orders: id (PK), user_id (FK), status, total_amount, created_at
  - OrderItems: id (PK), order_id (FK), product_id (FK), quantity, price
  - Categories: id (PK), name, parent_id (FK - 自引用)
  - Reviews: id (PK), product_id (FK), user_id (FK), rating, comment
- 关系：
  - Users 1:N Orders
  - Orders 1:N OrderItems
  - Products 1:N OrderItems
  - Products 1:N Reviews
  - Users 1:N Reviews
  - Categories 1:N Products (通过连接表多对多)
- 显示 PK/FK、数据类型、索引、约束
- 使用标准 ERD 符号
- 添加基数标签`,
    brief: {
      intent: "draft",
      tone: "enterprise",
      focus: ["hierarchy", "clarity"],
      diagramTypes: ["component"]
    }
  },
  // 21. Security Audit Flow
  {
    id: "security-audit",
    title: "安全审计流程",
    description: "安全审计流程，从范围定义到报告发布",
    category: "security",
    tags: ["安全", "审计", "合规"],
    difficulty: "intermediate",
    icon: "ShieldCheck",
    gradient: {
      from: "#10b981",
      to: "#059669"
    },
    estimatedTime: "10 分钟",
    prompt: `创建安全审计工作流：
- 规划阶段：
  - 定义审计范围 → 选择框架（SOC2, ISO27001 等）
  - 创建审计清单 → 安排访谈
- 数据收集：
  - 文档审查：政策、程序、架构图
  - 技术扫描：漏洞扫描、渗透测试、代码审查
  - 访谈：IT 团队、安全团队、管理层
- 评估：
  - 控制评估：有效 / 需要改进 / 无效
  - 风险评级：严重 / 高 / 中 / 低
  - 证据收集：截图、日志、配置
- 发现：
  - 识别差距 → 映射到合规要求
  - 建议补救措施 → 按风险确定优先级
- 报告：
  - 起草审计报告 → 与利益相关者审查 → 定稿
  - 向领导层演示 → 发布正式报告
- 补救跟踪：
  - 创建行动计划 → 分配负责人 → 设定截止日期
  - 后续审计 → 验证关闭
- 泳道：审计员、IT/安全团队、管理层`,
    brief: {
      intent: "draft",
      tone: "enterprise",
      focus: ["flow", "clarity"],
      diagramTypes: ["activity"]
    }
  },
  // 22. Access Control Matrix
  {
    id: "access-control",
    title: "访问控制矩阵",
    description: "基于角色的访问控制(RBAC)权限矩阵",
    category: "security",
    tags: ["安全", "RBAC", "权限"],
    difficulty: "intermediate",
    icon: "Lock",
    gradient: {
      from: "#10b981",
      to: "#059669"
    },
    estimatedTime: "10 分钟",
    prompt: `创建 RBAC 访问控制矩阵：
- 角色（行）：
  - 管理员：完全系统访问权限
  - 经理：部门级访问权限
  - 开发人员：代码和开发环境访问权限
  - 分析师：只读数据访问权限
  - 访客：有限的公共访问权限
- 资源（列）：
  - 用户管理、配置、代码仓库、生产数据库
  - Staging 环境、分析仪表板、财务报告、审计日志
- 权限（单元格）：
  - C (创建)、R (读取)、U (更新)、D (删除)、X (执行)
- 矩阵布局：
  - 管理员：所有资源的 CRUDX
  - 经理：部门资源的 CRUD，其他资源的 R
  - 开发人员：代码/Staging 的 CRUDX，生产环境的 R
  - 分析师：分析/报告的 R，无配置访问权限
  - 访客：仅公共资源的 R
- 包含审批工作流：
  - 提升权限请求 → 经理批准 → 限时授权
  - 显示角色之间的继承关系
- 颜色编码：绿色（允许）、红色（拒绝）、黄色（需要批准）`,
    brief: {
      intent: "draft",
      tone: "enterprise",
      focus: ["hierarchy", "clarity"],
      diagramTypes: ["component"]
    }
  },
  // 23. Workshop Facilitation
  {
    id: "workshop-facilitation",
    title: "工作坊引导流程",
    description: "工作坊流程设计，包含破冰、活动、产出",
    category: "creative",
    tags: ["工作坊", "引导", "协作"],
    difficulty: "intermediate",
    icon: "Users",
    gradient: {
      from: "#f59e0b",
      to: "#d97706"
    },
    estimatedTime: "10 分钟",
    prompt: `创建一个 2 小时的工作坊引导流程：
- 准备工作（工作坊前）：
  - 发送议程 → 准备材料 → 设置工具（Miro, Zoom）
- 介绍（15 分钟）：
  - 欢迎与背景 → 破冰活动 → 审查目标
- 活动 1：问题界定（30 分钟）：
  - 个人头脑风暴（5 分钟）→ 结对分享（10 分钟）→ 小组讨论（15 分钟）
  - 产出：问题陈述
- 休息（10 分钟）
- 活动 2：解决方案构思（40 分钟）：
  - 疯狂 8 分钟快速草图 → 想法投票 → 收敛到前 3 名
  - 产出：解决方案概念
- 活动 3：行动计划（20 分钟）：
  - 确定后续步骤 → 分配负责人 → 设定时间表
  - 产出：行动计划
- 总结（5 分钟）：
  - 回顾关键决策 → 分享成果 → 安排后续跟进
- 包含引导者提示、时间提示、备用活动
- 显示虚拟与面对面变化的并行轨道`,
    brief: {
      intent: "draft",
      tone: "playful",
      focus: ["flow", "clarity"],
      diagramTypes: ["activity"]
    }
  },
  // 24. Strategic Canvas
  {
    id: "strategic-canvas",
    title: "战略画布",
    description: "战略画布，综合展示商业策略全貌",
    category: "creative",
    tags: ["战略", "商业模式", "规划"],
    difficulty: "advanced",
    icon: "Layers",
    gradient: {
      from: "#f59e0b",
      to: "#d97706"
    },
    estimatedTime: "15 分钟",
    prompt: `创建一个结合多种框架的战略画布：
- 中心：公司愿景与使命
- 象限 1（左上）：市场分析
  - TAM/SAM/SOM → 增长趋势 → 竞争格局
- 象限 2（右上）：价值主张
  - 客户细分 → 待办任务 (Jobs-to-be-done) → 独特价值
- 象限 3（左下）：商业模式
  - 收入来源 → 成本结构 → 关键合作伙伴
- 象限 4（右下）：执行计划
  - OKR → 关键举措 → 路线图里程碑
- 连接元素：
  - 从市场分析到价值主张：洞察箭头
  - 从价值主张到商业模式：变现路径
  - 从商业模式到执行：资源分配
- 包含每个象限的 KPI
- 使用企业配色方案，清晰的层级
- 为高风险/高回报举措添加“战略押注”高亮`,
    brief: {
      intent: "draft",
      tone: "enterprise",
      focus: ["hierarchy", "clarity"],
      diagramTypes: ["mindmap"]
    }
  },
  // 25. Design System Workflow
  {
    id: "design-system",
    title: "设计系统工作流",
    description: "设计系统的创建、维护和使用流程",
    category: "product",
    tags: ["设计系统", "用户体验", "协作"],
    difficulty: "advanced",
    icon: "Palette",
    gradient: {
      from: "#ec4899",
      to: "#be185d"
    },
    estimatedTime: "12 分钟",
    prompt: `创建设计系统工作流：
- 基础层：
  - 设计令牌：颜色、排版、间距、阴影
  - 指南：无障碍、语气、原则
- 组件层：
  - 原子：按钮、输入框、图标、徽章
  - 分子：表单字段、卡片标题、搜索栏
  - 组织：导航、表单、数据表
- 文档：
  - Storybook → 组件规范 → 使用指南 → 代码示例
- 贡献流程：
  - 设计师提议新组件 → 设计评审 → 原型
  - 工程师构建 → 代码审查 → 测试 → 发布到 npm
  - 更新 Figma 库 → 更新 Storybook → 通知团队
- 消费工作流：
  - 产品团队请求组件 → 先检查库
  - 找到：使用现有 → 通过 props 自定义
  - 未找到：提交请求 或 构建自定义（需评审）
- 泳道：设计团队、工程、产品团队
- 显示改进的反馈循环`,
    brief: {
      intent: "draft",
      tone: "enterprise",
      focus: ["hierarchy", "flow"],
      diagramTypes: ["component"]
    }
  },
  // 26. Analytics Dashboard Flow
  {
    id: "analytics-dashboard",
    title: "分析仪表板数据流",
    description: "数据分析仪表板的数据流和交互逻辑",
    category: "product",
    tags: ["分析", "仪表板", "数据"],
    difficulty: "intermediate",
    icon: "BarChart",
    gradient: {
      from: "#ec4899",
      to: "#be185d"
    },
    estimatedTime: "10 分钟",
    prompt: `创建分析仪表板数据流：
- 数据源：
  - 应用数据库 → ETL 流水线 → 数据仓库
  - 事件跟踪 → 实时流 → 分析数据库
  - 外部 API → 缓存层 → 聚合服务
- 处理层：
  - 计划任务：每日/每周/每月聚合
  - 实时处理：用户会话、实时指标
- 仪表板组件：
  - KPI 卡片：用户、收入、转化率、流失率
  - 图表：时间序列（折线）、分布（柱状）、群组（热图）
  - 过滤器：日期范围、细分、地区、平台
- 交互流程：
  - 用户选择过滤器 → 查询构建器 → 缓存检查
  - 缓存命中：返回缓存数据（快速路径）
  - 缓存未命中：查询数据库 → 转换数据 → 更新缓存 → 返回
- 包含延迟 SLA、刷新策略、下钻路径
- 添加数据质量检查点`,
    brief: {
      intent: "draft",
      tone: "enterprise",
      focus: ["flow", "hierarchy"],
      diagramTypes: ["component"]
    }
  },
  // 27. Meeting Decision Flow
  {
    id: "meeting-decision",
    title: "会议决策流程",
    description: "会议决策流程，从议题讨论到行动项分配",
    category: "business",
    tags: ["会议", "决策", "行动项"],
    difficulty: "beginner",
    isNew: true,
    icon: "MessageSquare",
    gradient: {
      from: "#3b82f6",
      to: "#1d4ed8"
    },
    estimatedTime: "5 分钟",
    prompt: `创建会议决策流程：
- 议程审查 → 讨论 → 决策点
- 决策结果：
  - 批准：创建行动项 → 分配负责人 → 设定截止日期
  - 需要更多信息：安排后续跟进 → 分配研究任务
  - 拒绝：记录原因 → 归档
- 并行轨道：会议记录 → 与利益相关者分享
- 会议后：跟踪行动项 → 在截止日期前发送提醒
- 使用泳道表示角色：引导者、参与者、行动负责人
- 包含决策标准和投票机制
- 添加后续跟踪循环`,
    brief: {
      intent: "draft",
      tone: "balanced",
      focus: ["flow", "clarity"],
      diagramTypes: ["activity"]
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
