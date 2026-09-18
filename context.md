# 🧳 Trip Note - Project Context & Rules

> **IMPORTANT RULE FOR AI AGENTS**: Before making ANY code, configuration, or data changes in this repository, you MUST read this `context.md` file to understand the architecture, design principles, generalization requirements, and user preferences. All updates MUST be recorded in the Version History Log below.

---

## 🎯 1. 项目定位 (Project Vision)

**Trip Note** 是一款优雅、现代、高度通用（Generalizable）的个人旅行规划与随身助手 Web App。
- **不仅限于当前行程**：虽然目前以《澳新11日休闲度假行程 (2026/09/27 - 10/07)》作为首个测试行程，但应用架构必须具备**通用性**，以便未来轻松复用于全球任何目的地的旅行。
- **数据驱动的主题系统 (Dynamic Theme System)**：结合目的地的气象坐标与视觉主题，自动呈现城市实时天气。
- **渐进式 Vibes Coding 开发**：随用户行程调整和想法深入，按需增量扩展新功能，保持简洁与极致 UI/UX。

---

## 🎨 2. UI & UX 设计规范 (Design Taste & Aesthetics)

- **行级对齐双列布局 (Integrated Row-Aligned Two-Column Layout)**：
  - **非独立分离侧边栏**：右栏作为主栏每一行 (Timeline Row) 的**行级延伸拓展列**（如同表格的第二列），与左栏同频同步滚动与对齐。
  - **左侧主栏**：专注时间点、活动/航班/酒店名称、基础描述与航线/房型、子景点（带有 `🧭 导航` `📍 定位` `🦉 猫途鹰`）、酒店操作按钮。取消有子景点的父卡片冗余按钮。
  - **右侧延伸栏**：与左侧活动行**平齐对齐**，展示该行专属的 Speech Bubble 卡片 (`speech-bubble-card`)：
    - 航班行：展示**航班实时更新大牌**（`🟢 航班状态`、`航站楼`、`登机口`、`登机时间`、`预计起降`）。
    - 酒店行：展示**建议入住与退房时间提醒**（`🔑 建议入住`、`🚪 退房时间`）。
    - 其他行程行：展示 **`💰 预估开销`**、**`⚠️ 交通/刷卡/避坑注意事项`**、**`🅿️ 停车指南`**、**`🛑 自驾路线补给`**。
- **Day Header 动态气象与天文组件 (Day Weather & Astronomy Widget System)**：
  - 移除原头部国旗勋章（`destination-chip`），保持 Day Header 极致精简。
  - **实时气象 Chip**：展示实时图标、温度、天气状况与风速 (`🌤️ 18°C 晴间多云 · 💨 12 km/h`)，点击直接跳转至权威气象预测来源页面。
  - **日出日落 Chip**：展示当日精准日出日落时刻 (`🌅 06:15 · 🌇 18:10`)，点击可跳转查看气象来源数据。
  - **穿衣建议 Popover**：互动式 Pill 按钮，悬停/点击弹出高质感玻璃拟态 Popover。
- **精准快捷操作按钮组 (Precision Action Button Group)**：
  - `🧭 导航`：一键调起手机 Google Maps 开始导航。
  - `📍 定位`：一键调起 Google Maps 查看精准坐标。
  - `🦉 猫途鹰`：一键新标签页打开 TripAdvisor 网友真实点评、评分与游记。
- **极简省流量/零图片漫游模式 (Data-Saving Roaming Mode)**：
  - 为防止旅途中频繁打开 App 消耗海外漫游流量，默认取消全部非必要网络实景图片（`imageUrl` 设为可选空缺），保持全站超轻量化毫秒级加载与极致零流量消耗。
  - 保留 Lightbox 弹窗与图片基础架构能力，未来如有特特重要地标需要展示可随时点对点按需开启。

---

## 🏗️ 3. 核心数据模型与子地标规则 (Data Schema & SubSpot Principles - V24)

```typescript
interface SubSpot {
  name: string;
  mapQuery?: string;
  imageUrl?: string; // 📷 Sub-spot Specific Real Web Photo URL (Optional)
  url?: string;      // 🌐 External Official Verification Link (Optional)
}

interface TimelineItem {
  id: string;
  time: string;
  type: 'spot' | 'flight' | 'hotel' | 'drive' | 'food' | 'transit';
  name: string;
  desc?: string;
  cost?: string;
  tips?: string;
  parking?: string; // 🅿️ Dedicated Parking & Toilet Facility Information
  imageUrl?: string; // 📷 Real Web Photo URL (Optional)
  subSpots?: (string | SubSpot)[];
  mapQuery?: string;
  lat?: number;
  lng?: number;
  
  // Flight Specific Live Info (Extension Col)
  flightCode?: string;
  flightRoute?: string;
  terminal?: string;
  gate?: string;
  boardingTime?: string;
  flightStatus?: string;
  estDeparture?: string;
  estArrival?: string;
  
  // Hotel Specific Info (Extension Col)
  roomType?: string;
  phone?: string;
  checkInTime?: string;
  checkOutTime?: string;
  
  // Drive Specific Info
  distance?: string;
  duration?: string;
  pitstops?: string[];
}
```

### 🚫 子地标 (`subSpots`) 严格使用规则 (Strict SubSpot Rules)
> **AI AGENT MANDATORY RULE**: `subSpots` 旨在处理“一个大行程节点内包含**多个真实独立、地图搜索坐标不同**的物理目的地”（如在南岸公园漫步时分别前往滨河步道、摩天轮、人造海滩、咖啡馆）。

1. **🚫 严禁将基础设施作为子地标**：公共卫生间 (Toilets)、停车场 (Parking)、加油站 (Gas) 等设施**绝不可以**作为单独的 `subSpots` 生成导航/定位按钮。设施信息必须统一记录在 `parking`、`tips` 或 `desc` 中。
2. **🚫 严禁将特色菜品/菜单作为子地标**：菜品（如鹿肉、鸭胸、刺身、Fish & Chips）**绝不可以**作为 `subSpots` 渲染导航按钮，菜品推荐统一写入 `desc` 或 `cost`。
3. **🚫 严禁将影视/背景文化描述作为子地标**：文化描述（如《纳尼亚传奇》取景地）**绝不可以**作为 `subSpots`，统一写入 `desc`。
4. **🚫 严禁在同建筑物内拆分非独立设施**：同一建筑或场馆内的区域（如“室内餐厅”、“半室内喂食区”、“19世纪老建筑外观”）**绝不可以**拆分作为 `subSpots`。
5. **🚫 严禁创建只有 1 个或与父节点 mapQuery 完全相同的冗余子地标**：若某个行程仅对应一个物理地标（如 Castle Hill 巨石阵、Twenty Seven Steps 餐厅），必须**完全移除 `subSpots` 数组**，由父卡片独立渲染单实体 [`🧭 导航` `📍 定位` `🦉 猫途鹰`] 操作栏。

---

## 📜 4. 每次更新历史记录 (Version History Log)

