// 收入分成融资 - 行业合同模板系统
// 基于滴灌通联营协议（境内B类资产）标准模板

export interface IndustryTemplate {
  id: string
  name: string
  icon: string
  description: string
  color: string
  defaultParams: Record<string, any>
  modules: ContractModule[]
  fullText: ContractSection[]
}

export interface ContractModule {
  id: string
  title: string
  description: string
  icon: string
  clauses: ClauseItem[]
  risks?: string
}

export interface ClauseItem {
  name: string
  value: string
  key: string // 用于匹配和更新
  note?: string
}

export interface ContractSection {
  id: string
  number: string
  title: string
  clauses: {
    text: string
    note?: string
    keys?: string[] // 该条款涉及的参数key
  }[]
}

// ==================== 滴灌通联营协议通用条款 ====================
// 适用于：餐饮、零售、医美、教育等行业（非演唱会类）

const createMicroConnectFullText = (industrySpecificClauses?: ContractSection[]): ContractSection[] => [
  {
    id: 'business-arrangement',
    number: '一',
    title: '联营合作商业安排',
    clauses: [
      {
        text: '联营资金金额：人民币【${investmentAmount}】（大写：【${investmentAmountCN}】）。',
        note: '投资方提供的联营资金总额',
        keys: ['investmentAmount', 'investmentAmountCN']
      },
      {
        text: '联营资金用途：用于【${fundUsage}】。',
        note: '资金的指定用途',
        keys: ['fundUsage']
      },
      {
        text: '联营资金出资的前置条件：【${prerequisites}】。',
        note: '资金到位的前提条件',
        keys: ['prerequisites']
      },
      {
        text: '联营方收入定义：联营方实际经营【${businessScope}】的营业收入扣除【${deductions}】后的金额。',
        note: '收入计算口径定义',
        keys: ['businessScope', 'deductions']
      },
      {
        text: '固定分成比例：【${revenueShareRatio}】。',
        note: '投资方按此比例分享联营方收入',
        keys: ['revenueShareRatio']
      },
      {
        text: '收入分成期：自【${sharingStartDate}】起至【${sharingEndDate}】止，或收入分成期的终止触发事项发生时（以较早者为准）。',
        note: '分成期限的起止时间',
        keys: ['sharingStartDate', 'sharingEndDate']
      },
      {
        text: '收入分成期的终止触发事项：投资方累计实际取得的收入分成金额达到【联营资金×（1+${terminationReturn}÷12×已联营月数）】。',
        note: '分成终止条件（年化回报率）',
        keys: ['terminationReturn']
      },
      {
        text: '本协议整体期限自签署之日起至收入分成期届满或提前终止之日止。',
        note: '协议整体期限',
        keys: []
      },
      {
        text: '若在收入分成期开始日前本协议终止或解除的，投资方有权要求联营方退还已拨付的全部联营资金。',
        note: '提前终止退款条款',
        keys: []
      },
      {
        text: '若在收入分成期开始日后本协议终止或解除的，投资方有权要求联营方按照【已出资联营资金×（1+${terminationReturn}÷12×已联营月数）-累计已分成金额】的金额退还（如该金额为负数，则无需退还）。',
        note: '分成期内终止的退款计算',
        keys: ['terminationReturn']
      }
    ]
  },
  {
    id: 'data-transmission',
    number: '二',
    title: '数据传输与收入分成方式',
    clauses: [
      {
        text: '数据传输频率：【${dataReportFrequency}】。',
        note: '收入数据上报频率',
        keys: ['dataReportFrequency']
      },
      {
        text: '数据传输日：【${dataTransmissionDay}】。',
        note: '具体数据传输时间点',
        keys: ['dataTransmissionDay']
      },
      {
        text: '数据传输来源：【${dataSource}】。',
        note: '数据来源系统（如POS系统、收银系统等）',
        keys: ['dataSource']
      },
      {
        text: '收入分成频率：【${paymentFrequency}】。',
        note: '分成款支付频率',
        keys: ['paymentFrequency']
      },
      {
        text: '收入分成付款日：【${paymentDay}】。',
        note: '分成款支付时间点',
        keys: ['paymentDay']
      },
      {
        text: '对账方式：【${reconciliationMethod}】。',
        note: '数据核对与确认机制',
        keys: ['reconciliationMethod']
      },
      {
        text: '特别约定：如数据传输日或收入分成付款日恰逢法定节假日的，则提前至最近的一个工作日进行。',
        note: '节假日调整规则',
        keys: []
      }
    ]
  },
  {
    id: 'representations',
    number: '三',
    title: '陈述、保证及承诺',
    clauses: [
      {
        text: '联营方及品牌方保证其依法设立并有效存续，具备签署、履行本协议的必要资格及能力。',
        note: '主体资格保证',
        keys: []
      },
      {
        text: '联营方及品牌方保证本协议项下的标的门店【${storeName}】位于【${storeAddress}】，正常营业中。',
        note: '门店信息确认',
        keys: ['storeName', 'storeAddress']
      },
      {
        text: '联营方及品牌方保证其有权使用【${brandName}】品牌进行经营，品牌使用权在本协议期限内持续有效。',
        note: '品牌使用权保证',
        keys: ['brandName']
      },
      {
        text: '联营方及品牌方保证已获得经营所需的全部证照许可，包括但不限于【${requiredLicenses}】。',
        note: '证照资质保证',
        keys: ['requiredLicenses']
      },
      {
        text: '联营方及品牌方保证提供的所有信息真实、准确、完整，不存在虚假记载、误导性陈述或重大遗漏。',
        note: '信息真实性保证',
        keys: []
      }
    ]
  },
  {
    id: 'data-collection',
    number: '四',
    title: '信息收集和提供',
    clauses: [
      {
        text: '投资方有权通过【${dataCollectionMethod}】收集联营方的经营数据，联营方应予以配合。',
        note: '数据收集方式',
        keys: ['dataCollectionMethod']
      },
      {
        text: '联营方同意授权投资方接入其【${dataSource}】系统，实时或定期获取营业收入数据。',
        note: '系统接入授权',
        keys: ['dataSource']
      },
      {
        text: '如联营方出现数据异常、数据缺失或疑似数据造假情形，投资方有权要求联营方在【${responseTime}】内书面说明并提供原始凭证。',
        note: '数据异常处理',
        keys: ['responseTime']
      },
      {
        text: '投资方有权在联营方存在严重违约或数据造假时，向人民银行征信系统报送相关信用信息。',
        note: '征信报送权利',
        keys: []
      }
    ]
  },
  {
    id: 'rights-obligations',
    number: '五',
    title: '各方权利义务',
    clauses: [
      {
        text: '投资方不参与联营方的日常经营管理，联营方自主经营、自负盈亏。',
        note: '经营独立性',
        keys: []
      },
      {
        text: '未经投资方书面同意，联营方不得进行以下行为：（1）变更实际控制人或主要股东；（2）变更品牌使用权；（3）出售、转让或质押经营收入；（4）关闭或迁移标的门店。',
        note: '重大事项限制',
        keys: []
      },
      {
        text: '联营方如发生重大经营变动（包括但不限于停业、搬迁、品牌更换、负面舆情等），应在【${notificationDays}】日内书面通知投资方。',
        note: '重大事项通知义务',
        keys: ['notificationDays']
      },
      {
        text: '品牌方承担连带保证责任，确保联营方履行本协议项下的全部义务。',
        note: '品牌方连带责任',
        keys: []
      }
    ]
  },
  {
    id: 'grace-period',
    number: '六',
    title: '宽限期',
    clauses: [
      {
        text: '如联营方未能在约定的数据传输日按时传输数据，投资方给予【${dataGracePeriod}】天的宽限期。',
        note: '数据传输宽限期',
        keys: ['dataGracePeriod']
      },
      {
        text: '如联营方未能在约定的收入分成付款日按时付款，投资方给予【${paymentGracePeriod}】天的宽限期。',
        note: '付款宽限期',
        keys: ['paymentGracePeriod']
      },
      {
        text: '如联营方在宽限期届满后仍未履行义务，且逾期达到【${creditReportThreshold}】天，投资方有权向征信系统报送相关信息。',
        note: '征信报送门槛',
        keys: ['creditReportThreshold']
      }
    ]
  },
  {
    id: 'breach',
    number: '七',
    title: '违约责任',
    clauses: [
      {
        text: '以下情形构成严重违约：（1）数据造假；（2）逾期付款超过【${seriousBreachDays}】天；（3）擅自变更实际控制人或品牌使用权；（4）擅自处置经营收入；（5）虚假陈述或隐瞒重大事项；（6）其他严重损害投资方权益的行为。',
        note: '严重违约情形',
        keys: ['seriousBreachDays']
      },
      {
        text: '如联营方发生严重违约，投资方有权：（1）单方解除本协议；（2）要求联营方按照【已出资联营资金×（1+${terminationReturn}÷12×已联营月数）-累计已分成金额】退还款项；（3）要求联营方支付联营资金金额的【${breachPenalty}】作为违约金。',
        note: '违约后果',
        keys: ['terminationReturn', 'breachPenalty']
      },
      {
        text: '联营方、品牌方对本协议项下的全部债务承担连带责任。',
        note: '连带责任',
        keys: []
      }
    ]
  },
  {
    id: 'confidentiality',
    number: '八',
    title: '保密条款',
    clauses: [
      {
        text: '各方对因签署、履行本协议而知悉的对方商业秘密、经营信息、财务数据等保密信息负有保密义务。',
        note: '保密义务',
        keys: []
      },
      {
        text: '未经信息提供方书面同意，信息接收方不得向任何第三方披露保密信息，但法律法规要求披露或向其关联公司、专业顾问披露的除外。',
        note: '披露限制',
        keys: []
      },
      {
        text: '本保密义务在本协议终止后【${confidentialityPeriod}】年内继续有效。',
        note: '保密期限',
        keys: ['confidentialityPeriod']
      }
    ]
  },
  {
    id: 'integrity',
    number: '九',
    title: '廉洁与诚信',
    clauses: [
      {
        text: '各方承诺在本协议签署及履行过程中，不向对方或对方关联方的员工、代理人提供任何形式的回扣、佣金、礼品或其他利益。',
        note: '反商业贿赂',
        keys: []
      },
      {
        text: '任何一方如发现对方存在违反廉洁诚信的行为，可向【${complianceEmail}】举报。',
        note: '举报渠道',
        keys: ['complianceEmail']
      }
    ]
  },
  {
    id: 'law-dispute',
    number: '十',
    title: '适用法律和争议解决',
    clauses: [
      {
        text: '本协议的订立、效力、解释、履行及争议解决均适用中华人民共和国法律（不包括港澳台地区法律）。',
        note: '适用法律',
        keys: []
      },
      {
        text: '因本协议引起的或与本协议相关的任何争议，各方应友好协商解决；协商不成的，任何一方均可将争议提交至【${arbitrationInstitution}】按其届时有效的仲裁规则进行仲裁。',
        note: '争议解决方式',
        keys: ['arbitrationInstitution']
      },
      {
        text: '仲裁地为【${arbitrationPlace}】，仲裁语言为中文，仲裁裁决为终局裁决，对各方均有约束力。',
        note: '仲裁地点',
        keys: ['arbitrationPlace']
      }
    ]
  },
  {
    id: 'effectiveness',
    number: '十一',
    title: '协议的生效、变更、解除',
    clauses: [
      {
        text: '本协议自各方签署之日起生效。各方可选择电子签名或线下签署方式。',
        note: '生效方式',
        keys: []
      },
      {
        text: '本协议一经签署，任何一方不得单方变更或解除，但法律规定或本协议另有约定的除外。',
        note: '变更限制',
        keys: []
      },
      {
        text: '本协议正本一式【${copies}】份，各方各执【${copiesPerParty}】份，具有同等法律效力。',
        note: '文本数量',
        keys: ['copies', 'copiesPerParty']
      }
    ]
  },
  // 插入行业特定条款（如有）
  ...(industrySpecificClauses || [])
]

