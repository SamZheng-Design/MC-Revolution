/**
 * 平台标的数据（来自 MC-Awesome-Project 的 deals-seed）
 * 这是评估通"从平台数据库获取数据"入口的本地数据源
 * 生产环境可替换为 GET /api/deals 的实际 API 调用
 */

export interface Deal {
  id: string;
  company_name: string;
  industry: string;
  industry_sub?: string;
  status: string;
  region: string;
  city: string;
  main_business: string;
  funding_amount: number; // 万元
  funding_purpose?: string;
  investment_period_months: number;
  revenue_share_ratio: number;
  cashflow_frequency: 'daily' | 'weekly' | 'monthly';
  contact_name: string;
  contact_phone: string;
  submitted_date: string;
  project_documents: string;
  financial_data: string; // JSON string
  result: string;
}

export const platformDeals: Deal[] = [
  {
    id: "DGT-2026-001",
    company_name: "蜜雪冰城（深圳南山科技园店）",
    industry: "catering",
    industry_sub: "茶饮连锁",
    status: "pending",
    region: "广东",
    city: "深圳",
    main_business: "蜜雪冰城是中国最大的现制茶饮连锁品牌，主打高性价比策略，产品均价6-8元。该门店位于深圳南山科技园核心区，周边为腾讯、百度等互联网企业办公区，目标客群为白领和程序员。门店面积25平米，属于小店高频模式，日均出杯量400-600杯。",
    funding_amount: 35,
    funding_purpose: "门店升级改造（15万）+ 设备更新（10万）+ 流动资金（10万）",
    investment_period_months: 24,
    revenue_share_ratio: 0.08,
    cashflow_frequency: "daily",
    contact_name: "王店长",
    contact_phone: "13800000001",
    submitted_date: "2026-01-10",
    project_documents: `【项目名称】蜜雪冰城深圳南山科技园店收入分成项目\n\n【品牌介绍】\n蜜雪冰城创立于1997年，总部位于郑州，是中国门店数量最多的现制茶饮品牌。\n- 全国门店数量：36,000+\n- 覆盖城市：全国所有省份\n- 品牌定位：高性价比平价茶饮\n- 平均客单价：8元\n\n【门店信息】\n- 位置：深圳市南山区科技园北区（腾讯大厦斜对面）\n- 面积：25平米\n- 开业时间：2023年6月\n- 租金：1.8万/月\n- 员工：3人\n\n【经营数据（近12个月平均）】\n- 日均出杯量：520杯\n- 日均营收：4,160元\n- 月均营收：12.48万元\n- 年营收：149.76万元\n- 毛利率：55%\n- 净利率：18%\n\n【收入分成机制】\n- 分成比例：8%\n- 分成频率：T+1日结算\n- 账户管理：招商银行三方共管账户\n\n【投资回报测算】\n- 投资金额：35万元\n- 年分成收入：149.76万 × 8% = 11.98万元\n- 投资期限：24个月\n- 预期总回款：23.96万元\n- IRR：约18%`,
    financial_data: JSON.stringify({
      investment_amount: 35,
      investment_period_months: 24,
      revenue_share_ratio: 0.08,
      cashflow_frequency: "daily",
      revenue_data: {
        daily_revenue: 4160,
        monthly_revenue: 124800,
        annual_revenue: 1497600,
        gross_margin: 0.55,
        net_margin: 0.18
      },
      irr_estimate: 0.18
    }),
    result: "pending"
  },
  {
    id: "DGT-2026-002",
    company_name: "老乡鸡（上海徐汇日月光店）",
    industry: "catering",
    industry_sub: "快餐连锁",
    status: "pending",
    region: "上海",
    city: "上海",
    main_business: "老乡鸡是安徽本土快餐品牌，以中式快餐为主打，以高性价比和标准化闻名。本项目为上海徐汇日月光中心旗舰店，覆盖白领午餐市场。",
    funding_amount: 80,
    funding_purpose: "厨房设备升级（30万）+ 装修改造（30万）+ 流动资金（20万）",
    investment_period_months: 30,
    revenue_share_ratio: 0.06,
    cashflow_frequency: "daily",
    contact_name: "李经理",
    contact_phone: "13800000002",
    submitted_date: "2026-01-15",
    project_documents: `【项目名称】老乡鸡上海徐汇日月光店收入分成项目\n\n【品牌介绍】\n老乡鸡，起步于合肥，全国门店超3000家，以"三块钱一碗汤，不卖贵"著称。\n\n【门店信息】\n- 位置：上海市徐汇区日月光中心B1层\n- 面积：180平米\n- 开业时间：2024年3月\n- 座位数：80个\n- 员工：12人\n\n【经营数据】\n- 日均客流：600人次\n- 人均消费：28元\n- 日均营收：16,800元\n- 月均营收：50.4万元\n- 年营收：604.8万元\n- 毛利率：62%\n- 净利率：15%\n\n【收入分成机制】\n- 分成比例：6%\n- 分成频率：T+1日结算\n- 预期年回款：36.3万元`,
    financial_data: JSON.stringify({
      investment_amount: 80,
      investment_period_months: 30,
      revenue_share_ratio: 0.06,
      cashflow_frequency: "daily",
      revenue_data: {
        daily_revenue: 16800,
        monthly_revenue: 504000,
        annual_revenue: 6048000,
        gross_margin: 0.62,
        net_margin: 0.15
      },
      irr_estimate: 0.22
    }),
    result: "pending"
  },
  {
    id: "DGT-2026-003",
    company_name: "叮咚买菜（杭州拱墅区前置仓）",
    industry: "retail",
    industry_sub: "生鲜零售",
    status: "pending",
    region: "浙江",
    city: "杭州",
    main_business: "叮咚买菜是上海本土生鲜电商平台，采用前置仓模式，承诺29分钟到家。本项目为杭州拱墅区核心前置仓，服务范围覆盖3公里内居民区。",
    funding_amount: 120,
    funding_purpose: "冷链设备扩容（50万）+ 仓储扩建（40万）+ 流动资金（30万）",
    investment_period_months: 36,
    revenue_share_ratio: 0.04,
    cashflow_frequency: "weekly",
    contact_name: "张站长",
    contact_phone: "13800000003",
    submitted_date: "2026-01-20",
    project_documents: `【项目名称】叮咚买菜杭州拱墅区前置仓收入分成项目\n\n【项目概述】\n叮咚买菜在杭州市场稳居前三，本前置仓服务拱墅区核心居民区，覆盖用户超5万。\n\n【运营数据】\n- 日均订单量：1200单\n- 客单价：68元\n- 日均营收：8.16万元\n- 月均营收：244.8万元\n- 年营收：2937.6万元\n- 毛利率：28%\n- 净利率：8%\n\n【收入分成机制】\n- 分成比例：4%\n- 分成频率：每周结算\n- 预期年回款：117.5万元`,
    financial_data: JSON.stringify({
      investment_amount: 120,
      investment_period_months: 36,
      revenue_share_ratio: 0.04,
      cashflow_frequency: "weekly",
      revenue_data: {
        daily_revenue: 81600,
        monthly_revenue: 2448000,
        annual_revenue: 29376000,
        gross_margin: 0.28,
        net_margin: 0.08
      },
      irr_estimate: 0.25
    }),
    result: "pending"
  },
  {
    id: "DGT-2026-004",
    company_name: "罗森便利店（成都春熙路旗舰店）",
    industry: "retail",
    industry_sub: "便利店",
    status: "under_review",
    region: "四川",
    city: "成都",
    main_business: "罗森便利店是日本最大便利店品牌之一，在中国拥有超6000家门店。春熙路旗舰店位于成都核心商圈，日客流量超2000人次，是高单产旗舰级门店。",
    funding_amount: 60,
    funding_purpose: "热食设备引进（25万）+ 门店翻新（20万）+ 流动资金（15万）",
    investment_period_months: 24,
    revenue_share_ratio: 0.05,
    cashflow_frequency: "daily",
    contact_name: "陈店长",
    contact_phone: "13800000004",
    submitted_date: "2025-12-15",
    project_documents: `【项目名称】罗森便利店成都春熙路旗舰店收入分成项目\n\n【品牌介绍】\n罗森（LAWSON）是全球知名日系便利店品牌，以鲜食和日式体验著称。\n\n【门店信息】\n- 位置：成都市锦江区春熙路步行街核心地段\n- 面积：120平米\n- 开业时间：2022年9月\n- SKU数量：2800个\n- 员工：8人\n\n【经营数据】\n- 日均客流：2200人次\n- 客单价：22元\n- 日均营收：4.84万元\n- 月均营收：145.2万元\n- 年营收：1742.4万元\n- 毛利率：32%\n- 净利率：12%\n\n【收入分成机制】\n- 分成比例：5%\n- 分成频率：T+1日结算\n- 预期年回款：87.1万元`,
    financial_data: JSON.stringify({
      investment_amount: 60,
      investment_period_months: 24,
      revenue_share_ratio: 0.05,
      cashflow_frequency: "daily",
      revenue_data: {
        daily_revenue: 48400,
        monthly_revenue: 1452000,
        annual_revenue: 17424000,
        gross_margin: 0.32,
        net_margin: 0.12
      },
      irr_estimate: 0.35
    }),
    result: "pending"
  },
  {
    id: "DGT-2026-005",
    company_name: "新瑞鹏宠物医院（北京朝阳望京店）",
    industry: "service",
    industry_sub: "宠物医疗",
    status: "pending",
    region: "北京",
    city: "北京",
    main_business: "新瑞鹏集团是国内最大的宠物医疗连锁集团，全国拥有超1800家宠物医院。望京店位于北京科技创业园核心区，服务高净值宠物主家庭。",
    funding_amount: 150,
    funding_purpose: "医疗设备采购（80万）+ 诊室扩建（40万）+ 流动资金（30万）",
    investment_period_months: 36,
    revenue_share_ratio: 0.07,
    cashflow_frequency: "weekly",
    contact_name: "刘院长",
    contact_phone: "13800000005",
    submitted_date: "2026-01-25",
    project_documents: `【项目名称】新瑞鹏宠物医院北京朝阳望京店收入分成项目\n\n【品牌介绍】\n新瑞鹏集团成立于2016年，总部位于深圳，是国内最大的宠物医疗集团。\n\n【医院信息】\n- 位置：北京市朝阳区望京科技创业园\n- 面积：600平米\n- 执照年限：2019年至今\n- 注册执业兽医：8人\n- 员工：25人\n\n【经营数据】\n- 日均接诊量：80只\n- 客单价：450元\n- 日均营收：3.6万元\n- 月均营收：108万元\n- 年营收：1296万元\n- 毛利率：45%\n- 净利率：20%\n\n【收入分成机制】\n- 分成比例：7%\n- 分成频率：每周结算\n- 预期年回款：90.7万元`,
    financial_data: JSON.stringify({
      investment_amount: 150,
      investment_period_months: 36,
      revenue_share_ratio: 0.07,
      cashflow_frequency: "weekly",
      revenue_data: {
        daily_revenue: 36000,
        monthly_revenue: 1080000,
        annual_revenue: 12960000,
        gross_margin: 0.45,
        net_margin: 0.20
      },
      irr_estimate: 0.28
    }),
    result: "pending"
  },
  {
    id: "DGT-2026-006",
    company_name: "乐刻运动（广州天河体育中心店）",
    industry: "service",
    industry_sub: "连锁健身",
    status: "pending",
    region: "广东",
    city: "广州",
    main_business: "乐刻运动是中国最大的24小时连锁健身房品牌，以低价高频会员制著称。天河体育中心店位于广州最核心商业区，会员超3000人。",
    funding_amount: 85,
    funding_purpose: "器械更新（45万）+ 门店改造（25万）+ 流动资金（15万）",
    investment_period_months: 30,
    revenue_share_ratio: 0.09,
    cashflow_frequency: "weekly",
    contact_name: "孙经理",
    contact_phone: "13800000006",
    submitted_date: "2026-02-01",
    project_documents: `【项目名称】乐刻运动广州天河体育中心店收入分成项目\n\n【品牌介绍】\n乐刻运动成立于2015年，以月均99元的低价策略打入健身市场，全国门店超2500家。\n\n【门店信息】\n- 位置：广州市天河区体育中心商业综合体B2\n- 面积：800平米\n- 开业时间：2024年1月\n- 设备台数：150台\n- 员工：6人（24小时无人值守+教练约课）\n\n【经营数据】\n- 活跃会员：3200人\n- 月均会费收入：31.68万元（3200×99）\n- 课程收入：8万元/月\n- 月均营收：39.68万元\n- 年营收：476.2万元\n- 毛利率：68%\n- 净利率：30%\n\n【收入分成机制】\n- 分成比例：9%\n- 分成频率：每周结算\n- 预期年回款：42.9万元`,
    financial_data: JSON.stringify({
      investment_amount: 85,
      investment_period_months: 30,
      revenue_share_ratio: 0.09,
      cashflow_frequency: "weekly",
      revenue_data: {
        daily_revenue: 13200,
        monthly_revenue: 396800,
        annual_revenue: 4761600,
        gross_margin: 0.68,
        net_margin: 0.30
      },
      irr_estimate: 0.32
    }),
    result: "pending"
  },
  {
    id: "DGT-2026-007",
    company_name: "永琪美容美发（武汉光谷步行街店）",
    industry: "service",
    industry_sub: "美容美发",
    status: "under_review",
    region: "湖北",
    city: "武汉",
    main_business: "永琪美容美发是中国最大的连锁美发集团之一，全国超2000家门店。光谷步行街店毗邻华中科技大学，客群以年轻白领和大学生为主。",
    funding_amount: 55,
    funding_purpose: "设备引进（25万）+ 装修翻新（20万）+ 流动资金（10万）",
    investment_period_months: 24,
    revenue_share_ratio: 0.10,
    cashflow_frequency: "weekly",
    contact_name: "赵店长",
    contact_phone: "13800000007",
    submitted_date: "2025-11-20",
    project_documents: `【项目名称】永琪美容美发武汉光谷步行街店收入分成项目\n\n【品牌介绍】\n永琪美发成立于1992年，是国内历史最悠久的美发连锁品牌之一。\n\n【门店信息】\n- 位置：武汉市洪山区光谷步行街商业综合体2楼\n- 面积：300平米\n- 开业时间：2023年3月\n- 座位数：30个\n- 员工：20人\n\n【经营数据】\n- 日均客流：85人次\n- 客单价：180元\n- 日均营收：1.53万元\n- 月均营收：45.9万元\n- 年营收：550.8万元\n- 毛利率：58%\n- 净利率：22%\n\n【收入分成机制】\n- 分成比例：10%\n- 分成频率：每周结算\n- 预期年回款：55.1万元`,
    financial_data: JSON.stringify({
      investment_amount: 55,
      investment_period_months: 24,
      revenue_share_ratio: 0.10,
      cashflow_frequency: "weekly",
      revenue_data: {
        daily_revenue: 15300,
        monthly_revenue: 459000,
        annual_revenue: 5508000,
        gross_margin: 0.58,
        net_margin: 0.22
      },
      irr_estimate: 0.38
    }),
    result: "pending"
  },
  {
    id: "DGT-2026-008",
    company_name: "唱吧麦颂KTV（南京新街口旗舰店）",
    industry: "entertainment",
    industry_sub: "娱乐-KTV",
    status: "pending",
    region: "江苏",
    city: "南京",
    main_business: "唱吧麦颂是线上KTV平台唱吧旗下的线下娱乐连锁品牌，全国超300家门店。新街口旗舰店位于南京核心商圈，拥有50个包厢。",
    funding_amount: 200,
    funding_purpose: "音响设备更新（80万）+ 装修改造（80万）+ 流动资金（40万）",
    investment_period_months: 36,
    revenue_share_ratio: 0.06,
    cashflow_frequency: "monthly",
    contact_name: "周总",
    contact_phone: "13800000008",
    submitted_date: "2026-01-08",
    project_documents: `【项目名称】唱吧麦颂KTV南京新街口旗舰店收入分成项目\n\n【品牌介绍】\n唱吧麦颂依托唱吧8000万日活用户，实现线上线下联动运营。\n\n【门店信息】\n- 位置：南京市玄武区新街口商圈核心地段\n- 面积：2800平米\n- 开业时间：2023年12月\n- 包厢数：50个（大/中/小型）\n- 员工：40人\n\n【经营数据】\n- 周末日均包厢使用率：92%\n- 工作日日均包厢使用率：65%\n- 平均包厢单价：388元/场（3小时）\n- 月均营收：182.4万元\n- 年营收：2188.8万元\n- 毛利率：52%\n- 净利率：18%\n\n【收入分成机制】\n- 分成比例：6%\n- 分成频率：每月15日结算\n- 预期年回款：131.3万元`,
    financial_data: JSON.stringify({
      investment_amount: 200,
      investment_period_months: 36,
      revenue_share_ratio: 0.06,
      cashflow_frequency: "monthly",
      revenue_data: {
        daily_revenue: 60800,
        monthly_revenue: 1824000,
        annual_revenue: 21888000,
        gross_margin: 0.52,
        net_margin: 0.18
      },
      irr_estimate: 0.20
    }),
    result: "pending"
  },
  {
    id: "DGT-2026-009",
    company_name: "途虎养车工场店（重庆渝北龙湖店）",
    industry: "service",
    industry_sub: "汽车养护",
    status: "pending",
    region: "重庆",
    city: "重庆",
    main_business: "途虎养车是中国最大的互联网汽车养护平台，线下工场店超5000家。渝北龙湖店位于重庆最大居住区，年服务车辆超8000台次。",
    funding_amount: 180,
    funding_purpose: "设备扩充（90万）+ 场地扩建（60万）+ 流动资金（30万）",
    investment_period_months: 36,
    revenue_share_ratio: 0.05,
    cashflow_frequency: "monthly",
    contact_name: "吴店长",
    contact_phone: "13800000009",
    submitted_date: "2026-01-18",
    project_documents: `【项目名称】途虎养车工场店重庆渝北龙湖店收入分成项目\n\n【品牌介绍】\n途虎养车成立于2011年，2023年港交所上市，是中国汽车后市场数字化龙头。\n\n【门店信息】\n- 位置：重庆市渝北区龙湖北城天街旁\n- 面积：1200平米\n- 开业时间：2023年8月\n- 工位数：20个\n- 员工：18人（技师14+服务4）\n\n【经营数据】\n- 日均接车量：28台\n- 客单价：680元\n- 日均营收：1.9万元\n- 月均营收：57.12万元\n- 年营收：685.4万元\n- 毛利率：42%\n- 净利率：15%\n\n【收入分成机制】\n- 分成比例：5%\n- 分成频率：每月20日结算\n- 预期年回款：34.3万元`,
    financial_data: JSON.stringify({
      investment_amount: 180,
      investment_period_months: 36,
      revenue_share_ratio: 0.05,
      cashflow_frequency: "monthly",
      revenue_data: {
        daily_revenue: 19040,
        monthly_revenue: 571200,
        annual_revenue: 6854400,
        gross_margin: 0.42,
        net_margin: 0.15
      },
      irr_estimate: 0.12
    }),
    result: "pending"
  },
  {
    id: "DGT-2026-010",
    company_name: "海底捞（西安大雁塔店）",
    industry: "catering",
    industry_sub: "火锅连锁",
    status: "pending",
    region: "陕西",
    city: "西安",
    main_business: "海底捞是全球最大的中式火锅连锁品牌，以极致服务闻名。大雁塔店位于西安最大旅游商圈，节假日客流尤为旺盛，年接待顾客超20万人次。",
    funding_amount: 300,
    funding_purpose: "翻修扩建（150万）+ 设备升级（100万）+ 流动资金（50万）",
    investment_period_months: 48,
    revenue_share_ratio: 0.04,
    cashflow_frequency: "monthly",
    contact_name: "高店长",
    contact_phone: "13800000010",
    submitted_date: "2026-02-01",
    project_documents: `【项目名称】海底捞西安大雁塔店收入分成项目\n\n【品牌介绍】\n海底捞2023年全球营收超400亿元，港交所上市，全球超1600家门店。\n\n【门店信息】\n- 位置：西安市雁塔区大雁塔北广场商业街\n- 面积：3200平米\n- 开业时间：2021年7月\n- 座位数：400个（120桌）\n- 员工：120人\n\n【经营数据】\n- 日均翻台率：4.2次\n- 人均消费：110元\n- 日均营收：18.5万元\n- 月均营收：555万元\n- 年营收：6660万元\n- 毛利率：60%\n- 净利率：12%\n\n【收入分成机制】\n- 分成比例：4%\n- 分成频率：每月结算\n- 预期年回款：266.4万元`,
    financial_data: JSON.stringify({
      investment_amount: 300,
      investment_period_months: 48,
      revenue_share_ratio: 0.04,
      cashflow_frequency: "monthly",
      revenue_data: {
        daily_revenue: 185000,
        monthly_revenue: 5550000,
        annual_revenue: 66600000,
        gross_margin: 0.60,
        net_margin: 0.12
      },
      irr_estimate: 0.22
    }),
    result: "pending"
  }
];

// 行业标签映射
export const industryLabels: Record<string, string> = {
  catering: "餐饮",
  retail: "零售",
  service: "服务",
  entertainment: "文娱",
  tech: "科技",
  logistics: "物流"
};

// 状态标签映射
export const dealStatusLabels: Record<string, { text: string; color: string }> = {
  pending: { text: "待评估", color: "bg-yellow-100 text-yellow-800" },
  under_review: { text: "评估中", color: "bg-blue-100 text-blue-800" },
  approved: { text: "已通过", color: "bg-green-100 text-green-800" },
  rejected: { text: "已拒绝", color: "bg-red-100 text-red-800" }
};

// 分成频率映射
export const cashflowFrequencyLabels: Record<string, string> = {
  daily: "日结",
  weekly: "周结",
  monthly: "月结"
};

// 格式化融资金额
export function formatAmount(amount: number): string {
  if (amount >= 100) return `${amount}万元`;
  return `${amount}万元`;
}

// 格式化IRR
export function formatIRR(irr: number): string {
  return `${(irr * 100).toFixed(1)}%`;
}
