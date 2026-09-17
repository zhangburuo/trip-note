/* ==========================================================================
   Trip Note - Data Model & Dynamic Schema (V6)
   ========================================================================== */

const STORAGE_KEY_ITINERARY = 'TRIP_NOTE_ITINERARY_V33';

const DESTINATIONS_CONFIG = {
  nz: {
    code: 'nz',
    name: '新西兰',
    flag: '🇳🇿',
    gradientFrom: '#00f2fe',
    gradientTo: '#4facfe',
    shadowGlow: 'rgba(0, 242, 254, 0.25)',
    accentBg: 'rgba(0, 242, 254, 0.12)'
  },
  au: {
    code: 'au',
    name: '澳大利亚',
    flag: '🇦🇺',
    gradientFrom: '#ff9a44',
    gradientTo: '#fc6076',
    shadowGlow: 'rgba(255, 154, 68, 0.25)',
    accentBg: 'rgba(255, 154, 68, 0.12)'
  },
  cn: {
    code: 'cn',
    name: '中国',
    flag: '🇨🇳',
    gradientFrom: '#ff4b2b',
    gradientTo: '#ff416c',
    shadowGlow: 'rgba(255, 75, 43, 0.25)',
    accentBg: 'rgba(255, 75, 43, 0.12)'
  }
};

