/* ==========================================================================
   Trip Note - Live Weather & Official Meteorological Agency Service
   ========================================================================== */

const WEATHER_CODE_MAP = {
  0: { icon: '☀️', text: '晴朗' },
  1: { icon: '🌤️', text: '晴间多云' },
  2: { icon: '⛅', text: '多云' },
  3: { icon: '☁️', text: '阴天' },
  45: { icon: '🌫️', text: '有雾' },
  51: { icon: '🌧️', text: '毛毛雨' },
  61: { icon: '🌧️', text: '小雨' },
  63: { icon: '🌧️', text: '中雨' },
  65: { icon: '⛈️', text: '大雨' },
  71: { icon: '🌨️', text: '小雪' },
  80: { icon: '🌦️', text: '阵雨' },
  95: { icon: '🌩️', text: '雷阵雨' }
};

class WeatherService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Helper to convert wind speed in km/h into human-friendly rating & icon
   */
  getWindInfo(speedKmH) {
    const speed = Math.round(speedKmH || 14);
    if (speed < 12) {
      return { speed, text: '微风', icon: '🍃', tag: `🍃 ${speed}km/h 微风` };
    } else if (speed >= 12 && speed < 25) {
      return { speed, text: '和风', icon: '💨', tag: `💨 ${speed}km/h 和风` };
    } else if (speed >= 25 && speed < 40) {
      return { speed, text: '强风', icon: '🌬️', tag: `🌬️ ${speed}km/h 强风` };
    } else {
      return { speed, text: '大风警告', icon: '⚠️', tag: `⚠️ ${speed}km/h 大风` };
    }
  }

  /**
   * Generates clothing & outfit advice based on temperature range (diurnal variation) & weather conditions
   */
  getClothingAdvice(minTemp, maxTemp, weatherCode = 0, windSpeed = 14) {
    let advice = '';
    const tempDiff = maxTemp - minTemp;
    const windInfo = this.getWindInfo(windSpeed);

    if (tempDiff >= 7) {
      advice += `🌡️ <b>昼夜温差较大</b>（最高 ${maxTemp}°C / 最低 ${minTemp}°C，温差达 ${tempDiff}°C），强烈推荐采用<b>‘洋葱式多层穿搭’</b>。<br>`;
    }

    if (minTemp < 6) {
      advice += '🧥 <b>早晚/夜间冰凉防寒</b>：必须准备保暖羽绒服、毛衣或抓绒内胆与防风长裤。夜间观星或户外活动体感极低。';
    } else if (minTemp >= 6 && minTemp < 12) {
      advice += '🧥 <b>早晚偏凉体感</b>：建议配备风衣/夹克、薄毛衣与长裤，海边或山谷风大注意随身携带防风外套。';
    } else if (minTemp >= 12 && minTemp < 18) {
      advice += '👔 <b>舒适宜人</b>：建议长袖衬衫、薄卫衣配休闲裤，白天户外体感非常舒服。';
    } else {
      advice += '👕 <b>温暖晴朗</b>：建议短袖 T 恤、薄款长裤/短裤，户外防晒请准备轻薄防晒衫。';
    }

    if ([51, 61, 63, 65, 80, 95].includes(weatherCode)) {
      advice += ' ☂️ 预报有雨：请随身携带折叠伞或防泼水外衣。';
    }

    if (windSpeed >= 25) {
      advice += ` <br>${windInfo.icon} <b>风力预警 (${windInfo.tag})</b>：阵风强劲，户外游览/悬崖海岸线请格外注意防风与头部保暖。`;
    } else {
      advice += ` <br>${windInfo.icon} <b>风速体感</b>：${windInfo.tag}，体感舒适。`;
    }

    return advice;
  }

  /**
   * Main method to get weather & astronomy data for a day node
   */
  /**
   * Main method to get weather & astronomy data for a day node
   * Uses Dynamic API Horizon Detection:
   * 1. Attempts API fetch for location coordinates
   * 2. Dynamically checks if target date exists in API response daily.time array with valid non-null values
   * 3. If target date is present & valid in API forecast horizon -> Renders live API forecast
   * 4. If target date exceeds API forecast horizon or fetch fails -> Automatically falls back to historical climate reference
   */
  async getWeatherForDay(day) {
    const locations = day.weatherLocations && day.weatherLocations.length > 0
      ? day.weatherLocations
      : [
          {
            city: day.city || '目的地',
            lat: day.lat,
            lng: day.lng,
            agencyName: day.destinationCode === 'au' ? 'Australia BOM' : (day.destinationCode === 'nz' ? 'MetService NZ' : '中国天气网'),
            agencyUrl: day.destinationCode === 'au' 
              ? 'https://www.bom.gov.au/' 
              : (day.destinationCode === 'nz' ? 'https://www.metservice.com/' : 'http://www.weather.com.cn/'),
            historicalRange: '10°C ~ 18°C'
          }
        ];

    // Format target date as 'YYYY-MM-DD'
    const targetDateStr = day.date ? day.date.split(' ')[0].replace(/\//g, '-') : null;

    let overallMin = 99;
    let overallMax = -99;
    let overallWind = 14;
    let overallCode = 0;
    let sunrise = '06:15';
    let sunset = '18:10';
    let hasAnyHistorical = false;

    const processedLocations = await Promise.all(
      locations.map(async (loc) => {
        // Always construct a verifiable Open-Meteo source URL for this location
        const sourceApiUrl = (loc.lat && loc.lng)
          ? `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat.toFixed(4)}&longitude=${loc.lng.toFixed(4)}&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max,sunrise,sunset&forecast_days=16&timezone=auto`
          : null;

        if (loc.lat && loc.lng) {
          try {
            const cacheKey = `${loc.lat.toFixed(2)},${loc.lng.toFixed(2)}`;
            let data;
            if (this.cache.has(cacheKey)) {
              data = this.cache.get(cacheKey);
            } else {
              // Request forecast from API with 16 days model horizon
              const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max,sunrise,sunset&forecast_days=16&timezone=auto`;
              const res = await fetch(url);
              data = await res.json();
              this.cache.set(cacheKey, data);
            }

            // Dynamically check if target date exists in API response daily.time array
            let dateIndex = -1;
            if (targetDateStr && data && data.daily && Array.isArray(data.daily.time)) {
              dateIndex = data.daily.time.indexOf(targetDateStr);
            } else if (!targetDateStr && data && data.daily && data.daily.time && data.daily.time.length > 0) {
              dateIndex = 0;
            }

            // Check if valid numerical data exists at the matched date index
            if (dateIndex !== -1 && data.daily.temperature_2m_min[dateIndex] !== null && data.daily.temperature_2m_min[dateIndex] !== undefined) {
              const minT = Math.round(data.daily.temperature_2m_min[dateIndex]);
              const maxT = Math.round(data.daily.temperature_2m_max[dateIndex]);
              const code = data.daily.weathercode[dateIndex];
              const wind = Math.round(data.daily.windspeed_10m_max[dateIndex] || 14);
              const codeInfo = WEATHER_CODE_MAP[code] || { icon: '🌤️', text: '晴朗' };
              const windInfo = this.getWindInfo(wind);

              if (data.daily.sunrise && data.daily.sunrise[dateIndex]) {
                sunrise = data.daily.sunrise[dateIndex].split('T')[1].substring(0, 5);
              }
              if (data.daily.sunset && data.daily.sunset[dateIndex]) {
                sunset = data.daily.sunset[dateIndex].split('T')[1].substring(0, 5);
              }

              if (minT < overallMin) overallMin = minT;
              if (maxT > overallMax) overallMax = maxT;
              if (wind > overallWind) overallWind = wind;
              overallCode = code;

              return {
                city: loc.city,
                tempDisplay: `${minT}°C ~ ${maxT}°C`,
                minTemp: minT,
                maxTemp: maxT,
                windInfo,
                icon: codeInfo.icon,
                text: codeInfo.text,
                agencyName: loc.agencyName,
                agencyUrl: loc.agencyUrl,
                sourceApiUrl,
                isHistorical: false
              };
            }
          } catch (e) {
            console.warn('Forecast API query failed or date out of range, fallback to historical:', e);
          }
        }

        // Target Date Exceeds API Horizon or Fetch Failure -> Fallback to Historical Reference
        hasAnyHistorical = true;
        const historicParts = (loc.historicalRange || '10°C ~ 18°C').replace(/°C/g, '').split('~').map(s => parseInt(s.trim()));
        const minT = historicParts[0] || 10;
        const maxT = historicParts[1] || 18;
        const windInfo = this.getWindInfo(14); // Spring average wind rating

        if (minT < overallMin) overallMin = minT;
        if (maxT > overallMax) overallMax = maxT;

        return {
          city: loc.city,
          tempDisplay: loc.historicalRange || `${minT}°C ~ ${maxT}°C`,
          minTemp: minT,
          maxTemp: maxT,
          windInfo,
          icon: '🌤️',
          text: '10月历史参考',
          agencyName: loc.agencyName,
          agencyUrl: loc.agencyUrl,
          sourceApiUrl,
          isHistorical: true
        };
      })
    );

    if (overallMin === 99) overallMin = 8;
    if (overallMax === -99) overallMax = 18;

    let clothingAdvice = this.getClothingAdvice(
      overallMin,
      overallMax,
      overallCode,
      overallWind
    );

    if (hasAnyHistorical) {
      clothingAdvice += `<br><br>💡 <b>气象预报范围提示</b>：目标出行日期超出该地气象服务 API 的即时预报范围。当前已自动呈现为该地 10 月历史平均气候参考；随着出行日期临近落入预报范围时，系统将自动切入即时气象预报。`;
    }

    return {
      locations: processedLocations,
      sunrise,
      sunset,
      clothingAdvice,
      overallWindInfo: this.getWindInfo(overallWind),
      isWithinForecastWindow: !hasAnyHistorical,
      primaryAgencyName: locations[0].agencyName,
      primaryAgencyUrl: locations[0].agencyUrl
    };
  }
}

window.weatherService = new WeatherService();