// ==================== 行业模板定义 ====================

// 1. 演唱会/演出行业（保持原有专用模板不变）
export const concertTemplate: IndustryTemplate = {
  id: 'concert',
  name: '演唱会/演出',
  icon: 'fa-music',
  description: '演唱会、音乐节、话剧等现场演出项目',
  color: 'purple',
  defaultParams: {
    investmentAmount: '1,800万元',
    revenueShareRatio: '70%',
    terminationReturn: '33%',
    breachPenalty: '20%',
    giftTicketLimit: '1,000张',
    minTicketPrice: '50%',
    discountTicketLimit: '20%',
    approvalThreshold: '10万元',
    budgetOverrunLimit: '10%',
    delayPeriod: '6个月',
    dataReportTime: '18:00',
    paymentTime: '22:00',
    monthlyReconcileDay: '15',
    auditDays: '30',
    infoDisclosureDays: '5',
    urgentNoticeDays: '24小时',
    personnelChangeDays: '15'
  },
  modules: [
    {
      id: 'investment',
      title: '投资架构',
      description: '资金结构、出资顺序、前置条件',
      icon: 'fa-coins',
      clauses: [
        { name: '联营资金金额', value: '1,800万元', key: 'investmentAmount', note: '投资方投入的资金总额' },
        { name: '出资顺序', value: '劣后→优先', key: 'fundingOrder', note: '劣后出资方需先全额到位' },
        { name: '支出审批阈值', value: '>10万元', key: 'approvalThreshold', note: '超过此金额需投资方书面同意' },
        { name: '预算超支容忍', value: '10%', key: 'budgetOverrunLimit', note: '超出部分投资方可拒付' }
      ],
      risks: '劣后资金未到位即出资将丧失优先受偿权基础'
    },
    {
      id: 'revenue',
      title: '收入分成',
      description: '分成比例、计算方式、对账机制',
      icon: 'fa-chart-pie',
      clauses: [
        { name: '分成比例', value: '70%', key: 'revenueShareRatio', note: '基于税前营业收入' },
        { name: '终止回报率', value: '33%年化', key: 'terminationReturn', note: '累计分成达此回报后停止' },
        { name: '数据传输时间', value: '每日18:00前', key: 'dataReportTime', note: '基于票务系统' },
        { name: '分成付款时间', value: '每日22:00前', key: 'paymentTime', note: '当日分成支付' },
        { name: '月度对账日', value: '每月15日前', key: 'monthlyReconcileDay', note: '上月数据确认' }
      ],
      risks: '收入隐藏、数据延迟、口径争议'
    },
    {
      id: 'artist',
      title: '艺人风险',
      description: '艺人违约、负面舆情、合规管控',
      icon: 'fa-user-music',
      clauses: [
        { name: '政治言论风险', value: '极高', key: 'politicalRisk', note: '取消+全额退款+补偿金' },
        { name: '负面舆情告知', value: '5日内', key: 'infoDisclosureDays', note: '书面通知投资方' },
        { name: '延期最长期限', value: '6个月', key: 'delayPeriod', note: '超期视为取消' }
      ],
      risks: '艺人违约时，无论是否追回费用，融资方都需向投资方全额退款'
    },
    {
      id: 'ticketing',
      title: '票务管控',
      description: '赠票、折扣、最低售价限制',
      icon: 'fa-ticket',
      clauses: [
        { name: '赠票上限', value: '1,000张', key: 'giftTicketLimit', note: '超出按票面价支付' },
        { name: '最低售价', value: '票面50%', key: 'minTicketPrice', note: '低于需补差额' },
        { name: '折价票上限', value: '总票量20%', key: 'discountTicketLimit', note: '超出需书面同意' }
      ],
      risks: '赠票超限、低价销售可构成违约'
    },
    {
      id: 'breach',
      title: '违约责任',
      description: '违约情形、违约金、连带责任',
      icon: 'fa-gavel',
      clauses: [
        { name: '违约金比例', value: '20%', key: 'breachPenalty', note: '基于投资金额' },
        { name: '连带责任', value: '融资方+合作方', key: 'jointLiability', note: '共同且连带' },
        { name: '分成延迟违约', value: '>30天', key: 'paymentDelayBreach', note: '构成严重违约' }
      ],
      risks: '严重违约将导致协议解除、全额退款加违约金'
    },
    {
      id: 'escrow',
      title: '共管账户',
      description: '账户权限、审批流程、资金监管',
      icon: 'fa-university',
      clauses: [
        { name: '开户行', value: '双方协商', key: 'escrowBank', note: '指定银行开立' },
        { name: '投资方权限', value: '查询+复核+U盾', key: 'investorRights', note: '完整监管权限' },
        { name: '审批阈值', value: '>10万元', key: 'approvalThreshold', note: '需书面同意' }
      ],
      risks: '微信/邮件不构成有效书面同意，必须盖章文件'
    }
  ],
  fullText: [
    {
      id: 'investment',
      number: '一',
      title: '联营资金与出资安排',
      clauses: [
        {
          text: '投资方拟在满足本协议约定的相关前置条件后，提供联营资金，金额为人民币【${investmentAmount}】。',
          note: '联营资金金额为固定金额，不因项目实际成本变化而调整',
          keys: ['investmentAmount']
        },
        {
          text: '融资方如需支付项目运营支出，金额超过【${approvalThreshold}】的，需提前获得投资方的盖章书面文件同意，方可从共管账户中划出支付。',
          note: '支出审批机制',
          keys: ['approvalThreshold']
        },
        {
          text: '若实际需支出的金额超过预算金额的【${budgetOverrunLimit}】，投资方有权拒绝从共管账户支付超出部分，融资方需自行承担超出金额。',
          note: '预算超支处理',
          keys: ['budgetOverrunLimit']
        }
      ]
    },
    {
      id: 'revenue',
      number: '二',
      title: '收入分成安排',
      clauses: [
        {
          text: '融资方和/或其他方应按照项目收入的【${revenueShareRatio}】向投资方进行分成。',
          note: '分成比例基于税前全部营业收入',
          keys: ['revenueShareRatio']
        },
        {
          text: '分成终止触发事项：投资方累计实际取得的收入分成金额合计达到【投资方已出资的联营资金×（1+${terminationReturn}÷12×已联营月数）】金额。',
          note: '分成终止条件',
          keys: ['terminationReturn']
        },
        {
          text: '融资方应在数据传输日当日的【${dataReportTime}】前完成数据传输，分成付款日当日的【${paymentTime}】前完成分成付款。',
          note: '数据和付款时效',
          keys: ['dataReportTime', 'paymentTime']
        }
      ]
    },
    {
      id: 'artist',
      number: '三',
      title: '艺人风险管控',
      clauses: [
        {
          text: '若演出因艺人违约而取消，无论融资方是否实际收回已支付给艺人的演出费用，融资方需退还投资方已提供的全部资金，并按【${terminationReturn}按月计】计算补偿金。',
          note: '艺人违约导致取消的处理',
          keys: ['terminationReturn']
        },
        {
          text: '若演出需要延期，且最后一场演出不晚于原定日期后【${delayPeriod}】举行，收入分成期相应延长。若超过此期限，则视为演出取消。',
          note: '延期处理',
          keys: ['delayPeriod']
        }
      ]
    },
    {
      id: 'ticketing',
      number: '四',
      title: '票务管控',
      clauses: [
        {
          text: '演出赠票上限为【${giftTicketLimit}】，超出部分需融资方按票面价格支付至共管账户。',
          note: '赠票上限',
          keys: ['giftTicketLimit']
        },
        {
          text: '演出门票的最低销售价格不得低于票面价格的【${minTicketPrice}】，若按照低于该价格出售，融资方需将差额补足支付到共管账户。',
          note: '最低售价限制',
          keys: ['minTicketPrice']
        },
        {
          text: '融资方出售折价票的比例不得超过总票量的【${discountTicketLimit}】，超出部分需事先取得投资方的书面同意。',
          note: '折价票比例限制',
          keys: ['discountTicketLimit']
        }
      ]
    },
    {
      id: 'breach',
      number: '五',
      title: '违约责任',
      clauses: [
        {
          text: '如融资方发生严重违约，投资方有权单方解除本协议，要求融资方退还全部资金，并向投资方支付资金的【${breachPenalty}】作为违约金。',
          note: '严重违约后果',
          keys: ['breachPenalty']
        }
      ]
    },
    {
      id: 'escrow',
      number: '六',
      title: '共管账户',
      clauses: [
        {
          text: '投资方和融资方开立共管账户，投资方已取得必要的共管权限（包括但不限于网银查询权限、复核/审批权限及/或U盾、印鉴等），以确保投资方可对共管账户资金收支进行监管。',
          note: '共管账户设立及权限配置',
          keys: []
        },
        {
          text: '融资方如需支付运营支出，金额超过【${approvalThreshold}】的，需提前获得投资方的盖章书面文件同意。',
          note: '支出审批',
          keys: ['approvalThreshold']
        }
      ]
    }
  ]
}