// Full 11-Day Itinerary Data (V6 Schema with subSpot Queries, Flight Status, Hotel Check-in/out)
const initial11DayItinerary = [
  {
    id: 'day-1',
    dayNum: 1,
    date: '2026/09/27 (周日)',
    title: '启程飞往布里斯班',
    destinationCode: 'au',
    city: '广州 ➔ 机上过夜',
    lat: 23.3924,
    lng: 113.2988,
    weatherLocations: [
      {
        city: '广州',
        lat: 23.3924,
        lng: 113.2988,
        agencyName: '中国天气网 (CMA)',
        agencyUrl: 'http://www.weather.com.cn/weather/101280101.shtml',
        historicalRange: '21°C ~ 29°C'
      }
    ],
    items: [
      {
        id: 'item-1-1',
        time: '18:00',
        type: 'spot',
        name: '广州白云国际机场 T2',
        desc: '办理国际值机、行李托运与出境手续。准备登机体验夜航。',
        mapQuery: 'Guangzhou Baiyun International Airport Terminal 2',
        lat: 23.3924,
        lng: 113.2988
      },
      {
        id: 'item-1-2',
        time: '21:05',
        type: 'flight',
        name: '南方航空 CZ381 启程',
        flightCode: '南方航空 CZ381',
        flightRoute: '广州白云 T2 ➔ 布里斯班 T1',
        terminal: '广州 T2 ➔ 布里斯班 T1',
        gate: 'B224 (预估)',
        boardingTime: '20:25',
        flightStatus: '🟢 计划/准点',
        estDeparture: '21:05 (09/27)',
        estArrival: '08:25(+1) (09/28)',
        desc: '夜航直飞，机上过夜休息 (飞行约 9小时20分)',
        mapQuery: 'Guangzhou Airport Terminal 2'
      }
    ]
  },
  {
    id: 'day-2',
    dayNum: 2,
    date: '2026/09/28 (周一)',
    title: '布里斯班过境慢游 ➔ 深夜抵达基督城',
    destinationCode: 'au',
    city: '布里斯班 (Brisbane)',
    lat: -27.4705,
    lng: 153.0260,
    weatherLocations: [
      {
        city: '布里斯班',
        lat: -27.4705,
        lng: 153.0260,
        agencyName: 'Australia BOM',
        agencyUrl: 'http://www.bom.gov.au/qld/forecasts/brisbane.shtml',
        historicalRange: '15°C ~ 25°C'
      },
      {
        city: '基督城',
        lat: -43.5321,
        lng: 172.6362,
        agencyName: 'MetService NZ',
        agencyUrl: 'https://www.metservice.com/towns-cities/locations/christchurch',
        historicalRange: '6°C ~ 16°C'
      }
    ],
    items: [
      {
        id: 'item-2-1',
        time: '08:25',
        type: 'flight',
        name: '落地布里斯班国际航站楼 (T1)',
        flightCode: '南方航空 CZ381 (到达)',
        flightRoute: '顺利降落布里斯班 T1',
        terminal: '布里斯班国际 T1',
        flightStatus: '🟢 已降落/准点',
        estArrival: '08:25',
        desc: '办理入境手续，准备开启过境慢游。',
        mapQuery: 'Brisbane International Airport Terminal 1',
        lat: -27.3842,
        lng: 153.1175
      },
      {
        id: 'item-2-2',
        time: '08:25 - 09:40',
        type: 'spot',
        name: '办理入境与寄存随身行李',
        cost: '~$35 AUD',
        desc: '于 T1 到达层 Smarte Carte 柜台寄存随身行李。',
        mapQuery: 'Smarte Carte Brisbane Airport',
        lat: -27.3842,
        lng: 153.1175
      },
      {
        id: 'item-2-3',
        time: '09:50 - 10:15',
        type: 'transit',
        name: '搭乘 Airtrain (International Station ➔ South Bank 站)',
        cost: '$43.80 AUD/双人',
        tips: '⚠️ 交通支付：无须提前购票，直接使用含芯片信用卡或手机 (Apple Pay) 挥卡过闸机。严格执行一人一卡/一设备，进出站各刷一次。',
        subSpots: [
          { name: 'Airtrain 国际航站楼站', mapQuery: 'Airtrain International Airport Station Brisbane' },
          { name: 'South Bank 火车站', mapQuery: 'South Bank Railway Station Brisbane' }
        ],
        desc: '车程20分钟，直达南岸公园。',
        mapQuery: 'Airtrain International Airport Station Brisbane',
        lat: -27.3842,
        lng: 153.1175
      },
      {
        id: 'item-2-4',
        time: '10:15 - 12:45',
        type: 'food',
        name: '南岸公园漫步 & 澳式 Brunch',
        cost: '~$70 AUD (Denim Co.)',
        subSpots: [
          { name: 'Clem Jones 滨河步道', mapQuery: 'Clem Jones Promenade Brisbane' },
          { name: '布里斯班摩天轮', mapQuery: 'The Wheel of Brisbane' },
          { name: 'Streets Beach 人造海滩', mapQuery: 'Streets Beach Brisbane' },
          { name: 'Denim Co. 咖啡店 (Brunch)', mapQuery: 'Denim Co Brisbane' }
        ],
        desc: '漫步滨河步道，在 Denim Co. 享用精致澳式咖啡与 Brunch。',
        mapQuery: 'South Bank Parklands Brisbane',
        lat: -27.4810,
        lng: 153.0234
      },
      {
        id: 'item-2-5',
        time: '12:45 - 13:20',
        type: 'transit',
        name: 'CityHopper 免费轮渡观光 (South Bank ➔ Riverside)',
        cost: '$0 AUD (免费观光渡轮)',
        tips: '💡 交通支付：市政府免费观光渡轮 (认准红白船身)，无需购票，上下船均无需刷卡，直接登船。',
        subSpots: [
          { name: 'South Bank Terminal 3 (13:00 发船)', mapQuery: 'South Bank Ferry Terminal 3 Brisbane' },
          { name: '远眺故事桥', mapQuery: 'Story Bridge Brisbane' },
          { name: 'Riverside Ferry Terminal (13:18 抵达)', mapQuery: 'Riverside Ferry Terminal Brisbane' }
        ],
        desc: '体验红白船身免费渡轮，横渡布里斯班河。',
        mapQuery: 'South Bank Ferry Terminal 3 Brisbane',
        lat: -27.4800,
        lng: 153.0230
      },
      {
        id: 'item-2-6',
        time: '13:20 - 14:30',
        type: 'food',
        name: '河畔下午茶 & 观景 (Riverbar & Kitchen)',
        cost: '~$40 AUD',
        subSpots: [
          { name: 'Customs House (海关大楼)', mapQuery: 'Customs House Brisbane' },
          { name: 'Riverbar & Kitchen 下午茶', mapQuery: 'Riverbar & Kitchen Brisbane' }
        ],
        desc: '打卡古老海关大楼，在 Riverbar 享受河畔凉爽微风。',
        mapQuery: 'Riverbar & Kitchen Brisbane',
        lat: -27.4682,
        lng: 153.0305
      },
      {
        id: 'item-2-7',
        time: '14:30 - 15:10',
        type: 'spot',
        name: '市区历史街区漫步',
        subSpots: [
          { name: 'Riverside', mapQuery: 'Riverside Centre Brisbane' },
          { name: 'Queen Street Mall (女王街)', mapQuery: 'Queen Street Mall Brisbane' },
          { name: 'Anzac Square (澳纽军团广场)', mapQuery: 'Anzac Square Brisbane' },
          { name: 'Central Station (中央车站)', mapQuery: 'Central Railway Station Brisbane' }
        ],
        desc: '穿梭于现代商业街区与历史纪念广场之间。',
        mapQuery: 'Queen Street Mall Brisbane',
        lat: -27.4698,
        lng: 153.0251
      },
      {
        id: 'item-2-8',
        time: '15:15 - 15:37',
        type: 'transit',
        name: '搭乘 Airtrain 返回机场 (Central Station ➔ International Station)',
        cost: '$43.80 AUD/双人',
        tips: '⚠️ 交通支付：同样使用上一次进站对应的信用卡/手机，进出站各挥卡一次。',
        subSpots: [
          { name: 'Central Station 进站', mapQuery: 'Central Railway Station Brisbane' },
          { name: 'International Station 出站', mapQuery: 'Airtrain International Airport Station Brisbane' }
        ],
        desc: '车程22分钟，快速返抵国际航站楼。',
        mapQuery: 'Brisbane Central Railway Station',
        lat: -27.4660,
        lng: 153.0264
      },
      {
        id: 'item-2-9',
        time: '15:45',
        type: 'spot',
        name: '提取寄存行李与值机',
        desc: '提取随身行李，办理新西兰航空 NZ204 值机与安检。',
        mapQuery: 'Brisbane International Airport Terminal 1',
        lat: -27.3842,
        lng: 153.1175
      },
      {
        id: 'item-2-10',
        time: '18:10',
        type: 'flight',
        name: '新西兰航空 NZ204 起飞',
        flightCode: '新西兰航空 NZ204',
        flightRoute: '布里斯班 T1 (18:10) ➔ 基督城 T1 (00:40+1)',
        terminal: '布里斯班 T1 ➔ 基督城 T1',
        gate: '78 (预估)',
        boardingTime: '17:30',
        flightStatus: '🟢 计划/准点',
        estDeparture: '18:10',
        estArrival: '00:40(+1)',
        desc: '飞行 3小时30分，跨越塔斯曼海',
        mapQuery: 'Brisbane Airport Terminal 1',
        lat: -27.3842,
        lng: 153.1175
      },
      {
        id: 'item-2-11',
        time: '00:40',
        type: 'hotel',
        name: '克赖斯特彻奇机场诺富特酒店 (Novotel Christchurch Airport)',
        roomType: '行政特大床房',
        phone: '+64 3 357 7610',
        checkInTime: '建议入住: 14:00 后',
        checkOutTime: '退房时间: 11:00 前',
        desc: '出航站楼直接步行入住，无需深夜提车开夜路。',
        mapQuery: 'Novotel Christchurch Airport',
        lat: -43.4884,
        lng: 172.5369
      }
    ]
  },
  {
    id: 'day-3',
    dayNum: 3,
    date: '2026/09/29 (周二)',
    title: '机场提车 ➔ 阿卡罗阿法式风情小镇 & 羊驼农场',
    destinationCode: 'nz',
    city: '阿卡罗阿 (Akaroa)',
    lat: -43.8037,
    lng: 172.9682,
    weatherLocations: [
      {
        city: '阿卡罗阿',
        lat: -43.8037,
        lng: 172.9682,
        agencyName: 'MetService NZ',
        agencyUrl: 'https://www.metservice.com/towns-cities/locations/christchurch',
        historicalRange: '7°C ~ 16°C'
      }
    ],
    items: [
      {
        id: 'item-3-1',
        time: '08:30 - 10:00',
        type: 'hotel',
        name: '克赖斯特彻奇机场诺富特酒店 (Novotel Christchurch Airport)',
        roomType: '行政特大床房',
        checkOutTime: '退房时间: 11:00 前',
        desc: '酒店享用早餐，办理退房手续。',
        mapQuery: 'Novotel Christchurch Airport',
        lat: -43.4884,
        lng: 172.5369
      },
      {
        id: 'item-3-2',
        time: '10:00 - 10:30',
        type: 'transit',
        name: '搭乘 Snap 免费 Shuttle 前往租车门店',
        cost: '$0 NZD (免费 Shuttle)',
        desc: '步行至航站楼外指定接驳点，搭乘 Snap 免费 Shuttle 前往租车门店。',
        mapQuery: 'Snap Rentals Christchurch Airport'
      },
      {
        id: 'item-3-3',
        time: '10:30 - 11:15',
        type: 'spot',
        name: '办理 Snap 提车与验车手续',
        tips: '⚠️ 自驾提醒：新西兰为右舵左行，提车时仔细检查车身外观与胎压，熟悉车载导航与跟车视线。',
        desc: '办理 Snap 提车手续、验车，熟悉右舵驾驶与导航设置。',
        mapQuery: 'Snap Rentals Christchurch Airport'
      },
      {
        id: 'item-3-4',
        time: '11:15 - 12:05',
        type: 'drive',
        name: '自驾段 1：沿 SH75 公路前往 Little River',
        distance: '45 km',
        duration: '车程约 50 分',
        pitstops: ['平原好开路段', '沿途平原风光'],
        desc: '沿 SH75 国道开往 Little River，视野开阔平坦。',
        mapQuery: 'Little River Canterbury New Zealand'
      },
      {
        id: 'item-3-5',
        time: '12:05 - 12:20',
        type: 'food',
        name: 'Little River Café 快捷修整 & 外带',
        cost: '~$18 NZD',
        parking: '咖啡馆门口自带免费大型停车场 (Free)',
        desc: '使用卫生间，在 Little River Café 快速外带咖啡与现做肉派在车上享用。',
        mapQuery: 'Little River Cafe & Store'
      },
      {
        id: 'item-3-6',
        time: '12:20 - 12:55',
        type: 'drive',
        name: '自驾段 2：SH75 盘山公路 (途经 Hilltop Lookout 观景台)',
        distance: '38 km',
        duration: '车程约 35 分',
        pitstops: ['Hilltop Lookout 观景台'],
        parking: 'Hilltop Lookout 停车湾停靠 5-10分钟俯瞰海湾全景 (Free)',
        tips: '🛑 盘山公路弯道较多请减速慢行，如遇后方快车可驶入 Slow Vehicle Bay 让行。',
        desc: '沿 SH75 盘山公路前行，途经 Hilltop 俯瞰阿卡罗阿海湾全景。',
        mapQuery: 'Hilltop Lookout Akaroa'
      },
      {
        id: 'item-3-7',
        time: '13:00 - 13:30',
        type: 'hotel',
        name: '阿卡罗阿海滨汽车旅馆 (Akaroa Waterfront Motels)',
        roomType: '标准套房 (1卧室, 含厨房)',
        phone: '+64 3 304 7484',
        checkInTime: '建议入住: 14:00 - 19:00',
        checkOutTime: '退房时间: 10:00 前',
        parking: '停入汽车旅馆专属免费住客车位 (Free)，停好后镇内全程无车步行',
        desc: '提前办理 Check-in 或寄存行李，海景第一排。',
        mapQuery: 'Akaroa Waterfront Motels'
      },
      {
        id: 'item-3-8',
        time: '13:30 - 15:30',
        type: 'spot',
        name: '小镇特色店铺漫步 & 海边午餐',
        cost: '~$70 NZD (餐饮) + ~$20 NZD (Four Square 采购)',
        parking: '车辆停放于旅馆车位，镇内全程无车轻松步行',
        subSpots: [
          { name: 'Rue Lavaud 法式主街', mapQuery: 'Rue Lavaud Akaroa' },
          { name: 'The Trading Rooms 餐厅', mapQuery: 'The Trading Rooms Akaroa' },
          { name: 'Sweet As Bakery 烘焙店', mapQuery: 'Sweet As Bakery Akaroa' },
          { name: 'Four Square 超市补给', mapQuery: 'Four Square Akaroa' }
        ],
        desc: '趁营业中漫步 Rue Lavaud 主街，打卡法式手工艺品店与画廊，在海边露天餐厅享用午餐，顺路采购今明补给。',
        mapQuery: 'Rue Lavaud Akaroa'
      },
      {
        id: 'item-3-9',
        time: '15:30 - 15:55',
        type: 'drive',
        name: '自驾段 3：驱车前往 Shamarra 羊驼农场',
        distance: '13 km',
        duration: '车程约 20 分',
        tips: '⚠️ 13km 盘山公路弯多坡陡，请控制车速谨慎慢行。',
        desc: '驱车前往 Shamarra 羊驼农场高地。',
        mapQuery: 'Shamarra Alpacas Akaroa'
      },
      {
        id: 'item-3-10',
        time: '16:00 - 17:30',
        type: 'spot',
        name: 'Shamarra Alpacas 羊驼农场体验',
        cost: '$132.47 NZD/双人 (已预约 16:00 场次)',
        parking: '农场内部自带专用免费停车场 (Free)',
        tips: '💡 设施包含卫生间与羊驼毛纪念品店。海湾高地背景近距离喂食羊驼超出片。',
        mapQuery: 'Shamarra Alpacas Akaroa'
      },
      {
        id: 'item-3-11',
        time: '17:30 - 17:55',
        type: 'drive',
        name: '驱车下山返回阿卡罗阿旅馆',
        distance: '13 km',
        duration: '车程约 20 分',
        parking: '将车辆原位停回旅馆专属免费车位',
        desc: '驱车下山返回阿卡罗阿，将车停回旅馆免费车位。',
        mapQuery: 'Akaroa Waterfront Motels'
      },
      {
        id: 'item-3-12',
        time: '18:00 - 20:00',
        type: 'food',
        name: '海湾日落漫步 & 法式/海鲜晚宴',
        cost: '~$80 NZD',
        parking: '纯步行漫步，车辆停于旅馆',
        subSpots: [
          { name: 'Waterfront 滨海长廊', mapQuery: 'Waterfront Akaroa' },
          { name: 'Akaroa Lighthouse 赤色灯塔', mapQuery: 'Akaroa Lighthouse' },
          { name: 'Ma Maison 海湾法景餐厅', mapQuery: 'Ma Maison Akaroa' },
          { name: 'Murphy\'s Seafood 尝鲜 Fish & Chips', mapQuery: 'Murphy\'s Seafood Akaroa' }
        ],
        desc: '沿 Waterfront 滨海长廊漫步至赤色灯塔欣赏日落，在 Ma Maison 享用晚宴或 Murphy\'s 尝鲜地道 Fish & Chips。',
        mapQuery: 'Akaroa Lighthouse'
      }
    ]
  },
  {
    id: 'day-4',
    dayNum: 4,
    date: '2026/09/30 (周三)',
    title: '阿卡罗阿 ➔ 蒂卡波湖 (Lake Tekapo 冰川湖景与自主观星)',
    destinationCode: 'nz',
    city: '蒂卡波湖 (Lake Tekapo)',
    lat: -44.0047,
    lng: 170.4771,
    weatherLocations: [
      {
        city: '阿卡罗阿',
        lat: -43.8037,
        lng: 172.9682,
        agencyName: 'MetService NZ',
        agencyUrl: 'https://www.metservice.com/towns-cities/locations/christchurch',
        historicalRange: '7°C ~ 16°C'
      },
      {
        city: '蒂卡波湖',
        lat: -44.0047,
        lng: 170.4771,
        agencyName: 'MetService NZ',
        agencyUrl: 'https://www.metservice.com/towns-cities/locations/christchurch',
        historicalRange: '2°C ~ 14°C'
      }
    ],
    items: [
      {
        id: 'item-4-1',
        time: '08:30 - 09:30',
        type: 'hotel',
        name: '阿卡罗阿海滨汽车旅馆 (Akaroa Waterfront Motels)',
        roomType: '标准套房 (1卧室, 含厨房)',
        checkOutTime: '退房时间: 10:00 前',
        desc: '旅馆享用自备早餐/外带咖啡，办理退房手续。',
        mapQuery: 'Akaroa Waterfront Motels',
        lat: -43.8037,
        lng: 172.9682
      },
      {
        id: 'item-4-2',
        time: '09:30 - 11:45',
        type: 'drive',
        name: '自驾段 1：阿卡罗阿 ➔ Fairlie 小镇',
        distance: '160 km',
        duration: '车程约 2小时15分',
        pitstops: ['途经 SH75 及 SH79 景观公路', '坎特伯雷平原风光'],
        desc: '沿 SH75 及 SH79 景观公路行驶，一路平坦好开。',
        mapQuery: 'Fairlie Canterbury New Zealand',
        lat: -44.0954,
        lng: 170.8312
      },
      {
        id: 'item-4-3',
        time: '11:45 - 12:45',
        type: 'food',
        name: 'Fairlie Bakehouse 招牌肉派店 & 小镇补给',
        cost: '~$35 NZD',
        parking: '主街两侧免费路边车位 (Free)；镇上设完备公共卫生间与 Challenge 加油站',
        desc: '在 Fairlie Bakehouse 享用招牌鲑鱼派/牛肉派与热咖啡，顺路补给与使用设施。',
        mapQuery: 'Fairlie Bakehouse New Zealand',
        lat: -44.0954,
        lng: 170.8312
      },
      {
        id: 'item-4-4',
        time: '12:45 - 13:30',
        type: 'drive',
        name: '自驾段 2：Fairlie ➔ Lake Tekapo',
        distance: '40 km',
        duration: '车程约 40 分',
        pitstops: ['翻越 Burkes Pass 山口', '进入麦肯齐高地'],
        tips: '🛑 翻越 Burkes Pass 山口时注意弯道与风向。',
        desc: '翻越 Burkes Pass 山口，驶入麦肯齐盆地高地景观。',
        mapQuery: 'Burkes Pass Canterbury New Zealand',
        lat: -44.0883,
        lng: 170.6125
      },
      {
        id: 'item-4-5',
        time: '13:30 - 15:00',
        type: 'spot',
        name: '驱车登顶 Mt John & 山顶湖景下午茶 (Astra Café)',
        cost: '~$25 NZD (餐饮) + $8 NZD (道路维护费)',
        parking: '山顶自带免费停车场 (Free)；山顶入口闸机刷卡缴纳 $8 NZD 道路维护费',
        tips: '⚠️ 登顶山路稍窄，顶峰风力较大，请注意保暖与车门打开安全。',
        subSpots: [
          { name: 'Astra Café 山顶咖啡馆', mapQuery: 'Astro Cafe Mt John Lake Tekapo' },
          { name: '360度牛奶蓝湖景观景台', mapQuery: 'Mt John Observatory Lake Tekapo' }
        ],
        desc: '沿 Mt John Access Rd 驱车登顶，在 Astra Café 享用咖啡与甜品，360度俯瞰蒂卡波湖牛奶蓝湖水与雪山全景。',
        mapQuery: 'Astro Cafe Mt John Lake Tekapo',
        lat: -43.9859,
        lng: 170.4646
      },
      {
        id: 'item-4-6',
        time: '15:00 - 15:45',
        type: 'hotel',
        name: '湖景一室公寓B (Lakeview Studio B - Lake Tekapo)',
        roomType: '湖景公寓',
        phone: '+64 3 680 6558',
        checkInTime: '建议入住: 15:00 后',
        checkOutTime: '退房时间: 10:00 前',
        parking: '直接停入公寓自带的免费住客专属车位 (Free)',
        tips: '🔑 入住提醒：查收当天发送的钥匙箱密码，进行自助 Check-in 入住。',
        desc: '自助 Check-in 入住公寓，窗外直面蒂卡波湖景观。',
        mapQuery: 'Lakeview Studio B Lake Tekapo',
        lat: -44.0022,
        lng: 170.4820
      },
      {
        id: 'item-4-7',
        time: '15:45 - 17:30',
        type: 'spot',
        name: '好牧羊人教堂 & 湖畔漫步 & 四方超市采购',
        cost: '~$30 NZD (Four Square 采购)',
        parking: '步行约 10-15分钟；若开车可停教堂旁专用大型免费公共停车场 (Free)',
        subSpots: [
          { name: '好牧羊人教堂 (Church of the Good Shepherd)', mapQuery: 'Church of the Good Shepherd Lake Tekapo' },
          { name: '牧羊犬雕像 (Dog Statue)', mapQuery: 'Dog Statue Lake Tekapo' },
          { name: '湖畔步道 (Tekapo Lakefront)', mapQuery: 'Lake Tekapo Walkway' },
          { name: 'Four Square Tekapo 超市', mapQuery: 'Four Square Tekapo' }
        ],
        desc: '漫步前往好牧羊人教堂与牧羊犬雕像拍照，沿湖畔步道慢游，前往四方超市采购零食、饮品或次日早餐。',
        mapQuery: 'Church of the Good Shepherd Lake Tekapo',
        lat: -44.0036,
        lng: 170.4815
      },
      {
        id: 'item-4-8',
        time: '17:30 - 19:30',
        type: 'food',
        name: '镇上湖景晚宴 (Kohan 日料 / The Dark Sky Diner)',
        cost: '~$90 NZD',
        parking: '镇中心免费公共停车场 (Free) 或由公寓步行前往',
        tips: '💡 美食建议：Kohan Japanese Restaurant 湖景日料建议提前预约，必点高山三文鱼饭。',
        subSpots: [
          { name: 'Kohan Japanese Restaurant (湖景日料)', mapQuery: 'Kohan Japanese Restaurant Lake Tekapo' },
          { name: 'The Dark Sky Diner (夜空餐厅)', mapQuery: 'The Dark Sky Diner Lake Tekapo' }
        ],
        desc: '在 Kohan 享用湖景三文鱼日料或在 The Dark Sky Diner 享受美式观景晚餐。',
        mapQuery: 'Kohan Japanese Restaurant Lake Tekapo',
        lat: -44.0040,
        lng: 170.4800
      },
      {
        id: 'item-4-9',
        time: '19:30+',
        type: 'spot',
        name: '公寓周边自主观星 & 璀璨银河拍摄',
        cost: '$0 NZD (自主观星)',
        tips: '🌌 观星提醒：无须参加观星团！夜幕降临后在公寓阳台、草坪或步行至湖边自主观星、拍摄银河，请穿戴防风羽绒服与帽子保暖。',
        pitstops: ['备选方案：若阴雨多云，可前往 Tekapo Springs 体验夜间雪山户外温泉 (预估花销: ~$70 NZD/双人)'],
        subSpots: [
          { name: '湖畔/阳台自主观星点', mapQuery: 'Lake Tekapo Dark Sky Reserve' },
          { name: 'Tekapo Springs 温泉 (阴雨备选)', mapQuery: 'Tekapo Springs' }
        ],
        desc: '于国际暗夜保护区核心地带自主观星，夜探璀璨银河；阴雨备选体验雪山温泉。',
        mapQuery: 'Lake Tekapo Dark Sky Reserve',
        lat: -44.0089,
        lng: 170.4901
      }
    ]
  },
  {
    id: 'day-5',
    dayNum: 5,
    date: '2026/10/01 (周四)',
    title: '库克山冰川自驾与徒步 ➔ 返回基督城 (Plan A/B 双方案机动选择)',
    destinationCode: 'nz',
    city: '库克山 (Mt Cook) ➔ 基督城',
    lat: -43.7342,
    lng: 170.1044,
    weatherLocations: [
      {
        city: '库克山',
        lat: -43.7347,
        lng: 170.0963,
        agencyName: 'MetService NZ (山地)',
        agencyUrl: 'https://www.metservice.com/mountains-and-parks/national-parks/aoraki-mount-cook',
        historicalRange: '3°C ~ 12°C'
      },
      {
        city: '基督城',
        lat: -43.5321,
        lng: 172.6362,
        agencyName: 'MetService NZ',
        agencyUrl: 'https://www.metservice.com/towns-cities/locations/christchurch',
        historicalRange: '6°C ~ 16°C'
      }
    ],
    items: [
      // Early Morning Weather & DoC Status Notice
      {
        id: 'item-5-0',
        time: '07:30 - 08:00',
        type: 'spot',
        name: '⚠️ 出发前查验：DoC 官网与 MetService 天气判定',
        tips: '💡 出发判定：库克山高山天气多变！请在 07:30 - 08:00 查验 DoC 官网 Hooker Valley Track 实时开放状态与 MetService 库克山预报。若晴朗无狂风选 Plan A，若雨雪恶劣启动 Plan B！',
        subSpots: [
          { name: '🇳🇿 DoC 官方 Hooker Valley Track 开放状态查询', mapQuery: 'DoC Hooker Valley Track Status', url: 'https://www.doc.govt.nz/parks-and-recreation/places-to-go/canterbury/places/aoraki-mount-cook-national-park/things-to-do/tracks/hooker-valley-track/' },
          { name: '🌤️ MetService 库克山高山实时天气预报', mapQuery: 'MetService Mount Cook Weather', url: 'https://www.metservice.com/mountains-and-parks/national-parks/aoraki-mount-cook' }
        ],
        desc: '出发前通过 DoC 官网或 MetService 确认库克山天气与 Hooker Valley Track 开放状态。',
        mapQuery: 'Aoraki Mount Cook National Park'
      },

      // --- PLAN A: ☀️ 晴朗天气版 (冰川自驾 & Hooker Valley 徒步 & 基督城) ---
      {
        id: 'item-5-a1',
        plan: 'A',
        time: '07:30 - 08:30',
        type: 'hotel',
        name: '湖景一室公寓 Check-out 退房',
        checkOutTime: '退房时间: 10:00 前',
        desc: '公寓享用自备早餐，办理自助退房。',
        mapQuery: 'Lakeview Studio B Lake Tekapo'
      },
      {
        id: 'item-5-a2',
        plan: 'A',
        time: '08:30 - 09:00',
        type: 'drive',
        name: '自驾段 1：Lake Tekapo ➔ Lake Pukaki Viewpoint',
        distance: '40 km',
        duration: '车程约 30 分',
        pitstops: ['沿 SH8 号公路', '麦肯齐高地风光'],
        desc: '沿 SH8 号公路行驶，前往 Lake Pukaki 观景台。',
        mapQuery: 'Lake Pukaki Information Centre'
      },
      {
        id: 'item-5-a3',
        plan: 'A',
        time: '09:00 - 09:40',
        type: 'spot',
        name: 'Lake Pukaki 观景台 & Mt Cook Alpine Salmon',
        cost: '~$35 NZD',
        parking: '观景台专用大型免费停车场 (Free)；设生态公共卫生间',
        subSpots: [
          { name: 'Lake Pukaki 观景台 (牛奶蓝湖水)', mapQuery: 'Lake Pukaki Viewpoint' },
          { name: 'Mt Cook Alpine Salmon 三文鱼店', mapQuery: 'Mt Cook Alpine Salmon Information Centre' }
        ],
        desc: '打卡牛奶蓝湖水与 Mount Cook 雪山远景，现场品尝高山三文鱼刺身。',
        mapQuery: 'Lake Pukaki Information Centre'
      },
      {
        id: 'item-5-a4',
        plan: 'A',
        time: '09:40 - 10:25',
        type: 'drive',
        name: '自驾段 2：SH80 景观公路驶向库克山',
        distance: '55 km',
        duration: '车程约 45 分',
        pitstops: ['SH80 沿湖最美公路', 'Mueller Lake 远眺'],
        tips: '⛽ 加油提醒：库克山村仅 Hermitage Hotel 旁有简易高价加油机，建议回程在 Twizel 或 Geraldine 加满。',
        desc: '沿 SH80 景观公路驶向库克山国家公园，沿湖风景极佳。',
        mapQuery: 'Mount Cook Road Highway 80'
      },
      {
        id: 'item-5-a5',
        plan: 'A',
        time: '10:30 - 13:00',
        type: 'spot',
        name: 'Hooker Valley Track 徒步前半段',
        parking: 'White Horse Hill 停车场 (Free)；起点处设完备公共卫生间与饮用水补充点',
        tips: '⚠️ 装备建议：穿防风防水外套、徒步鞋；即使晴天山谷内风力也较大，过第一座吊桥至 Mueller Lake 观景台折返。',
        subSpots: [
          { name: 'White Horse Hill 停车场', mapQuery: 'White Horse Hill Campground Mount Cook' },
          { name: '第一座悬索吊桥', mapQuery: 'Hooker Valley Track First Swing Bridge' },
          { name: 'Mueller Lake 冰川湖观景台 (折返点)', mapQuery: 'Mueller Lake Lookout Mount Cook' }
        ],
        desc: '由 White Horse Hill 停车场出发，过第一座吊桥至 Mueller Lake 观景台远眺冰川湖后折返 (往返约2小时)。',
        mapQuery: 'Hooker Valley Track Mount Cook'
      },
      {
        id: 'item-5-a6',
        plan: 'A',
        time: '13:15 - 14:45',
        type: 'drive',
        name: '自驾段 3：库克山 ➔ Fairlie 镇',
        distance: '140 km',
        duration: '车程约 1.5 小时',
        pitstops: ['沿 SH80 接 SH8 国道'],
        desc: '驱车驶离库克山，沿 SH80 接 SH8 前往 Fairlie 镇。',
        mapQuery: 'Fairlie Canterbury New Zealand'
      },
      {
        id: 'item-5-a7',
        plan: 'A',
        time: '14:45 - 15:15',
        type: 'food',
        name: 'Fairlie 镇机动休整 & 弹性餐饮 (Fairlie Bakehouse)',
        cost: '~$0 - $25 NZD',
        parking: '主街免费路边车位 (Free)；镇中心设完备公共卫生间与 Challenge 加油站',
        tips: '🍽️ 机动选择：若徒步后较饥饿可二刷 Fairlie Bakehouse 补给；若不饿仅在此快捷使用卫生间/加油后前往 Geraldine。',
        desc: '根据饥饿程度弹性选择 Fairlie Bakehouse 补给或快捷修整。',
        mapQuery: 'Fairlie Bakehouse'
      },
      {
        id: 'item-5-a8',
        plan: 'A',
        time: '15:15 - 16:15',
        type: 'spot',
        name: '自驾段 4 & Geraldine 小镇下午茶',
        cost: '~$25 NZD',
        parking: '体验馆旁专用免费停车场 (Free)；设完备公共卫生间',
        subSpots: [
          { name: 'Geraldine 树荫艺术小镇', mapQuery: 'Geraldine Canterbury New Zealand' },
          { name: 'Barker\'s Eatery 咖啡馆', mapQuery: 'Barkers Eatery Geraldine' },
          { name: 'Barker\'s 果酱体验馆', mapQuery: 'Barkers of Geraldine Store' }
        ],
        desc: 'Fairlie ➔ Geraldine (30km，30分)。漫步精美树荫小镇，前往 Barker\'s Eatery 享用下午茶，免费试吃新西兰国宝级手工果酱。',
        mapQuery: 'Barkers Eatery Geraldine'
      },
      {
        id: 'item-5-a9',
        plan: 'A',
        time: '16:15 - 18:00',
        type: 'drive',
        name: '自驾段 5：沿 SH1 公路返回基督城',
        distance: '135 km',
        duration: '车程约 1小时45分',
        parking: '中途休息：途经 Ashburton 镇 (SH1 沿线 Mobil/BP 大型加油站、卫生间与快餐)',
        desc: '沿 SH1 公路稳健返回基督城，途经 Ashburton 快捷休整。',
        mapQuery: 'Fable Christchurch'
      },
      {
        id: 'item-5-a10',
        plan: 'A',
        time: '18:00 - 18:30',
        type: 'hotel',
        name: '基督城寓言酒店 Check-in (Fable Christchurch)',
        roomType: '高级特大床房 (连住第1晚)',
        phone: '+64 3 377 7000',
        checkInTime: '建议入住: 15:00 后',
        checkOutTime: '退房时间: 11:00 前',
        parking: '酒店代客泊车 (Valet Parking ~$45 NZD/晚) 或周边 Lichfield St Carpark (~$20 NZD/天)',
        desc: '办理入住精品酒店，安顿行李。',
        mapQuery: 'Fable Christchurch'
      },
      {
        id: 'item-5-a11',
        plan: 'A',
        time: '18:30 - 20:30',
        type: 'food',
        name: '基督城市区晚宴 (Regent St / Riverside Market)',
        cost: '~$80 NZD',
        subSpots: [
          { name: 'New Regent Street 新复古街区', mapQuery: 'New Regent Street Christchurch' },
          { name: 'Riverside Market 滨河集市', mapQuery: 'Riverside Market Christchurch' }
        ],
        desc: '步行至 Regent Street 或 Riverside Market 享用晚餐。',
        mapQuery: 'Riverside Market Christchurch'
      },

      // --- PLAN B: 🌧️ 恶劣天气替代方案 (室内三文鱼农场/复古古董镇/室内集市) ---
      {
        id: 'item-5-b1',
        plan: 'B',
        time: '08:30 - 09:30',
        type: 'hotel',
        name: '湖景一室公寓 Check-out 退房',
        checkOutTime: '退房时间: 10:00 前',
        desc: '公寓享用自备早餐，办理退房，启动 Plan B 恶劣天气避雨行程。',
        mapQuery: 'Lakeview Studio B Lake Tekapo'
      },
      {
        id: 'item-5-b2',
        plan: 'B',
        time: '09:30 - 10:30',
        type: 'drive',
        name: '自驾段 1：Lake Tekapo ➔ Twizel 镇',
        distance: '60 km',
        duration: '车程约 45 分',
        desc: '沿 SH8 号公路行驶前往 Twizel 镇。',
        mapQuery: 'High Country Salmon Twizel'
      },
      {
        id: 'item-5-b3',
        plan: 'B',
        time: '10:30 - 11:30',
        type: 'spot',
        name: 'High Country Salmon 三文鱼农场 (免预约)',
        cost: '~$40 NZD',
        parking: '农场自带大型免费停车场 (Free)；设完备卫生间',
        desc: '在暖和室内餐厅享用新鲜切片三文鱼与热鲜鱼汤，半室内区喂食高山三文鱼。',
        mapQuery: 'High Country Salmon Twizel'
      },
      {
        id: 'item-5-b4',
        plan: 'B',
        time: '11:30 - 12:30',
        type: 'drive',
        name: '自驾段 2：Twizel ➔ Burkes Pass 复古小镇',
        distance: '65 km',
        duration: '车程约 45 分',
        desc: '驱车往 Burkes Pass 复古小镇。',
        mapQuery: 'Burkes Pass Heritage Village'
      },
      {
        id: 'item-5-b5',
        plan: 'B',
        time: '12:30 - 13:30',
        type: 'spot',
        name: 'Burkes Pass 复古小镇 & Store of Yesterday 古董店',
        parking: '路边免费停车湾 (Free)',
        desc: '避风打卡 Store of Yesterday 室内古董店，参观 19 世纪古老乡村建筑与复古老爷车。',
        mapQuery: 'Store of Yesterday Burkes Pass'
      },
      {
        id: 'item-5-b6',
        plan: 'B',
        time: '13:30 - 14:15',
        type: 'drive',
        name: '自驾段 3：Burkes Pass ➔ Geraldine 艺术小镇',
        distance: '65 km',
        duration: '车程约 40 分',
        desc: '沿 SH79 驱车前往 Geraldine 树荫小镇。',
        mapQuery: 'Barkers Eatery Geraldine'
      },
      {
        id: 'item-5-b7',
        plan: 'B',
        time: '14:15 - 15:45',
        type: 'spot',
        name: 'Geraldine 小镇人文与果酱工坊 (免预约)',
        cost: '~$35 NZD',
        parking: '小镇公共免费停车场 (Free)；设设施完善公共卫生间',
        subSpots: [
          { name: 'Barker\'s of Geraldine 果酱体验馆', mapQuery: 'Barkers of Geraldine Store' },
          { name: 'Barker\'s Eatery 咖啡馆', mapQuery: 'Barkers Eatery Geraldine' }
        ],
        desc: '参观著名的 Barker\'s of Geraldine 果酱体验馆 (免费试吃)，在 Barker\'s Eatery 室内咖啡馆享用午茶。',
        mapQuery: 'Barkers Eatery Geraldine'
      },
      {
        id: 'item-5-b8',
        plan: 'B',
        time: '15:45 - 17:45',
        type: 'drive',
        name: '自驾段 4：沿 SH1 公路驶回基督城',
        distance: '135 km',
        duration: '车程约 2 小时',
        desc: '沿 SH1 公路稳健驶回基督城。',
        mapQuery: 'Fable Christchurch'
      },
      {
        id: 'item-5-b9',
        plan: 'B',
        time: '18:00',
        type: 'hotel',
        name: '基督城寓言酒店 Check-in (Fable Christchurch)',
        roomType: '高级特大床房 (连住第1晚)',
        phone: '+64 3 377 7000',
        parking: '使用酒店代客泊车或周边 Lichfield St 停车楼',
        desc: '入住酒店，整理休息。',
        mapQuery: 'Fable Christchurch'
      },
      {
        id: 'item-5-b10',
        plan: 'B',
        time: '18:30 - 20:30',
        type: 'food',
        name: 'Riverside Market 室内美食集市晚宴 (免预约)',
        cost: '~$80 NZD',
        desc: '前往基督城 Riverside Market (室内综合美食集市，不受阴雨影响)，品尝精品室内餐酒馆。',
        mapQuery: 'Riverside Market Christchurch'
      }
    ]
  },
  {
    id: 'day-6',
    dayNum: 6,
    date: '2026/10/02 (周五)',
    title: '睡到自然醒 ➔ 城堡山奇特巨石阵 ➔ 雅芳河与植物园 ➔ 27级台阶告别晚宴',
    destinationCode: 'nz',
    city: '基督城 ➔ 城堡山 (Castle Hill)',
    lat: -43.5321,
    lng: 172.6362,
    weatherLocations: [
      {
        city: '城堡山',
        lat: -43.2284,
        lng: 171.7161,
        agencyName: 'MetService NZ (山地)',
        agencyUrl: 'https://www.metservice.com/mountains-and-parks/national-parks/arthurs-pass',
        historicalRange: '4°C ~ 14°C'
      },
      {
        city: '基督城',
        lat: -43.5321,
        lng: 172.6362,
        agencyName: 'MetService NZ',
        agencyUrl: 'https://www.metservice.com/towns-cities/locations/christchurch',
        historicalRange: '6°C ~ 16°C'
      }
    ],
    items: [
      {
        id: 'item-6-1',
        time: '08:30 - 10:00',
        type: 'hotel',
        name: '基督城寓言酒店 (Fable Christchurch)',
        roomType: '高级特大床房 (连住第2晚)',
        checkInTime: '连住无需退房',
        desc: '彻底睡个懒觉，在 Fable 酒店慢悠悠洗漱与休息，享受惬意晨间时光。',
        mapQuery: 'Fable Christchurch',
        lat: -43.5312,
        lng: 172.6375
      },
      {
        id: 'item-6-2',
        time: '10:00 - 11:00',
        type: 'food',
        name: 'New Regent St 街区早午餐 (Brunch)',
        cost: '~$45 NZD',
        parking: '纯步行漫步，车辆停于 Lichfield 停车楼',
        subSpots: [
          { name: 'C1 Espresso 咖啡馆', mapQuery: 'C1 Espresso Christchurch' },
          { name: 'The Caffeine Laboratory 精品咖啡馆', mapQuery: 'The Caffeine Laboratory Christchurch' },
          { name: 'New Regent Street 西班牙建筑街区', mapQuery: 'New Regent Street Christchurch' }
        ],
        desc: '步行 3 分钟至 New Regent St 的 C1 Espresso (体验气动管道送餐) 或 The Caffeine Laboratory 享用精品 Brunch。',
        mapQuery: 'C1 Espresso Christchurch',
        lat: -43.5315,
        lng: 172.6410
      },
      {
        id: 'item-6-3',
        time: '11:00 - 12:20',
        type: 'drive',
        name: '自驾段 1：基督城市区 ➔ Castle Hill 城堡山',
        distance: '90 km',
        duration: '车程约 1小时20分钟',
        desc: '沿 SH73 景观公路驶向内陆中高原景观地带，沿途雪山连绵。',
        mapQuery: 'Castle Hill Conservation Area',
        lat: -43.2284,
        lng: 171.7161
      },
      {
        id: 'item-6-4',
        time: '12:20 - 14:00',
        type: 'spot',
        name: 'Castle Hill 纳尼亚传奇巨石阵漫步',
        parking: '城堡山入口大型免费停车场 (Free)；设生态公共卫生间',
        desc: '漫步于巨大灰白色石灰岩石群之间 (电影《纳尼亚传奇》取景地)，地形平缓好走，风景极其壮丽。',
        mapQuery: 'Castle Hill Conservation Area',
        lat: -43.2284,
        lng: 171.7161
      },
      {
        id: 'item-6-5',
        time: '14:00 - 15:20',
        type: 'drive',
        name: '自驾段 2：Castle Hill ➔ 基督城市中心',
        distance: '90 km',
        duration: '车程约 1小时20分钟',
        parking: '停入 Lichfield Street Carpark (离 Fable 酒店步行 3 分钟，停好车后开启全步行模式)',
        desc: '原路返抵基督城市区，将车停入 Lichfield Street Carpark 停车楼。',
        mapQuery: 'Lichfield Street Carpark Christchurch',
        lat: -43.5342,
        lng: 172.6371
      },
      {
        id: 'item-6-6',
        time: '15:20 - 17:30',
        type: 'spot',
        name: '基督城植物园、雅芳河畔 & Riverside Market 慢游',
        cost: '~$30 NZD',
        parking: '纯步行漫步',
        subSpots: [
          { name: '基督城植物园 (Botanic Gardens) 玫瑰园与温室', mapQuery: 'Christchurch Botanic Gardens' },
          { name: '雅芳河畔 (Avon River) 沿岸散步', mapQuery: 'Avon River Christchurch' },
          { name: 'Riverside Market 室内集市冰淇淋/手信', mapQuery: 'Riverside Market Christchurch' }
        ],
        desc: '漫步植物园 (Botanic Gardens) 玫瑰园与温室花房，沿雅芳河 (Avon River) 散步；在 Riverside Market 室内集市品尝手工冰淇淋或挑选手信。',
        mapQuery: 'Christchurch Botanic Gardens',
        lat: -43.5309,
        lng: 172.6205
      },
      {
        id: 'item-6-7',
        time: '17:30 - 18:30',
        type: 'hotel',
        name: '返回 Fable 酒店休息与梳洗',
        roomType: '高级特大床房 (连住第2晚)',
        desc: '返回 Fable 酒店休息、梳洗，准备享用南岛告别晚宴。',
        mapQuery: 'Fable Christchurch',
        lat: -43.5312,
        lng: 172.6375
      },
      {
        id: 'item-6-8',
        time: '18:30 - 20:30',
        type: 'food',
        name: 'New Regent Street 告别晚宴：Twenty Seven Steps',
        cost: '~$120 - $150 NZD/双人',
        tips: '⚠️ 预订提示：建议提前 2~3 周通过官网 (twentysevensteps.co.nz) 预约 18:30 座位',
        parking: '纯步行 3 分钟至 New Regent St 二楼餐厅',
        desc: '酒店步行 3 分钟至复古街区二楼的 Twenty Seven Steps 餐厅，享用招牌高山鹿肉、煎鸭胸或海鲜，搭配马尔堡白葡萄酒。',
        mapQuery: 'Twenty Seven Steps Christchurch',
        lat: -43.5316,
        lng: 172.6412
      }
    ]
  },
  {
    id: 'day-7',
    dayNum: 7,
    date: '2026/10/03 (周六)',
    title: '集市与缆车 ➔ 满油还车 ➔ 飞往悉尼 ➔ 达令港周六烟花秀 & 高空夜景酒吧',
    destinationCode: 'au',
    city: '基督城 ➔ 悉尼 (Sydney)',
    lat: -33.8688,
    lng: 151.2093,
    weatherLocations: [
      {
        city: '基督城',
        lat: -43.5321,
        lng: 172.6362,
        agencyName: 'MetService NZ',
        agencyUrl: 'https://www.metservice.com/towns-cities/locations/christchurch',
        historicalRange: '6°C ~ 16°C'
      },
      {
        city: '悉尼',
        lat: -33.8688,
        lng: 151.2093,
        agencyName: 'Australia BOM',
        agencyUrl: 'http://www.bom.gov.au/nsw/forecasts/sydney.shtml',
        historicalRange: '14°C ~ 22°C'
      }
    ],
    items: [
      {
        id: 'item-7-1',
        time: '08:30 - 09:30',
        type: 'hotel',
        name: '基督城寓言酒店 Check-out (Fable Christchurch)',
        roomType: '高级特大床房',
        checkOutTime: '退房时间: 11:00 前',
        desc: '酒店整理行李，办理退房手续 (随身行李直接放租车后备箱)。',
        mapQuery: 'Fable Christchurch',
        lat: -43.5312,
        lng: 172.6375
      },
      {
        id: 'item-7-2',
        time: '09:30 - 10:00',
        type: 'drive',
        name: '自驾段 1：酒店 ➔ Lyttelton 港口小镇',
        distance: '12 km',
        duration: '车程约 20 分钟',
        pitstops: ['穿过 Lyttelton 隧道'],
        desc: '沿公路穿过 Lyttelton 隧道前往海港小镇。',
        mapQuery: 'Lyttelton Canterbury New Zealand'
      },
      {
        id: 'item-7-3',
        time: '10:00 - 11:30',
        type: 'spot',
        name: 'Lyttelton Farmers Market 周末集市 & 小镇 Brunch',
        cost: '~$40 NZD',
        parking: '小镇路边免费停车位 (Free)；设完备公共卫生间',
        desc: '漫步 London Street 体验热闹集市 (10:00-13:00 开放)，品尝手冲咖啡、手工面包与高山芝士。',
        mapQuery: 'Lyttelton Farmers Market',
        lat: -43.6028,
        lng: 172.7198
      },
      {
        id: 'item-7-4',
        time: '11:30 - 11:45',
        type: 'drive',
        name: '自驾段 2：Lyttelton ➔ Christchurch Gondola 缆车站',
        distance: '5 km',
        duration: '车程约 10 分钟',
        desc: '驱车前往基督城缆车山麓车站。',
        mapQuery: 'Christchurch Gondola'
      },
      {
        id: 'item-7-5',
        time: '11:45 - 13:30',
        type: 'spot',
        name: 'Christchurch Gondola 基督城缆车 & 山顶 360 度全景',
        cost: '~$70 NZD/双人 (缆车票)',
        parking: '缆车山麓车站自带大型免费停车场 (Free)；山顶设 Café 与卫生间',
        desc: '搭乘缆车升至 Mount Cavendish 山顶，360 度俯瞰利特尔顿港湾与南阿尔卑斯山脉。',
        mapQuery: 'Christchurch Gondola',
        lat: -43.5898,
        lng: 172.6841
      },
      {
        id: 'item-7-6',
        time: '13:30 - 15:30',
        type: 'food',
        name: '返回市区轻食 & 顺路补给 (Riverside / Child Sister)',
        cost: '~$40 NZD',
        desc: '返回基督城市区，在 Riverside Market 或 Child Sister 享用午后咖啡与轻食。',
        mapQuery: 'Riverside Market Christchurch'
      },
      {
        id: 'item-7-7',
        time: '15:30 - 16:15',
        type: 'drive',
        name: '驱车前往 Snap 门店还车 & 满油加油',
        distance: '15 km',
        duration: '车程约 45 分钟',
        cost: '~$40 - $60 NZD (加油花销)',
        parking: 'BP Connect (Russley Rd) 满油加油',
        tips: '⛽ 关键加油点：在离 Snap 门店 3 分钟车程的 BP Connect (Russley Rd) 加满汽油并保留小票！',
        pitstops: ['BP Connect Russley Rd 满油加油'],
        desc: '在离 Snap 门店 3 分钟车程的 BP Connect 加满汽油并保留小票。',
        mapQuery: 'BP Connect Russley Road Christchurch'
      },
      {
        id: 'item-7-8',
        time: '16:15 - 16:30',
        type: 'spot',
        name: 'Snap Rentals 门店归还车辆',
        desc: '抵达 Snap Rentals 门店办理退车、验车与交接手续。',
        mapQuery: 'Snap Rentals Christchurch Airport'
      },
      {
        id: 'item-7-9',
        time: '16:30 - 16:40',
        type: 'transit',
        name: '搭乘 Snap 免费 Shuttle 前往基督城机场 Terminal',
        cost: '$0 NZD (免费 Shuttle)',
        duration: '3 分钟',
        desc: '搭乘 Snap 专属免费 Shuttle 抵达基督城机场航站楼。',
        mapQuery: 'Christchurch International Airport'
      },
      {
        id: 'item-7-10',
        time: '16:40 - 18:20',
        type: 'spot',
        name: '公务舱极速出境 & Manawa 贵宾室体验',
        cost: '包含于 QF8765 / EK413 机票',
        tips: '✨ 尊享服务：凭 QF8765 / EK413 机票走 Priority 优先通道极速值机与安检，进入 Manawa Lounge 享用点心与香槟。',
        desc: '凭公务舱机票走 Priority 通道极速值机与安检，进入 Manawa Lounge 享用点心与香槟。',
        mapQuery: 'Manawa Lounge Christchurch Airport'
      },
      {
        id: 'item-7-11',
        time: '18:20 - 18:40',
        type: 'flight',
        name: '澳洲航空 QF8765 / 阿联酋航空 EK413 启程',
        flightCode: 'QF8765 / EK413 (EK413 执飞)',
        flightRoute: '基督城 T1 (18:20) ➔ 悉尼 T1 (18:40 悉尼时间)',
        terminal: '基督城 T1 ➔ 悉尼 T1',
        gate: '12 (预估)',
        boardingTime: '17:40',
        flightStatus: '🟢 计划/准点',
        estDeparture: '18:20',
        estArrival: '18:40 (悉尼时间)',
        desc: '飞行 3.5 小时，跨国时差 -2 小时，机上享用豪华晚餐。',
        mapQuery: 'Christchurch International Airport'
      },
      {
        id: 'item-7-12',
        time: '18:40 - 19:30',
        type: 'spot',
        name: '悉尼国际机场极速入境 & 提取行李',
        tips: '⚡ 入境提醒：使用 SmartGate 电子护照自助通关闸机，快速入境澳大利亚并提取行李。',
        desc: '抵达悉尼机场 T1 国际航站楼，使用 SmartGate 极速自助通关并提取行李。',
        mapQuery: 'Sydney International Airport Terminal 1'
      },
      {
        id: 'item-7-13',
        time: '19:30 - 20:10',
        type: 'transit',
        name: '交通段：悉尼机场 ➔ PARKROYAL Darling Harbour 酒店',
        cost: '~$19.50 AUD/人 (T8 火车) | ~$50-$60 AUD (Uber)',
        transitType: 'train',
        lineName: '悉尼 T8 Airport Line',
        lineColor: '#0098cd',
        startStation: 'International Airport Station (国际机场站)',
        endStation: 'Town Hall Station (市政厅站)',
        stopsCount: '6 站 (约 18 分钟)',
        exitInfo: '从 Bathurst St / Market St 出口出站 ➔ 沿 Market St 朝达令港方向下坡步行 350 米 (4 分钟) 即达酒店',
        paymentTip: '💳 支付提醒：无须购买 Opal 实体卡，直接使用含芯片信用卡或手机 (Apple Pay) 进出站挥卡！',
        pitstops: ['Uber 备选：若携大件重行李，可从 P7 停车楼网约车区乘车 (车程约25分钟, 预估 ~$50 - $60 AUD)'],
        desc: '搭乘 T8 Airport Line (往 City Circle 方向) 6 站至 Town Hall Station 下车，步行 4 分钟至酒店。',
        mapQuery: 'PARKROYAL Darling Harbour Sydney',
        lat: -33.8732,
        lng: 151.2036
      },
      {
        id: 'item-7-14',
        time: '20:10 - 20:30',
        type: 'hotel',
        name: '悉尼达令港宾乐雅酒店 Check-in (PARKROYAL Darling Harbour)',
        roomType: '高级特大床房 (连住第1晚)',
        phone: '+61 2 9261 1188',
        checkInTime: '建议入住: 15:00 后',
        checkOutTime: '退房时间: 11:00 前',
        desc: '办理酒店 Check-in 入住，放置行李。',
        mapQuery: 'PARKROYAL Darling Harbour Sydney',
        lat: -33.8732,
        lng: 151.2036
      },
      {
        id: 'item-7-15',
        time: '20:30 - 21:15',
        type: 'spot',
        name: '达令港周六夜间海上烟花秀 (Darling Harbour Saturday Fireworks)',
        cost: '$0 AUD (免费赏观)',
        parking: '纯步行 2 分钟至 Cockle Bay 栈道',
        desc: '步行至 Cockle Bay Wharf 或 Pyrmont Bridge 桥上，占据绝佳位置欣赏 21:00 准时绽放的达令港海上夜空烟花秀。',
        mapQuery: 'Cockle Bay Wharf Darling Harbour',
        lat: -33.8749,
        lng: 151.2009
      },
      {
        id: 'item-7-16',
        time: '21:15 - 23:00',
        type: 'food',
        name: '特色夜景酒吧小酌 & 达令港夜漫步',
        cost: '~$50 - $80 AUD/双人',
        parking: '纯步行 5 分钟',
        subSpots: [
          { name: 'Zephyr Rooftop Bar (Hyatt Regency 顶楼高空全景)', mapQuery: 'Zephyr Rooftop Bar Sydney' },
          { name: 'Cockle Bay Wharf 水岸木栈道景观酒吧', mapQuery: 'Cockle Bay Wharf Sydney' }
        ],
        desc: '方案 A 前往 Zephyr 顶楼高空酒吧直面港湾夜景与特调鸡尾酒；方案 B 漫步水岸木栈道挑选露天酒吧享用精酿啤酒。',
        mapQuery: 'Zephyr Rooftop Bar Sydney',
        lat: -33.8698,
        lng: 151.2025
      }
    ]
  },
  {
    id: 'day-8',
    dayNum: 8,
    date: '2026/10/04 (周日)',
    title: '惬意 City Walk ➔ 塔龙加动物园 ➔ 屈臣湾日落 ➔ 环形码头蓝调月台 ➔ 岩石区晚宴',
    destinationCode: 'au',
    city: '悉尼 (Sydney)',
    lat: -33.8688,
    lng: 151.2093,
    weatherLocations: [
      {
        city: '悉尼',
        lat: -33.8688,
        lng: 151.2093,
        agencyName: 'Australia BOM',
        agencyUrl: 'http://www.bom.gov.au/nsw/forecasts/sydney.shtml',
        historicalRange: '14°C ~ 23°C'
      }
    ],
    items: [
      {
        id: 'item-8-1',
        time: '08:30 - 10:00',
        type: 'hotel',
        name: '酒店 SAILMAKER 餐厅享用早餐',
        roomType: '高级特大床房',
        phone: '+61 2 9261 1188',
        checkInTime: '连住中',
        desc: '彻底睡个懒觉，前往 PARKROYAL Darling Harbour 的 SAILMAKER 餐厅享用丰盛早餐 (周日早餐营业至 10:30，收餐时间约 10:15 - 10:30，时间充裕)。',
        mapQuery: 'SAILMAKER Restaurant PARKROYAL Darling Harbour',
        lat: -33.8732,
        lng: 151.2036
      },
      {
        id: 'item-8-2',
        time: '10:00 - 11:30',
        type: 'spot',
        name: '悉尼市中心经典 City Walk (纯步行约 2.5km)',
        subSpots: [
          { name: '圣玛丽大教堂', mapQuery: 'St Marys Cathedral Sydney' },
          { name: '海德公园', mapQuery: 'Hyde Park Sydney' },
          { name: '皇家植物园', mapQuery: 'Royal Botanic Garden Sydney' },
          { name: '麦考利夫人座椅观景点', mapQuery: "Mrs Macquarie's Chair Sydney" },
          { name: '悉尼歌剧院广场', mapQuery: 'Sydney Opera House' }
        ],
        desc: '🚶 路线：酒店出发 ➔ 圣玛丽大教堂 (St Mary\'s Cathedral) ➔ 海德公园 (Hyde Park) ➔ 皇家植物园 (Royal Botanic Garden) ➔ 麦考利夫人座椅合影 ➔ 抵达歌剧院广场 (Free)。',
        mapQuery: 'St Marys Cathedral Sydney',
        lat: -33.8712,
        lng: 151.2133
      },
      {
        id: 'item-8-3',
        time: '11:30 - 12:00',
        type: 'transit',
        name: '交通段1：环形码头 ➔ 塔龙加动物园北门',
        lineName: 'F2 Taronga Zoo 渡轮 + 238 路接驳公交',
        lineColor: '#00843d',
        transitType: 'ferry',
        startStation: 'Circular Quay Wharf 4',
        endStation: 'Taronga Zoo Main Entrance (北门主入口)',
        stopsCount: '渡轮 12分钟 + 公交 5分钟',
        exitInfo: '下船后在码头旁公交站搭乘 238 路 (约5分钟上坡) 直达北门主入口',
        paymentTip: '💳 刷信用卡 / Apple Pay 进出闸门',
        desc: '从歌剧院旁步行 3 分钟至 Circular Quay Wharf 4 ➔ 搭乘 F2 渡轮 (约12分钟，沿途视角赏歌剧院) ➔ 抵达 Taronga Zoo Wharf 换乘 238 路公交直达北门。',
        mapQuery: 'Circular Quay Wharf 4',
        lat: -33.8611,
        lng: 151.2106
      },
      {
        id: 'item-8-4',
        time: '12:00 - 14:30',
        type: 'spot',
        name: '塔龙加动物园 (Taronga Zoo) 下坡游览',
        desc: '从北门主入口向南门一路下坡游览，打卡长颈鹿与悉尼港全景合影、考拉、袋鼠与考拉园区 (预估门票: ~$51 AUD/人)。<br>🍽️ 餐饮：园内 Café / Food Market 可买卷饼、汉堡或冰淇淋午餐 (~$30 AUD)。',
        mapQuery: 'Taronga Zoo Sydney',
        lat: -33.8433,
        lng: 151.2412
      },
      {
        id: 'item-8-5',
        time: '14:30 - 15:15',
        type: 'transit',
        name: '交通段2：塔龙加动物园 ➔ Watsons Bay (屈臣湾)',
        lineName: 'F9 Watsons Bay 渡轮',
        lineColor: '#00843d',
        transitType: 'ferry',
        startStation: 'Taronga Zoo Wharf (南门)',
        endStation: 'Watsons Bay Wharf',
        stopsCount: '直达 (约 20-30 分钟)',
        exitInfo: '从动物园南门 Lower Entrance Quay 出即达码头',
        paymentTip: '💳 刷卡进出站',
        desc: '动物园南门出来 ➔ Taronga Zoo Wharf 刷卡搭乘 F9 渡轮 (或在 Circular Quay / Rose Bay 换乘) 直达屈臣湾。',
        mapQuery: 'Taronga Zoo Wharf',
        lat: -33.8475,
        lng: 151.2424
      },
      {
        id: 'item-8-6',
        time: '15:15 - 17:30',
        type: 'spot',
        name: 'Watsons Bay 大草坪躺平 & 海崖漫步',
        subSpots: [
          { name: 'Robertson Park 大草坪', mapQuery: 'Robertson Park Watsons Bay' },
          { name: 'Hornby Lighthouse 红白灯塔', mapQuery: 'Hornby Lighthouse Watsons Bay' }
        ],
        desc: '漫步至 Watsons Bay Wharf 旁 Robertson Park 大草坪晒太阳躺平；体力充沛沿 South Head Heritage Trail 散步至 Hornby Lighthouse (红白条纹灯塔) 观赏太平洋海崖。<br>🍽️ 餐饮：在草坪旁 Doyle\'s on the Beach 外带炸鱼薯条 (Fish & Chips) 与冷饮在草坪享用 (~$35 AUD)。',
        mapQuery: 'Watsons Bay Sydney',
        lat: -33.8427,
        lng: 151.2828
      },
      {
        id: 'item-8-7',
        time: '17:30 - 18:15',
        type: 'transit',
        name: '日落航程 ➔ 环形码头 (Circular Quay) 车站打卡蓝调时刻',
        lineName: 'F9 渡轮日落航行 + 环形码头高空月台',
        lineColor: '#00843d',
        transitType: 'ferry',
        startStation: 'Watsons Bay Wharf',
        endStation: 'Circular Quay Station (火车站月台)',
        stopsCount: '渡轮 30分钟',
        exitInfo: '出码头走楼梯/电梯直达火车站上层月台',
        paymentTip: '📸 利用周日上限，刷卡进出打卡最美大片',
        desc: '搭乘 F9 渡轮返回 Circular Quay (船上与海面上欣赏悉尼港金色日落) ➔ 直达 Circular Quay 火车站月台，刚好赶上 sunset 后的“蓝调时刻 (Blue Hour)”，拍摄以海港大桥与歌剧院为背景的悉尼最美框景月台大片。',
        mapQuery: 'Circular Quay Station',
        lat: -33.8615,
        lng: 151.2100
      },
      {
        id: 'item-8-8',
        time: '18:15 - 20:30',
        type: 'food',
        name: '岩石区 (The Rocks) 历史街区漫步与晚餐',
        desc: '🚶 从 Circular Quay 车站步行 5 分钟进入岩石区鹅卵石小巷。<br>🍷 晚餐推荐：The Glenmore Hotel 顶楼露天酒吧 (俯瞰海港大桥夜景) 或 The Cut Bar & Grill / The Oakus 享用精致晚餐与精酿 (~$120 - $150 AUD/双人)。',
        mapQuery: 'The Rocks Sydney',
        lat: -33.8599,
        lng: 151.2090
      },
      {
        id: 'item-8-9',
        time: '20:30 - 21:00',
        type: 'transit',
        name: '交通段3：岩石区/环形码头 ➔ 达令港 ➔ 返回酒店',
        lineName: 'F4 Cross Harbour 渡轮 (首选) / L2/L3 轻轨 (备选)',
        lineColor: '#00843d',
        transitType: 'ferry',
        startStation: 'Circular Quay Wharf 5',
        endStation: 'Pyrmont Bay / Barangaroo Wharf',
        stopsCount: '渡轮 20分钟',
        exitInfo: '下船沿达令港木栈道步行 5 分钟轻松回酒店',
        paymentTip: '💳 刷卡进出',
        desc: '🚢 渡轮首选：Circular Quay Wharf 5 搭乘 F4 渡轮横跨海港大桥下方 (约20分钟) 直达 Pyrmont Bay / Barangaroo ➔ 沿木栈道步行 5 分钟回 PARKROYAL 酒店。<br>🚃 轻轨备选：Bridge St 搭乘 L2/L3 轻轨至 QVB 站下车步行 4 分钟。',
        mapQuery: 'Circular Quay Wharf 5',
        lat: -33.8608,
        lng: 151.2104
      },
      {
        id: 'item-8-10',
        time: '21:00',
        type: 'hotel',
        name: '悉尼达令港宾乐雅酒店 (PARKROYAL Darling Harbour)',
        roomType: '高级特大床房 (连住第2晚)',
        phone: '+61 2 9261 1188',
        checkInTime: '连住中',
        desc: '连住无需退房。',
        mapQuery: 'PARKROYAL Darling Harbour Sydney',
        lat: -33.8732,
        lng: 151.2036
      }
    ]
  },
  {
    id: 'day-9',
    dayNum: 9,
    date: '2026/10/05 (周一)',
    title: 'QVB 复古购物 ➔ 邦迪至库吉绝美海岸徒步 ➔ 库吉海滩惬意日落 ➔ 早期休整',
    destinationCode: 'au',
    city: '悉尼 (Sydney)',
    lat: -33.8688,
    lng: 151.2093,
    weatherLocations: [
      {
        city: '悉尼',
        lat: -33.8688,
        lng: 151.2093,
        agencyName: 'Australia BOM',
        agencyUrl: 'http://www.bom.gov.au/nsw/forecasts/sydney.shtml',
        historicalRange: '14°C ~ 23°C'
      }
    ],
    items: [
      {
        id: 'item-9-1',
        time: '08:30 - 10:00',
        type: 'hotel',
        name: '酒店 SAILMAKER 餐厅享用早餐',
        roomType: '高级特大床房',
        phone: '+61 2 9261 1188',
        checkInTime: '连住中',
        desc: 'SAILMAKER 餐厅周一收餐时间为 10:00，建议 09:15 前前往。<br>💡 假日特别提示：今日为新南威尔士州劳动节 (Labour Day) 法定假日，餐厅、Café 及酒吧账单会自动产生 10%–15% 的假期附加费 (Public Holiday Surcharge)。今日餐饮全线避开高端餐厅，选择快捷外带/轻食以节省预算。',
        mapQuery: 'SAILMAKER Restaurant PARKROYAL Darling Harbour',
        lat: -33.8732,
        lng: 151.2036
      },
      {
        id: 'item-9-2',
        time: '10:00 - 12:30',
        type: 'spot',
        name: 'QVB 维多利亚女王大厦 & Pitt St 步行街购物',
        subSpots: [
          { name: 'QVB 维多利亚女王大厦', mapQuery: 'Queen Victoria Building Sydney' },
          { name: 'Pitt Street Mall 步行街', mapQuery: 'Pitt Street Mall Sydney' },
          { name: 'Jurlique 茱莉蔻旗舰店', mapQuery: 'Jurlique Westfield Sydney' }
        ],
        desc: '🚶 纯步行：从 PARKROYAL 酒店沿 Market St 步行 3 分钟即达 QVB。欣赏拜占庭风格罗马拱顶与彩绘玻璃，打卡皇家大钟 (Royal Clock)；逛精品店、羊毛衫与皮具店；随后踱步至 Pitt Street Mall (Westfield / 茱莉蔻旗舰店) (Free)。',
        mapQuery: 'Queen Victoria Building Sydney',
        lat: -33.8718,
        lng: 151.2067
      },
      {
        id: 'item-9-3',
        time: '12:30 - 13:15',
        type: 'food',
        name: 'QVB 附近平价午餐/轻食',
        desc: '在 Westfield Food Court (美食广场) 或 QVB 楼下 Espresso 档口购买平价快捷午餐 (如卷饼、Subway、日式便当或手冲咖啡)，既便宜高效，又能避开高端餐厅的陡峭附加费 (~$25 - $30 AUD/双人)。',
        mapQuery: 'Westfield Sydney Food Court',
        lat: -33.8698,
        lng: 151.2082
      },
      {
        id: 'item-9-4',
        time: '13:15 - 13:50',
        type: 'transit',
        name: '交通段1：QVB/City ➔ Bondi Beach (邦迪海滩)',
        lineName: 'T4 火车 + 333 / 379 路高频公交',
        lineColor: '#005aa3',
        transitType: 'train',
        startStation: 'Town Hall Station',
        endStation: 'Campbell Parade near Hall St (Bondi Beach)',
        stopsCount: '火车 10分钟 + 公交 15分钟',
        exitInfo: 'Bondi Junction 站下车后上楼至公交枢纽 Stand A 换乘 333/379 路',
        paymentTip: '💳 票价约 $4.50 AUD/人，刷卡进出',
        desc: '从 Town Hall Station 进站搭乘 T4 Eastern Suburbs Line 火车 (约10分钟) ➔ 到 Bondi Junction Station 下车 ➔ 随指示牌上楼至公交枢纽 Stand A 换乘 333 路 / 379 路高频公交 (约15分钟) 直达邦迪海滩。',
        mapQuery: 'Town Hall Station Sydney',
        lat: -33.8735,
        lng: 151.2065
      },
      {
        id: 'item-9-5',
        time: '13:50 - 17:00',
        type: 'spot',
        name: 'Bondi to Coogee Coastal Walk (邦迪至库吉海滩徒步，约 6 公里)',
        subSpots: [
          { name: 'Bondi Icebergs 悬崖泳池', mapQuery: 'Bondi Icebergs Club' },
          { name: 'Tamarama & Bronte 海滩', mapQuery: 'Bronte Beach Sydney' },
          { name: 'Waverley Cemetery 悬崖公墓', mapQuery: 'Waverley Cemetery Sydney' },
          { name: 'Gordon\'s Bay 戈登湾', mapQuery: 'Gordons Bay Sydney' },
          { name: 'Coogee Beach 库吉海滩', mapQuery: 'Coogee Beach Sydney' }
        ],
        desc: '🚶 绝美徒步路线：Bondi Icebergs Club 步道起点 ➔ Tamarama Beach ➔ Bronte Beach ➔ Waverley Cemetery (波浪谷悬崖公墓) ➔ Clovelly Beach ➔ Gordon\'s Bay ➔ Coogee Beach。<br>💡 全程约 6km，悬崖海景极佳，轻松耗时约 2.5 - 3 小时 (Free)。',
        mapQuery: 'Bondi Icebergs Club',
        lat: -33.8953,
        lng: 151.2743
      },
      {
        id: 'item-9-6',
        time: '17:00 - 18:00',
        type: 'spot',
        name: 'Coogee Beach 惬意海滩日落 & 平价海边小吃',
        desc: '在 Coogee Beach 沙滩上闲坐休息看落日余晖；在海滩旁炸鱼薯条小店或 Gelato 冰淇淋店外带 Fish & Chips 或冰淇淋在沙滩享用 (~$20 - $25 AUD/双人)。',
        mapQuery: 'Coogee Beach Sydney',
        lat: -33.9205,
        lng: 151.2580
      },
      {
        id: 'item-9-7',
        time: '18:00 - 18:45',
        type: 'transit',
        name: '交通段2：Coogee Beach ➔ 达令港 / 酒店',
        lineName: '374 路直达公交 / 350 路换乘',
        lineColor: '#00843d',
        transitType: 'bus',
        startStation: 'Coogee Beach, Arden St 沿线公交站',
        endStation: 'Town Hall Station / Darling Harbour',
        stopsCount: '直达 (约 40 分钟)',
        exitInfo: '下车后步行直达酒店',
        paymentTip: '💳 票价约 $3.90 AUD/人，刷卡进出',
        desc: '在 Coogee Beach, Arden St 沿线搭乘 374 路公交 (直达 Martin Place / City) 或 350 路至 Green Square 换乘火车返回 Town Hall Station / Darling Harbour。',
        mapQuery: 'Coogee Beach Arden St Bus Stop',
        lat: -33.9205,
        lng: 151.2580
      },
      {
        id: 'item-9-8',
        time: '18:45 - 20:00',
        type: 'food',
        name: '达令港轻食晚餐',
        desc: '在达令港木栈道沿线 (如 Betty\'s Burgers 汉堡或外带 Pizza) 享用轻松平价晚餐 (~$35 - $45 AUD/双人)。',
        mapQuery: 'Bettys Burgers Darling Harbour',
        lat: -33.8738,
        lng: 151.2015
      },
      {
        id: 'item-9-9',
        time: '20:00',
        type: 'hotel',
        name: '悉尼达令港宾乐雅酒店 (PARKROYAL Darling Harbour)',
        roomType: '高级特大床房 (连住第3晚)',
        phone: '+61 2 9261 1188',
        checkInTime: '连住中',
        desc: '早点休息，为次日早起去 Featherdale 动物园做准备。',
        mapQuery: 'PARKROYAL Darling Harbour Sydney',
        lat: -33.8732,
        lng: 151.2036
      }
    ]
  },
  {
    id: 'day-10',
    dayNum: 10,
    date: '2026/10/06 (周二)',
    title: '飞速前往 Featherdale 野生动物园 ➔ 考拉袋鼠晨间互动 ➔ George St & QVB 终极购物',
    destinationCode: 'au',
    city: '悉尼 (Sydney)',
    lat: -33.8688,
    lng: 151.2093,
    weatherLocations: [
      {
        city: '悉尼',
        lat: -33.8688,
        lng: 151.2093,
        agencyName: 'Australia BOM',
        agencyUrl: 'http://www.bom.gov.au/nsw/forecasts/sydney.shtml',
        historicalRange: '14°C ~ 23°C'
      },
      {
        city: '广州',
        lat: 23.3924,
        lng: 113.2988,
        agencyName: '中国天气网 (CMA)',
        agencyUrl: 'http://www.weather.com.cn/weather/101280101.shtml',
        historicalRange: '21°C ~ 29°C'
      }
    ],
    items: [
      {
        id: 'item-10-1',
        time: '07:00 - 08:00',
        type: 'hotel',
        name: '酒店 SAILMAKER 餐厅早餐',
        roomType: '高级特大床房',
        phone: '+61 2 9261 1188',
        checkInTime: '连住中',
        desc: '酒店享用早餐，准备提早出门。',
        mapQuery: 'PARKROYAL Darling Harbour Sydney',
        lat: -33.8732,
        lng: 151.2036
      },
      {
        id: 'item-10-2',
        time: '08:00 - 09:00',
        type: 'transit',
        name: '交通段1：酒店 ➔ Featherdale Wildlife Park (快线极速指南)',
        lineName: 'T1 Western Line 火车快线 + 729 路公交',
        lineColor: '#f36f21',
        transitType: 'train',
        startStation: 'Town Hall Station',
        endStation: 'Featherdale Wildlife Park 门口',
        stopsCount: '火车 35分钟 + 公交 10分钟',
        exitInfo: 'Blacktown 站 B2 出口前往公交枢纽 Stand E 换乘 729 路',
        paymentTip: '💳 票价约 $6.80 AUD/人 (Uber 备选车程 40分钟 ~$75-$90 AUD/车)',
        desc: 'Town Hall Station 进站搭乘 T1 Western Line 快线火车 (约35分钟) ➔ 到 Blacktown Station 下车 ➔ 从 B2 出口前往 Stand E 换乘 729 路公交 (约10分钟) 直达门口。<br>🚕 Uber 备选：车程约 40 分钟 (~$75 - $90 AUD/车)。',
        mapQuery: 'Town Hall Station Sydney',
        lat: -33.8735,
        lng: 151.2065
      },
      {
        id: 'item-10-3',
        time: '09:00 - 12:00',
        type: 'spot',
        name: 'Featherdale 野生动物园 (晨间动物最活跃时段互动)',
        desc: '开门即入园！晨间考拉和袋鼠精力最充沛。免费入园抚摸自由漫步的红袋鼠/短尾矮袋鼠 (Quokka)，亲手喂食；并可预约亲密近距离合影考拉 (预估门票: ~$42 AUD/人)。<br>☕ 轻食：园内 Café 享用咖啡与手工糕点 (~$20 AUD)。',
        mapQuery: 'Featherdale Wildlife Park',
        lat: -33.7663,
        lng: 150.8845
      },
      {
        id: 'item-10-4',
        time: '12:00 - 13:00',
        type: 'transit',
        name: '交通段2：Featherdale ➔ 悉尼市中心 George Street',
        lineName: '729 路公交 + T1 火车快线',
        lineColor: '#f36f21',
        transitType: 'train',
        startStation: 'Featherdale Wildlife Park',
        endStation: 'Town Hall Station / George St',
        stopsCount: '公交 10分钟 + 火车 35分钟',
        exitInfo: 'Town Hall 站出站即达 George St 核心商业街',
        paymentTip: '💳 刷卡进出',
        desc: '门口搭乘 729 路公交至 Blacktown Station ➔ 换乘 T1 火车快线返回 Town Hall Station。',
        mapQuery: 'Featherdale Wildlife Park',
        lat: -33.7663,
        lng: 150.8845
      },
      {
        id: 'item-10-5',
        time: '13:00 - 17:30',
        type: 'spot',
        name: 'George Street / QVB / Westfield 终极采购',
        subSpots: [
          { name: 'George Street 商业主干道', mapQuery: 'George Street Sydney' },
          { name: 'Mid City & Westfield', mapQuery: 'Westfield Sydney' },
          { name: 'QVB 维多利亚女王大厦', mapQuery: 'Queen Victoria Building Sydney' }
        ],
        desc: '🚶 纯步行：沿 George St (悉尼核心林荫商业主干道) 散步；在 QVB、Mid City、Westfield 彻底完成最终采购 (羊毛制品、茱莉蔻/Aesop 护肤品、保健品、伴手礼)。<br>🍽️ 餐饮：George St 沿线创煮/日韩料理或 QVB 楼下享用午餐/下午茶 (~$50 AUD)。',
        mapQuery: 'George Street Sydney',
        lat: -33.8705,
        lng: 151.2069
      },
      {
        id: 'item-10-6',
        time: '17:30 - 20:30',
        type: 'food',
        name: '达令港告别晚宴',
        desc: '🚶 纯步行：步行 3 分钟返回 PARKROYAL 酒店放好战利品，随后漫步至达令港水岸 (如 Cargo Bar / Bungalow 8) 享用精致告别晚宴 (~$100 AUD/双人)。',
        mapQuery: 'Cargo Bar Darling Harbour',
        lat: -33.8690,
        lng: 151.2014
      },
      {
        id: 'item-10-7',
        time: '20:30',
        type: 'hotel',
        name: '悉尼达令港宾乐雅酒店 (PARKROYAL Darling Harbour)',
        roomType: '高级特大床房 (连住第4晚/最后一晚)',
        phone: '+61 2 9261 1188',
        checkInTime: '连住中 (次日退房: 11:00前)',
        desc: '整理所有行李与包装收纳，准备次日返程。',
        mapQuery: 'PARKROYAL Darling Harbour Sydney',
        lat: -33.8732,
        lng: 151.2036
      }
    ]
  },
  {
    id: 'day-11',
    dayNum: 11,
    date: '2026/10/07 (周三)',
    title: '酒店退房 ➔ 悉尼机场 ➔ TRS 退税 ➔ HX018 转机 HX304 飞抵北京',
    destinationCode: 'au',
    city: '悉尼 ➔ 香港 ➔ 北京',
    lat: -33.8688,
    lng: 151.2093,
    weatherLocations: [
      {
        city: '广州',
        lat: 23.3924,
        lng: 113.2988,
        agencyName: '中国天气网 (CMA)',
        agencyUrl: 'http://www.weather.com.cn/weather/101280101.shtml',
        historicalRange: '21°C ~ 29°C'
      }
    ],
    items: [
      {
        id: 'item-11-1',
        time: '07:30 - 08:30',
        type: 'hotel',
        name: '酒店退房准备 & SAILMAKER 早餐',
        roomType: '高级特大床房 (办理退房)',
        phone: '+61 2 9261 1188',
        checkInTime: '退房日 (08:50前办理)',
        desc: '在 PARKROYAL 酒店 SAILMAKER 餐厅享用惬意早餐，彻底检查清点随身物品与托运行李。',
        mapQuery: 'PARKROYAL Darling Harbour Sydney',
        lat: -33.8732,
        lng: 151.2036
      },
      {
        id: 'item-11-2',
        time: '08:30 - 08:50',
        type: 'hotel',
        name: '办理退房手续 (Check-out)',
        desc: '前台办理 Check-out 提取全部行李。',
        mapQuery: 'PARKROYAL Darling Harbour Sydney',
        lat: -33.8732,
        lng: 151.2036
      },
      {
        id: 'item-11-3',
        time: '08:50 - 09:25',
        type: 'transit',
        name: '交通段：酒店 ➔ 悉尼国际机场 T1 Terminal',
        lineName: '悉尼 T8 Airport Line',
        lineColor: '#0098cd',
        transitType: 'train',
        startStation: 'Town Hall Station',
        endStation: 'International Airport Station (T1 国际航站楼)',
        stopsCount: '6 站 (约 18 分钟)',
        exitInfo: '出站即达 T1 国际出发大厅',
        paymentTip: '💳 票价约 $19.50 AUD/人 (Uber 备选车程 25分钟 ~$50-$65 AUD/车)',
        desc: '从 PARKROYAL 酒店步行 4 分钟至 Town Hall Station ➔ 刷卡进站搭乘 T8 Airport Line 火车 (约18分钟) ➔ 直达 International Airport Station 下车。<br>🚕 Uber 备选：若行李件数较多，叫 Uber 直达 T1 国际出发层 (车程约25分钟，预估 ~$50 - $65 AUD/车)。',
        mapQuery: 'International Airport Station Sydney',
        lat: -33.9399,
        lng: 151.1753
      },
      {
        id: 'item-11-4',
        time: '09:25 - 11:00',
        type: 'spot',
        name: '悉尼机场 T1 办理值机、托运与 TRS 购物退税',
        desc: '抵达 T1 国际出发大厅，前往香港航空 (Hong Kong Airlines) 柜台办理 HX018 值机与行李直挂 (行李直挂至北京首都机场)。<br>💡 TRS 退税提示：在澳洲单店消费满 $300 AUD 的商品，凭手机 "TRS App" 生成的 QR 码，过安检出境后前往 TRS (Tourist Refund Scheme) 柜台出示二维码、发票与商品快速办理 10% 消费税退税。',
        mapQuery: 'Sydney Airport Terminal 1',
        lat: -33.9399,
        lng: 151.1753
      },
      {
        id: 'item-11-5',
        time: '11:00 - 11:35',
        type: 'spot',
        name: '过关安检与前往登机口',
        desc: '过 SmartGate 极速通关与随身安检，前往 HX018 登机口。',
        mapQuery: 'Sydney Airport Terminal 1',
        lat: -33.9399,
        lng: 151.1753
      },
      {
        id: 'item-11-6',
        time: '12:05 - 20:10',
        type: 'flight',
        name: '第一程航班：悉尼 ➔ 香港 (HX018)',
        flightCode: '香港航空 HX018',
        flightRoute: '12:05 悉尼T1 ➔ 20:10 香港T1',
        terminal: '悉尼 T1 ➔ 香港 T1',
        gate: '看现场大牌',
        boardingTime: '11:25',
        flightStatus: '🟢 计划/准点',
        estDeparture: '12:05',
        estArrival: '20:10 (香港时间)',
        desc: '✈️ 搭乘香港航空 HX018 (12:05 悉尼 T1 起飞，飞行约 10 小时 05 分钟，香港时间 20:10 降落香港国际机场 T1)。机上享用午餐与晚餐，惬意休息。',
        mapQuery: 'Sydney Airport Terminal 1'
      },
      {
        id: 'item-11-7',
        time: '20:10 - 21:30',
        type: 'spot',
        name: '香港国际机场极速转机',
        desc: '无需提取托运行李，直接走国际转机通道 (Transfers) 重新过随身安检，进入出港层前往 HX304 登机口 (等待约 1 小时 20 分钟)。',
        mapQuery: 'Hong Kong International Airport',
        lat: 22.3080,
        lng: 113.9185
      },
      {
        id: 'item-11-8',
        time: '21:30 - 00:50 (+1天)',
        type: 'flight',
        name: '第二程航班：香港 ➔ 北京首都 (HX304)',
        flightCode: '香港航空 HX304',
        flightRoute: '21:30 香港T1 ➔ 00:50(+1) 北京T2',
        terminal: '香港 T1 ➔ 北京 T2',
        gate: '看现场大牌',
        boardingTime: '20:50',
        flightStatus: '🟢 计划/准点',
        estDeparture: '21:30',
        estArrival: '00:50 (+1天)',
        desc: '✈️ 搭乘香港航空 HX304 (21:30 香港 T1 起飞，飞行约 3 小时 20 分钟，次日 00:50 降落北京首都国际机场 T2)。',
        mapQuery: 'Hong Kong International Airport'
      },
      {
        id: 'item-11-9',
        time: '00:50+',
        type: 'spot',
        name: '顺利安抵北京首都国际机场 T2',
        desc: '提取托运行李，完美结束 11 日澳新度假之旅！',
        mapQuery: 'Beijing Capital International Airport',
        lat: 40.0799,
        lng: 116.6031
      }
    ]
  }
];

class TripStore {
  constructor() {
    this.destinations = DESTINATIONS_CONFIG;
    this.itinerary = this.load(STORAGE_KEY_ITINERARY, initial11DayItinerary);
  }

  load(key, fallback) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
      console.warn('LocalStorage load error, using fallback:', e);
      return fallback;
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY_ITINERARY, JSON.stringify(this.itinerary));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  }

  getDestinationConfig(code) {
    return this.destinations[code] || {
      code: code || 'default',
      name: '目的地',
      flag: '✈️',
      gradientFrom: '#38ef7d',
      gradientTo: '#11998e',
      shadowGlow: 'rgba(56, 239, 125, 0.25)',
      accentBg: 'rgba(56, 239, 125, 0.12)'
    };
  }

  getAllDays() {
    return this.itinerary;
  }

  getFilteredItinerary(destCode = 'all') {
    if (destCode === 'all') return this.itinerary;
    return this.itinerary.filter(item => item.destinationCode === destCode);
  }
}

window.tripStore = new TripStore();
