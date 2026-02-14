// 收入分成融资 - 行业合同模板系统
// 基于滴灌通联营协议（境内B类资产）标准模板 V3 - MCILC260126
// 更新时间: 2026-02-14

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
  importance?: 'critical' | 'high' | 'medium' | 'low' // 重要程度标识
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
    isImportant?: boolean // 重要条款标识
  }[]
}

// ==================== 滴灌通联营协议（境内B类资产）标准模板 ====================
// 基于 MCILC260126 版本

// 通用默认参数（所有行业共享）
const commonDefaultParams = {
  // 签约主体信息
  contractNumber: '待生成',
  dgtSigningEntity: '滴灌通管理（深圳）有限公司',
  dgtCreditCode: '91440300MA5XXXXXX',
  dgtAddress: '深圳市前海深港合作区',
  dgtLegalRep: '待确定',
  
  // 联营方信息
  mguName: '待确定',
  mguCreditCode: '待确定',
  mguAddress: '待确定',
  mguRepType: '法定代表人',
  mguRep: '待确定',
  mguController: '待确定',
  mguControllerIdCard: '待确定',
  
  // 品牌方/代理商信息（可选）
  brandName: '待确定',
  brandCreditCode: '待确定',
  brandAddress: '待确定',
  brandRepType: '法定代表人',
  brandRep: '待确定',
  brandController: '待确定',
  brandControllerIdCard: '待确定',
  
  // 联营资金与分成
  investmentAmount: '500万元',
  investmentAmountCN: '伍佰万元整',
  fundUsage: '门店经营、设备采购及流动资金',
  
  // 联营方收入定义
  revenueDefinition: '扣除所有税项前的全部营业收入（包含主营业务收入及其他业务收入）',
  revenueShareRatio: '15%',
  
  // 收入分成期
  sharingStartDate: '滴灌通发出本次联营资金出资指令之日',
  sharingEndDate: '【】年【】月【】日',
  annualReturnRate: '25%',
  
  // 提前终止
  earlyTerminationNoticeDays: '7',
  earlyTerminationCompensation: '本次联营资金+（本次联营资金×${annualReturnRate}%÷360×(已经历收入分成天数+7)）',
  
  // 亏损闭店
  lossThresholdMonths: '3',
  lossThresholdAmount: '待确定',
  noEarlyCloseMonths: '6',
  
  // 数据传输
  dataTransmissionMethod: '系统自动传输',
  dataTransmissionFrequency: '每自然日',
  dataTransmissionDay: '收入分成起始日后的每个自然日',
  dataSourceSystem: '待确定',
  
  // 分成付款
  paymentMethod: '系统自动打款',
  paymentFrequency: '每自然日',
  paymentDay: '收入分成起始日后的每个自然日',
  
  // 对账
  reconciliationDeadline: '每月15号前',
  reconciliationDifferenceDays: '7',
  
  // 联营方收款账户
  mguAccountName: '待确定',
  mguAccountNumber: '待确定',
  mguBankName: '待确定',
  mguBankBranch: '待确定',
  
  // 滴灌通收款账户
  dgtAccountName: '待确定',
  dgtAccountNumber: '待确定',
  dgtBankName: '待确定',
  dgtBankBranch: '待确定',
  
  // 门店/设备信息
  storeName: '待确定',
  storeAddress: '待确定',
  equipmentType: '待确定',
  equipmentCount: '待确定',
  
  // 违约责任
  breachPenaltyRate: '20%',
  seriousBreachDays: '30',
  
  // 保密期限
  confidentialityPeriod: '3年',
  
  // 通知
  notificationDays: '5',
  
  // 争议解决
  arbitrationInstitution: '深圳国际仲裁院',
  arbitrationPlace: '深圳',
  
  // 协议文本
  copies: '四',
  copiesPerParty: '一'
}