// 2. 餐饮行业 - 使用滴灌通联营协议模板
export const cateringTemplate: IndustryTemplate = {
  id: 'catering',
  name: '餐饮连锁',
  icon: 'fa-utensils',
  description: '餐厅、奶茶店、咖啡厅等餐饮项目',
  color: 'orange',
  defaultParams: {
    // 基础信息
    investmentAmount: '500万元',
    investmentAmountCN: '伍佰万元整',
    fundUsage: '门店装修、设备采购、首批物料及流动资金',
    prerequisites: '门店租赁合同已签署且租期不少于协议期限',
    
    // 收入分成
    businessScope: '餐饮服务',
    deductions: '政府规费、税金',
    revenueShareRatio: '15%',
    sharingStartDate: '首笔营业收入产生之日',
    sharingEndDate: '自收入分成期开始日起满36个月',
    terminationReturn: '25%',
    
    // 数据传输
    dataReportFrequency: '每日',
    dataTransmissionDay: 'T+1日12:00前',
    dataSource: 'POS收银系统',
    paymentFrequency: '每日',
    paymentDay: 'T+1日18:00前',
    reconciliationMethod: '按月对账，次月5日前确认',
    
    // 门店信息
    storeName: '待确定',
    storeAddress: '待确定',
    brandName: '待确定',
    requiredLicenses: '营业执照、食品经营许可证',
    
    // 数据与通知
    dataCollectionMethod: '系统接入+定期报表',
    responseTime: '3个工作日',
    notificationDays: '5',
    
    // 宽限期
    dataGracePeriod: '10',
    paymentGracePeriod: '10',
    creditReportThreshold: '15',
    
    // 违约
    seriousBreachDays: '30',
    breachPenalty: '20%',
    
    // 保密与合规
    confidentialityPeriod: '3',
    complianceEmail: 'compliance@microconnect.com',
    
    // 争议解决
    arbitrationInstitution: '深圳国际仲裁院',
    arbitrationPlace: '深圳',
    
    // 文本
    copies: '四',
    copiesPerParty: '一'
  },
  modules: [
    {
      id: 'business-arrangement',
      title: '联营合作商业安排',
      description: '资金、分成、门店信息',
      icon: 'fa-coins',
      clauses: [
        { name: '联营资金金额', value: '500万元', key: 'investmentAmount', note: '用于门店建设及运营' },
        { name: '固定分成比例', value: '15%', key: 'revenueShareRatio', note: '基于营业收入' },
        { name: '收入分成期', value: '36个月', key: 'sharingEndDate', note: '自首笔收入产生起' },
        { name: '终止回报率', value: '25%年化', key: 'terminationReturn', note: '提前终止计算标准' }
      ],
      risks: '门店选址风险、客流量不稳定'
    },
    {
      id: 'data-transmission',
      title: '数据传输与分成方式',
      description: '数据上报、付款频率、对账机制',
      icon: 'fa-chart-line',
      clauses: [
        { name: '数据传输频率', value: '每日', key: 'dataReportFrequency', note: 'T+1日12:00前' },
        { name: '数据来源', value: 'POS收银系统', key: 'dataSource', note: '系统自动对接' },
        { name: '付款频率', value: '每日', key: 'paymentFrequency', note: 'T+1日18:00前' },
        { name: '对账方式', value: '按月对账', key: 'reconciliationMethod', note: '次月5日前确认' }
      ]
    },
    {
      id: 'representations',
      title: '陈述与保证',
      description: '主体资格、门店信息、品牌权利',
      icon: 'fa-shield-check',
      clauses: [
        { name: '品牌名称', value: '待确定', key: 'brandName', note: '品牌使用权需有效' },
        { name: '必备证照', value: '营业执照、食品经营许可证', key: 'requiredLicenses' }
      ]
    },
    {
      id: 'grace-period',
      title: '宽限期',
      description: '数据延迟、付款延迟容忍期',
      icon: 'fa-clock',
      clauses: [
        { name: '数据宽限期', value: '10天', key: 'dataGracePeriod' },
        { name: '付款宽限期', value: '10天', key: 'paymentGracePeriod' },
        { name: '征信报送门槛', value: '15天', key: 'creditReportThreshold', note: '超期将上报征信' }
      ]
    },
    {
      id: 'breach',
      title: '违约责任',
      description: '违约情形、违约金、连带责任',
      icon: 'fa-gavel',
      clauses: [
        { name: '严重违约门槛', value: '逾期>30天', key: 'seriousBreachDays' },
        { name: '违约金比例', value: '20%', key: 'breachPenalty', note: '基于联营资金金额' }
      ],
      risks: '门店关停、经营权纠纷、数据造假'
    }
  ],
  fullText: createMicroConnectFullText([
    {
      id: 'catering-specific',
      number: '附加',
      title: '餐饮行业特别约定',
      clauses: [
        {
          text: '联营方应确保门店食品卫生安全，遵守《食品安全法》等相关法律法规，如发生食品安全事故，应在24小时内书面通知投资方。',
          note: '食品安全特别要求',
          keys: []
        },
        {
          text: '联营方应保持门店正常营业，每日营业时间不少于【${businessHours}】，如需调整营业时间或暂停营业，应提前【${notificationDays}】日书面通知投资方。',
          note: '营业时间要求',
          keys: ['businessHours', 'notificationDays']
        }
      ]
    }
  ])
}

