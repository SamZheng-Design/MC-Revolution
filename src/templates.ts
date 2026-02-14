// 收入分成融资 - 行业合同模板系统
// 基于滴灌通联营协议（境内B类资产）V3标准模板 - 2026年2月更新

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
  importance?: 'critical' | 'high' | 'medium' | 'low' // 重要程度标记
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

// ==================== 滴灌通联营协议（境内B类资产）V3标准模板 ====================
// 严格按照新版合同结构：10个主要章节 + 4个附件

/**
 * 创建滴灌通标准合同完整条款
 * @param industrySpecificClauses 行业特定附加条款
 * @returns 完整合同条款数组
 */
const createMicroConnectFullTextV3 = (industrySpecificClauses?: ContractSection[]): ContractSection[] => [
  // ========== 第一条：联营合作商业安排（核心商业条款）==========
  {
    id: 'business-arrangement',
    number: '一',
    title: '联营合作商业安排',
    clauses: [
      {
        text: '各方一致确认，关于联营合作的具体商业条款约定见如下：',
        note: '本条为核心商业条款，规定联营资金、分成比例等关键参数',
        keys: []
      },
      {
        text: '【联营资金金额】本分成方案项下滴灌通提供的联营资金（"本次联营资金"）金额为人民币【${investmentAmount}】元。',
        note: '投资方提供的联营资金总额',
        keys: ['investmentAmount']
      },
      {
        text: '【联营资金用途】联营方和其他方共同承诺本次联营资金仅可被用于联营方【${fundUsage}】，不得挪用（包括挪用至个人账户等）或未按前述约定用途使用，且滴灌通有权随时对联营资金的实际使用情况进行检查。',
        note: '资金用途限制，挪用将构成严重违约',
        keys: ['fundUsage']
      },
      {
        text: '【前置条件】滴灌通向联营方提供本次联营资金的前置条件为：（1）滴灌通取得关于提供本次联营资金的内部审批；（2）滴灌通与联营方、其他方及其他主体（如适用）的数据传输方案与分账方案均已完成且符合滴灌通要求；（3）联营方和其他方在滴灌通提供本次联营资金前均不存在任何违反本协议陈述保证及承诺或其它约定的情形；（4）联营方向滴灌通提供门店出资的资金到账证明、资金用途证明及门店资产价值清单及报价表；（5）品牌方已就其对联营方的特许经营事宜完成特许经营备案；（6）按照滴灌通要求提供完毕附件三资料；（7）各方同意的其它情形。',
        note: '资金拨付的前提条件',
        keys: ['prerequisites']
      },
      {
        text: '【联营方收入定义】本协议所指的"联营方收入"或"全部收入"应包括联营方扣除所有税项（指按照中国税收法律法规，联营方向税务机关申报缴纳的税费）或费用（指依据国家会计准则，联营方核算的各项成本、费用）前的全部营业收入（包含主营业务收入及其他业务收入）。',
        note: '收入计算口径为税前全部营业收入',
        keys: ['revenueDefinition']
      },
      {
        text: '【分成比例】在本协议的收入分成期内，联营方和/或其他方应按照联营方收入的【${revenueShareRatio}】%向滴灌通进行分成。',
        note: '固定分成比例，基于全部营业收入',
        keys: ['revenueShareRatio']
      },
      {
        text: '【收入分成期】本协议收入分成期自滴灌通"收入分成起始日"至【${sharingEndDate}】止。"收入分成起始日"为【${sharingStartDate}】。',
        note: '分成期限的起止时间',
        keys: ['sharingStartDate', 'sharingEndDate']
      },
      {
        text: '【分成终止触发事项】虽有前述约定，在收入分成期内，滴灌通累计实际取得的收入分成金额合计达到"滴灌通已出资的联营资金×(1+【${annualYieldRate}】%÷360×已联营天数)"金额的，收入分成期自该条件达成之日的前一日终止。',
        note: '年化收益率达到后自动终止分成',
        keys: ['annualYieldRate']
      },
      {
        text: '【协议期限】自收入分成期终止之日，本协议终止。本协议的协议期限为自本协议生效之日起直至本协议终止之日（"协议期限"）。除本协议另有约定外，在协议期限内联营方须经滴灌通确认同意方可提前结束联营合作项下门店的经营，并按本协议约定履行相关手续。',
        note: '协议期限与分成期挂钩',
        keys: []
      },
      {
        text: '【提前终止】除本协议另有约定外，各方确认，联营方和/或其他方主张提前终止本协议的行为构成对本协议收入分成期约定的违反。在收入分成期内，联营方和/或其他方若需提前终止本协议，其应提前7个自然日向滴灌通发出书面通知，且联营方和/或其他方应于发出终止本协议通知之日（含当日）起7个自然日内的16点前，向滴灌通支付补偿金。补偿金=本次联营资金+（本次联营资金×【${annualYieldRate}】%÷360×(已经历收入分成天数+7)）。"已经历收入分成天数"指自收入分成起始日（含当日）起至发出终止通知之日的天数，如不满90个自然日的，按90天计算，超过90个自然日的按实际天数计算。',
        note: '提前终止需支付补偿金，最低按90天计算',
        keys: ['annualYieldRate']
      },
      {
        text: '【亏损闭店终止联营】联营方在收入分成期内连续【${lossClosurePeriod}】个月联营收入低于【${lossClosureThreshold}】元，拟结束门店经营的，联营方和/或其他方应在拟结束门店经营前【${lossClosureNoticeDays}】个月书面通知滴灌通，并提供包括但不限于（1）联营方在收入分成期内的财务报表，及（2）联营方的租约解除协议或业务平台终止合作证明，（3）员工及门店设备撤出经营场所的证明或滴灌通认可的其他主体出具的证明文件，（4）收入分成期内销售订单明细、银行流水或滴灌通认可的其他文件，联营方和/或其他方应确保前述文件的真实、准确和完整。',
        note: '亏损闭店的条件和流程',
        keys: ['lossClosurePeriod', 'lossClosureThreshold', 'lossClosureNoticeDays']
      }
    ]
  },

  // ========== 第一条（续）：数据传输与收入分成方式 ==========
  {
    id: 'data-transmission',
    number: '一（续）',
    title: '数据传输及收入分成',
    clauses: [
      {
        text: '【数据传输方式】【${dataTransmissionMethod}】',
        note: '系统自动传输/手工上报',
        keys: ['dataTransmissionMethod']
      },
      {
        text: '【数据传输频率】数据传输应按照【${dataReportFrequency}】一次的频率进行传输。',
        note: '每自然日/周/月',
        keys: ['dataReportFrequency']
      },
      {
        text: '【数据传输时间】收入分成起始日后的【${dataTransmissionDay}】为"数据传输日"。',
        note: '具体数据传输时间点',
        keys: ['dataTransmissionDay']
      },
      {
        text: '【数据传输来源系统】【${dataSource}】',
        note: '系统名-产品名-版本号',
        keys: ['dataSource']
      },
      {
        text: '【分成付款方式】【${paymentMethod}】',
        note: '系统自动打款/手动分账',
        keys: ['paymentMethod']
      },
      {
        text: '【分成付款频率】收入分成款应按照【${paymentFrequency}】一次的频率进行计算及支付。',
        note: '每自然日/周/月',
        keys: ['paymentFrequency']
      },
      {
        text: '【分成付款时间】收入分成起始日后的【${paymentDay}】为"分成付款日"。',
        note: '具体分成付款时间点',
        keys: ['paymentDay']
      },
      {
        text: '【对账方案】联营方和/或其他方应在【${reconciliationDeadline}】前完成数据对账和确认；若联营方和/或其他方对数据存在疑问，应在前述日期内以书面形式向滴灌通提出申诉，并附相关核对依据；超出上述期限的，视为联营方和/或其他方已认可对应数据准确无误，滴灌通不再接受联营方和/或其他方就相应数据提出异议。如对账后发现联营方实际打款金额少于滴灌通应分而未分金额的，联营方应当自收到滴灌通通知起后【${reconciliationDays}】个自然日内向滴灌通补齐差额。',
        note: '对账机制及超期处理',
        keys: ['reconciliationDeadline', 'reconciliationDays']
      }
    ]
  },

  // ========== 第一条（续）：账户信息 ==========
  {
    id: 'account-info',
    number: '一（续）',
    title: '账户信息',
    clauses: [
      {
        text: '【联营方收款账户信息】户名：【${mguAccountName}】；账号：【${mguAccountNumber}】；开户行：【${mguBankName}】；开户支行：【${mguBankBranch}】。若联营方拟变更收款账户信息，联营方和/或其他方应当及时书面通知滴灌通并经滴灌通确认。滴灌通向上述联营方收款账户完成本次联营资金的划转，即视为滴灌通已完成本协议约定的本次联营资金的提供义务。',
        note: '联营方收款账户',
        keys: ['mguAccountName', 'mguAccountNumber', 'mguBankName', 'mguBankBranch']
      },
      {
        text: '【滴灌通分成款收款账户信息】户名：【${dgtAccountName}】；账号：【${dgtAccountNumber}】；开户行：【${dgtBankName}】；开户支行：【${dgtBankBranch}】。',
        note: '滴灌通收款账户',
        keys: ['dgtAccountName', 'dgtAccountNumber', 'dgtBankName', 'dgtBankBranch']
      },
      {
        text: '【发票开具】在进行年度核算时，当滴灌通累计取得的分成金额达到或超过滴灌通累计实际已提供联营资金金额后，就超过部分的分成收入，滴灌通同意根据届时适用的相关法律规定、相应主管部门的要求及联营方开票信息向联营方开具普通发票或其他凭证。',
        note: '发票开具规则',
        keys: []
      }
    ]
  },

  // ========== 第二条：陈述、保证及承诺 ==========
  {
    id: 'representations',
    number: '二',
    title: '陈述、保证及承诺',
    clauses: [
      {
        text: '各方均具有适当的法律资格和法律能力签署、交付并履行本协议，可以独立地作为一方诉讼、仲裁主体。',
        note: '主体资格保证',
        keys: []
      },
      {
        text: '各方均具备签署及履行本协议的所有必要的能力、权力及授权，本协议经各方签署后构成对其有约束力的法律义务。',
        note: '签署能力保证',
        keys: []
      },
      {
        text: '本协议的签署及履行均不会违反各方的组织文件或适用法律。',
        note: '合法性保证',
        keys: []
      },
      {
        text: '各方确认就本次联营合作作出如附件二所述的特别声明。',
        note: '特别声明确认（见附件二）',
        keys: []
      },
      {
        text: '针对本次联营合作，联营方和其他方共同且连带地向滴灌通作出如附件二所述的进一步陈述、保证及承诺。',
        note: '连带保证（重要）',
        keys: []
      }
    ]
  },

  // ========== 第三条：信息收集和提供 ==========
  {
    id: 'data-collection',
    number: '三',
    title: '信息收集和提供',
    clauses: [
      {
        text: '联营方和其他方同意直接或授权相关方间接向滴灌通持续提供和同步滴灌通所要求的数据和信息，并同意滴灌通和/或其境内外关联方有权自行收集（包括从联营方、其他方、政府相关部门或其他第三方收集）、管理和使用联营方和其他方与联营合作有关的所有数据和信息（"联营合作信息"，定义及范围见附件一）。',
        note: '数据收集授权',
        keys: []
      },
      {
        text: '联营方和/或其他方同意滴灌通将联营合作信息提供给滴灌通境内外关联方及第三方（包括但不限于滴灌通及其关联方的外部顾问和中介机构、潜在/间接投资者及其外部顾问和中介机构、监管机构等），并同意滴灌通将联营合作信息用于了解联营方和/或其他方的经营情况、统计分析并形成统计数据/图表/风险评级并对外公开与签署、履行本协议以及维护滴灌通在本协议项下权益相关的其他用途。',
        note: '数据使用授权',
        keys: []
      },
      {
        text: '如果联营方和/或其他方与滴灌通和/或征信机构(包括但不限于百行征信有限公司等)有相应授权协议或安排，基于该授权与本协议的相关约定，滴灌通会对联营方和/或其他方的联营合作信息及违约相关信息进行综合统计、分析或加工处理并将数据处理结果提供给前述征信机构，或直接将联营方和/或其他方的联营合作信息及违约相关信息报送前述征信机构，用于投资决策、风险管理等目的。',
        note: '征信报送授权',
        keys: []
      }
    ]
  },

  // ========== 第四条：各方权利义务 ==========
  {
    id: 'rights-obligations',
    number: '四',
    title: '各方权利义务',
    clauses: [
      {
        text: '联营方负责本协议项下联营合作业务的日常经营并应以其自身的名义对外经营，滴灌通不参与联营方的日常经营决策。在协议期限内，未事先经滴灌通书面同意，联营方不得无故停业或歇业或变更联营合作业务内容（包括变更主营业务品类等）。',
        note: '经营独立性与限制',
        keys: []
      },
      {
        text: '为避免滴灌通在本协议项下的权益由于其不参与联营方日常经营、对联营合作业务经营情况未能充分知悉而被恶意侵害，联营方的任何可能影响本次联营合作的重要事项须与滴灌通充分协商并及时披露与反馈。',
        note: '重要事项披露义务',
        keys: []
      },
      {
        text: '特别地，各方一致同意，在协议期限内，联营方和/或其他方不得执行以下行为：（1）联营方变更实际控制人或控股股东或个体户经营者（如有）；（2）联营方转让旗下品牌经营权、联营方品牌经营授权/许可到期不再续约等可能影响联营方主营业务收入的行为；（3）联营方将联营方收入向第三方进行出售、分成、贴现、保理等处理从而可能影响本次联营合作或本协议项下滴灌通的收入分成权利的行为；（4）联营方未征得滴灌通事先书面同意而变更重要经营事项（包括但不限于变更门店经营场地、增加或减少设备数量、停业、歇业、变更联营合作业务内容、变更经营范围、减少注册资本、经营权/控制权变更/转让、缩短或变更租赁合同等）。',
        note: '禁止行为清单（极重要）',
        keys: []
      },
      {
        text: '除本协议另有约定外，若联营方和/或其他方违反本协议约定执行了以上第（1）、（2）、（3）或（4）项行为，则：1）滴灌通有权要求联营方、其他方向滴灌通支付一笔补偿金，或其他滴灌通要求的方式，以提前解除本协议；2）针对情形（1），滴灌通除有权采用方式1）之外，有权选择要求与联营方的新实际控制人或新控股股东或新个体户经营者签署补充协议，由新实际控制人或新控股股东或新个体户经营者加入本协议并承担本协议项下其他方的相关权利及义务。联营方、其他方应在滴灌通发出前述要求的10个自然日内配合完成前述处理方案的协商及执行。',
        note: '违反禁止行为的后果',
        keys: []
      },
      {
        text: '联营方、其他方应确保协议期限内所有的联营方收入均及时、如实、准确、完整反映到相关收入情况和流水证明文件中。联营方、其他方不得以其他方式（包括以第三方或者员工个人名义代收的方式）代为收取任何联营方收入。',
        note: '收入真实性保证',
        keys: []
      },
      {
        text: '若本次联营合作采用系统自动分账作为分成付款方式，联营方和其他方应充分授权并配合滴灌通指定的第三方机构对联营方收入按本协议约定自动进行分成，并将滴灌通应得的分成部分直接自动支付至滴灌通指定的收款账户，且不得自行更改任何可能影响前述分成的安排，包括更改分成比例、变更/注销银行账户或撤销银行授权等。',
        note: '系统分账配合义务',
        keys: []
      },
      {
        text: '为免疑义，滴灌通并不承担联营方经营应缴付的任何税项，包括以全部收入为基数的流转税项等，联营方应按相关法律法规自行承担。',
        note: '税务责任归属',
        keys: []
      },
      {
        text: '滴灌通有权追踪联营方和其他方履行本协议的情况并追踪异常情况。前述追踪情况包括但不限于联营方销售收入明细数据、销售来源账号订单明细、联营方经营数据、财务流水、联营方经营异常情况及联营方重要事项，且联营方和其他方应当配合并充分协助滴灌通完成该等追踪工作，联营方和/或其他方应在滴灌通提出要求后的【${responseTime}】个自然日内提供滴灌通要求的全部资料。',
        note: '信息追踪权利',
        keys: ['responseTime']
      }
    ]
  },

  // ========== 第五条：违约责任（极重要）==========
  {
    id: 'breach',
    number: '五',
    title: '违约责任',
    clauses: [
      {
        text: '除本协议另有约定外，如果联营方和/或其他方发生以下任一情形，构成严重违约：（1）将本次联营资金挪用至联营方约定以外的个人账户、企业、业务或用途的；（2）通过各类方法隐藏、转移联营方收入、另设收银账号用于绕过分成监控机制的，或以其他形式开展非正常交易、导致滴灌通依据本协议所获分成收入遭受损失的；（3）经滴灌通合理判断，联营方实际控制人/控股股东或品牌方的实际控制人/控股股东存在"失联"情形的；（4）未经滴灌通事先书面同意，联营方停业、歇业或变更联营合作业务内容（包括变更主营业务品类等）的；（5）存在欺诈、违法违规行为等对联营方或其他方的商业信誉、经营状况造成重大影响的行为；（6）联营方和/或其他方存在超过【${dataDelay}】自然日没有按约定传输数据的；（7）联营方和/或其他方存在超过【${paymentDelay}】自然日没有按约定支付收入分成的；（8）联营方的品牌授权到期不再续约、或由于特许经营机制/加盟机制下的纠纷导致联营方丧失在相关合同下的继续经营权的；（9）联营方和/或其他方在本协议项下的陈述、保证及承诺存在不真实、不准确或不完整的；（10）本协议项下的其他严重违约情形。',
        note: '严重违约情形清单（十项）',
        keys: ['dataDelay', 'paymentDelay']
      },
      {
        text: '联营方和/或其他方发生以上任何一项严重违约的，滴灌通有权单方解除协议并要求联营方退还滴灌通已提供的本次联营资金，并向滴灌通支付【${breachPenalty}】作为违约金（"违约金"）。',
        note: '严重违约后果：退还资金+违约金',
        keys: ['breachPenalty']
      },
      {
        text: '联营方、品牌方、品牌代理商和/或联营方总公司对本协议项下联营方的所有债务和义务向滴灌通承担共同且连带的保证责任。',
        note: '连带保证责任（极重要）',
        keys: []
      },
      {
        text: '联营方实际控制人、品牌方实际控制人、品牌代理商实际控制人对本协议项下联营方的所有债务和义务向滴灌通承担共同且连带的保证责任。',
        note: '实际控制人连带责任',
        keys: []
      }
    ]
  },

  // ========== 第六条：保密 ==========
  {
    id: 'confidentiality',
    number: '六',
    title: '保密',
    clauses: [
      {
        text: '各方对因签署、履行本协议而知悉的对方商业秘密、经营信息、财务数据等保密信息负有保密义务。',
        note: '保密义务范围',
        keys: []
      },
      {
        text: '未经信息提供方书面同意，信息接收方不得向任何第三方披露保密信息，但法律法规要求披露或向其关联公司、专业顾问披露的除外。',
        note: '披露限制及例外',
        keys: []
      },
      {
        text: '本保密义务在本协议终止后【${confidentialityPeriod}】年内继续有效。',
        note: '保密期限延续',
        keys: ['confidentialityPeriod']
      }
    ]
  },

  // ========== 第七条：通知 ==========
  {
    id: 'notice',
    number: '七',
    title: '通知',
    clauses: [
      {
        text: '各方的联系方式详见附件三。各方同意通过以下方式送达的书面通知视为有效送达：（1）快递或邮寄：以签收日为送达日；（2）电子邮件：以发送成功日为送达日；（3）传真：以传真发送成功回执单记载日期为送达日。',
        note: '送达方式及生效日',
        keys: []
      },
      {
        text: '任何一方变更联系方式的，应在变更后【${contactChangeNotice}】个工作日内书面通知其他各方。',
        note: '联系方式变更通知',
        keys: ['contactChangeNotice']
      }
    ]
  },

  // ========== 第八条：廉洁与诚信 ==========
  {
    id: 'integrity',
    number: '八',
    title: '廉洁与诚信',
    clauses: [
      {
        text: '各方承诺在本协议签署及履行过程中，不向对方或对方关联方的员工、代理人提供任何形式的回扣、佣金、礼品或其他利益。',
        note: '反商业贿赂条款',
        keys: []
      },
      {
        text: '任何一方如发现对方存在违反廉洁诚信的行为，可向【${complianceEmail}】举报。',
        note: '举报渠道',
        keys: ['complianceEmail']
      }
    ]
  },

  // ========== 第九条：适用法律和争议解决 ==========
  {
    id: 'law-dispute',
    number: '九',
    title: '适用法律和争议解决',
    clauses: [
      {
        text: '本协议的订立、效力、解释、履行及争议解决均适用中华人民共和国法律（不包括港澳台地区法律）。',
        note: '适用中国大陆法律',
        keys: []
      },
      {
        text: '因本协议引起的或与本协议相关的任何争议，各方应友好协商解决；协商不成的，任何一方均可将争议提交至【${arbitrationInstitution}】按其届时有效的仲裁规则进行仲裁。',
        note: '争议解决方式',
        keys: ['arbitrationInstitution']
      },
      {
        text: '仲裁地为【${arbitrationPlace}】，仲裁语言为中文，仲裁裁决为终局裁决，对各方均有约束力。',
        note: '仲裁地点及效力',
        keys: ['arbitrationPlace']
      }
    ]
  },

  // ========== 第十条：协议的生效、变更、解除 ==========
  {
    id: 'effectiveness',
    number: '十',
    title: '协议的生效、变更、解除',
    clauses: [
      {
        text: '本协议自各方签署之日起生效。各方可选择电子签名或线下签署方式，电子签名与线下签署具有同等法律效力。',
        note: '生效方式（支持电子签章）',
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

  // ========== 附件一：定义及释义 ==========
  {
    id: 'appendix-definitions',
    number: '附件一',
    title: '定义及释义',
    clauses: [
      {
        text: '【实际控制人】指通过投资关系、协议或者其他安排，能够实际支配公司行为的人。就本协议而言，联营方实际控制人指直接或间接持有联营方50%以上股权或表决权的自然人；品牌方实际控制人指直接或间接持有品牌方50%以上股权或表决权的自然人。',
        note: '实际控制人定义',
        keys: []
      },
      {
        text: '【联营合作信息】指联营方和/或其他方与联营合作相关的所有数据和信息，包括但不限于：（1）联营方和/或其他方的基本信息（含工商信息、股权结构、实际控制人信息等）；（2）联营方和/或其他方的经营信息（含营业收入、成本费用、利润等）；（3）联营方和/或其他方的财务信息（含银行流水、资产负债等）；（4）本协议项下的交易信息。',
        note: '联营合作信息范围',
        keys: []
      },
      {
        text: '【违约相关信息】指联营方和/或其他方违反本协议约定的相关信息，包括但不限于：违约事实、违约时间、违约金额、催收记录、诉讼仲裁记录等。',
        note: '违约信息定义',
        keys: []
      },
      {
        text: '【联营方收入】指联营方扣除所有税项或费用前的全部营业收入（包含主营业务收入及其他业务收入），其中：税项指按照中国税收法律法规，联营方向税务机关申报缴纳的税费；费用指依据国家会计准则，联营方核算的各项成本、费用。',
        note: '联营方收入口径',
        keys: []
      }
    ]
  },

  // ========== 附件二：特别陈述、保证及承诺 ==========
  {
    id: 'appendix-representations',
    number: '附件二',
    title: '特别陈述、保证及承诺',
    clauses: [
      {
        text: '【非借贷关系声明】各方确认本协议项下的联营合作不构成借贷关系、合伙关系或任何形式的担保关系。滴灌通的投资回报仅来源于联营方收入的分成，滴灌通不对联营方的经营亏损承担任何责任。',
        note: '法律关系定性（非借贷）',
        keys: []
      },
      {
        text: '【权利转让同意】联营方和其他方同意，滴灌通有权将本协议项下的全部或部分权利义务转让给任何第三方（包括但不限于滴灌通的关联方），无需另行取得联营方和/或其他方的同意。',
        note: '权利可转让条款',
        keys: []
      },
      {
        text: '【品牌使用保证】联营方和/或其他方保证，联营方有权在协议期限内使用【${brandName}】品牌进行经营，且该品牌使用权不存在任何权利瑕疵或纠纷。',
        note: '品牌权利保证',
        keys: ['brandName']
      },
      {
        text: '【控制权稳定保证】联营方和/或其他方保证，在协议期限内，联营方的实际控制人、控股股东保持稳定，不会发生可能影响本协议履行的重大变化。',
        note: '控制权稳定承诺',
        keys: []
      },
      {
        text: '【合法合规保证】联营方和/或其他方保证，联营方的设立、存续及经营活动均符合适用法律法规的要求，已取得开展联营合作业务所需的全部证照、许可和批准，包括但不限于【${requiredLicenses}】。',
        note: '资质完备保证',
        keys: ['requiredLicenses']
      },
      {
        text: '【信息真实性保证】联营方和/或其他方保证，向滴灌通提供的所有信息和资料均真实、准确、完整，不存在虚假记载、误导性陈述或重大遗漏。',
        note: '信息真实性承诺',
        keys: []
      }
    ]
  },

  // ========== 附件三：资料清单 ==========
  {
    id: 'appendix-materials',
    number: '附件三',
    title: '资料清单',
    clauses: [
      {
        text: '联营方和其他方应向滴灌通提供以下资料：（1）各方的营业执照/身份证明文件；（2）各方的联系方式（地址、电话、邮箱、传真）；（3）联营方的银行账户信息；（4）门店的租赁合同或产权证明；（5）品牌授权文件或特许经营合同；（6）联营方的销售数据来源账号授权；（7）滴灌通要求的其他资料。',
        note: '应提供资料清单',
        keys: []
      },
      {
        text: '【联营方联系方式】地址：【${mguAddress}】；联系人：【${mguContact}】；电话：【${mguPhone}】；邮箱：【${mguEmail}】。',
        note: '联营方联系信息',
        keys: ['mguAddress', 'mguContact', 'mguPhone', 'mguEmail']
      },
      {
        text: '【滴灌通联系方式】地址：【${dgtAddress}】；联系人：【${dgtContact}】；电话：【${dgtPhone}】；邮箱：【${dgtEmail}】。',
        note: '滴灌通联系信息',
        keys: ['dgtAddress', 'dgtContact', 'dgtPhone', 'dgtEmail']
      }
    ]
  },

  // ========== 附件四：设备/门店信息 ==========
  {
    id: 'appendix-assets',
    number: '附件四',
    title: '设备唯一识别码与地理位置/门店信息',
    clauses: [
      {
        text: '本协议项下的联营合作标的为：【${assetType}】，位于【${storeAddress}】。',
        note: '联营标的描述',
        keys: ['assetType', 'storeAddress']
      },
      {
        text: '门店名称/简称：【${storeName}】',
        note: '门店名称',
        keys: ['storeName']
      },
      {
        text: '设备类型：【${equipmentType}】；设备数量：【${equipmentCount}】台。',
        note: '设备信息（如适用）',
        keys: ['equipmentType', 'equipmentCount']
      },
      {
        text: '设备唯一识别码清单：【${equipmentIds}】',
        note: '设备编号（如适用）',
        keys: ['equipmentIds']
      }
    ]
  },

  // 插入行业特定条款（如有）
  ...(industrySpecificClauses || [])
]

// ==================== 通用默认参数（V3标准）====================
const createDefaultParams = (industryOverrides: Record<string, any> = {}): Record<string, any> => ({
  // === 签约主体信息 ===
  dgtName: '滴灌通（深圳）投资管理有限公司',
  dgtCreditCode: '待填写',
  dgtAddress: '深圳市前海深港合作区',
  dgtLegalRep: '待填写',
  
  mguName: '待填写',
  mguCreditCode: '待填写',
  mguAddress: '待填写',
  mguLegalRep: '待填写',
  mguController: '待填写',
  mguControllerIdCard: '待填写',
  
  // === 联营资金与分成 ===
  investmentAmount: '500万',
  fundUsage: '门店装修、设备采购、首批物料及流动资金',
  prerequisites: '完成资料审核及系统对接',
  revenueDefinition: '税前全部营业收入',
  revenueShareRatio: '15',
  sharingStartDate: '首笔营业收入产生之日',
  sharingEndDate: '自收入分成起始日起满36个月',
  annualYieldRate: '25',
  
  // === 亏损闭店 ===
  lossClosurePeriod: '3',
  lossClosureThreshold: '5万',
  lossClosureNoticeDays: '1',
  
  // === 数据传输 ===
  dataTransmissionMethod: '系统自动传输',
  dataReportFrequency: '每自然日',
  dataTransmissionDay: '每个自然日（不含收入分成起始日）',
  dataSource: 'POS收银系统',
  
  // === 分成付款 ===
  paymentMethod: '系统自动打款',
  paymentFrequency: '每自然日',
  paymentDay: '每个自然日（不含收入分成起始日）',
  
  // === 对账 ===
  reconciliationDeadline: '分成付款日前',
  reconciliationDays: '7',
  
  // === 账户信息 ===
  mguAccountName: '待填写',
  mguAccountNumber: '待填写',
  mguBankName: '待填写',
  mguBankBranch: '待填写',
  dgtAccountName: '滴灌通（深圳）投资管理有限公司',
  dgtAccountNumber: '待填写',
  dgtBankName: '待填写',
  dgtBankBranch: '待填写',
  
  // === 门店/资产信息 ===
  storeName: '待确定',
  storeAddress: '待确定',
  brandName: '待确定',
  assetType: '门店',
  equipmentType: '无',
  equipmentCount: '0',
  equipmentIds: '无',
  
  // === 资质要求 ===
  requiredLicenses: '营业执照',
  
  // === 时限要求 ===
  responseTime: '5',
  contactChangeNotice: '5',
  
  // === 违约条款 ===
  dataDelay: '30',
  paymentDelay: '30',
  breachPenalty: '本次联营资金的20%',
  
  // === 保密与合规 ===
  confidentialityPeriod: '3',
  complianceEmail: 'compliance@microconnect.com',
  
  // === 争议解决 ===
  arbitrationInstitution: '深圳国际仲裁院',
  arbitrationPlace: '深圳',
  
  // === 文本 ===
  copies: '四',
  copiesPerParty: '一',
  
  // === 联系方式 ===
  mguContact: '待填写',
  mguPhone: '待填写',
  mguEmail: '待填写',
  dgtContact: '待填写',
  dgtPhone: '待填写',
  dgtEmail: '待填写',
  
  // 应用行业特定覆盖
  ...industryOverrides
})

// ==================== 通用模块定义（V3标准）====================
const createStandardModules = (industryModules: ContractModule[] = []): ContractModule[] => [
  // 模块1：联营资金与分成（核心商业条款）
  {
    id: 'investment-revenue',
    title: '联营资金与分成',
    description: '联营资金金额、分成比例、分成期限、终止条件',
    icon: 'fa-coins',
    importance: 'critical',
    clauses: [
      { name: '联营资金金额', value: '500万', key: 'investmentAmount', note: '投资方提供的资金总额' },
      { name: '固定分成比例', value: '15%', key: 'revenueShareRatio', note: '基于税前全部营业收入' },
      { name: '收入分成期', value: '36个月', key: 'sharingEndDate', note: '自首笔收入产生起' },
      { name: '年化收益率', value: '25%', key: 'annualYieldRate', note: '达到后自动终止分成' }
    ],
    risks: '分成比例过高影响经营、年化收益率偏高增加负担'
  },

  // 模块2：数据传输与对账
  {
    id: 'data-payment',
    title: '数据传输与对账',
    description: '数据上报频率、分成付款方式、对账机制',
    icon: 'fa-chart-line',
    importance: 'high',
    clauses: [
      { name: '数据传输方式', value: '系统自动传输', key: 'dataTransmissionMethod' },
      { name: '数据传输频率', value: '每自然日', key: 'dataReportFrequency' },
      { name: '数据来源系统', value: 'POS收银系统', key: 'dataSource' },
      { name: '分成付款频率', value: '每自然日', key: 'paymentFrequency' },
      { name: '对账周期', value: '按日', key: 'reconciliationDeadline' }
    ],
    risks: '数据延迟超30天构成严重违约'
  },

  // 模块3：提前终止条款
  {
    id: 'early-termination',
    title: '提前终止条款',
    description: '提前终止补偿金计算、亏损闭店条件',
    icon: 'fa-door-open',
    importance: 'critical',
    clauses: [
      { name: '提前终止通知期', value: '7个自然日', key: 'terminationNoticeDays', note: '需提前书面通知' },
      { name: '补偿金计算基础', value: '按年化收益率+7天', key: 'annualYieldRate', note: '最低按90天计算' },
      { name: '亏损闭店条件', value: '连续3个月收入低于5万', key: 'lossClosureThreshold' },
      { name: '亏损闭店通知期', value: '提前1个月', key: 'lossClosureNoticeDays' }
    ],
    risks: '提前终止代价高昂，需谨慎评估'
  },

  // 模块4：违约责任（极重要）
  {
    id: 'breach-liability',
    title: '违约责任',
    description: '严重违约情形、违约金、连带责任',
    icon: 'fa-gavel',
    importance: 'critical',
    clauses: [
      { name: '数据延迟违约门槛', value: '超过30天', key: 'dataDelay', note: '构成严重违约' },
      { name: '付款延迟违约门槛', value: '超过30天', key: 'paymentDelay', note: '构成严重违约' },
      { name: '违约金比例', value: '本次联营资金的20%', key: 'breachPenalty', note: '严重违约需支付' },
      { name: '连带责任方', value: '联营方+品牌方+实际控制人', key: 'jointLiability', note: '共同且连带责任' }
    ],
    risks: '严重违约将导致退还全部资金+20%违约金+征信记录'
  },

  // 模块5：禁止行为
  {
    id: 'prohibited-actions',
    title: '禁止行为',
    description: '未经同意不得执行的行为清单',
    icon: 'fa-ban',
    importance: 'critical',
    clauses: [
      { name: '变更控制权', value: '禁止', key: 'controlChange', note: '实际控制人/控股股东变更需同意' },
      { name: '转让品牌权', value: '禁止', key: 'brandTransfer', note: '品牌经营权转让需同意' },
      { name: '收入处置', value: '禁止', key: 'revenueDisposal', note: '不得出售、贴现、保理收入' },
      { name: '变更经营事项', value: '需书面同意', key: 'operationChange', note: '停业、搬迁、变更业务等' }
    ],
    risks: '违反禁止行为将触发补偿金或违约条款'
  },

  // 模块6：担保与连带责任
  {
    id: 'guarantee',
    title: '担保与连带责任',
    description: '各方连带保证责任安排',
    icon: 'fa-shield-halved',
    importance: 'critical',
    clauses: [
      { name: '联营方主体责任', value: '第一责任人', key: 'mguLiability' },
      { name: '品牌方连带责任', value: '共同且连带', key: 'brandLiability' },
      { name: '实际控制人责任', value: '共同且连带', key: 'controllerLiability' },
      { name: '品牌代理商责任', value: '共同且连带（如适用）', key: 'agentLiability' }
    ],
    risks: '实际控制人需承担个人连带责任'
  },

  // 模块7：门店/资产信息
  {
    id: 'store-info',
    title: '门店/资产信息',
    description: '联营标的的具体信息',
    icon: 'fa-store',
    importance: 'high',
    clauses: [
      { name: '门店名称', value: '待确定', key: 'storeName' },
      { name: '门店地址', value: '待确定', key: 'storeAddress' },
      { name: '品牌名称', value: '待确定', key: 'brandName' },
      { name: '必备证照', value: '营业执照', key: 'requiredLicenses' }
    ]
  },

  // 模块8：争议解决
  {
    id: 'dispute-resolution',
    title: '争议解决',
    description: '适用法律、仲裁机构、保密期限',
    icon: 'fa-balance-scale',
    importance: 'medium',
    clauses: [
      { name: '适用法律', value: '中国大陆法律', key: 'applicableLaw' },
      { name: '仲裁机构', value: '深圳国际仲裁院', key: 'arbitrationInstitution' },
      { name: '仲裁地点', value: '深圳', key: 'arbitrationPlace' },
      { name: '保密期限', value: '协议终止后3年', key: 'confidentialityPeriod' }
    ]
  },

  // 插入行业特定模块
  ...industryModules
]

// ==================== 行业模板定义 ====================

// 1. 演唱会/演出行业
export const concertTemplate: IndustryTemplate = {
  id: 'concert',
  name: '演唱会/演出',
  icon: 'fa-music',
  description: '演唱会、音乐节、话剧等现场演出项目',
  color: 'purple',
  defaultParams: createDefaultParams({
    investmentAmount: '1800万',
    revenueShareRatio: '70',
    annualYieldRate: '33',
    breachPenalty: '本次联营资金的20%',
    sharingEndDate: '演出结束且完成最终结算',
    fundUsage: '演出制作、艺人费用、场地租赁、宣传推广及流动资金',
    requiredLicenses: '营业执照、营业性演出许可证',
    assetType: '演唱会/演出项目',
    
    // 演唱会特有参数
    giftTicketLimit: '1000张',
    minTicketPrice: '票面价格的50%',
    discountTicketLimit: '总票量的20%',
    approvalThreshold: '10万元',
    budgetOverrunLimit: '10%',
    delayPeriod: '6个月',
    dataReportTime: '每日18:00前',
    paymentTime: '每日22:00前'
  }),
  modules: createStandardModules([
    {
      id: 'ticketing',
      title: '票务管控',
      description: '赠票上限、最低售价、折扣票比例',
      icon: 'fa-ticket',
      importance: 'critical',
      clauses: [
        { name: '赠票上限', value: '1000张', key: 'giftTicketLimit', note: '超出按票面价支付' },
        { name: '最低售价', value: '票面价格的50%', key: 'minTicketPrice', note: '低于需补差额' },
        { name: '折扣票上限', value: '总票量的20%', key: 'discountTicketLimit', note: '超出需书面同意' }
      ],
      risks: '赠票超限、低价销售可构成违约'
    },
    {
      id: 'artist-risk',
      title: '艺人风险',
      description: '艺人违约、负面舆情、演出延期',
      icon: 'fa-user-music',
      importance: 'critical',
      clauses: [
        { name: '艺人违约处理', value: '全额退款+补偿金', key: 'artistDefault', note: '无论是否追回费用' },
        { name: '演出延期上限', value: '6个月', key: 'delayPeriod', note: '超期视为取消' },
        { name: '负面舆情通知', value: '5日内', key: 'negativeNewsNotice' }
      ],
      risks: '艺人违约时需全额退款，与是否追回费用无关'
    },
    {
      id: 'escrow-account',
      title: '共管账户',
      description: '资金监管、支出审批、权限配置',
      icon: 'fa-university',
      importance: 'high',
      clauses: [
        { name: '支出审批阈值', value: '超过10万元', key: 'approvalThreshold', note: '需盖章书面同意' },
        { name: '预算超支容忍', value: '10%', key: 'budgetOverrunLimit', note: '超出可拒付' },
        { name: '投资方权限', value: '查询+复核+U盾', key: 'investorRights' }
      ],
      risks: '微信/邮件不构成有效书面同意'
    }
  ]),
  fullText: createMicroConnectFullTextV3([
    {
      id: 'concert-ticketing',
      number: '行业附加一',
      title: '票务管控特别约定',
      clauses: [
        {
          text: '演出赠票上限为【${giftTicketLimit}】，超出部分需融资方按票面价格支付至共管账户。',
          note: '赠票控制',
          keys: ['giftTicketLimit']
        },
        {
          text: '演出门票的最低销售价格不得低于【${minTicketPrice}】，若按照低于该价格出售，融资方需将差额补足支付到共管账户。',
          note: '价格保护',
          keys: ['minTicketPrice']
        },
        {
          text: '融资方出售折扣票的比例不得超过【${discountTicketLimit}】，超出部分需事先取得投资方的书面同意。',
          note: '折扣控制',
          keys: ['discountTicketLimit']
        }
      ]
    },
    {
      id: 'concert-artist',
      number: '行业附加二',
      title: '艺人风险特别约定',
      clauses: [
        {
          text: '若演出因艺人违约而取消，无论融资方是否实际收回已支付给艺人的演出费用，融资方需退还投资方已提供的全部资金，并按【${annualYieldRate}%按月计】计算补偿金。',
          note: '艺人违约处理',
          keys: ['annualYieldRate']
        },
        {
          text: '若演出需要延期，且最后一场演出不晚于原定日期后【${delayPeriod}】举行，收入分成期相应延长。若超过此期限，则视为演出取消。',
          note: '延期处理',
          keys: ['delayPeriod']
        }
      ]
    },
    {
      id: 'concert-escrow',
      number: '行业附加三',
      title: '共管账户特别约定',
      clauses: [
        {
          text: '投资方和融资方开立共管账户，投资方已取得必要的共管权限（包括但不限于网银查询权限、复核/审批权限及/或U盾、印鉴等），以确保投资方可对共管账户资金收支进行监管。',
          note: '共管账户设立',
          keys: []
        },
        {
          text: '融资方如需支付运营支出，金额超过【${approvalThreshold}】的，需提前获得投资方的盖章书面文件同意。',
          note: '支出审批',
          keys: ['approvalThreshold']
        },
        {
          text: '若实际需支出的金额超过预算金额的【${budgetOverrunLimit}】，投资方有权拒绝从共管账户支付超出部分，融资方需自行承担超出金额。',
          note: '预算超支处理',
          keys: ['budgetOverrunLimit']
        }
      ]
    }
  ])
}

// 2. 餐饮行业
export const cateringTemplate: IndustryTemplate = {
  id: 'catering',
  name: '餐饮连锁',
  icon: 'fa-utensils',
  description: '餐厅、奶茶店、咖啡厅等餐饮项目',
  color: 'orange',
  defaultParams: createDefaultParams({
    investmentAmount: '500万',
    revenueShareRatio: '15',
    annualYieldRate: '25',
    sharingEndDate: '自收入分成起始日起满36个月',
    fundUsage: '门店装修、设备采购、首批物料及流动资金',
    requiredLicenses: '营业执照、食品经营许可证',
    assetType: '餐饮门店',
    
    // 餐饮特有参数
    businessHours: '10小时',
    foodSafetyNotice: '24小时内',
    minMonthlyRevenue: '30万'
  }),
  modules: createStandardModules([
    {
      id: 'food-safety',
      title: '食品安全',
      description: '卫生许可、安全事故通知',
      icon: 'fa-shield-virus',
      importance: 'high',
      clauses: [
        { name: '必备证照', value: '食品经营许可证', key: 'requiredLicenses' },
        { name: '食品安全事故通知', value: '24小时内', key: 'foodSafetyNotice', note: '书面通知投资方' },
        { name: '最低日营业时间', value: '10小时', key: 'businessHours' }
      ],
      risks: '食品安全事故可能导致证照吊销'
    },
    {
      id: 'operation-requirement',
      title: '运营要求',
      description: '营业时间、最低营收',
      icon: 'fa-chart-bar',
      importance: 'medium',
      clauses: [
        { name: '最低月营收', value: '30万', key: 'minMonthlyRevenue', note: '连续3月低于需说明' }
      ]
    }
  ]),
  fullText: createMicroConnectFullTextV3([
    {
      id: 'catering-specific',
      number: '行业附加',
      title: '餐饮行业特别约定',
      clauses: [
        {
          text: '联营方应确保门店食品卫生安全，遵守《食品安全法》等相关法律法规，如发生食品安全事故，应在【${foodSafetyNotice}】内书面通知投资方。',
          note: '食品安全要求',
          keys: ['foodSafetyNotice']
        },
        {
          text: '联营方应保持门店正常营业，每日营业时间不少于【${businessHours}】，如需调整营业时间或暂停营业，应提前【${responseTime}】日书面通知投资方。',
          note: '营业时间要求',
          keys: ['businessHours', 'responseTime']
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

// 3. 零售行业
export const retailTemplate: IndustryTemplate = {
  id: 'retail',
  name: '零售门店',
  icon: 'fa-shopping-bag',
  description: '便利店、专卖店、商超等零售项目',
  color: 'blue',
  defaultParams: createDefaultParams({
    investmentAmount: '300万',
    revenueShareRatio: '12',
    annualYieldRate: '22',
    sharingEndDate: '自收入分成起始日起满48个月',
    fundUsage: '门店装修、货架设备、首批库存及流动资金',
    requiredLicenses: '营业执照',
    assetType: '零售门店',
    paymentFrequency: '每周',
    paymentDay: '每周一18:00前（上周收入）',
    
    // 零售特有参数
    inventoryTurnover: '30天',
    minMonthlyRevenue: '30万'
  }),
  modules: createStandardModules([
    {
      id: 'inventory-management',
      title: '库存管理',
      description: '库存周转、最低营收',
      icon: 'fa-boxes',
      importance: 'medium',
      clauses: [
        { name: '库存周转天数', value: '30天内', key: 'inventoryTurnover' },
        { name: '最低月营收', value: '30万', key: 'minMonthlyRevenue' }
      ],
      risks: '库存积压影响资金周转'
    }
  ]),
  fullText: createMicroConnectFullTextV3([
    {
      id: 'retail-specific',
      number: '行业附加',
      title: '零售行业特别约定',
      clauses: [
        {
          text: '联营方应确保库存周转天数不超过【${inventoryTurnover}】，如库存积压严重，应书面说明原因并制定清理计划。',
          note: '库存管理',
          keys: ['inventoryTurnover']
        },
        {
          text: '联营方应确保门店月营业收入不低于【${minMonthlyRevenue}】，连续3个月低于此标准需向投资方书面说明原因。',
          note: '最低营收',
          keys: ['minMonthlyRevenue']
        }
      ]
    }
  ])
}

// 4. 医美/健康行业
export const healthcareTemplate: IndustryTemplate = {
  id: 'healthcare',
  name: '医美/健康',
  icon: 'fa-heartbeat',
  description: '医美诊所、健身房、康复中心等项目',
  color: 'pink',
  defaultParams: createDefaultParams({
    investmentAmount: '800万',
    revenueShareRatio: '18',
    annualYieldRate: '28',
    sharingEndDate: '自收入分成起始日起满36个月',
    fundUsage: '场所装修、医疗设备采购、人员培训及流动资金',
    requiredLicenses: '医疗机构执业许可证、卫生许可证、从业人员资质证书',
    assetType: '医美/健康机构',
    dataSource: 'HIS系统/收银系统',
    paymentFrequency: '每周',
    paymentDay: '每周一18:00前（上周收入）',
    
    // 医美特有参数
    medicalIncidentNotice: '24小时内',
    licenseRenewalDays: '30天',
    minMonthlyRevenue: '50万'
  }),
  modules: createStandardModules([
    {
      id: 'medical-compliance',
      title: '医疗合规',
      description: '资质维护、医疗安全、事故通知',
      icon: 'fa-clipboard-check',
      importance: 'critical',
      clauses: [
        { name: '医疗机构执业许可证', value: '必须持续有效', key: 'requiredLicenses' },
        { name: '资质续期提前期', value: '到期前30天', key: 'licenseRenewalDays' },
        { name: '医疗事故通知', value: '24小时内', key: 'medicalIncidentNotice', note: '书面通知投资方' }
      ],
      risks: '资质吊销视为严重违约'
    },
    {
      id: 'operation-requirement',
      title: '运营要求',
      description: '最低营收',
      icon: 'fa-chart-bar',
      importance: 'medium',
      clauses: [
        { name: '最低月营收', value: '50万', key: 'minMonthlyRevenue' }
      ]
    }
  ]),
  fullText: createMicroConnectFullTextV3([
    {
      id: 'healthcare-specific',
      number: '行业附加',
      title: '医美/健康行业特别约定',
      clauses: [
        {
          text: '联营方应确保【${requiredLicenses}】等必要资质在本协议期限内持续有效，资质到期前【${licenseRenewalDays}】应完成续期手续。',
          note: '资质维护',
          keys: ['requiredLicenses', 'licenseRenewalDays']
        },
        {
          text: '如发生医疗事故或医疗纠纷，联营方应在【${medicalIncidentNotice}】内书面通知投资方，并及时提供事故处理进展。',
          note: '医疗事故通知',
          keys: ['medicalIncidentNotice']
        },
        {
          text: '联营方应确保门店月营业收入不低于【${minMonthlyRevenue}】，连续3个月低于此标准需向投资方书面说明原因。',
          note: '最低营收',
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

// 5. 教育培训行业
export const educationTemplate: IndustryTemplate = {
  id: 'education',
  name: '教育培训',
  icon: 'fa-graduation-cap',
  description: '培训机构、职业教育、兴趣班等项目',
  color: 'green',
  defaultParams: createDefaultParams({
    investmentAmount: '400万',
    revenueShareRatio: '20',
    annualYieldRate: '25',
    sharingEndDate: '自收入分成起始日起满36个月',
    fundUsage: '场地装修、教学设备、师资培训及流动资金',
    requiredLicenses: '营业执照、办学许可证（如适用）',
    assetType: '教育培训机构',
    dataSource: '教务管理系统/收银系统',
    paymentFrequency: '每周',
    paymentDay: '每周一18:00前（上周收入）',
    
    // 教育特有参数
    minStudentCount: '200人',
    refundPolicy: '开课前全额退款，开课后按课时比例退款'
  }),
  modules: createStandardModules([
    {
      id: 'enrollment',
      title: '招生与退费',
      description: '最低学员数、退费政策',
      icon: 'fa-chalkboard-teacher',
      importance: 'high',
      clauses: [
        { name: '最低在读学员数', value: '200人', key: 'minStudentCount' },
        { name: '退费政策', value: '开课前全额，开课后按比例', key: 'refundPolicy' }
      ],
      risks: '招生不达标、政策风险、退费纠纷'
    }
  ]),
  fullText: createMicroConnectFullTextV3([
    {
      id: 'education-specific',
      number: '行业附加',
      title: '教育培训行业特别约定',
      clauses: [
        {
          text: '联营方应确保在读学员数不低于【${minStudentCount}】，连续3个月低于此标准需向投资方书面说明原因。',
          note: '学员数量',
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

// ==================== 导出 ====================
export const industryTemplates: Record<string, IndustryTemplate> = {
  concert: concertTemplate,
  catering: cateringTemplate,
  retail: retailTemplate,
  healthcare: healthcareTemplate,
  education: educationTemplate
}

export const templateList = Object.values(industryTemplates)