// ==================== 创建标准联营协议完整文本 ====================
const createStandardFullText = (industrySpecificClauses?: ContractSection[]): ContractSection[] => [
  {
    id: 'business-arrangement',
    number: '一',
    title: '联营合作商业安排',
    clauses: [
      {
        text: '联营资金金额：人民币【${investmentAmount}】（大写：【${investmentAmountCN}】）。',
        note: '滴灌通提供的联营资金总额',
        keys: ['investmentAmount', 'investmentAmountCN'],
        isImportant: true
      },
      {
        text: '联营资金用途：联营方和其他方共同承诺本次联营资金仅可被用于联营方【${fundUsage}】，不得挪用（包括挪用至个人账户等）或未按前述约定用途使用，且滴灌通有权随时对联营资金的实际使用情况进行检查。',
        note: '资金用途限制',
        keys: ['fundUsage']
      },
      {
        text: '前置条件：滴灌通向联营方提供本次联营资金的前置条件为：（1）滴灌通取得关于提供本次联营资金的内部审批；（2）滴灌通与联营方、其他方及其他主体的数据传输方案与分账方案均已完成且符合滴灌通要求；（3）联营方和其他方在滴灌通提供本次联营资金前均不存在任何违反本协议陈述保证及承诺或其它约定的情形；（4）联营方向滴灌通提供门店出资的资金到账证明、资金用途证明及门店资产价值清单及报价表；（5）品牌方已就其对联营方的特许经营事宜完成特许经营备案；（6）按照滴灌通要求提供完毕附件三资料；（7）各方同意的其它情形。',
        note: '资金到位的前提条件',
        keys: []
      },
      {
        text: '联营方收入定义：本协议所指的"联营方收入"或"全部收入"应包括联营方【${revenueDefinition}】。',
        note: '收入计算口径',
        keys: ['revenueDefinition'],
        isImportant: true
      },
      {
        text: '分成比例：在本协议的收入分成期内，联营方和/或其他方应按照联营方收入的【${revenueShareRatio}】向滴灌通进行分成。',
        note: '固定分成比例',
        keys: ['revenueShareRatio'],
        isImportant: true
      },
      {
        text: '收入分成期：本协议收入分成期自滴灌通"收入分成起始日"至【${sharingEndDate}】止。"收入分成起始日"为【${sharingStartDate}】。',
        note: '分成期限',
        keys: ['sharingStartDate', 'sharingEndDate'],
        isImportant: true
      },
      {
        text: '分成终止触发事项：虽有前述约定，在收入分成期内，滴灌通累计实际取得的收入分成金额合计达到"滴灌通已出资的联营资金×(1+【${annualReturnRate}】÷360×已联营天数)"金额的，收入分成期自该条件达成之日的前一日终止。',
        note: '分成终止条件（年化回报率）',
        keys: ['annualReturnRate'],
        isImportant: true
      },
      {
        text: '协议期限：自收入分成期终止之日，本协议终止。除本协议另有约定外，在协议期限内联营方须经滴灌通确认同意方可提前结束联营合作项下门店的经营。',
        note: '协议期限',
        keys: []
      },
      {
        text: '提前终止：各方确认，联营方和/或其他方主张提前终止本协议的行为构成对本协议收入分成期约定的违反。在收入分成期内，联营方和/或其他方若需提前终止本协议，其应提前【${earlyTerminationNoticeDays}】个自然日向滴灌通发出书面通知，且联营方和/或其他方应于发出终止本协议通知之日起【${earlyTerminationNoticeDays}】个自然日内的16点前，向滴灌通支付补偿金。补偿金=【${earlyTerminationCompensation}】。',
        note: '提前终止条款',
        keys: ['earlyTerminationNoticeDays', 'earlyTerminationCompensation'],
        isImportant: true
      },
      {
        text: '亏损闭店终止联营：联营方在收入分成期内连续【${lossThresholdMonths}】个月联营收入低于【${lossThresholdAmount}】元，拟结束门店经营的，联营方和/或其他方应在拟结束门店经营前1个月书面通知滴灌通，并提供包括但不限于（1）联营方在收入分成期内的财务报表，及（2）联营方的租约解除协议或业务平台终止合作证明，（3）员工及门店设备撤出经营场所的证明或滴灌通认可的其他主体出具的证明文件，（4）收入分成期内销售订单明细、银行流水或滴灌通认可的其他文件。联营方和/或其他方确认，自收入分成起始日起【${noEarlyCloseMonths}】个月内，不存在可能导致门店提前结束经营的重大不利影响。',
        note: '亏损闭店条款',
        keys: ['lossThresholdMonths', 'lossThresholdAmount', 'noEarlyCloseMonths'],
        isImportant: true
      }
    ]
  },
  {
    id: 'data-transmission',
    number: '一（续）',
    title: '数据传输及收入分成',
    clauses: [
      {
        text: '数据传输方式：【${dataTransmissionMethod}】。',
        note: '系统自动传输/手工上报',
        keys: ['dataTransmissionMethod']
      },
      {
        text: '数据传输频率：数据传输应按照【${dataTransmissionFrequency}】一次的频率进行传输。',
        note: '传输频率',
        keys: ['dataTransmissionFrequency']
      },
      {
        text: '数据传输时间：【${dataTransmissionDay}】为"数据传输日"。',
        note: '具体传输时间点',
        keys: ['dataTransmissionDay']
      },
      {
        text: '数据传输来源系统：【${dataSourceSystem}】。',
        note: '数据来源系统',
        keys: ['dataSourceSystem']
      },
      {
        text: '分成付款方式：【${paymentMethod}】。',
        note: '系统自动打款/手动分账',
        keys: ['paymentMethod']
      },
      {
        text: '分成付款频率：收入分成款应按照【${paymentFrequency}】一次的频率进行计算及支付。',
        note: '付款频率',
        keys: ['paymentFrequency']
      },
      {
        text: '分成付款时间：【${paymentDay}】为"分成付款日"。',
        note: '具体付款时间点',
        keys: ['paymentDay']
      },
      {
        text: '对账方案：联营方和/或其他方应在【${reconciliationDeadline}】完成对上个自然月数据对账和确认；若联营方和/或其他方对数据存在疑问，应在前述日期内以书面形式向滴灌通提出申诉；超出上述期限的，视为联营方和/或其他方已认可对应数据准确无误。如对账后发现联营方实际打款金额少于滴灌通应分而未分金额的，联营方应当自收到滴灌通通知起后【${reconciliationDifferenceDays}】个自然日内向滴灌通补齐差额。',
        note: '对账机制',
        keys: ['reconciliationDeadline', 'reconciliationDifferenceDays']
      }
    ]
  },
  {
    id: 'account-info',
    number: '一（续）',
    title: '账户信息',
    clauses: [
      {
        text: '联营方收款账户信息：户名【${mguAccountName}】，账号【${mguAccountNumber}】，开户行【${mguBankName}】，开户支行【${mguBankBranch}】。',
        note: '联营方收款账户',
        keys: ['mguAccountName', 'mguAccountNumber', 'mguBankName', 'mguBankBranch']
      },
      {
        text: '若联营方拟变更收款账户信息，联营方和/或其他方应当及时书面通知滴灌通并经滴灌通确认。滴灌通向上述联营方收款账户完成本次联营资金的划转，即视为滴灌通已完成本协议约定的本次联营资金的提供义务。',
        note: '账户变更',
        keys: []
      },
      {
        text: '滴灌通分成款收款账户信息：户名【${dgtAccountName}】，账号【${dgtAccountNumber}】，开户行【${dgtBankName}】，开户支行【${dgtBankBranch}】。',
        note: '滴灌通收款账户',
        keys: ['dgtAccountName', 'dgtAccountNumber', 'dgtBankName', 'dgtBankBranch']
      },
      {
        text: '发票开具：在进行年度核算时，当滴灌通累计取得的分成金额达到或超过滴灌通累计实际已提供联营资金金额后，就超过部分的分成收入，滴灌通同意根据届时适用的相关法律规定、相应主管部门的要求及联营方开票信息向联营方开具普通发票或其他凭证。',
        note: '发票开具',
        keys: []
      }
    ]
  },
  {
    id: 'representations',
    number: '二',
    title: '陈述、保证及承诺',
    clauses: [
      {
        text: '各方的陈述、保证及承诺：各方均具有适当的法律资格和法律能力签署、交付并履行本协议，可以独立地作为一方诉讼、仲裁主体。',
        note: '主体资格',
        keys: []
      },
      {
        text: '各方均具备签署及履行本协议的所有必要的能力、权力及授权，本协议经各方签署后构成对其有约束力的法律义务。',
        note: '签署能力',
        keys: []
      },
      {
        text: '本协议的签署及履行均不会违反各方的组织文件或适用法律。',
        note: '合法性保证',
        keys: []
      },
      {
        text: '各方确认就本次联营合作作出如附件二所述的特别声明。',
        note: '特别声明确认',
        keys: []
      },
      {
        text: '针对本次联营合作，联营方和其他方共同且连带地向滴灌通作出如附件二所述的进一步陈述、保证及承诺。',
        note: '连带保证',
        keys: [],
        isImportant: true
      }
    ]
  },
  {
    id: 'data-collection',
    number: '三',
    title: '信息收集和提供',
    clauses: [
      {
        text: '联营方和其他方同意直接或授权相关方间接向滴灌通持续提供和同步滴灌通所要求的数据和信息，并同意滴灌通和/或其境内外关联方有权自行收集（包括从联营方、其他方、政府相关部门或其他第三方收集）、管理和使用联营方和其他方与联营合作有关的所有数据和信息（"联营合作信息"）。',
        note: '数据授权',
        keys: []
      },
      {
        text: '联营方和/或其他方同意滴灌通将联营合作信息提供给滴灌通境内外关联方及第三方（包括但不限于滴灌通及其关联方的外部顾问和中介机构、潜在/间接投资者及其外部顾问和中介机构、监管机构等），并同意滴灌通将联营合作信息用于了解联营方和/或其他方的经营情况、统计分析并形成统计数据/图表/风险评级并对外公开与签署、履行本协议以及维护滴灌通在本协议项下权益相关的其他用途。',
        note: '信息使用授权',
        keys: []
      },
      {
        text: '如果联营方和/或其他方与滴灌通和/或征信机构(包括但不限于百行征信有限公司等)有相应授权协议或安排，基于该授权与本协议的相关约定，滴灌通会对联营方和/或其他方的联营合作信息及违约相关信息进行综合统计、分析或加工处理并将数据处理结果提供给前述征信机构，或直接将联营方和/或其他方的联营合作信息及违约相关信息报送前述征信机构，用于投资决策、风险管理等目的。',
        note: '征信报送授权',
        keys: [],
        isImportant: true
      }
    ]
  },
  {
    id: 'rights-obligations',
    number: '四',
    title: '各方权利义务',
    clauses: [
      {
        text: '联营方负责本协议项下联营合作业务的日常经营并应以其自身的名义对外经营，滴灌通不参与联营方的日常经营决策。在协议期限内，未事先经滴灌通书面同意，联营方不得无故停业或歇业或变更联营合作业务内容（包括变更主营业务品类等）。',
        note: '经营独立性',
        keys: []
      },
      {
        text: '各方一致同意，在协议期限内，联营方和/或其他方不得执行以下行为：（1）联营方变更实际控制人或控股股东或个体户经营者（如有）；（2）联营方转让旗下品牌经营权、联营方品牌经营授权/许可到期不再续约等可能影响联营方主营业务收入的行为；（3）联营方将联营方收入向第三方进行出售、分成、贴现、保理等处理从而可能影响本次联营合作或本协议项下滴灌通的收入分成权利的行为；（4）联营方未征得滴灌通事先书面同意而变更重要经营事项（包括但不限于变更【${storeName}】经营场地、增加或减少【${equipmentType}】数量、停业、歇业、变更联营合作业务内容、变更经营范围、减少注册资本、经营权/控制权变更/转让、缩短或变更租赁合同导致滴灌通协议项下权益受损的，以及其他导致或可能导致滴灌通在本协议项下的权利或利益受到重大不利影响的资产处置与新增对外偿还债务等）。',
        note: '重大事项限制',
        keys: ['storeName', 'equipmentType'],
        isImportant: true
      },
      {
        text: '若联营方和/或其他方违反本协议约定执行了以上行为，则：1）滴灌通有权要求联营方、其他方向滴灌通支付一笔补偿金以提前解除本协议；2）针对情形（1），滴灌通有权要求与联营方的新实际控制人或新控股股东签署补充协议，由新实际控制人或新控股股东加入本协议并承担本协议项下其他方的相关权利及义务。联营方、其他方应在滴灌通发出前述要求的10个自然日内配合完成前述处理方案的协商及执行。',
        note: '违反重大事项限制的后果',
        keys: [],
        isImportant: true
      },
      {
        text: '联营方、其他方应确保协议期限内所有的联营方收入均及时、如实、准确、完整反映到相关收入情况和流水证明文件中。联营方、其他方不得以其他方式（包括以第三方或者员工个人名义代收的方式）代为收取任何联营方收入。',
        note: '收入完整性保证',
        keys: [],
        isImportant: true
      },
      {
        text: '若本次联营合作采用系统自动分账作为分成付款方式，联营方和其他方应充分授权并配合滴灌通指定的第三方机构对联营方收入按本协议约定自动进行分成，且不得自行更改任何可能影响前述分成的安排，包括更改分成比例、变更/注销银行账户或撤销银行授权等。',
        note: '自动分账配合义务',
        keys: []
      },
      {
        text: '滴灌通有权追踪联营方和其他方履行本协议的情况并追踪异常情况。前述追踪情况包括但不限于联营方销售收入明细数据、销售来源账号订单明细、联营方经营数据、财务流水、联营方经营异常情况及联营方重要事项，且联营方和其他方应当配合并充分协助滴灌通完成该等追踪工作，联营方和/或其他方应在滴灌通提出要求后的【${notificationDays}】个自然日内提供滴灌通要求的全部资料。',
        note: '追踪配合义务',
        keys: ['notificationDays']
      }
    ]
  },
  {
    id: 'breach',
    number: '五',
    title: '违约责任',
    clauses: [
      {
        text: '以下情形构成联营方和/或其他方的严重违约：（1）联营方和/或其他方挪用本次联营资金；（2）联营方和/或其他方通过私设收银账号（包括POS账号、银行账号）、虚构交易、篡改收入数据等方式隐藏、转移或挪用联营方收入；（3）联营方和/或其他方延迟或者未按时依约报送数据（含延迟超过【${seriousBreachDays}】天）或未按约定支付收入分成款（含逾期超过【${seriousBreachDays}】天）；（4）联营方和/或其他方违反本协议做出的陈述、保证和承诺；（5）联营方和/或其他方存在违法违规经营行为或涉及任何诉讼、仲裁、行政处罚或任何形式的民事或刑事调查或程序，可能对滴灌通的权利造成重大不利影响；（6）其他严重损害滴灌通在本协议项下权益的行为。',
        note: '严重违约情形',
        keys: ['seriousBreachDays'],
        isImportant: true
      },
      {
        text: '如联营方和/或其他方发生本条所述严重违约，滴灌通有权：（1）单方解除/终止本协议；（2）要求联营方和/或其他方退还全部本次联营资金，并向滴灌通支付本次联营资金金额的【${breachPenaltyRate}】作为违约金；（3）向征信机构报送联营方和/或其他方的违约相关信息；（4）采取其他法律措施维护自身权益。',
        note: '严重违约后果',
        keys: ['breachPenaltyRate'],
        isImportant: true
      },
      {
        text: '联营方、其他方及其实际控制人对本协议项下的全部债务承担共同且连带责任。',
        note: '连带责任',
        keys: [],
        isImportant: true
      }
    ]
  },
  {
    id: 'confidentiality',
    number: '六',
    title: '保密',
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
        text: '本保密义务在本协议终止后【${confidentialityPeriod}】内继续有效。',
        note: '保密期限',
        keys: ['confidentialityPeriod']
      }
    ]
  },
  {
    id: 'notice',
    number: '七',
    title: '通知',
    clauses: [
      {
        text: '各方的联络地址、联络方式等见附件三。任何一方变更联络信息的，应在变更后【${notificationDays}】个自然日内书面通知其他方。',
        note: '联络信息',
        keys: ['notificationDays']
      },
      {
        text: '各方通过上述联络方式发送的通知，以下列时间为送达时间：（1）专人送达的，以签收时间为送达时间；（2）以邮寄方式送达的，以签收时间为送达时间；（3）以电子邮件方式送达的，以发送成功时间为送达时间；（4）以微信方式送达的，以发送成功时间为送达时间。',
        note: '送达标准',
        keys: []
      }
    ]
  },
  {
    id: 'integrity',
    number: '八',
    title: '廉洁与诚信',
    clauses: [
      {
        text: '各方承诺在本协议签署及履行过程中，不向对方或对方关联方的员工、代理人提供任何形式的回扣、佣金、礼品或其他利益。',
        note: '反商业贿赂',
        keys: []
      },
      {
        text: '任何一方如发现对方存在违反廉洁诚信的行为，可向滴灌通合规部门举报。',
        note: '举报渠道',
        keys: []
      }
    ]
  },
  {
    id: 'law-dispute',
    number: '九',
    title: '适用法律和争议解决',
    clauses: [
      {
        text: '本协议的订立、效力、解释、履行及争议解决均适用中华人民共和国法律（不包括港澳台地区法律）。',
        note: '适用法律',
        keys: []
      },
      {
        text: '因本协议引起的或与本协议相关的任何争议，各方应友好协商解决；协商不成的，任何一方均可将争议提交至【${arbitrationInstitution}】按其届时有效的仲裁规则进行仲裁。',
        note: '争议解决',
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
    number: '十',
    title: '协议的生效、变更、解除',
    clauses: [
      {
        text: '本协议自各方签署（含电子签名）之日起生效。各方可选择电子签名或线下签署方式。',
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
  // 附件
  {
    id: 'appendix-definitions',
    number: '附件一',
    title: '定义及释义',
    clauses: [
      {
        text: '"实际控制人"是指：（1）对于企业，指持有公司50%以上股权或通过投资关系、协议或者其他安排能够实际支配公司行为的自然人或法人；（2）对于个体工商户，指该个体户的经营者本人。',
        note: '实际控制人定义',
        keys: []
      },
      {
        text: '"联营合作信息"是指联营方和其他方与本次联营合作相关的全部信息，包括但不限于：（1）基本信息（名称、统一社会信用代码、地址、联系方式等）；（2）经营信息（营业收入、成本费用、利润、客户数据等）；（3）财务信息（银行账户、流水、报表等）；（4）资产信息（设备、存货、知识产权等）；（5）其他滴灌通认为与联营合作相关的信息。',
        note: '联营合作信息定义',
        keys: []
      },
      {
        text: '"违约相关信息"是指联营方和/或其他方在本协议项下的违约行为相关信息，包括但不限于：违约情形、违约时间、违约金额、追索情况等。',
        note: '违约相关信息定义',
        keys: []
      },
      {
        text: '"联营方收入"或"全部收入"是指联营方【${revenueDefinition}】，具体包括：（1）主营业务收入：联营方从事经营活动取得的各项收入；（2）其他业务收入：联营方从事主营业务以外的其他业务活动取得的收入。',
        note: '联营方收入定义',
        keys: ['revenueDefinition']
      }
    ]
  },
  {
    id: 'appendix-representations',
    number: '附件二',
    title: '特别陈述、保证及承诺',
    clauses: [
      {
        text: '本协议项下的联营合作不构成任何借贷关系、合伙关系或其他类型的法律关系。',
        note: '非借贷关系声明',
        keys: [],
        isImportant: true
      },
      {
        text: '联营方和其他方同意滴灌通有权将其在本协议项下的权利和/或义务全部或部分转让给第三方（包括滴灌通的境内外关联方），无需另行取得联营方和其他方的同意。',
        note: '权利转让',
        keys: []
      },
      {
        text: '联营方和其他方保证：（1）联营方已依法取得从事联营合作业务所需的全部许可证照，且该等许可证照在本协议期限内持续有效；（2）联营方对门店享有合法有效的经营权利；（3）联营方及其实际控制人不存在任何可能影响本协议履行的诉讼、仲裁、行政处罚或调查程序。',
        note: '合规保证',
        keys: []
      },
      {
        text: '品牌方保证：品牌方授予联营方的品牌使用权在本协议期限内持续有效，且品牌方不会采取任何措施导致联营方无法继续使用该品牌。',
        note: '品牌方保证',
        keys: []
      }
    ]
  },
  // 插入行业特定条款（如有）
  ...(industrySpecificClauses || [])
]

// ==================== 创建标准模块列表 ====================
const createStandardModules = (industrySpecificModules?: ContractModule[]): ContractModule[] => [
  {
    id: 'investment',
    title: '联营资金与分成',
    description: '联营资金金额、用途、分成比例、期限、终止条件',
    icon: 'fa-coins',
    importance: 'critical',
    clauses: [
      { name: '联营资金金额', value: '${investmentAmount}', key: 'investmentAmount', note: '滴灌通提供的联营资金总额' },
      { name: '资金用途', value: '${fundUsage}', key: 'fundUsage', note: '资金的限定用途，不得挪用' },
      { name: '固定分成比例', value: '${revenueShareRatio}', key: 'revenueShareRatio', note: '基于联营方收入的分成比例' },
      { name: '收入分成期', value: '${sharingEndDate}', key: 'sharingEndDate', note: '分成期限' },
      { name: '年化回报率', value: '${annualReturnRate}', key: 'annualReturnRate', note: '分成终止触发条件' }
    ],
    risks: '资金挪用风险、分成期限延长风险'
  },
  {
    id: 'termination',
    title: '提前终止与亏损闭店',
    description: '提前终止条件、补偿金计算、亏损闭店流程',
    icon: 'fa-door-open',
    importance: 'critical',
    clauses: [
      { name: '提前终止通知期', value: '${earlyTerminationNoticeDays}天', key: 'earlyTerminationNoticeDays', note: '提前书面通知天数' },
      { name: '亏损闭店收入门槛', value: '连续${lossThresholdMonths}个月低于${lossThresholdAmount}元', key: 'lossThresholdAmount', note: '触发亏损闭店的条件' },
      { name: '禁止提前闭店期', value: '${noEarlyCloseMonths}个月', key: 'noEarlyCloseMonths', note: '分成起始日后不得提前闭店的期限' }
    ],
    risks: '被动提前终止风险、补偿金承担风险'
  },
  {
    id: 'data-payment',
    title: '数据传输与分成付款',
    description: '数据传输方式、频率、付款时间、对账机制',
    icon: 'fa-chart-line',
    importance: 'high',
    clauses: [
      { name: '数据传输方式', value: '${dataTransmissionMethod}', key: 'dataTransmissionMethod', note: '系统自动/手工上报' },
      { name: '数据传输频率', value: '${dataTransmissionFrequency}', key: 'dataTransmissionFrequency', note: '传输频率' },
      { name: '分成付款方式', value: '${paymentMethod}', key: 'paymentMethod', note: '自动打款/手动分账' },
      { name: '分成付款频率', value: '${paymentFrequency}', key: 'paymentFrequency', note: '付款频率' },
      { name: '对账截止日', value: '${reconciliationDeadline}', key: 'reconciliationDeadline', note: '月度对账确认时间' }
    ]
  },
  {
    id: 'restrictions',
    title: '重大事项限制',
    description: '控制权变更、品牌转让、收入处置、经营变更限制',
    icon: 'fa-lock',
    importance: 'critical',
    clauses: [
      { name: '禁止变更实际控制人', value: '未经同意不得变更', key: 'controllerChange', note: '控股股东/实际控制人变更需同意' },
      { name: '禁止转让品牌经营权', value: '不得转让或不续约', key: 'brandTransfer', note: '品牌权利变更限制' },
      { name: '禁止处置收入', value: '不得出售/分成/贴现/保理', key: 'revenueDisposal', note: '收入不得向第三方处置' },
      { name: '重要经营事项', value: '需书面同意', key: 'majorOperations', note: '停业、搬迁、注册资本变更等' }
    ],
    risks: '违反限制将触发解约和违约金'
  },
  {
    id: 'breach',
    title: '违约责任',
    description: '严重违约情形、违约金、连带责任',
    icon: 'fa-gavel',
    importance: 'critical',
    clauses: [
      { name: '严重违约情形', value: '资金挪用、收入隐藏、数据造假、逾期>${seriousBreachDays}天等', key: 'seriousBreachDays', note: '构成严重违约的情形' },
      { name: '违约金比例', value: '联营资金的${breachPenaltyRate}', key: 'breachPenaltyRate', note: '基于联营资金金额计算' },
      { name: '连带责任', value: '联营方+其他方+实际控制人', key: 'jointLiability', note: '共同且连带承担' }
    ],
    risks: '严重违约导致协议解除、全额退款加违约金'
  },
  {
    id: 'representations',
    title: '陈述保证与承诺',
    description: '主体资格、合规经营、品牌权利、非借贷声明',
    icon: 'fa-shield-check',
    importance: 'high',
    clauses: [
      { name: '主体资格', value: '具备签署和履行能力', key: 'entityQualification' },
      { name: '证照有效', value: '在协议期限内持续有效', key: 'licenseValid' },
      { name: '非借贷关系', value: '本协议不构成借贷/合伙关系', key: 'nonLending', note: '重要法律性质声明' }
    ]
  },
  {
    id: 'confidentiality',
    title: '保密与合规',
    description: '保密义务、期限、廉洁诚信',
    icon: 'fa-user-lock',
    importance: 'medium',
    clauses: [
      { name: '保密期限', value: '协议终止后${confidentialityPeriod}内', key: 'confidentialityPeriod' },
      { name: '廉洁承诺', value: '不提供回扣、佣金、礼品等', key: 'integrityCommitment' }
    ]
  },
  {
    id: 'dispute',
    title: '争议解决',
    description: '适用法律、仲裁机构、仲裁地点',
    icon: 'fa-balance-scale',
    importance: 'medium',
    clauses: [
      { name: '适用法律', value: '中华人民共和国法律', key: 'applicableLaw' },
      { name: '仲裁机构', value: '${arbitrationInstitution}', key: 'arbitrationInstitution' },
      { name: '仲裁地点', value: '${arbitrationPlace}', key: 'arbitrationPlace' }
    ]
  },
  // 插入行业特定模块（如有）
  ...(industrySpecificModules || [])
]

// ==================== 行业模板定义 ====================

// 1. 餐饮行业
export const cateringTemplate: IndustryTemplate = {
  id: 'catering',
  name: '餐饮连锁',
  icon: 'fa-utensils',
  description: '餐厅、奶茶店、咖啡厅等餐饮门店项目',
  color: 'orange',
  defaultParams: {
    ...commonDefaultParams,
    // 餐饮行业特定参数
    investmentAmount: '500万元',
    investmentAmountCN: '伍佰万元整',
    fundUsage: '门店装修、设备采购、首批物料及流动资金',
    revenueShareRatio: '15%',
    sharingEndDate: '自收入分成起始日起满36个月',
    annualReturnRate: '25%',
    
    // 数据传输
    dataTransmissionMethod: '系统自动传输',
    dataSourceSystem: 'POS收银系统',
    
    // 餐饮特定
    businessHours: '10小时',
    foodSafetyNotice: '24小时',
    minMonthlyRevenue: '30万元',
    lossThresholdAmount: '15万元'
  },
  modules: createStandardModules([
    {
      id: 'catering-specific',
      title: '餐饮行业特别约定',
      description: '食品安全、营业时间、卫生许可',
      icon: 'fa-utensils',
      importance: 'high',
      clauses: [
        { name: '食品安全通知', value: '${foodSafetyNotice}内书面通知', key: 'foodSafetyNotice', note: '发生食品安全事故需立即通知' },
        { name: '最低日营业时间', value: '${businessHours}', key: 'businessHours', note: '每日营业时间不少于' },
        { name: '最低月营收', value: '${minMonthlyRevenue}', key: 'minMonthlyRevenue', note: '月营业收入不低于' },
        { name: '必备证照', value: '营业执照、食品经营许可证', key: 'requiredLicenses' }
      ],
      risks: '食品安全事故风险、证照过期风险'
    }
  ]),
  fullText: createStandardFullText([
    {
      id: 'catering-specific',
      number: '附加一',
      title: '餐饮行业特别约定',
      clauses: [
        {
          text: '联营方应确保门店食品卫生安全，遵守《食品安全法》等相关法律法规。如发生食品安全事故或接到食品安全相关投诉、行政处罚，应在【${foodSafetyNotice}】内书面通知滴灌通。',
          note: '食品安全特别要求',
          keys: ['foodSafetyNotice'],
          isImportant: true
        },
        {
          text: '联营方应保持门店正常营业，每日营业时间不少于【${businessHours}】。如需调整营业时间或暂停营业，应提前【${notificationDays}】日书面通知滴灌通。',
          note: '营业时间要求',
          keys: ['businessHours', 'notificationDays']
        },
        {
          text: '联营方应确保门店月营业收入不低于【${minMonthlyRevenue}】，连续3个月低于此标准需向滴灌通书面说明原因并提供改善计划。',
          note: '最低营收要求',
          keys: ['minMonthlyRevenue']
        },
        {
          text: '联营方应确保下列证照在本协议期限内持续有效：营业执照、食品经营许可证。证照到期前30日应完成续期手续并向滴灌通提供更新后的证照复印件。',
          note: '证照维护要求',
          keys: []
        }
      ]
    }
  ])
}

// 2. 零售行业
export const retailTemplate: IndustryTemplate = {
  id: 'retail',
  name: '零售门店',
  icon: 'fa-shopping-bag',
  description: '便利店、专卖店、商超等零售项目',
  color: 'blue',
  defaultParams: {
    ...commonDefaultParams,
    // 零售行业特定参数
    investmentAmount: '300万元',
    investmentAmountCN: '叁佰万元整',
    fundUsage: '门店装修、货架设备、首批库存及流动资金',
    revenueShareRatio: '12%',
    revenueDefinition: '扣除所有税项、退换货前的全部营业收入',
    sharingEndDate: '自收入分成起始日起满48个月',
    annualReturnRate: '22%',
    
    // 数据传输
    dataTransmissionMethod: '系统自动传输',
    dataSourceSystem: 'ERP/收银系统',
    paymentFrequency: '每周',
    paymentDay: '每周一18:00前（上周收入）',
    
    // 零售特定
    inventoryTurnover: '30天',
    minMonthlyRevenue: '25万元',
    lossThresholdAmount: '12万元'
  },
  modules: createStandardModules([
    {
      id: 'retail-specific',
      title: '零售行业特别约定',
      description: '库存周转、最低营收、商品管理',
      icon: 'fa-boxes',
      importance: 'high',
      clauses: [
        { name: '库存周转天数', value: '不超过${inventoryTurnover}', key: 'inventoryTurnover', note: '库存周转要求' },
        { name: '最低月营收', value: '${minMonthlyRevenue}', key: 'minMonthlyRevenue', note: '月营业收入不低于' }
      ],
      risks: '库存积压风险、滞销风险'
    }
  ]),
  fullText: createStandardFullText([
    {
      id: 'retail-specific',
      number: '附加一',
      title: '零售行业特别约定',
      clauses: [
        {
          text: '联营方应确保库存周转天数不超过【${inventoryTurnover}】。如库存积压严重，应在滴灌通要求后的5个自然日内书面说明原因并制定清理计划。',
          note: '库存管理要求',
          keys: ['inventoryTurnover']
        },
        {
          text: '联营方应确保门店月营业收入不低于【${minMonthlyRevenue}】，连续3个月低于此标准需向滴灌通书面说明原因。',
          note: '最低营收要求',
          keys: ['minMonthlyRevenue']
        }
      ]
    }
  ])
}

// 3. 医美/健康行业
export const healthcareTemplate: IndustryTemplate = {
  id: 'healthcare',
  name: '医美/健康',
  icon: 'fa-heartbeat',
  description: '医美诊所、健身房、康复中心等项目',
  color: 'pink',
  defaultParams: {
    ...commonDefaultParams,
    // 医美行业特定参数
    investmentAmount: '800万元',
    investmentAmountCN: '捌佰万元整',
    fundUsage: '场所装修、医疗设备采购、人员培训及流动资金',
    revenueShareRatio: '18%',
    revenueDefinition: '扣除所有税项、医疗保险理赔前的全部营业收入',
    sharingEndDate: '自收入分成起始日起满36个月',
    annualReturnRate: '28%',
    breachPenaltyRate: '25%',
    
    // 数据传输
    dataTransmissionMethod: '系统自动传输',
    dataSourceSystem: 'HIS系统/收银系统',
    paymentFrequency: '每周',
    paymentDay: '每周一18:00前（上周收入）',
    
    // 医美特定
    licenseRequirement: '医疗机构执业许可证',
    medicalIncidentNotice: '24小时',
    minMonthlyRevenue: '50万元',
    lossThresholdAmount: '25万元'
  },
  modules: createStandardModules([
    {
      id: 'healthcare-specific',
      title: '医美/健康行业特别约定',
      description: '资质维护、医疗安全、事故通知',
      icon: 'fa-stethoscope',
      importance: 'critical',
      clauses: [
        { name: '必备资质', value: '${licenseRequirement}', key: 'licenseRequirement', note: '医疗机构执业许可证等' },
        { name: '医疗事故通知', value: '${medicalIncidentNotice}内书面通知', key: 'medicalIncidentNotice', note: '发生医疗事故/纠纷需立即通知' },
        { name: '最低月营收', value: '${minMonthlyRevenue}', key: 'minMonthlyRevenue', note: '月营业收入不低于' }
      ],
      risks: '医疗纠纷风险、资质吊销风险'
    }
  ]),
  fullText: createStandardFullText([
    {
      id: 'healthcare-specific',
      number: '附加一',
      title: '医美/健康行业特别约定',
      clauses: [
        {
          text: '联营方应确保【${licenseRequirement}】等必要资质在本协议期限内持续有效，资质到期前30日应完成续期手续。如资质被吊销、暂停或限制，视为严重违约。',
          note: '资质维护要求',
          keys: ['licenseRequirement'],
          isImportant: true
        },
        {
          text: '如发生医疗事故或医疗纠纷，联营方应在【${medicalIncidentNotice}】内书面通知滴灌通，并及时提供事故处理进展及最终处理结果。',
          note: '医疗事故通知',
          keys: ['medicalIncidentNotice'],
          isImportant: true
        },
        {
          text: '联营方应确保门店月营业收入不低于【${minMonthlyRevenue}】，连续3个月低于此标准需向滴灌通书面说明原因。',
          note: '最低营收要求',
          keys: ['minMonthlyRevenue']
        }
      ]
    }
  ])
}

// 4. 教育培训行业
export const educationTemplate: IndustryTemplate = {
  id: 'education',
  name: '教育培训',
  icon: 'fa-graduation-cap',
  description: '培训机构、职业教育、兴趣班等项目',
  color: 'green',
  defaultParams: {
    ...commonDefaultParams,
    // 教育行业特定参数
    investmentAmount: '400万元',
    investmentAmountCN: '肆佰万元整',
    fundUsage: '场地装修、教学设备、师资培训及流动资金',
    revenueShareRatio: '20%',
    revenueDefinition: '扣除所有税项、退费前的全部营业收入',
    sharingEndDate: '自收入分成起始日起满36个月',
    annualReturnRate: '25%',
    
    // 数据传输
    dataTransmissionMethod: '系统自动传输',
    dataSourceSystem: '教务管理系统/收银系统',
    paymentFrequency: '每周',
    paymentDay: '每周一18:00前（上周收入）',
    
    // 教育特定
    minStudentCount: '200人',
    refundPolicy: '开课前全额退款，开课后按课时比例退款',
    lossThresholdAmount: '15万元'
  },
  modules: createStandardModules([
    {
      id: 'education-specific',
      title: '教育培训行业特别约定',
      description: '招生要求、退费政策、预付款监管',
      icon: 'fa-chalkboard-teacher',
      importance: 'high',
      clauses: [
        { name: '最低在读学员数', value: '${minStudentCount}', key: 'minStudentCount', note: '在读学员数不低于' },
        { name: '退费政策', value: '${refundPolicy}', key: 'refundPolicy', note: '退费计算标准' }
      ],
      risks: '招生不达标风险、政策风险、退费纠纷风险'
    }
  ]),
  fullText: createStandardFullText([
    {
      id: 'education-specific',
      number: '附加一',
      title: '教育培训行业特别约定',
      clauses: [
        {
          text: '联营方应确保在读学员数不低于【${minStudentCount}】，连续3个月低于此标准需向滴灌通书面说明原因。',
          note: '学员数量要求',
          keys: ['minStudentCount']
        },
        {
          text: '联营方应严格执行退费政策：【${refundPolicy}】。不得以任何理由拒绝符合条件的退费申请。',
          note: '退费政策',
          keys: ['refundPolicy']
        },
        {
          text: '联营方收取的预付学费应按规定存入监管账户，用于日常运营支出，不得挪作他用。如教育主管部门出台新规导致联营方无法正常经营，双方应友好协商调整协议条款或提前终止。',
          note: '预付款监管及政策风险',
          keys: [],
          isImportant: true
        }
      ]
    }
  ])
}

// 5. 演唱会/演出行业（保持专用模板，但调整为新版框架）
export const concertTemplate: IndustryTemplate = {
  id: 'concert',
  name: '演唱会/演出',
  icon: 'fa-music',
  description: '演唱会、音乐节、话剧等现场演出项目',
  color: 'purple',
  defaultParams: {
    ...commonDefaultParams,
    // 演唱会行业特定参数
    investmentAmount: '1,800万元',
    investmentAmountCN: '壹仟捌佰万元整',
    fundUsage: '演出制作、场地租赁、艺人费用及运营支出',
    revenueShareRatio: '70%',
    revenueDefinition: '扣除所有税项前的全部营业收入（含票房、赞助、周边等）',
    sharingEndDate: '演出结束后30日或收入分成终止触发事项发生时',
    annualReturnRate: '33%',
    
    // 数据传输
    dataTransmissionMethod: '系统自动传输',
    dataSourceSystem: '票务系统',
    dataTransmissionFrequency: '每日',
    dataTransmissionDay: '每日18:00前',
    paymentFrequency: '每日',
    paymentDay: '每日22:00前',
    
    // 演唱会特定
    giftTicketLimit: '1,000张',
    minTicketPrice: '票面50%',
    discountTicketLimit: '20%',
    approvalThreshold: '10万元',
    budgetOverrunLimit: '10%',
    delayPeriod: '6个月',
    artistRisk: '极高',
    monthlyReconcileDay: '15'
  },
  modules: [
    {
      id: 'investment',
      title: '投资架构',
      description: '资金结构、出资顺序、审批机制',
      icon: 'fa-coins',
      importance: 'critical',
      clauses: [
        { name: '联营资金金额', value: '${investmentAmount}', key: 'investmentAmount', note: '滴灌通提供的联营资金总额' },
        { name: '支出审批阈值', value: '>${approvalThreshold}需书面同意', key: 'approvalThreshold', note: '超过此金额需滴灌通盖章书面同意' },
        { name: '预算超支容忍', value: '${budgetOverrunLimit}', key: 'budgetOverrunLimit', note: '超出部分滴灌通可拒付' }
      ],
      risks: '劣后资金未到位即出资将丧失优先受偿权基础'
    },
    {
      id: 'revenue',
      title: '收入分成',
      description: '分成比例、计算方式、对账机制',
      icon: 'fa-chart-pie',
      importance: 'critical',
      clauses: [
        { name: '分成比例', value: '${revenueShareRatio}', key: 'revenueShareRatio', note: '基于税前全部营业收入' },
        { name: '年化回报率', value: '${annualReturnRate}', key: 'annualReturnRate', note: '分成终止触发条件' },
        { name: '数据传输时间', value: '每日${dataTransmissionDay}前', key: 'dataTransmissionDay', note: '基于票务系统' },
        { name: '分成付款时间', value: '每日${paymentDay}前', key: 'paymentDay', note: '当日分成支付' },
        { name: '月度对账日', value: '每月${monthlyReconcileDay}日前', key: 'monthlyReconcileDay', note: '上月数据确认' }
      ],
      risks: '收入隐藏、数据延迟、口径争议'
    },
    {
      id: 'artist',
      title: '艺人风险',
      description: '艺人违约、负面舆情、延期处理',
      icon: 'fa-user-music',
      importance: 'critical',
      clauses: [
        { name: '艺人风险等级', value: '${artistRisk}', key: 'artistRisk', note: '政治言论、负面舆情等' },
        { name: '延期最长期限', value: '${delayPeriod}', key: 'delayPeriod', note: '超期视为取消' },
        { name: '负面舆情告知', value: '${notificationDays}日内', key: 'notificationDays', note: '书面通知滴灌通' }
      ],
      risks: '艺人违约时，无论是否追回费用，融资方都需向滴灌通全额退款'
    },
    {
      id: 'ticketing',
      title: '票务管控',
      description: '赠票、折扣、最低售价限制',
      icon: 'fa-ticket',
      importance: 'high',
      clauses: [
        { name: '赠票上限', value: '${giftTicketLimit}', key: 'giftTicketLimit', note: '超出按票面价支付' },
        { name: '最低售价', value: '${minTicketPrice}', key: 'minTicketPrice', note: '低于需补差额' },
        { name: '折价票上限', value: '总票量${discountTicketLimit}', key: 'discountTicketLimit', note: '超出需书面同意' }
      ],
      risks: '赠票超限、低价销售可构成违约'
    },
    {
      id: 'breach',
      title: '违约责任',
      description: '违约情形、违约金、连带责任',
      icon: 'fa-gavel',
      importance: 'critical',
      clauses: [
        { name: '违约金比例', value: '联营资金的${breachPenaltyRate}', key: 'breachPenaltyRate', note: '基于联营资金金额' },
        { name: '连带责任', value: '融资方+合作方+实际控制人', key: 'jointLiability', note: '共同且连带' },
        { name: '分成延迟违约', value: '>30天', key: 'seriousBreachDays', note: '构成严重违约' }
      ],
      risks: '严重违约将导致协议解除、全额退款加违约金'
    },
    {
      id: 'escrow',
      title: '共管账户',
      description: '账户权限、审批流程、资金监管',
      icon: 'fa-university',
      importance: 'high',
      clauses: [
        { name: '滴灌通权限', value: '查询+复核+U盾', key: 'investorRights', note: '完整监管权限' },
        { name: '审批阈值', value: '>${approvalThreshold}需书面同意', key: 'approvalThreshold', note: '盖章文件为准' }
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
          text: '滴灌通拟在满足本协议约定的相关前置条件后，提供联营资金，金额为人民币【${investmentAmount}】（大写：【${investmentAmountCN}】）。',
          note: '联营资金金额为固定金额，不因项目实际成本变化而调整',
          keys: ['investmentAmount', 'investmentAmountCN'],
          isImportant: true
        },
        {
          text: '融资方如需支付项目运营支出，金额超过【${approvalThreshold}】的，需提前获得滴灌通的盖章书面文件同意，方可从共管账户中划出支付。',
          note: '支出审批机制',
          keys: ['approvalThreshold']
        },
        {
          text: '若实际需支出的金额超过预算金额的【${budgetOverrunLimit}】，滴灌通有权拒绝从共管账户支付超出部分，融资方需自行承担超出金额。',
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
          text: '融资方和/或其他方应按照项目收入的【${revenueShareRatio}】向滴灌通进行分成。',
          note: '分成比例基于税前全部营业收入',
          keys: ['revenueShareRatio'],
          isImportant: true
        },
        {
          text: '分成终止触发事项：滴灌通累计实际取得的收入分成金额合计达到【滴灌通已出资的联营资金×（1+${annualReturnRate}÷12×已联营月数）】金额。',
          note: '分成终止条件',
          keys: ['annualReturnRate'],
          isImportant: true
        },
        {
          text: '融资方应在数据传输日当日的【${dataTransmissionDay}】前完成数据传输，分成付款日当日的【${paymentDay}】前完成分成付款。',
          note: '数据和付款时效',
          keys: ['dataTransmissionDay', 'paymentDay']
        }
      ]
    },
    {
      id: 'artist',
      number: '三',
      title: '艺人风险管控',
      clauses: [
        {
          text: '若演出因艺人违约而取消，无论融资方是否实际收回已支付给艺人的演出费用，融资方需退还滴灌通已提供的全部资金，并按【${annualReturnRate}按月计】计算补偿金。',
          note: '艺人违约导致取消的处理',
          keys: ['annualReturnRate'],
          isImportant: true
        },
        {
          text: '若演出需要延期，且最后一场演出不晚于原定日期后【${delayPeriod}】举行，收入分成期相应延长。若超过此期限，则视为演出取消。',
          note: '延期处理',
          keys: ['delayPeriod']
        },
        {
          text: '如艺人发生负面舆情事件，融资方应在【${notificationDays}】日内书面通知滴灌通，并及时提供事件处理进展。',
          note: '负面舆情通知',
          keys: ['notificationDays']
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
          text: '融资方出售折价票的比例不得超过总票量的【${discountTicketLimit}】，超出部分需事先取得滴灌通的书面同意。',
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
          text: '以下情形构成融资方和/或其他方的严重违约：（1）挪用联营资金；（2）通过私设账号、虚构交易等方式隐藏、转移收入；（3）延迟报送数据或支付分成超过【${seriousBreachDays}】天；（4）违反陈述保证和承诺；（5）艺人发生重大负面舆情未及时告知；（6）其他严重损害滴灌通权益的行为。',
          note: '严重违约情形',
          keys: ['seriousBreachDays'],
          isImportant: true
        },
        {
          text: '如融资方发生严重违约，滴灌通有权单方解除本协议，要求融资方退还全部资金，并向滴灌通支付联营资金的【${breachPenaltyRate}】作为违约金。',
          note: '严重违约后果',
          keys: ['breachPenaltyRate'],
          isImportant: true
        },
        {
          text: '融资方、合作方及其实际控制人对本协议项下的全部债务承担共同且连带责任。',
          note: '连带责任',
          keys: [],
          isImportant: true
        }
      ]
    },
    {
      id: 'escrow',
      number: '六',
      title: '共管账户',
      clauses: [
        {
          text: '滴灌通和融资方开立共管账户，滴灌通已取得必要的共管权限（包括但不限于网银查询权限、复核/审批权限及/或U盾、印鉴等），以确保滴灌通可对共管账户资金收支进行监管。',
          note: '共管账户设立及权限配置',
          keys: []
        },
        {
          text: '融资方如需支付运营支出，金额超过【${approvalThreshold}】的，需提前获得滴灌通的盖章书面文件同意。微信、邮件等电子通讯方式不构成有效的书面同意。',
          note: '支出审批',
          keys: ['approvalThreshold'],
          isImportant: true
        }
      ]
    },
    // 通用条款
    {
      id: 'representations',
      number: '七',
      title: '陈述、保证及承诺',
      clauses: [
        {
          text: '各方均具有适当的法律资格和法律能力签署、交付并履行本协议。本协议的签署及履行均不会违反各方的组织文件或适用法律。',
          note: '主体资格保证',
          keys: []
        },
        {
          text: '本协议项下的联营合作不构成任何借贷关系、合伙关系或其他类型的法律关系。',
          note: '非借贷关系声明',
          keys: [],
          isImportant: true
        }
      ]
    },
    {
      id: 'law-dispute',
      number: '八',
      title: '适用法律和争议解决',
      clauses: [
        {
          text: '本协议的订立、效力、解释、履行及争议解决均适用中华人民共和国法律（不包括港澳台地区法律）。',
          note: '适用法律',
          keys: []
        },
        {
          text: '因本协议引起的或与本协议相关的任何争议，各方应友好协商解决；协商不成的，任何一方均可将争议提交至【${arbitrationInstitution}】按其届时有效的仲裁规则进行仲裁。仲裁地为【${arbitrationPlace}】，仲裁裁决为终局裁决。',
          note: '争议解决',
          keys: ['arbitrationInstitution', 'arbitrationPlace']
        }
      ]
    }
  ]
}

// ==================== 设备类资产模板（如娃娃机、自动售货机等）====================
export const equipmentTemplate: IndustryTemplate = {
  id: 'equipment',
  name: '设备运营',
  icon: 'fa-gamepad',
  description: '娃娃机、自动售货机、充电宝等设备运营项目',
  color: 'cyan',
  defaultParams: {
    ...commonDefaultParams,
    // 设备行业特定参数
    investmentAmount: '200万元',
    investmentAmountCN: '贰佰万元整',
    fundUsage: '设备采购、点位租金、运营维护及流动资金',
    revenueShareRatio: '25%',
    revenueDefinition: '扣除所有税项前的全部营业收入',
    sharingEndDate: '自收入分成起始日起满24个月',
    annualReturnRate: '30%',
    
    // 数据传输
    dataTransmissionMethod: '系统自动传输',
    dataSourceSystem: '设备管理系统/支付系统',
    
    // 设备特定
    equipmentType: '待确定',
    equipmentCount: '待确定',
    equipmentIdentifier: '见附件四',
    minMonthlyRevenuePerUnit: '5000元',
    maintenanceResponse: '24小时',
    lossThresholdAmount: '10万元'
  },
  modules: createStandardModules([
    {
      id: 'equipment-specific',
      title: '设备运营特别约定',
      description: '设备管理、点位维护、故障响应',
      icon: 'fa-cogs',
      importance: 'high',
      clauses: [
        { name: '设备类型', value: '${equipmentType}', key: 'equipmentType', note: '具体设备类型' },
        { name: '设备数量', value: '${equipmentCount}台', key: 'equipmentCount', note: '联营设备数量' },
        { name: '单台月营收下限', value: '${minMonthlyRevenuePerUnit}/台', key: 'minMonthlyRevenuePerUnit', note: '单台设备最低月收入' },
        { name: '故障响应时间', value: '${maintenanceResponse}', key: 'maintenanceResponse', note: '设备故障处理时限' }
      ],
      risks: '设备故障风险、点位丢失风险'
    }
  ]),
  fullText: createStandardFullText([
    {
      id: 'equipment-specific',
      number: '附加一',
      title: '设备运营特别约定',
      clauses: [
        {
          text: '本协议项下联营合作业务为联营方于【${storeAddress}】经营【${equipmentCount}】台【${equipmentType}】（设备的唯一识别码与位置如附件四所示）。',
          note: '设备基本信息',
          keys: ['storeAddress', 'equipmentCount', 'equipmentType']
        },
        {
          text: '联营方应确保单台设备月营业收入不低于【${minMonthlyRevenuePerUnit}】，连续3个月单台平均收入低于此标准需向滴灌通书面说明原因。',
          note: '单台设备营收要求',
          keys: ['minMonthlyRevenuePerUnit']
        },
        {
          text: '联营方应确保设备正常运营，设备出现故障时应在【${maintenanceResponse}】内完成修复或更换。设备停运超过3天需书面通知滴灌通。',
          note: '设备维护要求',
          keys: ['maintenanceResponse']
        },
        {
          text: '未经滴灌通书面同意，联营方不得变更设备位置、减少设备数量或处置（包括出售、出租、抵押、质押）联营设备。',
          note: '设备管理限制',
          keys: [],
          isImportant: true
        }
      ]
    },
    {
      id: 'equipment-appendix',
      number: '附件四',
      title: '设备唯一识别码与地理位置',
      clauses: [
        {
          text: '【详见设备清单表格，包含：序号、设备类型、设备唯一识别码（SN码）、设备位置地址、投放日期】',
          note: '设备清单',
          keys: ['equipmentIdentifier']
        }
      ]
    }
  ])
}

// 导出所有模板
export const industryTemplates: Record<string, IndustryTemplate> = {
  catering: cateringTemplate,
  retail: retailTemplate,
  healthcare: healthcareTemplate,
  education: educationTemplate,
  concert: concertTemplate,
  equipment: equipmentTemplate
}

export const templateList = Object.values(industryTemplates)
