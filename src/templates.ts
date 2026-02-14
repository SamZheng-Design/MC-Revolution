// 收入分成融资 - 行业合同模板系统
// 基于滴灌通联营协议（境内B类资产）标准模板 V3 - 2026年2月更新

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

// ==================== 滴灌通联营协议（境内B类资产）标准模板 V3 ====================
// 基于最新版《联合经营协议》完整重构
// 适用于：餐饮、零售、医美、教育、设备运营等境内B类资产业务

/**
 * 创建标准滴灌通联营协议完整文本
 * @param industrySpecificClauses 行业特定附加条款
 * @returns 完整合同条款数组
 */
const createStandardFullText = (industrySpecificClauses?: ContractSection[]): ContractSection[] => [
  // ========== 第一条：联营合作商业安排 ==========
  {
    id: 'business-arrangement',
    number: '一',
    title: '联营合作商业安排',
    clauses: [
      // 1.1 联营资金提供及收入分成安排
      {
        text: '滴灌通将根据本协议约定向联营方提供联营资金，同时联营方收入的相应比例应由联营方和/或其他方向滴灌通进行分成。',
        note: '核心商业条款总述',
        keys: []
      },
      {
        text: '联营资金金额：本分成方案项下滴灌通提供的联营资金（"本次联营资金"）金额为人民币【${investmentAmount}】元（大写：【${investmentAmountCN}】）。',
        note: '投资方提供的联营资金总额',
        keys: ['investmentAmount', 'investmentAmountCN']
      },
      {
        text: '联营资金用途：联营方和其他方共同承诺本次联营资金仅可被用于联营方【${fundUsage}】，不得挪用（包括挪用至个人账户等）或未按前述约定用途使用，且滴灌通有权随时对联营资金的实际使用情况进行检查。若政府主管部门要求对联营资金的使用情况进行合规性检查，联营方和其他方应予以充分配合。',
        note: '资金的指定用途及监管要求',
        keys: ['fundUsage']
      },
      {
        text: '前置条件：滴灌通向联营方提供本次联营资金的前置条件为：（1）滴灌通取得关于提供本次联营资金的内部审批；（2）滴灌通与联营方、其他方及其他主体（如适用）的数据传输方案与分账方案均已完成且符合滴灌通要求；（3）联营方和其他方在滴灌通提供本次联营资金前均不存在任何违反本协议陈述保证及承诺或其它约定的情形；（4）联营方向滴灌通提供门店出资的资金到账证明、资金用途证明（包括但不限于购销合同其他资金用途证明）及门店资产价值清单及报价表；（5）品牌方已就其对联营方的特许经营事宜完成特许经营备案；（6）按照滴灌通要求提供完毕附件三资料；（7）各方同意的其它情形。',
        note: '资金到位的前提条件清单',
        keys: []
      },
      {
        text: '联营方收入定义：本协议所指的"联营方收入"或"全部收入"应包括联营方扣除所有税项（指按照中国税收法律法规，联营方向税务机关申报缴纳的税费）或费用（指依据国家会计准则，联营方核算的各项成本、费用）前的全部营业收入（包含主营业务收入及其他业务收入）。',
        note: '收入计算口径定义',
        keys: []
      },
      {
        text: '分成比例：在本协议的收入分成期内，联营方和/或其他方应按照联营方收入的【${revenueShareRatio}】%向滴灌通进行分成。',
        note: '投资方按此比例分享联营方收入',
        keys: ['revenueShareRatio']
      },
      {
        text: '收入分成期：本协议收入分成期自滴灌通"收入分成起始日"至【${sharingEndDate}】止。"收入分成起始日"为【${sharingStartDate}】。',
        note: '分成期限的起止时间',
        keys: ['sharingStartDate', 'sharingEndDate']
      },
      {
        text: '收入分成期的终止触发事项：虽有前述约定，在收入分成期内，滴灌通累计实际取得的收入分成金额合计达到"滴灌通已出资的联营资金×(1+【${annualYieldRate}】%÷360×已联营天数)"金额的，收入分成期自该条件达成之日的前一日终止。"已联营天数"的计算方式为：自滴灌通发出本次联营资金出资指令之日起算（含当日）经过的自然日天数。',
        note: '分成终止条件（年化回报率）',
        keys: ['annualYieldRate']
      },
      {
        text: '协议期限：自收入分成期终止之日，本协议终止。本协议的协议期限为自本协议生效之日起直至本协议终止之日（"协议期限"）。除本协议另有约定外，在协议期限内联营方须经滴灌通确认同意方可提前结束联营合作项下门店的经营，并按本协议约定履行相关手续。',
        note: '协议整体期限',
        keys: []
      },
      {
        text: '提前终止：除本协议另有约定外，各方确认，联营方和/或其他方主张提前终止本协议的行为构成对本协议收入分成期约定的违反。基于此，在收入分成期内，联营方和/或其他方若需提前终止本协议，其应提前7个自然日向滴灌通发出书面通知，且联营方和/或其他方应于发出终止本协议通知之日（含当日）起7个自然日内的16点前，向滴灌通支付补偿金。补偿金=本次联营资金+（本次联营资金×【${annualYieldRate}】%÷360×(已经历收入分成天数+7)）。"已经历收入分成天数"指自收入分成起始日（含当日）起至发出终止通知之日的天数，如不满90个自然日的，按90天计算，超过90个自然日的按实际天数计算。',
        note: '提前终止的补偿金计算方式',
        keys: ['annualYieldRate']
      },
      {
        text: '亏损闭店终止联营：联营方在收入分成期内连续【${lossClosurePeriod}】个月联营收入低于【${lossClosureThreshold}】元，拟结束门店经营的，联营方和/或其他方应在拟结束门店经营前1个月书面通知滴灌通，并提供包括但不限于（1）联营方在收入分成期内的财务报表，及（2）联营方的租约解除协议或业务平台终止合作证明，（3）员工及门店设备撤出经营场所的证明或滴灌通认可的其他主体出具的证明文件，（4）收入分成期内销售订单明细、银行流水或滴灌通认可的其他文件，联营方和/或其他方应确保前述文件的真实、准确和完整。',
        note: '亏损闭店的条件和流程',
        keys: ['lossClosurePeriod', 'lossClosureThreshold']
      }
    ]
  },
  
  // ========== 数据传输及收入分成方式 ==========
  {
    id: 'data-transmission',
    number: '一（续）',
    title: '数据传输及收入分成',
    clauses: [
      {
        text: '数据传输方式：【${dataTransmissionMethod}】。',
        note: '系统自动传输或手工上报',
        keys: ['dataTransmissionMethod']
      },
      {
        text: '数据传输频率：数据传输应按照【${dataReportFrequency}】一次的频率进行传输。',
        note: '每日/每周/每月',
        keys: ['dataReportFrequency']
      },
      {
        text: '数据传输时间：收入分成起始日后的【${dataTransmissionDay}】为"数据传输日"。',
        note: '具体数据传输时间点',
        keys: ['dataTransmissionDay']
      },
      {
        text: '数据传输来源系统：【${dataSource}】。',
        note: '数据来源系统名称（如POS系统、收银系统等）',
        keys: ['dataSource']
      },
      {
        text: '分成付款方式：【${paymentMethod}】。',
        note: '系统自动打款或手动分账',
        keys: ['paymentMethod']
      },
      {
        text: '分成付款频率：收入分成款应按照【${paymentFrequency}】一次的频率进行计算及支付。',
        note: '分成款支付频率',
        keys: ['paymentFrequency']
      },
      {
        text: '分成付款时间：收入分成起始日后的【${paymentDay}】为"分成付款日"。',
        note: '分成款支付时间点',
        keys: ['paymentDay']
      },
      {
        text: '对账方案：联营方和/或其他方应在【${reconciliationDeadline}】前完成数据对账和确认；若联营方和/或其他方对数据存在疑问，应在前述日期内以书面形式向滴灌通提出申诉，并附相关核对依据；超出上述期限的，视为联营方和/或其他方已认可对应数据准确无误，滴灌通不再接受联营方和/或其他方就相应数据提出异议。如对账后发现联营方实际打款金额少于滴灌通应分而未分金额的，联营方应当自收到滴灌通通知起后【${reconciliationPaymentDays}】个自然日内向滴灌通补齐差额（"分配差额"）。',
        note: '数据核对与确认机制',
        keys: ['reconciliationDeadline', 'reconciliationPaymentDays']
      }
    ]
  },
  
  // ========== 账户信息 ==========
  {
    id: 'account-info',
    number: '一（续）',
    title: '收款账户信息',
    clauses: [
      {
        text: '联营方收款账户信息：户名【${mguAccountName}】，账号【${mguAccountNumber}】，开户行【${mguBankName}】，开户支行【${mguBankBranch}】。若联营方拟变更收款账户信息，联营方和/或其他方应当及时书面通知滴灌通并经滴灌通确认。滴灌通向上述联营方收款账户（含代联营方收款的账户或变更后的联营方收款账户）完成本次联营资金的划转，即视为滴灌通已完成本协议约定的本次联营资金的提供义务。',
        note: '联营方收款账户',
        keys: ['mguAccountName', 'mguAccountNumber', 'mguBankName', 'mguBankBranch']
      },
      {
        text: '滴灌通分成款收款账户信息：户名【${mcAccountName}】，账号【${mcAccountNumber}】，开户行【${mcBankName}】，开户支行【${mcBankBranch}】。',
        note: '滴灌通收款账户',
        keys: ['mcAccountName', 'mcAccountNumber', 'mcBankName', 'mcBankBranch']
      },
      {
        text: '发票开具：在进行年度核算时，当滴灌通累计取得的分成金额达到或超过滴灌通累计实际已提供联营资金金额后，就超过部分的分成收入，滴灌通同意根据届时适用的相关法律规定、相应主管部门的要求及联营方开票信息向联营方开具普通发票或其他凭证。',
        note: '发票开具安排',
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
        note: '附件二特别声明确认',
        keys: []
      },
      {
        text: '针对本次联营合作，联营方和其他方共同且连带地向滴灌通作出如附件二所述的进一步陈述、保证及承诺。',
        note: '联营方及其他方的连带保证',
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
        text: '联营方和其他方同意直接或授权相关方间接向滴灌通持续提供和同步滴灌通所要求的数据和信息，并同意滴灌通和/或其境内外关联方有权自行收集（包括从联营方、其他方、政府相关部门或其他第三方收集）、管理和使用联营方和其他方与联营合作有关的所有数据和信息（本条提及的数据和信息以下统称"联营合作信息"，定义及范围见附件一）。',
        note: '数据收集授权',
        keys: []
      },
      {
        text: '联营方和/或其他方同意滴灌通将联营合作信息提供给滴灌通境内外关联方及第三方（包括但不限于滴灌通及其关联方的外部顾问和中介机构、潜在/间接投资者及其外部顾问和中介机构、监管机构等），并同意滴灌通将联营合作信息用于了解联营方和/或其他方的经营情况、统计分析并形成统计数据/图表/风险评级并对外公开与签署、履行本协议以及维护滴灌通在本协议项下权益相关的其他用途。',
        note: '数据使用和共享授权',
        keys: []
      },
      {
        text: '如果联营方和/或其他方与滴灌通和/或征信机构(包括但不限于百行征信有限公司等)有相应授权协议或安排，基于该授权与本协议的相关约定，滴灌通会对联营方和/或其他方的联营合作信息及违约相关信息进行综合统计、分析或加工处理并将数据处理结果提供给前述征信机构，或直接将联营方和/或其他方的联营合作信息及违约相关信息报送前述征信机构，用于投资决策、风险管理等目的。',
        note: '征信信息报送授权',
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
        text: '特别地，各方一致同意，在协议期限内，联营方和/或其他方不得执行以下行为：（1）联营方变更实际控制人或控股股东或个体户经营者（如有）；（2）联营方转让旗下品牌经营权、联营方品牌经营授权/许可到期不再续约等可能影响联营方主营业务收入的行为；（3）联营方将联营方收入向第三方进行出售、分成、贴现、保理等处理从而可能影响本次联营合作或本协议项下滴灌通的收入分成权利的行为；及（4）联营方未征得滴灌通事先书面同意而变更重要经营事项（包括但不限于变更门店经营场地、增加或减少设备数量、停业、歇业、变更联营合作业务内容、变更经营范围、减少注册资本、经营权/控制权变更/转让、缩短或变更租赁合同导致滴灌通协议项下权益受损的，以及其他导致或可能导致滴灌通在本协议项下的权利或利益受到重大不利影响的资产处置与新增对外偿还债务等）。为免疑义，前述"处置"包括出售、对外租赁、对外抵押/质押/担保，无论是一系列交易还是单笔交易。',
        note: '禁止性行为清单（重大事项限制）',
        keys: []
      },
      {
        text: '除本协议另有约定外，若联营方和/或其他方违反本协议约定执行了以上禁止行为，则：1）滴灌通有权要求联营方、其他方向滴灌通支付一笔补偿金，或其他滴灌通要求的方式，以提前解除本协议；2）针对变更控制权情形，滴灌通除有权采用方式1）之外，有权选择要求与联营方的新实际控制人或新控股股东或新个体户经营者签署补充协议，由新实际控制人或新控股股东或新个体户经营者加入本协议并承担本协议项下其他方的相关权利及义务。联营方、其他方应在滴灌通发出前述要求的10个自然日内配合完成前述处理方案的协商及执行。',
        note: '违反限制行为的处理方式',
        keys: []
      },
      {
        text: '联营方、其他方应确保协议期限内所有的联营方收入均及时、如实、准确、完整反映到相关收入情况和流水证明文件中。联营方、其他方不得以其他方式（包括以第三方或者员工个人名义代收的方式）代为收取任何联营方收入。',
        note: '收入如实申报义务',
        keys: []
      },
      {
        text: '若本次联营合作采用系统自动分账作为分成付款方式，联营方和其他方应充分授权并配合滴灌通指定的第三方机构对联营方收入按本协议约定自动进行分成，并将滴灌通应得的分成部分直接自动支付至滴灌通指定的收款账户，且不得自行更改任何可能影响前述分成的安排，包括更改分成比例、变更/注销银行账户或撤销银行授权等。',
        note: '自动分账配合义务',
        keys: []
      },
      {
        text: '为免疑义，滴灌通并不承担联营方经营应缴付的任何税项，包括以全部收入为基数的流转税项等，联营方应按相关法律法规自行承担。',
        note: '税务责任划分',
        keys: []
      },
      {
        text: '滴灌通有权追踪联营方和其他方履行本协议的情况并追踪异常情况。前述追踪情况包括但不限于联营方销售收入明细数据、销售来源账号订单明细、联营方经营数据、财务流水、联营方经营异常情况及联营方重要事项，且联营方和其他方应当配合并充分协助滴灌通完成该等追踪工作，联营方和/或其他方应在滴灌通提出要求后的【${responseTime}】个自然日内提供滴灌通要求的全部资料。',
        note: '投资方追踪权',
        keys: ['responseTime']
      }
    ]
  },

  // ========== 第五条：违约责任（重要条款）==========
  {
    id: 'breach',
    number: '五',
    title: '违约责任',
    clauses: [
      {
        text: '如联营方和/或其他方存在以下任一情形，即构成"严重违约"：（1）联营方和/或其他方挪用联营资金（包括挪用至个人账户等）或未按本协议约定的用途使用联营资金；（2）联营方和/或其他方私自设立银行账户或第三方支付账户，或联营方和/或其他方及其员工私自收取联营方收入；或存在其他可能导致滴灌通无法按照本协议约定的条件及时、准确、完整地获得联营方收入的数据或其他信息的行为，或存在数据造假、伪造、变造、篡改或其它操纵行为；（3）联营方在收入分成期存续期间，未经滴灌通书面同意停业或歇业（无论正当与否）；（4）联营方和/或其他方延迟向滴灌通报送数据或支付联营方收入分成达【${seriousBreachDays}】天；（5）联营方和/或其他方违反本协议的陈述保证与承诺（包括但不限于附件二项下的陈述保证与承诺）；（6）联营方或其他方涉及违法犯罪行为或被行政机关处罚的；（7）其他联营方和/或其他方明显违反合同约定、违反诚信原则的行为。',
        note: '严重违约情形清单',
        keys: ['seriousBreachDays']
      },
      {
        text: '如联营方和/或其他方存在严重违约情形，滴灌通有权（但无义务）选择以下任一方式处理：（1）单方解除本协议；（2）要求联营方和/或其他方向滴灌通退还滴灌通已出资的联营资金（如有），同时向滴灌通支付违约金（违约金为本次联营资金的【${breachPenalty}】%）。',
        note: '严重违约的处理方式及违约金',
        keys: ['breachPenalty']
      },
      {
        text: '联营方和其他方对本协议项下所有付款义务（包括但不限于联营方收入分成支付义务、违约金支付义务）承担共同且连带的付款责任。',
        note: '连带付款责任',
        keys: []
      },
      {
        text: '若联营方和/或其他方因违反本协议而需向滴灌通支付任何款项的，需在违约日起【${defaultPaymentDays}】个自然日内全额支付。若联营方和/或其他方逾期付款的，滴灌通有权要求联营方和/或其他方按逾期付款金额的日【${overdueInterestRate}】%支付逾期利息。',
        note: '违约付款期限及逾期利息',
        keys: ['defaultPaymentDays', 'overdueInterestRate']
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
        note: '保密期限',
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
        text: '本协议项下的任何通知、同意或批准应采用书面形式，可通过专人送达、邮寄、电子邮件或传真方式发送至附件三所列联系地址。',
        note: '通知方式',
        keys: []
      },
      {
        text: '专人送达的通知于签收之日视为送达；邮寄的通知于投递后第【${mailingNoticeDays}】个自然日视为送达；电子邮件或传真于发送当日视为送达。',
        note: '送达时间认定',
        keys: ['mailingNoticeDays']
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
        note: '仲裁地点和效力',
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
        text: '本协议自各方签署之日起生效。各方可选择电子签名或线下签署方式，电子签名与手写签名具有同等法律效力。',
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

  // ========== 附件一：定义及释义 ==========
  {
    id: 'appendix-definitions',
    number: '附件一',
    title: '定义及释义',
    clauses: [
      {
        text: '"实际控制人"是指能够对联营方/品牌方的经营决策产生重大影响或有效控制的自然人，包括但不限于：（1）持有联营方/品牌方50%以上股权/表决权的自然人；（2）虽持股比例低于50%，但通过协议安排、一致行动人等方式能够对联营方/品牌方的重大事项作出决定的自然人；（3）联营方/品牌方的实际出资人。',
        note: '实际控制人定义',
        keys: []
      },
      {
        text: '"联营合作信息"包括但不限于：（1）本协议及其附件、补充协议的内容；（2）联营方、其他方、实际控制人的基本信息、证照信息、账户信息；（3）联营方的经营数据、财务数据、销售数据、银行流水；（4）门店/设备的基本信息、位置信息、资产信息；（5）品牌信息、特许经营信息；（6）联营方、其他方在履行本协议过程中产生的其他信息。',
        note: '联营合作信息范围',
        keys: []
      },
      {
        text: '"违约相关信息"包括但不限于：（1）联营方和/或其他方存在的违约情形；（2）联营方和/或其他方的逾期付款记录；（3）滴灌通对联营方和/或其他方采取的违约处理措施；（4）仲裁、诉讼情况；（5）其他与违约相关的信息。',
        note: '违约相关信息范围',
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
        text: '各方特别声明：（1）本协议项下的联营合作不构成法律意义上的借贷关系、合伙关系或联营关系，滴灌通提供的联营资金不构成借款；（2）各方同意滴灌通有权将本协议项下的全部或部分权利义务转让给第三方，联营方和其他方应予以配合；（3）联营方承诺严格按照品牌方的经营规范和标准进行经营。',
        note: '关系定性与转让权',
        keys: []
      },
      {
        text: '联营方和其他方进一步陈述、保证及承诺：（1）本协议签署时，联营方和其他方的实际控制人分别为【${mguActualController}】和【${brandActualController}】，在本协议期限内，未经滴灌通书面同意，实际控制人不会发生变更；（2）联营方已取得开展联营合作业务所需的全部证照和许可，并将在本协议期限内保持有效；（3）联营方和其他方提供的所有信息和资料均真实、准确、完整；（4）联营方及其实际控制人不存在未决的或潜在的诉讼、仲裁或行政处罚；（5）本协议的签署和履行不会违反联营方和其他方对任何第三方的义务。',
        note: '联营方和其他方的特别保证',
        keys: ['mguActualController', 'brandActualController']
      }
    ]
  },

  // 插入行业特定条款（如有）
  ...(industrySpecificClauses || [])
]

/**
 * 创建标准模块列表（用于快速查看重要条款）
 * @param customModules 行业特定模块
 * @returns 完整模块列表
 */
const createStandardModules = (customModules?: ContractModule[]): ContractModule[] => [
  // ========== 核心商业条款模块 ==========
  {
    id: 'investment-core',
    title: '联营资金安排',
    description: '资金金额、用途、前置条件',
    icon: 'fa-coins',
    importance: 'critical',
    clauses: [
      { name: '联营资金金额', value: '待填写', key: 'investmentAmount', note: '滴灌通提供的联营资金总额' },
      { name: '联营资金用途', value: '待填写', key: 'fundUsage', note: '资金指定用途，不得挪用' },
      { name: '资金监管', value: '滴灌通有权随时检查', key: 'fundSupervision', note: '政府部门合规检查需配合' }
    ],
    risks: '资金挪用将构成严重违约'
  },
  {
    id: 'revenue-share',
    title: '收入分成安排',
    description: '分成比例、分成期限、终止条件',
    icon: 'fa-chart-pie',
    importance: 'critical',
    clauses: [
      { name: '固定分成比例', value: '待填写', key: 'revenueShareRatio', note: '基于全部营业收入（税前）' },
      { name: '收入分成起始日', value: '待填写', key: 'sharingStartDate', note: '分成开始时间' },
      { name: '收入分成截止日', value: '待填写', key: 'sharingEndDate', note: '分成结束时间' },
      { name: '年化回报率', value: '待填写', key: 'annualYieldRate', note: '用于计算终止触发条件' }
    ],
    risks: '收入定义争议、分成计算口径'
  },
  {
    id: 'early-termination',
    title: '提前终止',
    description: '主动终止、亏损闭店、补偿金计算',
    icon: 'fa-door-open',
    importance: 'critical',
    clauses: [
      { name: '提前终止通知期', value: '7个自然日', key: 'terminationNoticeDays', note: '提前书面通知' },
      { name: '补偿金计算', value: '联营资金+（联营资金×年收益率÷360×已联营天数+7）', key: 'terminationCompensation', note: '不满90天按90天计算' },
      { name: '亏损闭店周期', value: '待填写', key: 'lossClosurePeriod', note: '连续亏损月数' },
      { name: '亏损闭店收入门槛', value: '待填写', key: 'lossClosureThreshold', note: '月收入低于此值' }
    ],
    risks: '提前终止构成违约，需支付补偿金'
  },

  // ========== 数据与支付模块 ==========
  {
    id: 'data-payment',
    title: '数据传输与分成支付',
    description: '传输方式、频率、对账机制',
    icon: 'fa-exchange-alt',
    importance: 'high',
    clauses: [
      { name: '数据传输方式', value: '待填写', key: 'dataTransmissionMethod', note: '系统自动/手工上报' },
      { name: '数据传输频率', value: '待填写', key: 'dataReportFrequency', note: '每日/每周/每月' },
      { name: '数据来源系统', value: '待填写', key: 'dataSource', note: 'POS/ERP/收银系统' },
      { name: '分成支付方式', value: '待填写', key: 'paymentMethod', note: '自动分账/手动付款' },
      { name: '分成支付频率', value: '待填写', key: 'paymentFrequency', note: '每日/每周/每月' }
    ]
  },

  // ========== 权利限制模块 ==========
  {
    id: 'restrictions',
    title: '重大事项限制',
    description: '控制权变更、资产处置、经营变更',
    icon: 'fa-ban',
    importance: 'critical',
    clauses: [
      { name: '禁止变更控制权', value: '需滴灌通书面同意', key: 'controlChangeRestriction', note: '实际控制人/控股股东变更' },
      { name: '禁止品牌转让', value: '需滴灌通书面同意', key: 'brandTransferRestriction', note: '品牌经营权转让/不续约' },
      { name: '禁止收入处置', value: '不得出售/分成/保理', key: 'revenueDisposalRestriction', note: '收入权利不得向第三方处置' },
      { name: '禁止擅自变更', value: '重要经营事项需同意', key: 'operationChangeRestriction', note: '场地/设备/经营范围等' }
    ],
    risks: '违反限制将导致滴灌通要求补偿金或协议解除'
  },

  // ========== 违约责任模块（重点标注）==========
  {
    id: 'breach-liability',
    title: '违约责任',
    description: '严重违约情形、违约金、连带责任',
    icon: 'fa-gavel',
    importance: 'critical',
    clauses: [
      { name: '严重违约情形', value: '挪用资金/私设账户/数据造假/停业/逾期付款', key: 'seriousBreachTypes', note: '7大严重违约情形' },
      { name: '逾期付款门槛', value: '待填写', key: 'seriousBreachDays', note: '延迟报送或付款超过此天数' },
      { name: '违约金比例', value: '待填写', key: 'breachPenalty', note: '基于联营资金金额' },
      { name: '连带责任', value: '联营方+其他方共同且连带', key: 'jointLiability', note: '包括实际控制人、品牌方等' }
    ],
    risks: '严重违约将导致协议解除+退还资金+违约金'
  },

  // ========== 担保与责任模块 ==========
  {
    id: 'guarantee',
    title: '陈述保证与连带责任',
    description: '主体资格、信息真实、连带担保',
    icon: 'fa-shield-alt',
    importance: 'high',
    clauses: [
      { name: '主体资格保证', value: '依法设立、有效存续', key: 'entityQualification', note: '具备签署履行能力' },
      { name: '信息真实性', value: '真实、准确、完整', key: 'informationTruthfulness', note: '不存在虚假陈述或遗漏' },
      { name: '控制权稳定', value: '实际控制人不变更', key: 'controlStability', note: '协议期限内保持稳定' },
      { name: '连带担保', value: '联营方、其他方共同且连带', key: 'jointGuarantee', note: '品牌方/实际控制人承担连带责任' }
    ]
  },

  // ========== 争议解决模块 ==========
  {
    id: 'dispute',
    title: '争议解决',
    description: '适用法律、仲裁机构、仲裁地点',
    icon: 'fa-balance-scale',
    importance: 'medium',
    clauses: [
      { name: '适用法律', value: '中华人民共和国法律', key: 'applicableLaw', note: '不含港澳台' },
      { name: '仲裁机构', value: '待填写', key: 'arbitrationInstitution', note: '深圳国际仲裁院' },
      { name: '仲裁地点', value: '待填写', key: 'arbitrationPlace', note: '仲裁裁决终局' }
    ]
  },

  // 插入行业特定模块
  ...(customModules || [])
]

// ==================== 通用默认参数 ====================
const standardDefaultParams = {
  // 签约主体信息（占位符）
  mcSigningEntity: '${滴灌通签约主体名称}',
  mcCreditCode: '${滴灌通签约主体统一社会信用代码}',
  mcAddress: '${滴灌通签约主体注册地址}',
  mcLegalRep: '${滴灌通签约主体负责人}',
  
  mguName: '${MGU名称}',
  mguCreditCode: '${MGU统一社会信用代码}',
  mguAddress: '${MGU注册地址}',
  mguLegalRepType: '${MGU负责人类型}',
  mguLegalRep: '${MGU负责人}',
  mguActualController: '${MGU实际控制人姓名}',
  mguActualControllerId: '${MGU实际控制人身份证号码}',
  
  brandName: '${品牌方名称}',
  brandCreditCode: '${品牌方统一社会信用代码}',
  brandAddress: '${品牌方注册地址}',
  brandLegalRepType: '${品牌方负责人类型}',
  brandLegalRep: '${品牌方负责人}',
  brandActualController: '${品牌方实际控制人姓名}',
  brandActualControllerId: '${品牌方实际控制人身份证号码}',
  
  // 核心商业参数
  investmentAmount: '500万',
  investmentAmountCN: '伍佰万元整',
  fundUsage: '门店建设、设备采购、流动资金',
  revenueShareRatio: '15',
  sharingStartDate: '滴灌通发出本次联营资金出资指令之日的当日',
  sharingEndDate: '自收入分成起始日起满36个月',
  annualYieldRate: '25',
  
  // 提前终止参数
  lossClosurePeriod: '3',
  lossClosureThreshold: '50000',
  
  // 数据传输参数
  dataTransmissionMethod: '系统自动传输',
  dataReportFrequency: '每自然日',
  dataTransmissionDay: '每个自然日（不含收入分成起始日）',
  dataSource: 'POS收银系统',
  paymentMethod: '系统自动打款',
  paymentFrequency: '每自然日',
  paymentDay: '每个自然日（不含收入分成起始日）',
  
  // 对账参数
  reconciliationDeadline: '每月15号前（上月数据）',
  reconciliationPaymentDays: '7',
  
  // 账户信息（占位符）
  mguAccountName: '${联营方收款账户户名}',
  mguAccountNumber: '${联营方收款账户账号}',
  mguBankName: '${联营方收款账户开户行}',
  mguBankBranch: '${联营方收款账户开户支行}',
  mcAccountName: '${分成款收款账户户名}',
  mcAccountNumber: '${分成款收款账户账号}',
  mcBankName: '${分成款收款账户开户行}',
  mcBankBranch: '${分成款收款账户开户支行}',
  
  // 违约参数
  seriousBreachDays: '30',
  breachPenalty: '20',
  defaultPaymentDays: '10',
  overdueInterestRate: '0.05',
  
  // 追踪与通知
  responseTime: '5',
  mailingNoticeDays: '5',
  
  // 保密与合规
  confidentialityPeriod: '3',
  complianceEmail: 'compliance@microconnect.com',
  
  // 争议解决
  arbitrationInstitution: '深圳国际仲裁院',
  arbitrationPlace: '深圳',
  
  // 文本
  copies: '四',
  copiesPerParty: '一'
}

// ==================== 行业模板定义 ====================

// 1. 餐饮行业模板
export const cateringTemplate: IndustryTemplate = {
  id: 'catering',
  name: '餐饮连锁',
  icon: 'fa-utensils',
  description: '餐厅、奶茶店、咖啡厅、火锅店等餐饮项目',
  color: 'orange',
  defaultParams: {
    ...standardDefaultParams,
    investmentAmount: '500万',
    investmentAmountCN: '伍佰万元整',
    fundUsage: '门店装修、厨房设备采购、首批物料及流动资金',
    revenueShareRatio: '15',
    sharingEndDate: '自收入分成起始日起满36个月',
    annualYieldRate: '25',
    dataSource: 'POS收银系统',
    breachPenalty: '20',
    // 餐饮特定参数
    businessHours: '10小时',
    foodSafetyNotice: '24小时'
  },
  modules: createStandardModules([
    {
      id: 'catering-specific',
      title: '餐饮行业特别约定',
      description: '食品安全、营业时间、卫生要求',
      icon: 'fa-concierge-bell',
      importance: 'high',
      clauses: [
        { name: '每日营业时间', value: '不少于10小时', key: 'businessHours', note: '调整需提前通知' },
        { name: '食品安全事故通知', value: '24小时内', key: 'foodSafetyNotice', note: '书面通知投资方' },
        { name: '必备证照', value: '营业执照、食品经营许可证', key: 'requiredLicenses', note: '保持有效' }
      ],
      risks: '食品安全事故、证照过期'
    }
  ]),
  fullText: createStandardFullText([
    {
      id: 'catering-specific',
      number: '附加',
      title: '餐饮行业特别约定',
      clauses: [
        {
          text: '联营方应确保门店食品卫生安全，遵守《食品安全法》等相关法律法规，如发生食品安全事故，应在【${foodSafetyNotice}】内书面通知滴灌通。',
          note: '食品安全特别要求',
          keys: ['foodSafetyNotice']
        },
        {
          text: '联营方应保持门店正常营业，每日营业时间不少于【${businessHours}】，如需调整营业时间或暂停营业，应提前【${responseTime}】日书面通知滴灌通。',
          note: '营业时间要求',
          keys: ['businessHours', 'responseTime']
        },
        {
          text: '联营方应确保已取得并保持有效的食品经营许可证、卫生许可证等必要证照，证照到期前30日应完成续期手续。',
          note: '证照要求',
          keys: []
        }
      ]
    }
  ])
}

// 2. 零售行业模板
export const retailTemplate: IndustryTemplate = {
  id: 'retail',
  name: '零售门店',
  icon: 'fa-shopping-bag',
  description: '便利店、专卖店、商超、无人货架等零售项目',
  color: 'blue',
  defaultParams: {
    ...standardDefaultParams,
    investmentAmount: '300万',
    investmentAmountCN: '叁佰万元整',
    fundUsage: '门店装修、货架设备、首批库存及流动资金',
    revenueShareRatio: '12',
    sharingEndDate: '自收入分成起始日起满48个月',
    annualYieldRate: '22',
    paymentFrequency: '每周',
    paymentDay: '每周三（不含收入分成起始日）',
    dataSource: 'ERP/收银系统',
    breachPenalty: '15',
    // 零售特定参数
    inventoryTurnover: '30',
    minMonthlyRevenue: '30万'
  },
  modules: createStandardModules([
    {
      id: 'retail-specific',
      title: '零售行业特别约定',
      description: '库存管理、最低营收、商品质量',
      icon: 'fa-boxes',
      importance: 'high',
      clauses: [
        { name: '库存周转天数', value: '不超过30天', key: 'inventoryTurnover', note: '积压需书面说明' },
        { name: '最低月营收', value: '30万元', key: 'minMonthlyRevenue', note: '连续3月低于需说明' },
        { name: '必备证照', value: '营业执照', key: 'requiredLicenses', note: '保持有效' }
      ],
      risks: '库存积压、选址风险'
    }
  ]),
  fullText: createStandardFullText([
    {
      id: 'retail-specific',
      number: '附加',
      title: '零售行业特别约定',
      clauses: [
        {
          text: '联营方应确保库存周转天数不超过【${inventoryTurnover}】天，如库存积压严重，应书面说明原因并制定清理计划。',
          note: '库存管理要求',
          keys: ['inventoryTurnover']
        },
        {
          text: '联营方应确保门店月营业收入不低于【${minMonthlyRevenue}】元，连续3个月低于此标准需向滴灌通书面说明原因。',
          note: '最低营收要求',
          keys: ['minMonthlyRevenue']
        }
      ]
    }
  ])
}

// 3. 医美/健康行业模板
export const healthcareTemplate: IndustryTemplate = {
  id: 'healthcare',
  name: '医美/健康',
  icon: 'fa-heartbeat',
  description: '医美诊所、健身房、康复中心、口腔诊所等项目',
  color: 'pink',
  defaultParams: {
    ...standardDefaultParams,
    investmentAmount: '800万',
    investmentAmountCN: '捌佰万元整',
    fundUsage: '场所装修、医疗设备采购、人员培训及流动资金',
    revenueShareRatio: '18',
    sharingEndDate: '自收入分成起始日起满36个月',
    annualYieldRate: '28',
    dataSource: 'HIS系统/收银系统',
    breachPenalty: '25',
    responseTime: '3',
    // 医美特定参数
    licenseRequirement: '医疗机构执业许可证',
    incidentNotice: '24小时',
    minMonthlyRevenue: '50万'
  },
  modules: createStandardModules([
    {
      id: 'healthcare-specific',
      title: '医美健康行业特别约定',
      description: '医疗资质、医疗安全、从业人员',
      icon: 'fa-clinic-medical',
      importance: 'critical',
      clauses: [
        { name: '资质要求', value: '医疗机构执业许可证', key: 'licenseRequirement', note: '保持有效' },
        { name: '医疗事故通知', value: '24小时内', key: 'incidentNotice', note: '书面通知投资方' },
        { name: '最低月营收', value: '50万元', key: 'minMonthlyRevenue', note: '连续3月低于需说明' },
        { name: '资质吊销后果', value: '视为严重违约', key: 'licenseRevocation', note: '协议解除+违约金' }
      ],
      risks: '医疗纠纷、资质吊销、政策变动'
    }
  ]),
  fullText: createStandardFullText([
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
          text: '如发生医疗事故或医疗纠纷，联营方应在【${incidentNotice}】内书面通知滴灌通，并及时提供事故处理进展。',
          note: '医疗事故通知',
          keys: ['incidentNotice']
        },
        {
          text: '联营方应确保门店月营业收入不低于【${minMonthlyRevenue}】元，连续3个月低于此标准需向滴灌通书面说明原因。',
          note: '最低营收要求',
          keys: ['minMonthlyRevenue']
        },
        {
          text: '如联营方的医疗机构执业许可证被吊销、暂停或限制，视为严重违约，滴灌通有权立即解除本协议并要求联营方和其他方承担违约责任。',
          note: '资质风险条款',
          keys: []
        }
      ]
    }
  ])
}