// 3. 零售行业 - 使用滴灌通联营协议模板
export const retailTemplate: IndustryTemplate = {
  id: 'retail',
  name: '零售门店',
  icon: 'fa-shopping-bag',
  description: '便利店、专卖店、商超等零售项目',
  color: 'blue',
  defaultParams: {
    // 基础信息
    investmentAmount: '300万元',
    investmentAmountCN: '叁佰万元整',
    fundUsage: '门店装修、货架设备、首批库存及流动资金',
    prerequisites: '门店租赁合同已签署且租期不少于协议期限',
    
    // 收入分成
    businessScope: '商品零售',
    deductions: '政府规费、税金、退换货',
    revenueShareRatio: '12%',
    sharingStartDate: '首笔营业收入产生之日',
    sharingEndDate: '自收入分成期开始日起满48个月',
    terminationReturn: '22%',
    
    // 数据传输
    dataReportFrequency: '每日',
    dataTransmissionDay: 'T+1日12:00前',
    dataSource: 'ERP/收银系统',
    paymentFrequency: '每周',
    paymentDay: '每周一18:00前（上周收入）',
    reconciliationMethod: '按月对账，次月5日前确认',
    
    // 门店信息
    storeName: '待确定',
    storeAddress: '待确定',
    brandName: '待确定',
    requiredLicenses: '营业执照',
    
    // 数据与通知
    dataCollectionMethod: '系统接入+定期报表',
    responseTime: '3个工作日',
    notificationDays: '5',
    
    // 宽限期
    dataGracePeriod: '10',
    paymentGracePeriod: '10',
    creditReportThreshold: '15',
    
    // 违约
    seriousBreachDays: '30',
    breachPenalty: '15%',
    
    // 保密与合规
    confidentialityPeriod: '3',
    complianceEmail: 'compliance@microconnect.com',
    
    // 争议解决
    arbitrationInstitution: '深圳国际仲裁院',
    arbitrationPlace: '深圳',
    
    // 文本
    copies: '四',
    copiesPerParty: '一',
    
    // 行业特定
    inventoryTurnover: '30天',
    minMonthlyRevenue: '30万元'
  },
  modules: [
    {
      id: 'business-arrangement',
      title: '联营合作商业安排',
      description: '资金、分成、门店信息',
      icon: 'fa-coins',
      clauses: [
        { name: '联营资金金额', value: '300万元', key: 'investmentAmount', note: '用于门店建设及运营' },
        { name: '固定分成比例', value: '12%', key: 'revenueShareRatio', note: '基于营业收入' },
        { name: '收入分成期', value: '48个月', key: 'sharingEndDate', note: '自首笔收入产生起' },
        { name: '终止回报率', value: '22%年化', key: 'terminationReturn', note: '提前终止计算标准' }
      ],
      risks: '库存积压、市场竞争、选址风险'
    },
    {
      id: 'data-transmission',
      title: '数据传输与分成方式',
      description: '数据上报、付款频率、对账机制',
      icon: 'fa-chart-line',
      clauses: [
        { name: '数据传输频率', value: '每日', key: 'dataReportFrequency', note: 'T+1日12:00前' },
        { name: '数据来源', value: 'ERP/收银系统', key: 'dataSource', note: '系统自动对接' },
        { name: '付款频率', value: '每周', key: 'paymentFrequency', note: '每周一18:00前' },
        { name: '对账方式', value: '按月对账', key: 'reconciliationMethod', note: '次月5日前确认' }
      ]
    },
    {
      id: 'representations',
      title: '陈述与保证',
      description: '主体资格、门店信息、品牌权利',
      icon: 'fa-shield-check',
      clauses: [
        { name: '品牌名称', value: '待确定', key: 'brandName', note: '品牌使用权需有效' },
        { name: '必备证照', value: '营业执照', key: 'requiredLicenses' }
      ]
    },
    {
      id: 'operation',
      title: '运营管控',
      description: '库存周转、最低营收',
      icon: 'fa-boxes',
      clauses: [
        { name: '最低月营收', value: '30万元', key: 'minMonthlyRevenue' },
        { name: '库存周转', value: '30天内', key: 'inventoryTurnover' }
      ]
    },
    {
      id: 'grace-period',
      title: '宽限期',
      description: '数据延迟、付款延迟容忍期',
      icon: 'fa-clock',
      clauses: [
        { name: '数据宽限期', value: '10天', key: 'dataGracePeriod' },
        { name: '付款宽限期', value: '10天', key: 'paymentGracePeriod' },
        { name: '征信报送门槛', value: '15天', key: 'creditReportThreshold', note: '超期将上报征信' }
      ]
    },
    {
      id: 'breach',
      title: '违约责任',
      description: '违约情形、违约金、连带责任',
      icon: 'fa-gavel',
      clauses: [
        { name: '严重违约门槛', value: '逾期>30天', key: 'seriousBreachDays' },
        { name: '违约金比例', value: '15%', key: 'breachPenalty', note: '基于联营资金金额' }
      ],
      risks: '库存积压、门店关停、数据造假'
    }
  ],
  fullText: createMicroConnectFullText([
    {
      id: 'retail-specific',
      number: '附加',
      title: '零售行业特别约定',
      clauses: [
        {
          text: '联营方应确保库存周转天数不超过【${inventoryTurnover}】，如库存积压严重，应书面说明原因并制定清理计划。',
          note: '库存管理要求',
          keys: ['inventoryTurnover']
        },
        {
          text: '联营方应确保门店月营业收入不低于【${minMonthlyRevenue}】，连续3个月低于此标准需向投资方书面说明原因。',
          note: '最低营收要求',
          keys: ['minMonthlyRevenue']
        }
      ]
    }
  ])
}

