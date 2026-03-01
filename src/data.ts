// 滴灌通超级Agent产品数据层
// 新架构：身份通统一入口 → Y型分叉（投资者/融资者）
// 融资者：申请通上传数据 → 数据流入投资者筛子
// 投资者：评估通+风控通（AI筛子工作流）→ 机会通（看板展现）
// 汇合：条款通 → 合约通 → 结算通 → 履约通

export interface Product {
  id: string;
  name: string;
  englishName: string;
  englishShort: string;
  logo: string;
  description: string;
  category: string;
  categoryEn: string;
  status: 'live' | 'beta' | 'coming';
  features: string[];
  color: string;
  colorDark: string;
  // 角色归属：shared=共用, borrower=融资者, investor=投资者, collaborative=双方协同
  role: 'shared' | 'borrower' | 'investor' | 'collaborative';
  // 流程阶段
  phase: 'entry' | 'borrower-upload' | 'investor-filter' | 'investor-view' | 'deal' | 'post-investment';
  // 流程中的序号（展示排序用）
  flowOrder: number;
  // 是否标记"协同"
  isCollaborative?: boolean;
  // 是否是筛子组件（评估通/风控通）
  isFilter?: boolean;
}

export interface Foundation {
  name: string;
  description: string;
  icon: string;
}

// 完整产品列表 — 9个通
export const products: Product[] = [
  {
    id: "identity",
    name: "身份通",
    englishName: "Identity Connect",
    englishShort: "Identity",
    logo: "https://www.genspark.ai/api/files/s/2UNypAIm",
    description: "统一认证入口，所有用户先通过身份通认证，再根据角色（投资者/融资者）分流至不同路径",
    category: "统一入口",
    categoryEn: "Unified Entry",
    status: "live",
    features: ["统一认证", "角色识别", "投资者/融资者分流", "多因素认证", "账户安全"],
    color: "#DBEAFE",
    colorDark: "#3B82F6",
    role: "shared",
    phase: "entry",
    flowOrder: 1
  },
  {
    id: "application",
    name: "申请通",
    englishName: "Application Connect",
    englishShort: "Application",
    logo: "https://www.genspark.ai/api/files/s/sGTxJUcV",
    description: "融资者的专属工具——整理、上传经营信息与数据，生成Pitch Deck，让项目信息标准化进入投资者的筛选池",
    category: "融资者路径",
    categoryEn: "Borrower Path",
    status: "beta",
    features: ["材料整理", "数据上传", "AI生成Pitch Deck", "信息标准化", "项目宣传"],
    color: "#FEF3C7",
    colorDark: "#F59E0B",
    role: "borrower",
    phase: "borrower-upload",
    flowOrder: 2
  },
  {
    id: "assess",
    name: "评估通",
    englishName: "Assess Connect",
    englishShort: "Assess",
    logo: "https://www.genspark.ai/api/files/s/UJuchZc6",
    description: "投资者的AI评估筛子——每个投资者可自定义投资标准和评估模型，自动对融资项目进行量化打分与尽调分析",
    category: "投资者路径",
    categoryEn: "Investor Path",
    status: "beta",
    features: ["自定义投资标准", "AI量化评估", "尽调报告生成", "投资者个性化模型", "批量筛选"],
    color: "#E0E7FF",
    colorDark: "#6366F1",
    role: "investor",
    phase: "investor-filter",
    flowOrder: 3,
    isFilter: true
  },
  {
    id: "risk",
    name: "风控通",
    englishName: "Risk Connect",
    englishShort: "Risk",
    logo: "https://www.genspark.ai/api/files/s/SrCHke7M",
    description: "投资者的AI风控筛子——每个投资者可设置自己的风控标准与核验方式，自动对项目进行材料验真与合规审查",
    category: "投资者路径",
    categoryEn: "Investor Path",
    status: "live",
    features: ["自定义风控标准", "材料验真", "合规审查", "风险评分", "核验方式配置"],
    color: "#E0E7FF",
    colorDark: "#6366F1",
    role: "investor",
    phase: "investor-filter",
    flowOrder: 4,
    isFilter: true
  },
  {
    id: "opportunity",
    name: "机会通",
    englishName: "Opportunity Connect",
    englishShort: "Opportunity",
    logo: "https://www.genspark.ai/api/files/s/UJuchZc6",
    description: "投资者的统一项目看板——展示通过评估通和风控通筛选后的融资项目。若未设置任何筛子，则展示所有融资项目",
    category: "投资者路径",
    categoryEn: "Investor Path",
    status: "live",
    features: ["筛后项目看板", "全量项目浏览", "项目对比", "投资意向标记", "智能推荐"],
    color: "#D1FAE5",
    colorDark: "#10B981",
    role: "investor",
    phase: "investor-view",
    flowOrder: 5
  },
  {
    id: "terms",
    name: "条款通",
    englishName: "Terms Connect",
    englishShort: "Terms",
    logo: "https://www.genspark.ai/api/files/s/xnam27pA",
    description: "投融资双方协同节点——基于评估和风控结论，自动生成收入分成方案，双方在线协商条款",
    category: "交易达成",
    categoryEn: "Deal Making",
    status: "coming",
    features: ["收入分成方案", "条款协商", "方案对比", "模拟测算"],
    color: "#EDE9FE",
    colorDark: "#8B5CF6",
    role: "collaborative",
    phase: "deal",
    flowOrder: 6,
    isCollaborative: true
  },
  {
    id: "contract",
    name: "合约通",
    englishName: "Contract Connect",
    englishShort: "Contract",
    logo: "https://www.genspark.ai/api/files/s/8qGcHXYE",
    description: "电子合约签署平台——投融资双方在线协同完成合约签署，具有法律效力",
    category: "交易达成",
    categoryEn: "Deal Making",
    status: "beta",
    features: ["电子签署", "合约管理", "版本控制", "法律合规"],
    color: "#EDE9FE",
    colorDark: "#8B5CF6",
    role: "collaborative",
    phase: "deal",
    flowOrder: 7,
    isCollaborative: true
  },
  {
    id: "settlement",
    name: "结算通",
    englishName: "Settlement Connect",
    englishShort: "Settlement",
    logo: "https://www.genspark.ai/api/files/s/AONkBaFh",
    description: "收入分成自动结算——透明化资金流转记录，按合约约定自动执行",
    category: "投后管理",
    categoryEn: "Post-Investment",
    status: "coming",
    features: ["自动结算", "资金流转", "账单管理", "对账核销"],
    color: "#FEE2E2",
    colorDark: "#EF4444",
    role: "collaborative",
    phase: "post-investment",
    flowOrder: 8
  },
  {
    id: "performance",
    name: "履约通",
    englishName: "Performance Connect",
    englishShort: "Performance",
    logo: "https://www.genspark.ai/api/files/s/goK923ZW",
    description: "履约监控与数据追踪——实时掌握项目运营状况，预警机制保障投资安全",
    category: "投后管理",
    categoryEn: "Post-Investment",
    status: "coming",
    features: ["履约监控", "数据追踪", "预警提示", "报表生成"],
    color: "#FEE2E2",
    colorDark: "#EF4444",
    role: "collaborative",
    phase: "post-investment",
    flowOrder: 9
  }
];