// 4. 教育培训行业模板
export const educationTemplate: IndustryTemplate = {
  id: 'education',
  name: '教育培训',
  icon: 'fa-graduation-cap',
  description: '职业培训、技能培训、兴趣班、成人教育等项目',
  color: 'green',
  defaultParams: {
    ...standardDefaultParams,
    investmentAmount: '400万',
    investmentAmountCN: '肆佰万元整',
    fundUsage: '场地装修、教学设备、师资培训及流动资金',
    revenueShareRatio: '20',
    sharingEndDate: '自收入分成起始日起满36个月',
    annualYieldRate: '25',
    dataSource: '教务管理系统/收银系统',
    breachPenalty: '20',
    // 教育特定参数
    minStudentCount: '200',
    refundPolicy: '开课前全额退款，开课后按课时比例退款'
  },
  modules: createStandardModules([
    {
      id: 'education-specific',
      title: '教育培训行业特别约定',
      description: '招生要求、退费政策、预付款监管',
      icon: 'fa-chalkboard-teacher',
      importance: 'high',
      clauses: [
        { name: '最低在读学员', value: '200人', key: 'minStudentCount', note: '连续3月低于需说明' },
        { name: '退费政策', value: '开课前全额，开课后按比例', key: 'refundPolicy', note: '不得拒绝合理退费' },
        { name: '预付款监管', value: '存入监管账户', key: 'prepaymentSupervision', note: '不得挪作他用' }
      ],
      risks: '招生不达标、政策风险、退费纠纷'
    }
  ]),
  fullText: createStandardFullText([
    {
      id: 'education-specific',
      number: '附加',
      title: '教育培训行业特别约定',
      clauses: [
        {
          text: '联营方应确保在读学员数不低于【${minStudentCount}】人，连续3个月低于此标准需向滴灌通书面说明原因。',
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

// 5. 演唱会/演出行业模板（保持原有专用模板结构）
export const concertTemplate: IndustryTemplate = {
  id: 'concert',
  name: '演唱会/演出',
  icon: 'fa-music',
  description: '演唱会、音乐节、话剧、音乐剧等现场演出项目',
  color: 'purple',
  defaultParams: {
    ...standardDefaultParams,
    investmentAmount: '1800万',
    investmentAmountCN: '壹仟捌佰万元整',
    fundUsage: '演出制作费用、艺人费用、场地租赁、宣传推广',
    revenueShareRatio: '70',
    sharingEndDate: '最后一场演出完成后30日',
    annualYieldRate: '33',
    breachPenalty: '20',
    // 演唱会特定参数
    giftTicketLimit: '1000',
    minTicketPrice: '50',
    discountTicketLimit: '20',
    approvalThreshold: '10万',
    budgetOverrunLimit: '10',
    delayPeriod: '6',
    dataReportTime: '18:00',
    paymentTime: '22:00'
  },
  modules: createStandardModules([
    {
      id: 'concert-investment',
      title: '演出投资架构',
      description: '资金结构、出资顺序、支出审批',
      icon: 'fa-coins',
      importance: 'critical',
      clauses: [
        { name: '联营资金金额', value: '1800万元', key: 'investmentAmount', note: '投资方提供' },
        { name: '出资顺序', value: '劣后→优先', key: 'fundingOrder', note: '劣后方需先全额到位' },
        { name: '支出审批阈值', value: '>10万元', key: 'approvalThreshold', note: '需投资方盖章书面同意' },
        { name: '预算超支容忍', value: '10%', key: 'budgetOverrunLimit', note: '超出部分投资方可拒付' }
      ],
      risks: '劣后资金未到位即出资将丧失优先受偿权基础'
    },
    {
      id: 'concert-ticketing',
      title: '票务管控',
      description: '赠票、折扣、最低售价限制',
      icon: 'fa-ticket',
      importance: 'critical',
      clauses: [
        { name: '赠票上限', value: '1000张', key: 'giftTicketLimit', note: '超出按票面价支付' },
        { name: '最低售价', value: '票面50%', key: 'minTicketPrice', note: '低于需补差额' },
        { name: '折价票上限', value: '总票量20%', key: 'discountTicketLimit', note: '超出需书面同意' }
      ],
      risks: '赠票超限、低价销售可构成违约'
    },
    {
      id: 'concert-artist',
      title: '艺人风险管控',
      description: '艺人违约、负面舆情、延期处理',
      icon: 'fa-user-music',
      importance: 'critical',
      clauses: [
        { name: '政治言论风险', value: '极高', key: 'politicalRisk', note: '取消+全额退款+补偿金' },
        { name: '负面舆情告知', value: '5日内', key: 'infoDisclosureDays', note: '书面通知投资方' },
        { name: '延期最长期限', value: '6个月', key: 'delayPeriod', note: '超期视为取消' }
      ],
      risks: '艺人违约时，无论是否追回费用，融资方都需向投资方全额退款'
    },
    {
      id: 'concert-escrow',
      title: '共管账户',
      description: '账户权限、审批流程、资金监管',
      icon: 'fa-university',
      importance: 'high',
      clauses: [
        { name: '开户行', value: '双方协商', key: 'escrowBank', note: '指定银行开立' },
        { name: '投资方权限', value: '查询+复核+U盾', key: 'investorRights', note: '完整监管权限' },
        { name: '审批阈值', value: '>10万元', key: 'approvalThreshold', note: '需盖章书面同意' }
      ],
      risks: '微信/邮件不构成有效书面同意'
    }
  ]),
  fullText: createStandardFullText([
    {
      id: 'concert-specific',
      number: '附加',
      title: '演唱会/演出行业特别约定',
      clauses: [
        {
          text: '投资方和融资方开立共管账户，投资方已取得必要的共管权限（包括但不限于网银查询权限、复核/审批权限及/或U盾、印鉴等），以确保投资方可对共管账户资金收支进行监管。',
          note: '共管账户设立',
          keys: []
        },
        {
          text: '融资方如需支付项目运营支出，金额超过【${approvalThreshold}】元的，需提前获得投资方的盖章书面文件同意，方可从共管账户中划出支付。',
          note: '支出审批',
          keys: ['approvalThreshold']
        },
        {
          text: '若实际需支出的金额超过预算金额的【${budgetOverrunLimit}】%，投资方有权拒绝从共管账户支付超出部分，融资方需自行承担超出金额。',
          note: '预算超支处理',
          keys: ['budgetOverrunLimit']
        },
        {
          text: '演出赠票上限为【${giftTicketLimit}】张，超出部分需融资方按票面价格支付至共管账户。',
          note: '赠票上限',
          keys: ['giftTicketLimit']
        },
        {
          text: '演出门票的最低销售价格不得低于票面价格的【${minTicketPrice}】%，若按照低于该价格出售，融资方需将差额补足支付到共管账户。',
          note: '最低售价',
          keys: ['minTicketPrice']
        },
        {
          text: '融资方出售折价票的比例不得超过总票量的【${discountTicketLimit}】%，超出部分需事先取得投资方的书面同意。',
          note: '折价票限制',
          keys: ['discountTicketLimit']
        },
        {
          text: '若演出因艺人违约而取消，无论融资方是否实际收回已支付给艺人的演出费用，融资方需退还投资方已提供的全部资金，并按【${annualYieldRate}】%年化按月计算补偿金。',
          note: '艺人违约处理',
          keys: ['annualYieldRate']
        },
        {
          text: '若演出需要延期，且最后一场演出不晚于原定日期后【${delayPeriod}】个月举行，收入分成期相应延长。若超过此期限，则视为演出取消。',
          note: '延期处理',
          keys: ['delayPeriod']
        },
        {
          text: '融资方应在数据传输日当日的【${dataReportTime}】前完成数据传输，分成付款日当日的【${paymentTime}】前完成分成付款。',
          note: '时效要求',
          keys: ['dataReportTime', 'paymentTime']
        }
      ]
    }
  ])
}

// 6. 设备运营行业模板（新增，适用于B类资产中的设备类）
export const equipmentTemplate: IndustryTemplate = {
  id: 'equipment',
  name: '设备运营',
  icon: 'fa-cogs',
  description: '自动售货机、充电桩、娃娃机、共享设备等',
  color: 'gray',
  defaultParams: {
    ...standardDefaultParams,
    investmentAmount: '200万',
    investmentAmountCN: '贰佰万元整',
    fundUsage: '设备采购、点位租赁、运维费用及流动资金',
    revenueShareRatio: '25',
    sharingEndDate: '自收入分成起始日起满24个月',
    annualYieldRate: '30',
    dataSource: '设备运营管理系统',
    breachPenalty: '20',
    // 设备特定参数
    equipmentCount: '${设备台数}',
    equipmentType: '${设备类型}',
    equipmentLocation: '${设备位置}'
  },
  modules: createStandardModules([
    {
      id: 'equipment-specific',
      title: '设备运营特别约定',
      description: '设备管理、点位租赁、在线率要求',
      icon: 'fa-server',
      importance: 'high',
      clauses: [
        { name: '设备数量', value: '待填写', key: 'equipmentCount', note: '协议约定的设备台数' },
        { name: '设备类型', value: '待填写', key: 'equipmentType', note: '设备唯一识别码见附件四' },
        { name: '设备在线率', value: '≥95%', key: 'onlineRate', note: '月度平均在线率' },
        { name: '设备维护责任', value: '联营方负责', key: 'maintenanceResponsibility', note: '保持正常运行' }
      ],
      risks: '设备故障、点位合同到期、在线率不达标'
    }
  ]),
  fullText: createStandardFullText([
    {
      id: 'equipment-specific',
      number: '附加',
      title: '设备运营行业特别约定',
      clauses: [
        {
          text: '联营合作业务：联营方于【${equipmentLocation}】经营【${equipmentCount}】台【${equipmentType}】，设备的唯一识别码与位置如附件四所示。',
          note: '设备信息',
          keys: ['equipmentLocation', 'equipmentCount', 'equipmentType']
        },
        {
          text: '联营方应确保设备月度平均在线率不低于95%，如连续3个月在线率低于90%，需向滴灌通书面说明原因并提供整改计划。',
          note: '在线率要求',
          keys: []
        },
        {
          text: '联营方负责设备的日常维护和保养，确保设备正常运行。如设备出现故障，应在48小时内完成维修或更换。',
          note: '维护责任',
          keys: []
        },
        {
          text: '联营方应确保与点位提供方的租赁/合作协议在本协议期限内持续有效。如点位协议即将到期或被终止，应提前30日书面通知滴灌通。',
          note: '点位合同管理',
          keys: []
        },
        {
          text: '未经滴灌通书面同意，联营方不得擅自增加或减少设备数量、变更设备位置或更换设备类型。',
          note: '设备变更限制',
          keys: []
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