// 4. 医美/健康行业 - 使用滴灌通联营协议模板
export const healthcareTemplate: IndustryTemplate = {
  id: 'healthcare',
  name: '医美/健康',
  icon: 'fa-heartbeat',
  description: '医美诊所、健身房、康复中心等项目',
  color: 'pink',
  defaultParams: {
    // 基础信息
    investmentAmount: '800万元',
    investmentAmountCN: '捌佰万元整',
    fundUsage: '场所装修、医疗设备采购、人员培训及流动资金',
    prerequisites: '医疗机构执业许可证已取得且在有效期内',
    
    // 收入分成
    businessScope: '医疗美容/健康服务',
    deductions: '政府规费、税金、医疗保险理赔',
    revenueShareRatio: '18%',
    sharingStartDate: '首笔营业收入产生之日',
    sharingEndDate: '自收入分成期开始日起满36个月',
    terminationReturn: '28%',
    
    // 数据传输
    dataReportFrequency: '每日',
    dataTransmissionDay: 'T+1日12:00前',
    dataSource: 'HIS系统/收银系统',
    paymentFrequency: '每周',
    paymentDay: '每周一18:00前（上周收入）',
    reconciliationMethod: '按月对账，次月5日前确认',
    
    // 门店信息
    storeName: '待确定',
    storeAddress: '待确定',
    brandName: '待确定',
    requiredLicenses: '医疗机构执业许可证、卫生许可证、从业人员资质证书',
    
    // 数据与通知
    dataCollectionMethod: '系统接入+定期报表',
    responseTime: '3个工作日',
    notificationDays: '3',
    
    // 宽限期
    dataGracePeriod: '10',
    paymentGracePeriod: '10',
    creditReportThreshold: '15',
    
    // 违约
    seriousBreachDays: '30',
    breachPenalty: '25%',
    
    // 保密与合规
    confidentialityPeriod: '3',
    complianceEmail: 'compliance@microconnect.com',
    
    // 争议解决
    arbitrationInstitution: '深圳国际仲裁院',
    arbitrationPlace: '深圳',
    
    // 文本
    copies: '四',
    copiesPerParty: '一',
    
    // 行业特定
    licenseRequirement: '医疗机构执业许可证',
    incidentNotice: '24小时',
    minMonthlyRevenue: '50万元'
  },
  modules: [
    {
      id: 'business-arrangement',
      title: '联营合作商业安排',
      description: '资金、分成、机构信息',
      icon: 'fa-coins',
      clauses: [
        { name: '联营资金金额', value: '800万元', key: 'investmentAmount', note: '用于机构建设及运营' },
        { name: '固定分成比例', value: '18%', key: 'revenueShareRatio', note: '基于营业收入' },
        { name: '收入分成期', value: '36个月', key: 'sharingEndDate', note: '自首笔收入产生起' },
        { name: '终止回报率', value: '28%年化', key: 'terminationReturn', note: '提前终止计算标准' }
      ],
      risks: '医疗纠纷、资质吊销、政策变动'
    },
    {
      id: 'data-transmission',
      title: '数据传输与分成方式',
      description: '数据上报、付款频率、对账机制',
      icon: 'fa-chart-line',
      clauses: [
        { name: '数据传输频率', value: '每日', key: 'dataReportFrequency', note: 'T+1日12:00前' },
        { name: '数据来源', value: 'HIS系统/收银系统', key: 'dataSource', note: '系统自动对接' },
        { name: '付款频率', value: '每周', key: 'paymentFrequency', note: '每周一18:00前' },
        { name: '对账方式', value: '按月对账', key: 'reconciliationMethod', note: '次月5日前确认' }
      ]
    },
    {
      id: 'compliance',
      title: '合规要求',
      description: '资质维护、医疗安全、通知义务',
      icon: 'fa-clipboard-check',
      clauses: [
        { name: '资质要求', value: '医疗机构执业许可证', key: 'licenseRequirement' },
        { name: '资质维护', value: '持续有效', key: 'licenseStatus', note: '到期前30日续期' },
        { name: '医疗事故通知', value: '24小时内', key: 'incidentNotice', note: '书面通知投资方' }
      ],
      risks: '医疗纠纷、资质吊销风险'
    },
    {
      id: 'grace-period',
      title: '宽限期',
      description: '数据延迟、付款延迟容忍期',
      icon: 'fa-clock',
      clauses: [
        { name: '数据宽限期', value: '10天', key: 'dataGracePeriod' },
        { name: '付款宽限期', value: '10天', key: 'paymentGracePeriod' },
        { name: '征信报送门槛', value: '15天', key: 'creditReportThreshold', note: '超期将上报征信' }
      ]
    },
    {
      id: 'breach',
      title: '违约责任',
      description: '违约情形、违约金、连带责任',
      icon: 'fa-gavel',
      clauses: [
        { name: '严重违约门槛', value: '逾期>30天', key: 'seriousBreachDays' },
        { name: '违约金比例', value: '25%', key: 'breachPenalty', note: '基于联营资金金额' }
      ],
      risks: '医疗纠纷、资质吊销、数据造假'
    }
  ],
  fullText: createMicroConnectFullText([
    {
      id: 'healthcare-specific',
      number: '附加',
      title: '医美/健康行业特别约定',
      clauses: [
        {
          text: '联营方应确保【${licenseRequirement}】等必要资质在本协议期限内持续有效，资质到期前30日应完成续期手续。',
          note: '资质维护要求',
          keys: ['licenseRequirement']
        },
        {
          text: '如发生医疗事故或医疗纠纷，联营方应在【${incidentNotice}】内书面通知投资方，并及时提供事故处理进展。',
          note: '医疗事故通知',
          keys: ['incidentNotice']
        },
        {
          text: '联营方应确保门店月营业收入不低于【${minMonthlyRevenue}】，连续3个月低于此标准需向投资方书面说明原因。',
          note: '最低营收要求',
          keys: ['minMonthlyRevenue']
        },
        {
          text: '如联营方的医疗机构执业许可证被吊销、暂停或限制，视为严重违约。',
          note: '资质风险',
          keys: []
        }
      ]
    }
  ])
}