// 按角色分组的产品
export const entryProduct = products.find(p => p.phase === 'entry')!; // 身份通
export const borrowerProducts = products.filter(p => p.role === 'borrower'); // 申请通
export const investorFilterProducts = products.filter(p => p.isFilter); // 评估通 + 风控通
export const investorViewProduct = products.find(p => p.phase === 'investor-view')!; // 机会通
export const dealProducts = products.filter(p => p.phase === 'deal'); // 条款通 + 合约通
export const postInvestmentProducts = products.filter(p => p.phase === 'post-investment'); // 结算通 + 履约通
export const collaborativeProducts = products.filter(p => p.isCollaborative); // 条款通 + 合约通

// 主流程产品（按flowOrder排序）
export const mainFlowProducts = [...products].sort((a, b) => a.flowOrder - b.flowOrder);

export const foundations: Foundation[] = [
  {
    name: "Account 身份体系",
    description: "统一认证 · 权限隔离 · 角色分流",
    icon: "fa-users"
  },
  {
    name: "Data 数据底座",
    description: "数据同源 · 清洗治理 · 标准化",
    icon: "fa-database"
  },
  {
    name: "AI 智能引擎",
    description: "NLP解析 · 量化算法 · 筛子编排",
    icon: "fa-brain"
  }
];

