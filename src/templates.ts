// 收入分成融资 - 行业合同模板系统

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

// ==================== 行业模板定义 ====================

// 1. 演唱会/演出行业
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

// 2. 餐饮行业
export const cateringTemplate: IndustryTemplate = {
  id: 'catering',
  name: '餐饮连锁',
  icon: 'fa-utensils',
  description: '餐厅、奶茶店、咖啡厅等餐饮项目',
  color: 'orange',
  defaultParams: {
    investmentAmount: '500万元',
    revenueShareRatio: '15%',
    terminationReturn: '25%',
    breachPenalty: '20%',
    sharingPeriod: '36个月',
    minDailyRevenue: '5,000元',
    approvalThreshold: '5万元',
    dataReportFrequency: '每日',
    auditDays: '30',
    brandUsageFee: '3%'
  },
  modules: [
    {
      id: 'investment',
      title: '投资架构',
      description: '资金结构、门店数量、投资期限',
      icon: 'fa-coins',
      clauses: [
        { name: '投资金额', value: '500万元', key: 'investmentAmount', note: '用于门店装修、设备、首批物料' },
        { name: '投资门店', value: '待确定', key: 'storeCount', note: '覆盖门店数量' },
        { name: '审批阈值', value: '>5万元', key: 'approvalThreshold', note: '超过需投资方同意' }
      ],
      risks: '门店选址风险、客流量不稳定'
    },
    {
      id: 'revenue',
      title: '收入分成',
      description: '分成比例、分成期限、保底条款',
      icon: 'fa-chart-pie',
      clauses: [
        { name: '分成比例', value: '15%', key: 'revenueShareRatio', note: '基于门店营业收入' },
        { name: '分成期限', value: '36个月', key: 'sharingPeriod', note: '自首笔分成之日起' },
        { name: '终止回报率', value: '25%年化', key: 'terminationReturn', note: '提前终止适用' },
        { name: '数据上报', value: '每日', key: 'dataReportFrequency', note: '基于POS系统' }
      ],
      risks: '收入波动、季节性影响'
    },
    {
      id: 'operation',
      title: '运营管控',
      description: '营业时间、产品标准、卫生要求',
      icon: 'fa-store',
      clauses: [
        { name: '最低日营收', value: '5,000元', key: 'minDailyRevenue', note: '低于需书面说明' },
        { name: '品牌使用费', value: '3%', key: 'brandUsageFee', note: '如适用加盟品牌' },
        { name: '营业时间', value: '10:00-22:00', key: 'businessHours', note: '最低营业时长' }
      ],
      risks: '运营不达标、品牌形象受损'
    },
    {
      id: 'breach',
      title: '违约责任',
      description: '违约情形、违约金、提前终止',
      icon: 'fa-gavel',
      clauses: [
        { name: '违约金比例', value: '20%', key: 'breachPenalty', note: '基于投资金额' },
        { name: '提前终止', value: '需30天通知', key: 'terminationNotice', note: '加补偿金' }
      ],
      risks: '门店关停、经营权纠纷'
    }
  ],
  fullText: [
    {
      id: 'investment',
      number: '一',
      title: '投资安排',
      clauses: [
        {
          text: '投资方向融资方提供收入分成融资款，金额为人民币【${investmentAmount}】，用于门店建设及运营。',
          keys: ['investmentAmount']
        },
        {
          text: '融资方如需支付单笔金额超过【${approvalThreshold}】的支出，需提前获得投资方书面同意。',
          keys: ['approvalThreshold']
        }
      ]
    },
    {
      id: 'revenue',
      number: '二',
      title: '收入分成',
      clauses: [
        {
          text: '融资方应按照门店营业收入的【${revenueShareRatio}】向投资方进行分成，分成期限为【${sharingPeriod}】。',
          keys: ['revenueShareRatio', 'sharingPeriod']
        },
        {
          text: '如融资方提前终止协议，应向投资方支付补偿金，计算方式为：未回收本金×（1+${terminationReturn}÷12×已分成月数）。',
          keys: ['terminationReturn']
        }
      ]
    },
    {
      id: 'operation',
      number: '三',
      title: '运营要求',
      clauses: [
        {
          text: '融资方应确保门店日均营业收入不低于【${minDailyRevenue}】，连续30日低于此标准需向投资方书面说明原因。',
          keys: ['minDailyRevenue']
        }
      ]
    },
    {
      id: 'breach',
      number: '四',
      title: '违约责任',
      clauses: [
        {
          text: '如融资方发生严重违约，投资方有权解除协议，要求退还剩余本金，并支付投资金额的【${breachPenalty}】作为违约金。',
          keys: ['breachPenalty']
        }
      ]
    }
  ]
}