// 5. 教育培训行业 - 使用滴灌通联营协议模板
export const educationTemplate: IndustryTemplate = {
  id: 'education',
  name: '教育培训',
  icon: 'fa-graduation-cap',
  description: '培训机构、职业教育、兴趣班等项目',
  color: 'green',
  defaultParams: {
    // 基础信息
    investmentAmount: '400万元',
    investmentAmountCN: '肆佰万元整',
    fundUsage: '场地装修、教学设备、师资培训及流动资金',
    prerequisites: '办学许可证已取得且在有效期内（如适用）',
    
    // 收入分成
    businessScope: '教育培训服务',
    deductions: '政府规费、税金、退费',
    revenueShareRatio: '20%',
    sharingStartDate: '首笔营业收入产生之日',
    sharingEndDate: '自收入分成期开始日起满36个月',
    terminationReturn: '25%',
    
    // 数据传输
    dataReportFrequency: '每日',
    dataTransmissionDay: 'T+1日12:00前',
    dataSource: '教务管理系统/收银系统',
    paymentFrequency: '每周',
    paymentDay: '每周一18:00前（上周收入）',
    reconciliationMethod: '按月对账，次月5日前确认',
    
    // 门店信息
    storeName: '待确定',
    storeAddress: '待确定',
    brandName: '待确定',
    requiredLicenses: '营业执照、办学许可证（如适用）',
    
    // 数据与通知
    dataCollectionMethod: '系统接入+定期报表',
    responseTime: '3个工作日',
    notificationDays: '5',
    
    // 宽限期
    dataGracePeriod: '10',
    paymentGracePeriod: '10',
    creditReportThreshold: '15',
    
    // 违约
    seriousBreachDays: '30',
    breachPenalty: '20%',
    
    // 保密与合规
    confidentialityPeriod: '3',
    complianceEmail: 'compliance@microconnect.com',
    
    // 争议解决
    arbitrationInstitution: '深圳国际仲裁院',
    arbitrationPlace: '深圳',
    
    // 文本
    copies: '四',
    copiesPerParty: '一',
    
    // 行业特定
    minStudentCount: '200人',
    refundPolicy: '开课前全额退款，开课后按课时比例退款'
  },
  modules: [
    {
      id: 'business-arrangement',
      title: '联营合作商业安排',
      description: '资金、分成、机构信息',
      icon: 'fa-coins',
      clauses: [
        { name: '联营资金金额', value: '400万元', key: 'investmentAmount', note: '用于机构建设及运营' },
        { name: '固定分成比例', value: '20%', key: 'revenueShareRatio', note: '基于营业收入' },
        { name: '收入分成期', value: '36个月', key: 'sharingEndDate', note: '自首笔收入产生起' },
        { name: '终止回报率', value: '25%年化', key: 'terminationReturn', note: '提前终止计算标准' }
      ],
      risks: '招生不达标、政策风险、退费风险'
    },
    {
      id: 'data-transmission',
      title: '数据传输与分成方式',
      description: '数据上报、付款频率、对账机制',
      icon: 'fa-chart-line',
      clauses: [
        { name: '数据传输频率', value: '每日', key: 'dataReportFrequency', note: 'T+1日12:00前' },
        { name: '数据来源', value: '教务管理系统/收银系统', key: 'dataSource', note: '系统自动对接' },
        { name: '付款频率', value: '每周', key: 'paymentFrequency', note: '每周一18:00前' },
        { name: '对账方式', value: '按月对账', key: 'reconciliationMethod', note: '次月5日前确认' }
      ]
    },
    {
      id: 'operation',
      title: '运营管控',
      description: '招生要求、退费政策',
      icon: 'fa-chalkboard-teacher',
      clauses: [
        { name: '最低学员数', value: '200人', key: 'minStudentCount', note: '在读学员数' },
        { name: '退费政策', value: '开课前全额，开课后按比例', key: 'refundPolicy' }
      ],
      risks: '招生不达标、政策风险'
    },
    {
      id: 'grace-period',
      title: '宽限期',
      description: '数据延迟、付款延迟容忍期',
      icon: 'fa-clock',
      clauses: [
        { name: '数据宽限期', value: '10天', key: 'dataGracePeriod' },
        { name: '付款宽限期', value: '10天', key: 'paymentGracePeriod' },
        { name: '征信报送门槛', value: '15天', key: 'creditReportThreshold', note: '超期将上报征信' }
      ]
    },
    {
      id: 'breach',
      title: '违约责任',
      description: '违约情形、违约金、连带责任',
      icon: 'fa-gavel',
      clauses: [
        { name: '严重违约门槛', value: '逾期>30天', key: 'seriousBreachDays' },
        { name: '违约金比例', value: '20%', key: 'breachPenalty', note: '基于联营资金金额' }
      ],
      risks: '招生不达标、政策变化、退费纠纷'
    }
  ],
  fullText: createMicroConnectFullText([
    {
      id: 'education-specific',
      number: '附加',
      title: '教育培训行业特别约定',
      clauses: [
        {
          text: '联营方应确保在读学员数不低于【${minStudentCount}】，连续3个月低于此标准需向投资方书面说明原因。',
          note: '学员数量要求',
          keys: ['minStudentCount']
        },
        {
          text: '联营方应严格执行退费政策：【${refundPolicy}】，不得以任何理由拒绝符合条件的退费申请。',
          note: '退费政策',
          keys: ['refundPolicy']
        },
        {
          text: '联营方收取的预付学费应按规定存入监管账户，用于日常运营支出，不得挪作他用。',
          note: '预付款监管',
          keys: []
        },
        {
          text: '如教育主管部门出台新规导致联营方无法正常经营，双方应友好协商调整协议条款或提前终止。',
          note: '政策风险',
          keys: []
        }
      ]
    }
  ])
}

// 导出所有模板
export const industryTemplates: Record<string, IndustryTemplate> = {
  concert: concertTemplate,
  catering: cateringTemplate,
  retail: retailTemplate,
  healthcare: healthcareTemplate,
  education: educationTemplate
}

export const templateList = Object.values(industryTemplates)