| 版本 | 日期 | 核心更新内容描述 |
| :--- | :--- | :--- |
| **V1** | 2026/09/27 | 初始版本搭建：HTML+CSS+JS 原生极简基础时间轴卡片与侧栏架构。 |
| **V2** | 2026/09/27 | 引入 Google Maps 坐标系统 (`lat`/`lng`/`mapQuery`)，实现全行程定位跳转。 |
| **V3** | 2026/09/27 | 引入多目的地国旗与城市实时气象 Chip 组件。 |
| **V4** | 2026/09/28 | 按钮语义重构：将“手机开始导航”简化为“导航”，将“查看地图坐标”简化为“定位”；支持子行程单独定位，隐藏含有子行程节点的父卡片冗余按钮。 |
| **V5** | 2026/09/28 | 航班与酒店信息升级：删除预定号，增加航班实时动态大牌（航站楼、登机口、登机时间、起降预估）与酒店入住退房时间提示。 |
| **V6** | 2026/09/28 | 酒店卡片集成 Google Maps `🧭 导航` 与 `📍 定位` 按钮。 |
| **V7** | 2026/09/28 | 布局框架重构：取消独立悬浮侧栏，重构为与主时间轴每一行同频滚动的**行级延伸列 (Extension Column)**，实现表格化平齐显示。 |
| **V8** | 2026/09/28 | 将酒店入住退房提醒与航班实时更新大牌全域迁移至右侧行级延伸列。 |
| **V9** | 2026/09/28 | 气象与天文系统升级：移除国家勋章，气象与日出日落 Chip 支持点击外跳至数据源，增加高质感 Popover 穿衣建议系统。 |
| **V10** | 2026/09/29 | 在所有景点、酒店、美食餐馆与子行程节点集成 **`🦉 猫途鹰 (TripAdvisor)`** 快捷点评跳转按钮。 |
| **V11** | 2026/09/29 | 专有自驾与停车指南系统：新增 `drive` 自驾类型节点、`parking` 停车专有属性与右侧延伸列 **`🅿️ 停车指南`** 气泡框。 |
| **V12** | 2026/09/29 | 9月29日 (周二) Day 3 阿卡罗阿 12 项细化自驾/羊驼农场/灯塔日落行程数据录入。 |
| **V13** | 2026/09/29 | 真实网络实景图与全屏 Lightbox 放大模态框系统：增加 `imageUrl` 属性、`📷 真实地标参考图` 缩略图卡片与全屏高斯模糊遮罩弹窗 (`#image-lightbox-modal`)。 |
| **V14** | 2026/09/29 | 全量真实公有地标照片替换与 context.md 审计记录：采用维基百科 (Wikimedia Commons) 真实实景摄影彻底替换所有临时/占位图，补全 V1~V14 全版本更新历史审计日志。 |
| **V15** | 2026/09/29 | 多地标独立配图机制 & Day 2 / Akaroa 精准照片更新：支持在子景点 (`subSpots`) 中为每个具体地标单独配备维基百科真实地标照片 (`subSpot.imageUrl`)。 |
| **V16** | 2026/09/29 | 省流量/零图片随身漫游模式 (Data-Saving Roaming Mode)：响应随身漫游流量节省需求，全量清空 `data.js` 中所有节点与子地标的 `imageUrl` 链接，实现 App 极速瞬间加载与 0 流量开销；架构完备保留，未来可按需开启。 |
| **V17** | 2026/09/30 | **9月30日 (周三) Day 4 蒂卡波湖 9 项细化自驾/观景/自主观星行程数据录入**：填入阿卡罗阿退房、SH75/SH79 平原自驾、Fairlie Bakehouse 招牌肉派与停车补给、Burkes Pass 盘山自驾、Mt John Access Rd 登顶观景与闸机/Astra Cafe 下午茶、Lakeview Studio B 自助 Check-in 与住客车位、好牧羊人教堂/牧羊犬雕像/ Four Square 超市采购、Kohan 湖景日料晚宴，以及暗夜保护区核心地带自主观星/温泉备选 9 项细化行程节点。 |
| **V18** | 2026/10/01 | **10月1日 (周四) Day 5 库克山冰川徒步 & Plan A / Plan B 弹性行程录入**：新增出发前 07:30 - 08:00 DoC 官网与 MetService 库克山天气/徒步路线开放状态查验卡片（配置 `🌐 官网查验` 外部跳转按钮）；全量集成 Plan A (☀️ 晴朗冰川公路自驾 ➔ Lake Pukaki 高山刺身三文鱼 ➔ Hooker Valley Track 往返徒步 ➔ Fairlie 弹性休整 ➔ Geraldine 艺术小镇 Barker's 下午茶 ➔ 基督城 Fable Check-in) 与 Plan B (🌧️ 恶劣天气替代方案：Twizel 室内三文鱼农场 ➔ Burkes Pass 复古小镇漫步 ➔ Geraldine 室内果酱工坊 & 咖啡馆 ➔ 基督城 Riverside Market 室内美食集市晚宴) 21 项行程节点。 |
| **V19** | 2026/10/02 | **最高/最低气温昼夜温差、一天的多地气温、距离远预报提示与权威气象机构官方链接系统升级**：<br>1. **高低温与昼夜温差**：将单温显示重构为精准高低温区间 (`最低°C ~ 最高°C`)，穿衣建议智能化提醒高温差‘洋葱式多层穿搭’；<br>2. **多地气温支持**：在跨城/多目的地行程（如 Day 2 布里斯班+基督城、Day 4 阿卡罗阿+蒂卡波湖、Day 5 库克山+基督城）配置 `weatherLocations` 节点，并发渲染各城市专属气象 Chip；<br>3. **远日期出行提示**：自动校验目标日期距离系统当天的天数，超过 14 天预报窗口时显示 `10月历史气候参考` 标识与 `(距出行较远，实时预报将在出发前14天自动启用)` 明确提示，绝不显示今日误导性假数据；<br>4. **正规官方气象机构外链**：彻底取消 Google 通用搜索链接，全面精准链接至官方权威气象机构（新西兰 **MetService NZ** 城市/山地预报页、澳大利亚 **BOM** 气象局官方预报页、中国 **中国天气网 CMA** 预报页）。 |
| **V20** | 2026/10/02 | **10月2日 (周五) Day 6 城堡山巨石阵漫步与 Twenty Seven Steps 告别晚宴行程录入**：填入 Fable 睡到自然醒、New Regent St 街区 C1 Espresso 气动管道送餐 Brunch、SH73 景观公路自驾 90km 至 Castle Hill 纳尼亚传奇取景地灰白石灰岩石群漫步（含入口免费停车场与生态卫生间）、返程 Lichfield St 停车楼开启全步行模式、基督城植物园玫瑰园/温室花房与雅芳河散步、Riverside Market 室内集市、返回 Fable 酒店休息梳洗，以及 New Regent St 告别晚宴 Twenty Seven Steps（招牌高山鹿肉/煎鸭胸/海鲜配白葡萄酒，含提前 2~3 周官网预约提醒）8 项细化行程节点。 |
| **V21** | 2026/10/02 | **行程时间区间下方显示动态时长 Chip 标签 (Duration Chip Feature)**：增加 `calculateTimeDuration` 与 `renderTimeBadgeHtml` 智能计算函数。自动对带有时间范围（如 `07:30 - 08:30`、`11:00 - 12:20`、`15:20 - 17:30`）的行程节点解析开始与结束时刻，并在左侧时间栏下方生成直观高质感的 `⏱️ 30分钟` / `⏱️ 1小时20分钟` 动态时长 Chip 标签。 |
| **V22** | 2026/10/02 | **多方案 (Plan A / Plan B) 交互式隐藏与 segmented switcher 选项卡分段切换功能**：为包含多方案的行程日（如 Day 5 库克山冰川/雨天避雨日）引入 `plan: 'A'` 与 `plan: 'B'` 属性标记与 `activeDayPlans` 状态管理。在 Day Body 顶部与地图侧栏呈现视觉惊艳的现代分段切卡 UI (`☀️ Plan A 晴朗冰川全景版` vs `🌧️ Plan B 雨雪天气避雨版`)，默认仅渲染当前选中的方案节点，实现页面大体量多方案的极简收纳与一键无缝切换。 |
| **V23** | 2026/10/02 | **全行程 `subSpots` 冗余/非地理定位节点专项清理与精准化矫正**：针对 Day 6 Twenty Seven Steps 告别晚宴中误将特色菜品 (`招牌高山鹿肉/煎鸭胸/海鲜配白葡萄酒`) 作为子地标渲染导航按钮的冗余定位进行彻底清理；全面排查全行程，移除所有非地理位置/菜品/电影描述/同楼宇重复定位 subSpot，恢复单实体卡片 (Single Primary Card) 独立导航/定位/猫途鹰按钮显示。 |
| **V24** | 2026/10/02 | **`subSpots` 严格使用规则固化与 Castle Hill / Burkes Pass / Hilltop 单实体冗余卫生间子定位全面清理**：<br>1. 清理 Day 6 Castle Hill 中将“生态公共卫生间”重复链接至相同坐标的冗余 `subSpot`，卫生间统一归入 `parking` 属性，主卡片独立渲染单实体操作栏；<br>2. 清理 Day 3 Hilltop Lookout 与 Day 5 Burkes Pass 单一/重复 `subSpots`；<br>3. 将 5 条 `subSpots` 严格禁忌规则（禁止卫生间/停车场/菜品/电影描述/同建筑重复定位）写入 `context.md` 核心架构规范，作为后续所有行程更新的强制默认规范。 |
| **V25** | 2026/10/02 | **Fairlie 镇公共卫生间 & 加油站 / Mt John 道路闸机等公共设施子定位全面清理**：彻底清理 Day 4 Item 3、Day 5 Item A7 Fairlie 镇节点与 Day 4 Item 5 Mt John 节点中误将公共卫生间、加油站、道路收费闸机作为 `subSpots` 渲染导航按钮的冗余结构，将设施提示完整收纳于 `parking` 与 `tips` 属性，恢复餐厅与景点主卡片独立干净的导航定位按钮组。 |
| **V26** | 2026/10/03 | **10月3日 (周六) Day 7 基督城缆车/还车出境/飞往悉尼 & 悉尼 T8 公交路线 UI/UX 视效节点**：<br>1. **Day 7 16项细化行程录入**：包括 Lyttelton 港口小镇周末集市 & Brunch、Christchurch Gondola 缆车山顶全景、Riverside / Child Sister 午后补给、BP Connect 满油加油、Snap 门店还车交接与免费 Shuttle 接驳、EK413 / QF8765 跨塔斯曼海海峡商务舱体验、Manawa 贵宾室、悉尼 Intl 机场 SmartGate 极速通关、悉尼 T8 Airport Line 轨交、PARKROYAL Darling Harbour Check-in、达令港 Cockle Bay 21:00 周六海上夜空烟花秀，以及 Zephyr Rooftop Bar / O Bar 露天酒吧夜生活；<br>2. **悉尼公共交通 (Public Transit) UI/UX Visual Stepper 节点组件设计**：为公共交通节点增加 `transitType`、`lineName`、`lineColor`、`startStation`、`endStation`、`stopsCount`、`exitInfo`、`paymentTip` 结构化属性，并在 CSS/JS 中构建视效高质感的路线站点 Stepper 垂直卡片，支持 Apple Pay/信用卡无接触感应进站提示与关键出站口指引。 |
| **V27** | 2026/10/07 | **10月4日~10月7日 (Day 8 - Day 11) 悉尼行程全量深度补全 & 全程 11 日度假行程大圆满**：<br>1. **Day 8 (10/04 周日)**：SAILMAKER 惬意早餐、2.5km 市中心经典 City Walk (圣玛丽大教堂 ➔ 海德公园 ➔ 皇家植物园 ➔ 麦考利夫人座椅 ➔ 歌剧院广场)、F2 渡轮 + 238 公交至 Taronga Zoo 塔龙加动物园下坡游览、F9 渡轮至 Watsons Bay 屈臣湾草坪躺平 & Hornby 红白灯塔海崖散步、Doyle's 炸鱼薯条、F9 渡轮日落航程至 Circular Quay 车站打卡“蓝调时刻 (Blue Hour)”框景月台大片、岩石区 (The Rocks) 晚宴与 The Glenmore 顶楼夜景酒吧、F4 渡轮横跨大桥返回达令港；<br>2. **Day 9 (10/05 周一)**：NSW 劳动节 (Labour Day) 10%-15% 假日附加费避坑特别提示、QVB 维多利亚女王大厦 & Pitt St 步行街、Westfield 平价美食广场、T4 火车 + 333/379 公交至 Bondi Beach、6km Bondi to Coogee 绝美海岸悬崖步道 (Icebergs 泳池 ➔ Tamarama ➔ Bronte ➔ Waverley 悬崖公墓 ➔ Gordon's Bay ➔ Coogee Beach)、Coogee 沙滩日落、374 路直达公交返回达令港；<br>3. **Day 10 (10/06 周二)**：T1 火车快线 + 729 公交极速前往 Featherdale 野生动物园 (晨间动物最活跃互动：红袋鼠/短尾矮袋鼠 Quokka 自由抚摸喂食 & 考拉合影)、George St 林荫主干道与 QVB/Westfield 终极采购、达令港水岸告别晚宴、晚间打包收纳行李；<br>4. **Day 11 (10/07 周三)**：SAILMAKER 早餐与 Check-out 退房、T8 Airport Line 直达 T1 国际航站楼、香港航空 (HX018 / HX304) 值机与行李直挂至北京、手机 TRS App QR 码 10% 消费税退税指引、HX018 飞往香港、香港 T1 极速转机、HX304 飞抵北京首都国际机场 T2，完美收官 11 日澳新度假随身助手！ |
| **V28** | 2026/10/07 | **每日行程卡片折叠/展开 (Expandable Day Cards & Header Toggle) 极简交互功能上线**：<br>1. **默认收起 (Collapsed By Default)**：每天的行程卡片默认处于优雅的折叠收起状态，Header 仅展示基础信息（Day 编号、标题、日期、城市、行程项数 Chip 与气象/穿衣按钮）；<br>2. **卡片 Header 交互展开 (Header Tap to Expand)**：点击任意 Card Header 即可流畅展开该天详细行程时间轴；二次点击即刻平滑收起；<br>3. **顶部一键全展/全收按钮 (Global Expand All Switcher)**：顶部控制栏集成 `📂 展开全部行程` / `📁 收起全部行程` 全局按钮，支持一键切换全部天数的折叠展开状态。 |
| **V29** | 2026/10/07 | **官方权威 7 天天气预报过滤规则与风速等级系统 & Day Header 双排与多国勋章 UI/UX 视效全面升级**：<br>1. **官方预报 7 天窗口规则**：严格遵循新西兰 MetService / 澳大利亚 BOM 官方平台最远 7 天预报发布限制，仅在精准窗口期内接入即时预报，超出窗口统一展示 `10月历史` 气候参考与明确说明；<br>2. **风速等级与图标系统**：自动计算风速 (km/h) 并转换为易懂的风级与图标 Tag（`🍃 微风` <12km/h, `💨 和风` 12-25km/h, `🌬️ 强风` 25-40km/h, `⚠️ 大风警告` >40km/h）；<br>3. **Day Header 布局与跨国勋章重构**：<br> - **Row 1**：左侧为 Day 编号/标题/日期/城市/行程项数，右上角 (Top Right) 动态展示当日涉及的国家勋章（跨城跨国天自动并排展示 🇦🇺 澳大利亚 + 🇳🇿 新西兰）；<br> - **Row 2**：包含气象 Chip（含温度+风速+预报/历史标记）、日出日落时刻 Chip、穿衣建议 Popover 按钮，右下角 (Bottom Right) 配置纯箭头 32px 圆形指示按钮 (`▲` / `▼`)；<br>4. **折叠状态浮窗遮挡修复**：重构 `.day-card` 与 `.day-header` 的 `overflow` 溢出处理与圆角卡片样式，消除行程收起状态下穿衣建议浮窗的底端裁剪。 |
| **V30** | 2026/10/07 | **穿衣建议 Popover 跨卡片图层置顶与 Day Header 冗余箭头按钮移除**：<br>1. **Popover 跨 Card 顶级置顶**：为激活穿衣建议 Popover 的 `.day-card` 动态增加 `has-active-popover` 状态类，并赋予 `z-index: 1000 !important;` 顶级层叠上下文，搭配 Popover 本身的 `z-index: 9999`，彻底解决弹出框被下一天卡片 Header 盖住的问题；<br>2. **删除冗余箭头按钮**：彻底移除 Day Header 右下角的独立箭头按钮，统一保留直接点击 Day Header 选项卡卡片进行开合折叠的极致流畅交互。 |
| **V31** | 2026/10/07 | **Day Header 国家勋章严格按行程时间顺序摆放 & 补全出境/入境中国勋章**：<br>1. **严格行程时间顺序**：重构 `getDayDestinationBadges(day)`，按当天的具体时间流向（如出发城市 ➔ 抵达城市、第一项行程 ➔ 最后一项行程）精准解析国家出现先后顺序（如 Day 2 为 🇦🇺 澳大利亚 ➔ 🇳🇿 新西兰，Day 7 为 🇳🇿 新西兰 ➔ 🇦🇺 澳大利亚）；<br>2. **补全去程与回程国旗勋章**：在 Day 1 国际去程与 Day 11 国际回程中，自动精准解析并渲染出发与到达国家勋章（Day 1: 🇨🇳 中国 ➔ 🇦🇺 澳大利亚；Day 11: 🇦🇺 澳大利亚 ➔ 🇨🇳 中国），完美展现出入境跨国全貌。 |
| **V32** | 2026/10/07 | **动态 API 预报视界探测与自适应历史天气降级机制 (Dynamic API Horizon & Fallback Strategy)**：<br>1. **废除前端硬编码天数门槛**：彻底废除前端 `diffDays <= 7` 硬编码天数限制，改为动态向气象服务 API 查询模型视界数据（Open-Meteo 最高 16 天）；<br>2. **动态自适应落域**：按 API 返回的 `daily.time` 数组精准检索目标行程日期。若目标日期在预报范围内且数据有效，即刻呈现即时气象预报（自动兼容 3 天、7 天或 14 天预报）；<br>3. **智能自动降级**：若目标日期超出该 API 的实际预报视界或请求失败，系统自动无缝降级为呈现该地 10 月历史平均气候参考，实现最大程度的数据通用性与弹性。 |
| **V33** | 2026/10/07 | **气象预报官方机构外链 100% 审计与 Akaroa / Tekapo 404 修复**：<br>1. **原因排查与修复**：针对 MetService NZ 在 `/towns-cities/locations/akaroa` 与 `/lake-tekapo` 抛出 404 错误的问题，经全面验证，MetService 将该区域划归为克赖斯特彻奇与坎特伯雷大区预报，已全量更新为 100% 连通的官方页面 (`/christchurch`)；<br>2. **全量正规气象外链验证**：审计并确认所有目的地气象机构外链（包含 MetService NZ 库克山/亚瑟通道/基督城、澳大利亚 BOM 布里斯班/悉尼、中国天气网 广州/北京）均 100% 稳定有效无 404。 |
| **V34** | 2026/09/17 | **天气 Chip 可验证数据来源 Popover 系统 (Weather Data Verifiability Upgrade)**：<br>1. **问题修复**：原天气 Chip 为外跳 `<a>` 标签，点击直接跳至 MetService/BOM 官方网站，而 App 实际数据来自 Open-Meteo API，两套数据来源不同，用户无法在官方网站核实 App 内显示的具体数值；<br>2. **改为内嵌详情 Popover**：将天气 Chip 重构为点击展开的 Popover 组件（蓝色系玻璃拟态风格，与紫色穿衣建议 Popover 视觉区分），Popover 展示：温度区间 / 天气状况 / 风速 / 日出日落 / 数据来源明细；<br>3. **Open-Meteo 直接验证链接**：Popover 内嵌 `📡 Open-Meteo API 原始数据 ↗` 精准链接，浏览器打开即见 JSON，`daily.time` 数组中找对应日期，数值与 App 显示 100% 吻合；<br>4. **官方机构参考链接保留**：保留 `🏛️ 官方气象机构参考 ↗` 链接作为权威交叉验证；<br>5. **三文件同步**：`weather.js` 补充 `sourceApiUrl` 字段 / `app.js` 新增 `toggleWeatherPopover` 函数并更新点击排除列表 / `components.css` 新增 `.weather-badge-wrapper` 与 `.weather-detail-popover` 样式。 |
| **V35** | 2026/09/17 | **Phase 1 产品重大演进：PWA 离线运行架构、Live Focus 当日焦点感知系统与移动端人体工程学优化**：<br>1. **PWA 离线可用与主屏幕安装**：新增 `manifest.webmanifest` 与轻量 Service Worker (`sw.js`)，支持在手机 Safari/Chrome 中一键“添加到主屏幕”全屏独立运行；配置原生状态栏与离线缓存策略，核心静态资源秒开，应对冰川山区无信号场景；<br>2. **Live Focus / Now Mode 实时焦点系统**：在主控栏上方集成高质感 Live Focus Mini Bar。若当前真实日期落在行程期内，自动聚焦并展开“今日”Day Card；若在行程期外，优雅启动“自由行演练模式”支持任意选择天数模拟演练；<br>3. **今日卡片与活动节点视觉高亮**：为今日 Day Card 提供翡翠绿 Ribbon 勋章与微光边框，正在进行或即将进行的具体时间轴节点赋予呼吸脉冲点、专属 `is-live-active-item` 内发光底色与 `🟢 当前焦点` 标签；<br>4. **一键直达与移动端 Bottom Dock**：提供 `jumpToToday()` 伴随呼吸涟漪动效平滑滚动直达；在移动端（<768px）新增极简毛玻璃悬浮 Dock 导航条（今日直达、全展全收、地图/行程一键切模、平滑回顶），极大提升单手操作人体工程学体验。 |
| **V35.1** | 2026/09/17 | **渲染阻断修复 (Render Hotfix)**：修复 `app.js` 中 `activeItemClass`、`isCurrentActiveItem` 与 `itemRowId` 变量在循环顶部作用域声明遗漏导致的 `ReferenceError` 异常，全行程时间轴与 Live Focus 演练栏恢复 100% 毫秒级正常渲染，更新版本号与缓存穿透标识。 |
| **V35.2** | 2026/09/17 | **移动端 Impeccable 视效与人体工程学重构 (Mobile UI/UX Overhaul)**：<br>1. **时间轴时间徽章顶部解耦**：彻底移除窄屏（<768px）下左侧固定的 95px 时间栏挤压，时间与时长 Chip 改为在活动卡片上方横向居左流动排布（`item-time-badge`），释放出 100% 完整宽度给行程主体；<br>2. **子地标垂直堆叠与按钮换行**：彻底解决图片中所见子地标名字竖排与按钮挤成细长垂直条的问题；地标名称独占一行、自适应换行；操作按钮组自动横向流动平铺 (`flex-wrap`)，官网查验全宽置顶，符合 Apple HIG 最小 36px 触控靶心规范；<br>3. **Plan A / Plan B 等分双胶囊**：在手机端自适应为 1:1 双格分段切卡，单手拇指极易盲操点按；<br>4. **延伸列气泡内嵌融合**：将原本孤立掉在右侧的 Speech Bubble 气泡卡片在移动端无缝收纳为活动节点底部的深色融合板块，消除视觉撕裂。 |
| **V35.3** | 2026/09/17 | **Day Header 国家徽章同排内联展示 & 公共交通路线卡片视效重构 (Transit Stepper & Header Inline Optimization)**：<br>1. **Day Header 国家徽章同排无缝内联**：在手机端将 `.day-header-row-1` 重构为 `flex-wrap: nowrap`，国家徽章 Chip (`.destination-chip`) 精准居右内联于同一排，消除换行冗余占用垂直高度，大幅压缩折叠状态下的屏占比；<br>2. **公共交通卡片垂直地铁路线轨 (Continuous Subway Track Stepper)**：针对悉尼 T8 机场线、渡轮、公交等公共交通节点，彻底重构移动端站点 Stepper 交互布局：上车站、连续贯穿垂直线段与下车站 100% 像素级对齐；支持动态交通载具图标（🚆 火车 / ⛴️ 渡轮 / 🚌 公交 / 🚶 步行）；注入 `--route-color` CSS 变量自适应匹配悉尼官方路线主题色；出站指引与支付贴士采用清晰 Callout 排版，彻底解决移动端显示混乱问题；<br>3. **Service Worker 动态缓存穿透与版本更新**：升级 Service Worker 缓存策略至 `trip-note-cache-v35.3`，页面导航采用 Network-First 策略，全量静态资源穿透更新至 `v=35.3`，确保移动端刷新即生效最新排版。 |
| **V35.4** | 2026/09/17 | **Day Header 标题下排独立全宽展示与顶排徽章左右对齐重构 (Day Header Title Row Separation)**：<br>1. **DOM 结构重构**：将 `.day-title-box` 移出 `.day-badge-container` 作为 `.day-header-row-1` 的独立子容器；<br>2. **移动端完美分排排版**：顶排（第 1 排）左侧放置 `DAY X` 编号及 `📍 今日` Ribbon 徽章，右侧 `margin-left: auto` 放置对应国家徽章（`🇦🇺` / `🇳🇿`），实现徽章极简同排展示；<br>3. **行程主要命名全宽下排**：行程主要命名（`.day-title-text`）与日期/项数（`.day-date`）赋予 `order: 3; width: 100%`，独占第 2 排完整屏幕宽度，彻底解决与国家徽章水平挤压导致的文字换行与压迫感；<br>4. **全端版本穿透**：全量静态资源与 Service Worker 缓存池递增至 `v35.4`。 |
| **V35.5** | 2026/09/17 | **气象栏 UI 极简瘦身与穿衣建议 Popover 移动端全宽安全防溢出 (Weather Chip Slim & Popover Containment)**：<br>1. **气象 Chip 极简瘦身**：移除气象 Chip 中冗余的天气文字描述（如“晴天多云”）与风力文字描述（如“微风/和风”），仅保留直观的状况图标与高低温区间（`${loc.icon} ${loc.city} ${loc.tempDisplay}`）及风力小图标与速度（`${windIcon} ${windSpeed}km/h`），尺寸由 ~310px 锐减至 ~190px，大幅缓解手机屏横向拥挤；<br>2. **完整气象与风力文字保留于详情框**：点击气象 Chip 弹出的详情框中完整保留文字状况、详细风力风级、日出日落与原始数据 API 验证链接；<br>3. **穿衣建议 & 气象 Popover 移动端防溢出重构**：在移动端彻底解决穿衣建议 Popover 伸出屏幕左/右侧的问题。将容器父级重置为 `position: static`，浮层以 `.day-header` 宽度为基准自适应撑开（`left: 0.75rem; right: 0.75rem; width: auto; max-width: calc(100vw - 1.5rem)`），增加最大高度 `max-height: 75vh` 与内容纵向滚动；<br>4. **Popover 交互易用性提升**：在浮窗右上角增加优雅的小圆 `✕` 关闭按钮，并注册全局空白处点击关闭监听器，大幅提升单手触控操作体验；<br>5. **全量缓存版本同步升级至 `v35.5`**。 |
| **V35.6** | 2026/09/17 | **穿衣建议 Popover 关闭按钮触控修复与 Day Header 下半部展开行程交互恢复 (Popover Close & Day Header Expand Fix)**：<br>1. **穿衣建议 Popover 移动端 Safari 粘滞 Hover 清除**：移除 `css/components.css` 中 `.weather-clothing-wrapper:hover .weather-clothing-popover` 选择器，彻底消除触控设备在点击弹窗内部后由于 iOS Safari 维持伪类 `:hover` 导致无法通过 `✕` 按钮关闭的顽疾；现在 Popover 开闭 100% 由 `.active` 状态类严格控制，点击 `✕` 按钮即刻平滑收起；<br>2. **Popover 关闭按钮触控靶心升级**：将 `.popover-close-btn` 尺寸由 24px 放大至 32px，添加 `touch-action: manipulation` 与四周 8px 隐藏命中热区（达到 Apple HIG 48px 触控标准），并绑定 `ontouchend` 监听提升触控即时响应速度；增加移动端外部空白处点击/触摸收起 Popover；<br>3. **Day Header 下半部（气象栏区域）展开行程交互恢复**：移除 `app.js` 中 `.weather-mount-box` 容器上的 `onclick="event.stopPropagation()"` 事件阻断属性；现在点击 Day Header 卡片选项卡的下半部分（气象栏空白区域、内边距与间隙）与点击上半部分一样，均能流畅展开/收起当日详细行程时间轴；单独点击气象 Chip 或穿衣建议按钮仍独立响应对应 Popover；<br>4. **全端版本缓存穿透**：全量静态资源与 Service Worker 缓存池版本号递增至 `v35.6`。 |
| **V36.0** | 2026/09/17 | **Phase 2 随身实用工具库重大发布：行前备忘与海关申报清单、Cmd+K 全局即时搜索、当日全天连贯路线导航 (Checklist Vault, Spotlight Search & Connected Route)**：<br>1. **行前备忘、证件库与澳新海关避坑清单 (Checklist & Customs Vault)**：在控制栏与移动端 Dock 增加 `📋 备忘清单` 抽屉；内置 19 项分类细化检查项（护照/澳大利亚电子签/NZeTA/驾照翻译件/信用卡、澳标三脚转换头/手机支架/登山鞋/防晒霜/充电宝，以及极其严苛的澳新生物安全红线：严禁新鲜水果肉类、严禁蜂产品、徒步鞋底泥土清洗与申报法则）；勾选状态通过 `localStorage` 自动持久化并在控制栏显示实时百分比；支持一键重置；<br>2. **Cmd+K 全局即时搜索系统 (Spotlight Instant Search)**：支持键盘快捷键 (`⌘K` / `Ctrl+K` / `/`) 与界面按钮触发；全局毫秒级模糊检索全部 11 天行程中的景点、酒店、航班号、餐厅、停车与退税贴士；支持高亮标签一键填词；点击搜索结果自动切回时间轴视图、自动展开对应 Day Card、平滑居中滚动至目标节点并附加翡翠微光呼吸动画 (`search-target-highlight`) 视觉锁定；<br>3. **当日全天连贯自驾/游览路线导航 (Daily Connected Route Map)**：扩展 `MapsHelper.getDailyRouteUrl`，自动提取当天多节点地理坐标，在 Day Header 气象栏动态生成 `🚗 全天自驾路线 ↗` 或 `🚶 全天游览路线 ↗` 快捷 Chip；点击一键拉起官方 Google Maps 多途径点整日连续轨迹与耗时全览；<br>4. **全端版本缓存穿透**：Service Worker 缓存池与静态资源版本全量升级至 `v36.0`。 |
| **V36.1** | 2026/09/17 | **搜索功能运行时数据访问修复 & 备忘录分类标签移动端渲染修复 (Search Hotfix & Checklist Mobile UI Patch)**：<br>1. **搜索功能数据访问与字段索引修复**：排查发现 `buildSearchIndex` 中调用未定义的 `tripStore.getAllDays()` 导致运行时抛出 `TypeError` 阻断弹窗打开；在 `data.js` 中补齐 `TripStore.getAllDays()` 方法，并在 `app.js` 中适配弹性访问机制（兼容 `getFilteredItinerary('all')` 与 `itinerary`）；重构索引建立逻辑，全面覆盖 `item.name`、`desc`、`tips`、`drivingTips`、`flightCode`、`hotelName`、`subSpots` 等所有真实字段；<br>2. **跨国家筛选与多方案直达联动**：在搜索直达逻辑中，若目标行程被当前目的地过滤条件隐藏，自动平滑切回“全部行程”视图；若目标属于特定 Plan (如 Plan B)，自动激活该方案，确保 100% 滚动聚焦目标节点；<br>3. **备忘录分类标签 WebKit 渲染修复**：针对 iOS Safari 手机端出现的分类标签胶囊边框压扁、文字与图标下移溢出边框的 WebKit 按钮原生外观 Bug，在 `main.css` 与 `components.css` 中为 `button` 与 `.checklist-tab` 注入 `-webkit-appearance: none; appearance: none;`，采用 `display: inline-flex; align-items: center; justify-content: center; height: 34px; line-height: 1;` 刚性约束，并消除横向滚动条，彻底实现胶囊药丸按钮与文字的像素级垂直居中与饱满视觉；<br>4. **全端版本穿透**：全量静态资源与 Service Worker 缓存升级至 `v36.1`。 |
| **V37.0** | 2026/09/17 | **Phase 3 旅途质感与应急保障重大发布：跨国多时区时钟、实时汇率换算抽屉、行程节点打卡记忆与 A4 纸质应急行程单打印 (Timezone Clocks, Currency Converter, Item Completion & Emergency Print)**：<br>1. **跨国多时区实时时钟 (Multi-Timezone Live Clocks)**：在 Hero Banner 统计栏下方集成玻璃拟态多时区时钟条（🇨🇳 北京 UTC+8 基准、🇦🇺 悉尼、🇳🇿 基督城）；基于浏览器原生 `Intl.DateTimeFormat` IANA 时区（`Asia/Shanghai` / `Australia/Sydney` / `Pacific/Auckland`）实现秒级精准时间与星期计算，原生自适应澳新夏令时切换；动态计算悉尼与基督城相对于北京的时差标识（`+2h` / `+4h` 或 `+5h`）；<br>2. **随身三币双向汇率换算抽屉 (3-Way Currency Converter Drawer)**：在控制栏与移动端底部 Dock 增加 `💱 汇率` 快捷按钮；支持 NZD（新西兰元）、AUD（澳大利亚元）、CNY（人民币）三币实时联动输入计算；内置 `$10` / `$25` / `$50` / `$100` / `$200` / `$500` 常用面额快捷筹码；支持一键网络刷新最新牌价并使用 `localStorage` 持久化离线缓存；内嵌澳新本地消费防坑要诀（拒用 DCC 动态货币转换、防范商家信用卡 Surcharge 附加费）；<br>3. **行程节点行中打卡与进度记忆 (Timeline Item Completion & Progress Memory)**：在每个行程节点左侧时间徽章处集成圆形打卡按钮，支持单手一键标记已完成（`✓`）；已打卡节点自适应虚化渐变与绿色边框，标题附加 `✓ 已打卡` 标记；在 Day Header 实时统计当日达成情况（`✓ 已打卡 X/Y 项` 或 `🎉 今日全部达成`）；全部打卡状态经由 `TRIP_NOTE_COMPLETED_ITEMS_V1` 在本地持久化保存；<br>4. **A4 黑白纸质应急行程单打印/导出模式 (`@media print` & Window Print)**：在控制栏与页脚集成 `🖨️ 打印应急单` 功能；触发时自动展开所有被折叠的行程天数卡片；内置仅在打印/导出时显示的应急紧急联络栏（新西兰 111、澳大利亚 000、中国驻悉尼/基督城总领馆电话、租车公司救援热线）与关键预定概览表；通过纯白底色、高对比度黑字、隐藏屏幕 Dock 与导航条、强制避免跨页截断等严苛墨粉友好排版，完美导出可塞入护照夹的 A4 应急备用纸质单；<br>5. **全端版本与 Service Worker 缓存穿透**：全量静态资源与 Service Worker 缓存池版本升级至 `v37.0`。 |
| **V37.1** | 2026/09/17 | **多地时钟手机溢出修复 & 备忘清单分类与滚动裁切全面修复 (Mobile UI Patch: Timezone Grid & Checklist Containment)**：<br>1. **多时区时钟移动端 3 列网格重构 (Timezone Mobile 3-Col Grid)**：针对移动端（<768px）宽度有限（~300px）导致 3 地横排文字溢出边框的缺陷，彻底重构为 3 等分竖直卡片网格布局（`grid-template-columns: repeat(3, 1fr)`）；移动端自动精简文字（隐藏“时间”与“基准”冗余后缀），国旗、城市与时差 Chip 居中对齐，大字号时间与日期平铺，彻底解决边框溢出问题；<br>2. **备忘清单分类选项卡 4 列等分网格 (Checklist Tabs 4-Col Grid)**：彻底消除移动端分类选项卡横向单行溢出被右边缘切断一半的体验缺陷；采用响应式 4 列网格（`全部` · `🛂 证件` · `🎒 行李` · `⚠️ 海关`），文字居中且 100% 同屏完整展现；<br>3. **备忘清单列表 WebKit 滚动穿透与视口防截断 (Checklist Scroll & Safari dvh Fix)**：为 `.checklist-items-container` 注入 `min-height: 0; flex: 1 1 auto; -webkit-overflow-scrolling: touch;`，消除 iOS Safari flexbox 滚动边界丢失导致的底部列表截断；`.drawer-modal` 高度采用 `max-height: 86dvh` 动态视口单位，底部安全边距防 Safari 工具栏遮挡；底部增加 1.75rem 滚动垫片，确保最后一项清晰完整；<br>4. **全端版本与 Service Worker 缓存穿透**：全量静态资源与 Service Worker 缓存池版本升级至 `v37.1`。 |
| **V37.2** | 2026/09/17 | **移除页脚冗余打印按钮 & 界面极简纯净化 (Footer Cleanup & Redundancy Removal)**：<br>1. **移除页脚冗余按钮**：因顶部控制栏已有功能完备的 `🖨️ 打印应急单` 按钮，彻底移除页脚中的次级打印按钮 (`.print-footer-btn`)，消除重复入口与垂直空间挤占，使页面底部更加轻量纯粹；<br>2. **全端版本与 Service Worker 缓存穿透**：全量静态资源与 Service Worker 缓存池版本升级至 `v37.2`。 |
| **V37.3** | 2026/09/17 | **PWA 即时热更新与移动端缓存自动刷新救急架构 (PWA Instant Update & Mobile Cache Recovery)**：<br>1. **Service Worker 自动接管与无感知热重载**：在 `index.html` 中注册 `navigator.serviceWorker.addEventListener('controllerchange')` 与 `reg.update()` 轮询；当 GitHub Pages 推送新版本后，新 Worker 自动调用 `self.skipWaiting()` 并在激活时触发客户端无缝 `window.location.reload()`，彻底解决手机端（iOS Safari / PWA Standalone）因强缓存滞留旧版页面的顽疾；<br>2. **GitHub Pages 根路径导航拦截强化**：优化 `sw.js` 中的 Navigation 判定，全面覆盖 GitHub Pages 子路径 `/trip-note` 与 `/trip-note/`，强制执行 Network-First 策略，联网状态下 100% 直连 GitHub 服务器拉取最新 DOM；<br>3. **手动清存应急触发入口**：在页面顶部版本徽章（`#brand-badge-version`）绑定触控手势，点击可一键清空本地 `CacheStorage` 并强制刷新，为极端弱网或强缓设备提供直接救急方案；<br>4. **全端版本与 Service Worker 缓存穿透**：全量静态资源与 Service Worker 缓存池版本升级至 `v37.3`。 |
| **V37.4** | 2026/09/17 | **汇率换算多货币快捷预设目标切换 & 行内输入激活联动 (Multi-Currency Quick Presets & Active Target Sync)**：<br>1. **多货币快捷预设全面支持**：彻底解决原快捷预设硬编码仅能输入新西兰元（NZD）的局限；新增 `activeCurrency` 状态管理与动态预设渲染（`renderCurrencyPresetChips`），当切换到澳大利亚元（AUD）或人民币（CNY）时，快捷预设按钮即刻匹配对应币种与本土化常用面额（NZD/AUD: `$10` ~ `$500`，CNY: `¥10` ~ `¥1000`）；点击任一快捷筹码即刻写入当前选中币种并联动换算其余两种货币；<br>2. **快捷目标胶囊选项卡 (Target Tabs Selector)**：在预设区域顶部集成 `[ 🇳🇿 NZD ] [ 🇦🇺 AUD ] [ 🇨🇳 CNY ]` 极简分段药丸切换器，当前激活币种一目了然、一触即换；<br>3. **输入行激活与聚焦双向联动**：点击任意货币行或聚焦输入框时，自动将该货币设为活跃目标（`selectActiveCurrency`），对应输入行激活青蓝微光边框与 `当前输入` 徽章，同时上方预设栏自动跟随切换，操作极其自然丝滑；<br>4. **预设匹配高亮与移动端紧凑排版**：输入框数值若与快捷预设匹配自动高亮对应筹码（`.is-selected`）；增加针对手机端（<480px）内边距、字体与输入框宽度的适配规范，确保小屏无裁切不溢出；<br>5. **全端版本与 Service Worker 缓存穿透**：全量静态资源与 Service Worker 缓存池版本升级至 `v37.4`。 |
| **V38.0** | 2026/09/18 | **Apple 极简毛玻璃 (Liquid Glass) 质感、公共交通 2.0、自驾路书 2.0 专属卡片与渐进式折叠抽屉系统上线 (Apple Frosted Glass Transit & Drive 2.0 Overhaul)**：<br>1. **Apple HIG 极简毛玻璃质感升级**：引入 `.apple-glass-card`、`.apple-glass-pill`、`.apple-glass-sub-panel` 现代材质系统，配置 `backdrop-filter: blur(24px) saturate(190%)`、视网膜级 1px 内高光反光边缘 (`inset 0 1px 0 rgba(255,255,255,0.16)`) 与高质感深色浮层，消除视觉粗糙感与文字拥挤感；<br>2. **公共交通 2.0 专属卡片 (Transit 2.0)**：将密集的文字描述重构为图元化站点轨线与微胶囊系统：<br> - **头部栏**：路线官方主题色徽章 + 支付方式微胶囊（`[ 💳 Apple Pay / 芯片卡 ]` / `[ 🆓 免费无须刷卡 ]` / `[ ⚠️ 严格一人一卡 ]`）与开销胶囊；<br> - **站点连续轨道图 (Subway Track Stepper)**：起点站名 + 站台号 Chip + `[ 🟢 进站挥卡 ]` ➔ 发光轨道与站数耗时徽章 (`⏱️ 6站 · 18分钟`) ➔ 终点站名 + `[ 🔴 出站挥卡 ]`；<br> - **图元化出站与接驳链条 (Exit & Connection Chain)**：将文本长句精炼为直观图元链：`[ 🚪 Bathurst / Market St 出口 ] ➔ [ 🚶 步行 350m · 4分钟 ] ➔ [ 🎯 抵店 ]`；<br>3. **自驾路书 2.0 专属卡片 (Drive 2.0)**：<br> - **公路盾牌与指标栏**：提取官方公路盾牌徽章（`[ 🛡️ SH75 ]` / `[ 🛡️ SH80 ]` / `[ 🛡️ SH1 ]`），并列展示里程与耗时微胶囊（`🚗 82 km · ⏱️ 1h 25m`）；<br> - **沿途经停补给里程碑轨线 (Milestone Stepper)**：将沿途经停节点（肉派店/观景台/山口/加油站）以符号链清晰串联；<br> - **路况警示与设施微胶囊**：提取 `[ ⚠️ 多急弯·减速慢行 ]`、`[ 🛑 设有慢车让行道 (Slow Bay) ]`、`[ ⛽ 沿途加油补给提醒 ]`、`[ 🅿️ 免费车位 ]` 与 `[ 🚾 洗手间设施 ]`；<br>4. **渐进式折叠抽屉 (Progressive Detail Drawer)**：卡片底部集成极简优雅的 `💡 展开详情与备忘 ▾` 按钮，采用 CSS Grid 0fr ➔ 1fr 硬件加速无抖动平滑过渡；将背景介绍、详细交规、打车 (Uber) 备选方案收纳至深色毛玻璃抽屉内，实现前台一目了然、后台细节无损；<br>5. **全量数据向前兼容与版本缓存穿透**：通过智能文本解析器自适应覆盖全行程 11 天所有交通与自驾节点；全端静态资源与 Service Worker 缓存池版本升级至 `v38.0`。 |
| **V39.0** | 2026/09/18 | **全行程卡片化 2.0 体系大成：美食餐饮、景点活动、住宿酒店、民航航班 100% 覆盖与 Apple 毛玻璃登机牌质感发布 (All-Type 2.0 Apple Frosted Glass Cards & Boarding Pass Aesthetic)**：<br>1. **美食餐饮 2.0 卡片 (`.food-card-v2`)**：以暖桃红/品酒红（`#f43f5e`）为主基调，引入风味徽章（`🍷 精致晚宴`、`☕ 澳式早午餐`、`🍣 湖景日料`、`🥧 手工烘焙`、`🍸 景观酒吧`、`🍔 水岸轻食`），智能解析预订状态胶囊（`📅 热门需提前预约` / `⚡ 免预约 · 随到随享` / `💡 弹性餐饮`）与预算开销；内嵌 `🍽️ 招牌必尝` 标签带（`[ 🦌 高山鹿肉 ]` `[ 🦆 脆皮煎鸭胸 ]` `[ 🐟 高山纯净三文鱼 ]` `[ 🥧 招牌鲑鱼派 ]` `[ 🍷 新西兰白葡萄酒 ]`）；支持 `🌐 官网预约` 直跳；正文背景描述与停车提示收纳于渐进抽屉；<br>2. **景点活动 2.0 卡片 (`.spot-card-v2`)**：冰川蓝/探索绿主色调，智能提取活动分类（`🥾 高山冰川徒步`、`🏛️ 城市人文漫步`、`🐨 野生动物探访`、`🌅 观景摄影地标`、`🌌 国际暗夜保护区观星`、`🛍️ 特色集市商圈`、`🛂 机场通关与手续`）；自动折算游玩建议停留时长 Chip 与 `🆓 免费游览` / `🎟️ 门票开销` 胶囊；提取 `[ 🧥 防风保暖衣物 ]`、`[ 🥾 防滑徒步鞋 ]`、`[ 🛂 电子护照自助通关 ]` 装备安全警示；子景点轻量化嵌入；<br>3. **住宿酒店 2.0 卡片 (`.hotel-card-v2`)**：尊贵紫罗兰（`#8b5cf6`）毛玻璃质感，提供入住/退房状态走廊（`🔑 建议入住` / `🛌 连住中无需退房` / `🚪 退房时间`）、房型规格标签（`🛏️ 高级特大床房` / `湖景公寓`）、配套设施胶囊（`🅿️ 免费车位`、`🍳 含早餐`、`🔐 密码箱自助`）；独家集成 `📞 拨打电话` 原生一键直拨；钥匙箱密码与泊车详情折叠入抽屉；<br>4. **民航航班 2.0 卡片 (`.flight-card-v2`)**：Apple Wallet 登机牌设计，顶部为蔚蓝航司代码徽章与准点状态，中部为醒目的机场大代码航线走廊（`CAN (广州白云)` ➔ `✈️ 9h 20m` ➔ `BNE (布里斯班)`）；下嵌航站楼、登机口、登机时间与起落时刻指标网格；行李规则与贵宾厅权益折叠收纳；<br>5. **全天候 115 节点 100% 覆盖与 PWA 缓存升级**：全行程 115 个节点全部升级至 2.0 毛玻璃卡片与抽屉交互系统；全端静态资源与 Service Worker 缓存池版本升级至 `v39.0`。 |
| **V39.1** | 2026/09/18 | **卡片底部幽灵空白根治、冗余操作按钮剥离与 Phase 3 场景化按钮矩阵规划 (Card Bottom Ghost Gap Elimination & Redundant Action Buttons Removal)**：<br>1. **根治卡片底部空白幽灵占位**：深度定位并修复 CSS Grid 折叠抽屉（`0fr ➔ 1fr`）因未声明 `overflow: hidden;` 导致内部内边距与外边距溢出产生的 ~37px 幽灵占位；新增 `.drawer-collapse-inner { min-height: 0; overflow: hidden; }` 进行物理隔离，折叠态实现 0.0px 绝对归零；<br>2. **全面剥离机械堆叠的通用操作按钮**：从公共交通 (`transit`)、自驾路书 (`drive`)、自然人文景点 (`spot`) 主卡片中彻底剔除无差别的 `🧭 导航 / 📍 定位 / 🦉 猫途鹰`；从民航航班 (`flight`) 中剔除通用导航按钮；酒店卡片仅保留专属 `📞 拨打电话`，餐厅卡片仅保留专属 `🌐 官网预约`；<br>3. **卡片内边距与信息密度深度紧凑化**：将 6 类 2.0 卡片的内边距收紧至 `0.85rem 1.05rem`，元素流间隙收紧至 `0.6rem`；折叠切换条紧凑化为 28px 极简微胶囊；新增 `.timeline-extension-col:empty { display: none !important; }` 根除移动端空栏占位；<br>4. **Phase 3 差异化行动按钮矩阵确立**：确立严谨的卡片功能矩阵（公共交通/自驾绝不使用猫途鹰与机械导航，餐饮/酒店聚焦实拍评价与一键直拨，景点聚焦机位攻略与 DoC 官方查验）；<br>5. **全端版本穿透**：全量静态资源与 Service Worker 缓存池版本升级至 `v39.1`。 |
| **V39.2** | 2026/09/18 | **公共交通子地点按钮剥离 & 自驾路书专属自驾导航按钮恢复 (Transit Sub-Spots Cleanup & Dedicated Driving Navigation Button)**：<br>1. **彻底移除公交卡片子地点中的导航/定位/猫途鹰**：排查发现 `transit-card-v2` 中仍挂载了 `${subSpotsContainerHtml}`，导致布里斯班 Airtrain、渡轮等公交站被作为普通子地点渲染出火车站/码头的 `🧭 导航 / 📍 定位 / 🦉 猫途鹰` 按钮；鉴于地铁/公交站点已由专属图元化的连续轨道图（`transit-v2-stepper`）与出站链完美展示，彻底从 `transit-card-v2` 中剥离子地点列表，杜绝重复与干扰；<br>2. **恢复自驾卡片专属一键自驾导航按钮**：自驾路书（`drive-card-v2`）是公路旅行中最依赖导航的场景，恢复并定制高质感专属导航按钮 `.drive-nav-btn`（`🧭 开启自驾导航`），采用琥珀金公路渐变微光，直连 Google Maps 原生驾车导航（`travelmode=driving`）；<br>3. **全端版本穿透**：全量静态资源与 Service Worker 缓存池版本升级至 `v39.2`。 |

---

## 📝 5. 工作流与 Agent 指南 (Agent Guidelines)

1. **修改代码前**：必须首先查看并读取本 `context.md` 文件。
2. **每次修改后**：必须在上面的 **`📜 4. 每次更新历史记录 (Version History Log)`** 表格中追加记录当次更新的版本号、日期与核心改动。
3. **严格遵守 `subSpots` 数据规则**：未来录入新行程节点时，**严禁**将公共卫生间、停车场、特色菜品/菜单、电影背景文化描述、同建筑设施单独作为 `subSpots` 渲染导航按钮；单实体节点一律不带 `subSpots`，由主卡片渲染独立操作栏。
4. **组件解耦**：所有数据均存储于 `js/data.js` 中，通过 `tripStore` 进行集中式状态管理。
5. **打开/预览/部署方式**：采用原生 HTML + JS + CSS 结构，可以直接在标准浏览器中以静态页面模式打开 (`index.html`) 或通过 local server (`http://localhost:8088`) 预览；线上仓库为 `https://github.com/zhangburuo/trip-note`，通过 GitHub Pages 发布在 `https://zhangburuo.github.io/trip-note/`。