export const statusLabels: Record<string, { text: string; class: string }> = {
  live: { text: "已上线", class: "bg-green-100 text-green-700 border-green-200" },
  beta: { text: "Beta测试中", class: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  coming: { text: "即将上线", class: "bg-gray-100 text-gray-500 border-gray-200" }
};

// 新架构分组：按Y型分流阶段
export const architectureGroups = [
  {
    title: "统一入口",
    titleEn: "Unified Entry",
    color: "#3B82F6",
    bgColor: "#DBEAFE",
    icon: "fa-sign-in-alt",
    ids: ["identity"]
  },
  {
    title: "融资者路径",
    titleEn: "Borrower Path",
    color: "#F59E0B",
    bgColor: "#FEF3C7",
    icon: "fa-upload",
    ids: ["application"]
  },
  {
    title: "投资者路径",
    titleEn: "Investor Path",
    color: "#6366F1",
    bgColor: "#E0E7FF",
    icon: "fa-filter",
    ids: ["assess", "risk", "opportunity"]
  },
  {
    title: "交易达成",
    titleEn: "Deal Making",
    color: "#8B5CF6",
    bgColor: "#EDE9FE",
    icon: "fa-handshake",
    ids: ["terms", "contract"]
  },
  {
    title: "投后管理",
    titleEn: "Post-Investment",
    color: "#EF4444",
    bgColor: "#FEE2E2",
    icon: "fa-chart-line",
    ids: ["settlement", "performance"]
  }
];

// 设计思路手风琴数据 — 全新Y型分叉逻辑
export const designSections = [
  {
    id: "background",
    title: "产品背景与核心问题",
    icon: "fa-lightbulb",
    content: [
      {
        subtitle: "传统做法的痛点",
        text: "传统RBF平台按赛道（餐饮、零售、医美等）分别建系统，导致大量重复开发、数据孤岛、维护成本高。每个赛道都有自己的评估体系、风控标准、合同模板，难以形成规模效应。"
      },
      {
        subtitle: "从按赛道造轮子到Super Agent",
        text: "我们提出「Super Agent矩阵」理念——不按赛道建系统，而是按投资流程的关键环节抽象出9个通用Agent。每个Agent专注于一个核心能力，通过灵活组合覆盖所有赛道。"
      },
      {
        subtitle: "核心价值主张",
        text: "提纲挈领、以不变应万变。9个Agent + 统一底座，即可覆盖RBF投资全流程，同时保留针对不同赛道和不同投资者偏好的定制能力。"
      }
    ]
  },
  {
    id: "y-flow",
    title: "Y型业务流程逻辑（核心创新）",
    icon: "fa-project-diagram",
    content: [
      {
        subtitle: "身份通：统一入口，角色分流",
        text: "所有用户——无论是融资者还是投资者——统一通过「身份通」进入系统。身份通完成认证后，根据用户角色自动分流到两条不同的路径，这就是Y型结构的分叉点。"
      },
      {
        subtitle: "融资者路径：申请通（数据上传）",
        text: "融资者通过「申请通」整理和上传自己的经营信息与数据（财务流水、门店信息、经营资质等）。申请通会帮助融资者将零散资料标准化，生成Pitch Deck，让数据进入投资者的筛选池。\n\n这一步是融资者唯一需要做的事——上传真实的经营数据。"
      },
      {
        subtitle: "投资者路径：评估通+风控通（AI筛子工作流）",
        text: "每个投资者可以用「评估通」和「风控通」搭建自己的项目「筛子」工作流：\n\n· 评估通：设置自己的投资标准和评估模型（比如：月流水>50万、经营>2年、毛利率>40%）\n· 风控通：设置自己的风控标准和核验方式（比如：必须有POS数据验证、社保在缴人数>5）\n\n评估通和风控通本质上是投资者用AI搭建的个性化「筛子」，在众多融资者中自动筛出符合自己投资偏好的项目。"
      },
      {
        subtitle: "关键过程：申请通数据 → 评估通 → 风控通 → 机会通",
        text: "这是整个Y型流程中最核心的数据穿越过程：\n\n① 融资者在申请通上传的经营数据，会直接进入投资者搭建的评估通进行第一轮筛选（投资标准匹配）\n② 通过评估通的项目，继续流入风控通进行第二轮筛选（风控标准核验）\n③ 通过评估通+风控通全部标准的项目，才会出现在该投资者的机会通看板上\n④ 不通过的项目会被淘汰，或通知融资者通过申请通补充材料后重新进入筛选管道\n\n这条「申请通 → 评估通 → 风控通 → 机会通」的数据管道，是连接融资者和投资者两条路径的桥梁。"
      },
      {
        subtitle: "机会通：投资者统一看板",
        text: "经过评估通和风控通层层筛选后的项目，最终呈现在「机会通」看板上。这是投资者的统一项目展示页面。\n\n关键规则：如果投资者没有设置任何评估/风控筛子，则机会通展示所有融资项目——即「无筛子=全量曝光」。\n\n这个设计保证了：\n· 融资者的项目一定会被看到（至少出现在没有设筛子的投资者的机会通里）\n· 投资者可以精准高效地筛选项目（设了筛子就只看匹配的）"
      },
      {
        subtitle: "Y型汇合：条款通 → 后续流程",
        text: "投资者在机会通中选中项目后，投融资双方进入协同阶段：\n\n条款通（协同）→ 合约通（协同）→ 结算通 → 履约通\n\n从条款通开始，融资者和投资者两条路径汇合，双方需要共同参与条款协商、合约签署，直至投后管理。这形成了完整的Y型闭环。"
      }
    ]
  },
  {
    id: "filter",
    title: "评估通+风控通：AI筛子工作流详解",
    icon: "fa-filter",
    content: [
      {
        subtitle: "筛子的本质：投资者的个性化AI代理",
        text: "评估通和风控通不是简单的表单审批工具，而是每个投资者可以自行配置的AI Agent工作流。投资者把自己的投资标准和核验方式「编排」进去，系统就会自动在海量融资项目中执行筛选。"
      },
      {
        subtitle: "评估通筛子：投资偏好量化",
        text: "投资者可以设置的评估维度包括：\n· 行业偏好：餐饮 / 零售 / 医美 / 教育 …\n· 财务指标：月流水门槛、毛利率、增长率\n· 经营能力：经营年限、门店数量、团队规模\n· AI评估权重：各维度的打分权重可自定义\n\n评估通会自动对所有融资项目进行量化评分，产出评估报告。"
      },
      {
        subtitle: "风控通筛子：合规与风险过滤",
        text: "投资者可以设置的风控规则包括：\n· 必要验证：POS流水验真、银行流水交叉核验\n· 合规要求：营业执照有效、无法律纠纷、税务正常\n· 风险阈值：最大可接受杠杆率、最长回收期\n· 黑名单规则：特定区域/行业排除\n\n风控通会自动执行合规审查，标记风险等级。"
      },
      {
        subtitle: "无筛子默认策略",
        text: "如果投资者没有配置任何评估/风控筛子：\n· 机会通将展示所有融资项目（全量浏览模式）\n· 项目按默认排序展示（提交时间、行业分类等）\n· 投资者可随时补建筛子，实时刷新筛选结果\n\n这确保了系统的包容性——新投资者可以先浏览全量市场，再逐步细化自己的筛选标准。"
      }
    ]
  },
  {
    id: "dataflow",
    title: "数据流与决策机制",
    icon: "fa-exchange-alt",
    content: [
      {
        subtitle: "事件驱动的Y型数据流",
        text: "融资者在申请通上传数据后，数据自动进入统一数据池。投资者在评估通/风控通中设置的筛子规则会实时应用于数据池中的项目，筛选结果实时呈现在机会通看板上。\n\n核心机制：事件驱动 · 实时筛选 · 按需组合"
      },
      {
        subtitle: "双向数据流动",
        text: "· 融资者 → 数据池：申请通上传的信息流入统一数据底座\n· 数据池 → 投资者筛子：评估通和风控通从数据池拉取项目\n· 筛子 → 机会通：通过筛选的项目推送到投资者的机会通看板\n· 机会通 → 条款通：投资者选中项目后触发条款协商流程"
      },
      {
        subtitle: "补充材料循环",
        text: "如果风控通在核验中发现问题，系统自动通知融资者通过申请通补充材料。材料更新后重新触发评估/风控筛选流程，形成闭环。"
      }
    ]
  },
  {
    id: "tech",
    title: "技术架构",
    icon: "fa-microchip",
    content: [
      {
        subtitle: "事件驱动架构",
        text: "所有Agent之间通过事件总线通信，松耦合设计确保各模块可独立部署和升级。支持异步处理和实时推送，提高系统响应速度。"
      },
      {
        subtitle: "统一底座的三大组件",
        text: "Account（身份体系）：统一的认证和权限管理，支持投资者/融资者角色分流和多租户隔离。\nData（数据底座）：数据同源、清洗治理，确保所有Agent使用一致的数据。融资者上传的数据标准化后存入统一数据池。\nAI（智能引擎）：NLP解析、量化算法、筛子工作流编排引擎，为评估通和风控通的个性化AI筛子提供底层能力。"
      },
      {
        subtitle: "模块化设计与灵活调用",
        text: "每个Agent都是独立的微服务，可按需组合、灵活调用。评估通和风控通支持投资者自定义配置，无需开发即可搭建个性化筛选工作流。"
      }
    ]
  }
];