// 3. 零售行业
export const retailTemplate: IndustryTemplate = {
  id: 'retail',
  name: '零售门店',
  icon: 'fa-shopping-bag',
  description: '便利店、专卖店、商超等零售项目',
  color: 'blue',
  defaultParams: {
    investmentAmount: '300万元',
    revenueShareRatio: '12%',
    terminationReturn: '22%',
    breachPenalty: '15%',
    sharingPeriod: '48个月',
    minMonthlyRevenue: '30万元',
    approvalThreshold: '3万元',
    inventoryTurnover: '30天'
  },
  modules: [
    {
      id: 'investment',
      title: '投资架构',
      description: '资金结构、门店覆盖、投资期限',
      icon: 'fa-coins',
      clauses: [
        { name: '投资金额', value: '300万元', key: 'investmentAmount' },
        { name: '审批阈值', value: '>3万元', key: 'approvalThreshold' }
      ]
    },
    {
      id: 'revenue',
      title: '收入分成',
      description: '分成比例、分成期限',
      icon: 'fa-chart-pie',
      clauses: [
        { name: '分成比例', value: '12%', key: 'revenueShareRatio' },
        { name: '分成期限', value: '48个月', key: 'sharingPeriod' },
        { name: '终止回报率', value: '22%年化', key: 'terminationReturn' }
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
      id: 'breach',
      title: '违约责任',
      description: '违约金、终止条款',
      icon: 'fa-gavel',
      clauses: [
        { name: '违约金比例', value: '15%', key: 'breachPenalty' }
      ]
    }
  ],
  fullText: [
    {
      id: 'investment',
      number: '一',
      title: '投资安排',
      clauses: [
        { text: '投资方提供收入分成融资款【${investmentAmount}】。', keys: ['investmentAmount'] }
      ]
    },
    {
      id: 'revenue',
      number: '二',
      title: '收入分成',
      clauses: [
        { text: '融资方按营业收入的【${revenueShareRatio}】分成，期限【${sharingPeriod}】。', keys: ['revenueShareRatio', 'sharingPeriod'] }
      ]
    }
  ]
}

// 4. 医美/健康行业
export const healthcareTemplate: IndustryTemplate = {
  id: 'healthcare',
  name: '医美/健康',
  icon: 'fa-heartbeat',
  description: '医美诊所、健身房、康复中心等项目',
  color: 'pink',
  defaultParams: {
    investmentAmount: '800万元',
    revenueShareRatio: '18%',
    terminationReturn: '28%',
    breachPenalty: '25%',
    sharingPeriod: '36个月',
    minMonthlyRevenue: '50万元',
    approvalThreshold: '10万元',
    licenseRequirement: '医疗机构执业许可证'
  },
  modules: [
    {
      id: 'investment',
      title: '投资架构',
      description: '资金结构、资质要求',
      icon: 'fa-coins',
      clauses: [
        { name: '投资金额', value: '800万元', key: 'investmentAmount' },
        { name: '资质要求', value: '医疗机构执业许可证', key: 'licenseRequirement' },
        { name: '审批阈值', value: '>10万元', key: 'approvalThreshold' }
      ]
    },
    {
      id: 'revenue',
      title: '收入分成',
      description: '分成比例、分成期限',
      icon: 'fa-chart-pie',
      clauses: [
        { name: '分成比例', value: '18%', key: 'revenueShareRatio' },
        { name: '分成期限', value: '36个月', key: 'sharingPeriod' },
        { name: '终止回报率', value: '28%年化', key: 'terminationReturn' }
      ]
    },
    {
      id: 'compliance',
      title: '合规要求',
      description: '资质维护、医疗安全',
      icon: 'fa-clipboard-check',
      clauses: [
        { name: '资质维护', value: '持续有效', key: 'licenseStatus' },
        { name: '医疗事故', value: '24小时内通知', key: 'incidentNotice' }
      ],
      risks: '医疗纠纷、资质吊销风险'
    },
    {
      id: 'breach',
      title: '违约责任',
      description: '违约金、特殊终止',
      icon: 'fa-gavel',
      clauses: [
        { name: '违约金比例', value: '25%', key: 'breachPenalty' }
      ]
    }
  ],
  fullText: [
    {
      id: 'investment',
      number: '一',
      title: '投资安排',
      clauses: [
        { text: '投资方提供收入分成融资款【${investmentAmount}】。', keys: ['investmentAmount'] }
      ]
    },
    {
      id: 'revenue',
      number: '二',
      title: '收入分成',
      clauses: [
        { text: '融资方按营业收入的【${revenueShareRatio}】分成，期限【${sharingPeriod}】。', keys: ['revenueShareRatio', 'sharingPeriod'] }
      ]
    }
  ]
}

// 5. 教育培训行业
export const educationTemplate: IndustryTemplate = {
  id: 'education',
  name: '教育培训',
  icon: 'fa-graduation-cap',
  description: '培训机构、职业教育、兴趣班等项目',
  color: 'green',
  defaultParams: {
    investmentAmount: '400万元',
    revenueShareRatio: '20%',
    terminationReturn: '25%',
    breachPenalty: '20%',
    sharingPeriod: '36个月',
    minStudentCount: '200人',
    approvalThreshold: '5万元',
    refundPolicy: '30天无理由退款'
  },
  modules: [
    {
      id: 'investment',
      title: '投资架构',
      icon: 'fa-coins',
      description: '资金结构、办学资质',
      clauses: [
        { name: '投资金额', value: '400万元', key: 'investmentAmount' },
        { name: '审批阈值', value: '>5万元', key: 'approvalThreshold' }
      ]
    },
    {
      id: 'revenue',
      title: '收入分成',
      icon: 'fa-chart-pie',
      description: '分成比例、分成期限',
      clauses: [
        { name: '分成比例', value: '20%', key: 'revenueShareRatio' },
        { name: '分成期限', value: '36个月', key: 'sharingPeriod' },
        { name: '终止回报率', value: '25%年化', key: 'terminationReturn' }
      ]
    },
    {
      id: 'operation',
      title: '运营管控',
      icon: 'fa-chalkboard-teacher',
      description: '招生要求、退费政策',
      clauses: [
        { name: '最低学员数', value: '200人', key: 'minStudentCount' },
        { name: '退费政策', value: '30天无理由退款', key: 'refundPolicy' }
      ],
      risks: '招生不达标、政策风险'
    },
    {
      id: 'breach',
      title: '违约责任',
      icon: 'fa-gavel',
      description: '违约金、终止条款',
      clauses: [
        { name: '违约金比例', value: '20%', key: 'breachPenalty' }
      ]
    }
  ],
  fullText: [
    {
      id: 'investment',
      number: '一',
      title: '投资安排',
      clauses: [
        { text: '投资方提供收入分成融资款【${investmentAmount}】。', keys: ['investmentAmount'] }
      ]
    },
    {
      id: 'revenue',
      number: '二',
      title: '收入分成',
      clauses: [
        { text: '融资方按营业收入的【${revenueShareRatio}】分成，期限【${sharingPeriod}】。', keys: ['revenueShareRatio', 'sharingPeriod'] }
      ]
    }
  ]
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
