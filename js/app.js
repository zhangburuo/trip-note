/* ==========================================================================
   Trip Note - Main App Controller (V8 - Parallel Row-Aligned Dual Column)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  let activeDestinationFilter = 'all';
  let activeViewMode = 'timeline'; // 'timeline' | 'map'
  let selectedMapDayNum = 1;
  let activeDayPlans = {}; // Store active plan selection ('A' | 'B') per multi-plan day
  let expandedDays = {}; // Store expanded state per day ('day-1', 'day-2'...) - Default: Collapsed
  let simulatedDateStr = null; // e.g., '2026/10/01' for testing or null for real-time
  let currentActiveDayNum = null;
  let currentActiveItemId = null;

  // UI Elements
  const timelineContainer = document.getElementById('timeline-container');
  const filterTabsContainer = document.getElementById('filter-tabs-container');
  const viewModeTabs = document.querySelectorAll('.view-btn');
  const toastNotification = document.getElementById('toast-notification');
  const liveFocusContainer = document.getElementById('live-focus-container');

  // Initialize App UI
  initLiveFocusState();
  renderNavigationTabs();
  renderCurrentView();
  renderLiveFocusBar();

  // Helper: Get Current Effective Date (Real or Simulated)
  function getEffectiveDate() {
    if (simulatedDateStr) {
      const parts = simulatedDateStr.split('/');
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0);
    }
    return new Date();
  }

  // Initialize Live Focus: Detect if Today falls into the itinerary
  function initLiveFocusState() {
    const allDays = window.tripStore.itinerary;
    if (!allDays || allDays.length === 0) return;

    const effectiveDate = getEffectiveDate();
    const yyyy = effectiveDate.getFullYear();
    const mm = String(effectiveDate.getMonth() + 1).padStart(2, '0');
    const dd = String(effectiveDate.getDate()).padStart(2, '0');
    const targetDatePrefix = `${yyyy}/${mm}/${dd}`;

    // Find day that matches the effective date
    const matchedDay = allDays.find(d => d.date.startsWith(targetDatePrefix));

    if (matchedDay) {
      currentActiveDayNum = matchedDay.dayNum;
      // Auto-expand today's day card by default
      expandedDays[`day-${matchedDay.dayNum}`] = true;

      // Find current or upcoming item based on effective time
      const currentHours = effectiveDate.getHours();
      const currentMinutes = effectiveDate.getMinutes();
      const currentTotalMin = currentHours * 60 + currentMinutes;

      const items = matchedDay.items || [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.time) continue;
        const timeMatch = item.time.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const itemTotalMin = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
          if (currentTotalMin <= itemTotalMin + 90) { // Within 90 mins after start
            currentActiveItemId = item.id;
            break;
          }
        }
      }
      if (!currentActiveItemId && items.length > 0) {
        currentActiveItemId = items[0].id;
      }
    } else {
      currentActiveDayNum = null;
      currentActiveItemId = null;
    }
  }

  // Render Live Focus Mini Bar (Now Mode & Simulation Pill)
  function renderLiveFocusBar() {
    if (!liveFocusContainer) return;

    const allDays = window.tripStore.itinerary;
    const effectiveDate = getEffectiveDate();
    const isSimulating = !!simulatedDateStr;

    if (!currentActiveDayNum) {
      // Not in trip period: show gentle preview simulator
      liveFocusContainer.innerHTML = `
        <div class="live-focus-bar live-focus-preview">
          <div class="live-focus-left">
            <span class="live-focus-badge preview-badge">🗓️ 自由行演练模式</span>
            <span class="live-focus-text">当前时间未在行程期 (2026/09/27 - 10/07)。可快速模拟任意一天查看随身焦点：</span>
          </div>
          <div class="live-focus-actions">
            <select class="sim-day-select" onchange="setSimulatedDay(this.value)">
              <option value="">-- 选择模拟行程日 --</option>
              ${allDays.map(d => `<option value="${d.dayNum}" ${simulatedDateStr && d.date.startsWith(simulatedDateStr) ? 'selected' : ''}>DAY ${d.dayNum} · ${d.city} (${d.date.split(' ')[0]})</option>`).join('')}
            </select>
          </div>
        </div>
      `;
      return;
    }

    const todayObj = allDays.find(d => d.dayNum === currentActiveDayNum);
    if (!todayObj) return;

    const activeItem = (todayObj.items || []).find(i => i.id === currentActiveItemId) || todayObj.items[0];
    const navQuery = activeItem ? (activeItem.mapQuery || activeItem.name) : todayObj.city;
    const navUrl = window.MapsHelper.getDirectionsUrl(navQuery);

    liveFocusContainer.innerHTML = `
      <div class="live-focus-bar live-focus-active ${isSimulating ? 'is-simulated' : ''}">
        <div class="live-focus-left" onclick="jumpToToday()" style="cursor: pointer;">
          <span class="live-status-dot"></span>
          <span class="live-focus-badge ${isSimulating ? 'sim-badge' : 'today-badge'}">${isSimulating ? '🧪 模拟焦点' : '🟢 今日焦点'} · DAY ${todayObj.dayNum}</span>
          <span class="live-focus-info">
            <b>${todayObj.city}</b> · ${activeItem ? `<span class="live-item-time">${activeItem.time}</span> <span class="live-item-name">${activeItem.name}</span>` : todayObj.title}
          </span>
        </div>
        <div class="live-focus-actions">
          <a href="${navUrl}" target="_blank" class="live-focus-btn nav-btn" title="一键导航至当前焦点">
            🧭 导航直达
          </a>
          <button class="live-focus-btn scroll-btn" onclick="jumpToToday()" title="在下方展开并定位至今天">
            📍 直达位置
          </button>
          ${isSimulating ? `<button class="live-focus-btn reset-btn" onclick="clearSimulatedDay()" title="退出模拟">✕ 退出模拟</button>` : ''}
        </div>
      </div>
    `;
  }

  // Set Simulated Day Handler
  window.setSimulatedDay = function(dayNum) {
    if (!dayNum) {
      window.clearSimulatedDay();
      return;
    }
    const dayObj = window.tripStore.itinerary.find(d => d.dayNum === parseInt(dayNum, 10));
    if (dayObj) {
      const datePart = dayObj.date.split(' ')[0]; // '2026/10/01'
      simulatedDateStr = datePart;
      initLiveFocusState();
      renderCurrentView();
      renderLiveFocusBar();
      showToast(`已切换至 DAY ${dayNum} 随身焦点模拟`);
      setTimeout(() => window.jumpToToday(), 200);
    }
  };

  // Clear Simulated Day Handler
  window.clearSimulatedDay = function() {
    simulatedDateStr = null;
    initLiveFocusState();
    renderCurrentView();
    renderLiveFocusBar();
    showToast('已恢复当前真实时间');
  };

  // Jump To Today Handler
  window.jumpToToday = function(event) {
    if (event) event.stopPropagation();
    const targetDayNum = currentActiveDayNum || 1;
    const dayCard = document.getElementById(`day-card-${targetDayNum}`);
    if (dayCard) {
      if (dayCard.classList.contains('collapsed')) {
        window.toggleDayExpand(targetDayNum);
      }
      dayCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Pulse effect
      dayCard.classList.add('day-card-pulse');
      setTimeout(() => dayCard.classList.remove('day-card-pulse'), 1500);
    }
  };

  // Toggle Mobile View Mode between timeline and map
  window.toggleMobileViewMode = function(event) {
    if (event) event.stopPropagation();
    const newMode = activeViewMode === 'timeline' ? 'map' : 'timeline';
    const btn = document.querySelector(`.view-btn[data-view="${newMode}"]`);
    if (btn) btn.click();

    const viewIcon = document.getElementById('dock-view-icon');
    const viewLabel = document.getElementById('dock-view-label');
    if (viewIcon && viewLabel) {
      if (newMode === 'timeline') {
        viewIcon.textContent = '🗺️';
        viewLabel.textContent = '地图';
      } else {
        viewIcon.textContent = '⏱️';
        viewLabel.textContent = '行程';
      }
    }
  };

  // Switch Plan A / Plan B Handler
  window.switchDayPlan = function(dayId, planId, event) {
    if (event) event.stopPropagation();
    activeDayPlans[dayId] = planId;
    renderCurrentView();
  };

  // Expand / Collapse Day Handler
  window.toggleDayExpand = function(dayNum, event) {
    if (event) {
      if (event.target.closest('a, button, .weather-clothing-popover, .weather-clothing-wrapper, .weather-badge-wrapper, .weather-detail-popover, .popover-close-btn')) {
        return;
      }
    }
    const dayKey = `day-${dayNum}`;
    const cardEl = document.getElementById(`day-card-${dayNum}`);
    if (!cardEl) return;

    const willExpand = cardEl.classList.contains('collapsed');
    if (willExpand) {
      cardEl.classList.remove('collapsed');
      expandedDays[dayKey] = true;
    } else {
      cardEl.classList.add('collapsed');
      expandedDays[dayKey] = false;
    }

    const btnIcon = cardEl.querySelector('.day-toggle-arrow-btn .toggle-icon');
    if (btnIcon) {
      btnIcon.textContent = expandedDays[dayKey] ? '▲' : '▼';
    }

    updateExpandAllBtnState();
  };

  // Toggle All Days Handler
  window.toggleAllDaysExpand = function(event) {
    if (event) event.stopPropagation();
    const filteredItems = window.tripStore.getFilteredItinerary(activeDestinationFilter);
    if (!filteredItems || filteredItems.length === 0) return;

    const allExpanded = filteredItems.every(d => expandedDays[`day-${d.dayNum}`] === true);
    const targetState = !allExpanded;

    filteredItems.forEach(d => {
      const dayKey = `day-${d.dayNum}`;
      expandedDays[dayKey] = targetState;
      const cardEl = document.getElementById(`day-card-${d.dayNum}`);
      if (cardEl) {
        if (targetState) {
          cardEl.classList.remove('collapsed');
        } else {
          cardEl.classList.add('collapsed');
        }
        const btnIcon = cardEl.querySelector('.day-toggle-arrow-btn .toggle-icon');
        if (btnIcon) {
          btnIcon.textContent = targetState ? '▲' : '▼';
        }
      }
    });

    updateExpandAllBtnState();
  };

  function updateExpandAllBtnState() {
    const labelEl = document.getElementById('expand-all-btn-label');
    if (!labelEl) return;
    const filteredItems = window.tripStore.getFilteredItinerary(activeDestinationFilter);
    if (!filteredItems || filteredItems.length === 0) return;
    const allExpanded = filteredItems.every(d => expandedDays[`day-${d.dayNum}`] === true);
    labelEl.textContent = allExpanded ? '📁 收起全部行程' : '📂 展开全部行程';
  }

  // Toast Notification Helper
  function showToast(message) {
    if (!toastNotification) return;
    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 2500);
  }

  // View Mode Tabs Trigger
  viewModeTabs.forEach(btn => {
    btn.addEventListener('click', (e) => {
      viewModeTabs.forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      activeViewMode = target.getAttribute('data-view');
      renderCurrentView();
    });
  });

  // Render Navigation Tabs dynamically from Store Configuration
  function renderNavigationTabs() {
    const destinations = window.tripStore.destinations;
    let tabsHtml = `
      <button class="tab-btn active" data-dest="all">
        <span>🌏 全部行程</span>
      </button>
    `;

    Object.values(destinations).forEach(dest => {
      tabsHtml += `
        <button class="tab-btn" data-dest="${dest.code}">
          <span>${dest.flag} ${dest.name}</span>
        </button>
      `;
    });

    filterTabsContainer.innerHTML = tabsHtml;

    // Attach Click Events to Tabs
    const tabs = filterTabsContainer.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        const targetTab = e.currentTarget;
        targetTab.classList.add('active');
        activeDestinationFilter = targetTab.getAttribute('data-dest');

        // Reset map selected day if filtering
        const days = window.tripStore.getFilteredItinerary(activeDestinationFilter);
        if (days.length > 0) selectedMapDayNum = days[0].dayNum;

        renderCurrentView();
      });
    });
  }

  // Render Current Active View (Timeline vs Map)
  function renderCurrentView() {
    if (activeViewMode === 'timeline') {
      renderTimelineView();
    } else {
      renderMapView();
    }
  }

  // Helper: Render Sub-Spots Precision Action Cards
  function renderSubSpotsHtml(subSpots) {
    if (!subSpots || subSpots.length === 0) return '';

    const cardsHtml = subSpots.map(sub => {
      const isObj = typeof sub === 'object' && sub !== null;
      const subName = isObj ? sub.name : sub;
      const subQuery = isObj && sub.mapQuery ? sub.mapQuery : subName;
      const subImage = isObj && sub.imageUrl ? sub.imageUrl : null;
      const subUrl = isObj && sub.url ? sub.url : null;
      
      const searchUrl = window.MapsHelper.getSearchUrl(subQuery);
      const dirUrl = window.MapsHelper.getDirectionsUrl(subQuery);
      const taUrl = window.MapsHelper.getTripAdvisorUrl(subQuery);

      const webBtnHtml = subUrl ? `
        <a href="${subUrl}" target="_blank" class="sub-spot-btn web-btn interactive-hover" title="直接打开 DoC / MetService 官方查验页面">
          🌐 官网查验
        </a>
      ` : '';

      const imageHtml = subImage ? `
        <div class="sub-spot-image-box" onclick="openImageLightbox('${subImage}', '${subName.replace(/'/g, "\\'")}', '地标实景参考图')">
          <img src="${subImage}" alt="${subName}" class="sub-spot-image-thumb" onerror="this.parentElement.style.display='none'">
          <div class="sub-spot-image-badge">📷 真实地标</div>
        </div>
      ` : '';

      return `
        <div class="sub-spot-action-card ${subImage ? 'has-sub-image' : ''}">
          <div class="sub-spot-header-row">
            <div class="sub-spot-name-text">📍 ${subName}</div>
            <div class="sub-spot-actions-group">
              ${webBtnHtml}
              <a href="${dirUrl}" target="_blank" class="sub-spot-btn interactive-hover" title="导航至此地点">
                🧭 导航
              </a>
              <a href="${searchUrl}" target="_blank" class="sub-spot-btn interactive-hover" title="在地图上定位查看">
                📍 定位
              </a>
              <a href="${taUrl}" target="_blank" class="sub-spot-btn ta-btn interactive-hover" title="在猫途鹰 TripAdvisor 查看评价与指南">
                🦉 猫途鹰
              </a>
            </div>
          </div>
          ${imageHtml}
        </div>
      `;
    }).join('');

    return `<div class="sub-spots-container">${cardsHtml}</div>`;
  }

  // Helper to determine destination country badge(s) for a given day in exact chronological itinerary order
  function getDayDestinationBadges(day) {
    const countryList = [];

    function addCountry(code) {
      if (code && !countryList.includes(code)) {
        countryList.push(code);
      }
    }

    function detectCountriesFromText(text) {
      if (!text) return;
      const matches = [];
      const re = /(广州|北京|香港|中国|CAN|PEK|PKX|HKG|🇨🇳)|(布里斯班|悉尼|墨尔本|邦迪|屈臣湾|澳大利亚|BNE|SYD|MEL|🇦🇺)|(基督城|皇后镇|阿卡罗阿|蒂卡波|库克山|瓦纳卡|新西兰|CHC|ZQN|AKL|🇳🇿)/g;
      let m;
      while ((m = re.exec(text)) !== null) {
        if (m[1]) matches.push({ code: 'cn', index: m.index });
        else if (m[2]) matches.push({ code: 'au', index: m.index });
        else if (m[3]) matches.push({ code: 'nz', index: m.index });
      }

      matches.sort((a, b) => a.index - b.index);
      matches.forEach(m => addCountry(m.code));
    }

    // 1. Scan Day City and Title in order (high-level itinerary direction string)
    detectCountriesFromText(`${day.city || ''} ${day.title || ''}`);

    // 2. Scan Day Items in chronological order
    if (day.items && Array.isArray(day.items)) {
      day.items.forEach(item => {
        const itemText = `${item.name || ''} ${item.flightRoute || ''} ${item.desc || ''} ${item.startStation || ''} ${item.endStation || ''}`;
        detectCountriesFromText(itemText);
      });
    }

    // 3. Fallback: if no country detected yet, use day.destinationCode
    if (countryList.length === 0 && day.destinationCode) {
      addCountry(day.destinationCode.toLowerCase());
    }

    const badges = countryList.map(code => {
      const config = window.tripStore.getDestinationConfig(code);
      if (!config) return '';
      return `
        <span class="destination-chip" style="background: ${config.accentBg}; color: ${config.gradientFrom}; border-color: ${config.gradientFrom}40;">
          ${config.flag} ${config.name}
        </span>
      `;
    }).filter(Boolean);

    return `<div class="day-dest-badges-group">${badges.join('')}</div>`;
  }

  /* ==========================================================================
     Phase 3: Timeline Item Completion (Checkmark & Storage)
     ========================================================================== */
  const STORAGE_KEY_COMPLETED_ITEMS = 'TRIP_NOTE_COMPLETED_ITEMS_V1';

  function getCompletedItems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COMPLETED_ITEMS);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveCompletedItems(map) {
    try {
      localStorage.setItem(STORAGE_KEY_COMPLETED_ITEMS, JSON.stringify(map));
    } catch (e) {
      console.warn('Failed to save completed items:', e);
    }
  }

  window.toggleItemCompletion = function(itemId, event) {
    if (event) event.stopPropagation();
    const map = getCompletedItems();
    const isNowDone = !map[itemId];
    if (isNowDone) {
      map[itemId] = true;
    } else {
      delete map[itemId];
    }
    saveCompletedItems(map);
    renderTimelineView();
    if (typeof showToast === 'function') {
      showToast(isNowDone ? '✅ 已标记打卡完成！' : '↩️ 已取消打卡标记');
    }
  };

  // Global Toggle for Progressive Disclosure Detail Drawers
  window.toggleItemDetailDrawer = function(itemId, event) {
    if (event) event.stopPropagation();
    const drawerEl = document.getElementById(`drawer-${itemId}`);
    if (!drawerEl) return;
    const isExpanded = drawerEl.classList.toggle('is-expanded');
    const btn = drawerEl.querySelector('.drawer-toggle-btn');
    if (btn) {
      btn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      const label = btn.querySelector('.drawer-toggle-label');
      if (label) {
        label.textContent = isExpanded ? '收起详情与备忘' : '展开详情与备忘';
      }
    }
  };

  // Helper Parser: Smart Public Transit Extractor
  function parseTransitInfo(item) {
    const lineName = item.lineName || (item.name ? item.name.replace(/^(交通段\d*：|搭乘\s*)/, '') : '公共交通路线');
    let transitType = item.transitType || 'train';
    if (!item.transitType) {
      if (/渡轮|轮渡|Ferry|船/i.test(item.name)) transitType = 'ferry';
      else if (/公交|巴士|Bus|Shuttle|接驳/i.test(item.name)) transitType = 'bus';
      else if (/步行|Walk/i.test(item.name)) transitType = 'walk';
    }

    let lineColor = item.lineColor;
    if (!lineColor) {
      if (transitType === 'ferry') lineColor = '#00843d';
      else if (transitType === 'bus') lineColor = '#f36f21';
      else if (transitType === 'walk') lineColor = '#64748b';
      else lineColor = '#0098cd';
    }

    let transitIcon = '🚆';
    if (transitType === 'ferry') transitIcon = '⛴️';
    else if (transitType === 'bus') transitIcon = '🚌';
    else if (transitType === 'walk') transitIcon = '🚶';

    // Start & End Stations
    let startStation = item.startStation;
    let endStation = item.endStation;
    if (!startStation || !endStation) {
      if (item.subSpots && item.subSpots.length >= 2) {
        startStation = typeof item.subSpots[0] === 'string' ? item.subSpots[0] : item.subSpots[0].name;
        endStation = typeof item.subSpots[item.subSpots.length - 1] === 'string'
          ? item.subSpots[item.subSpots.length - 1]
          : item.subSpots[item.subSpots.length - 1].name;
      } else if (item.name && item.name.includes('➔')) {
        const cleanP = item.name.replace(/^[^(]*\(/, '').replace(/\)[^)]*$/, '');
        const parts = cleanP.split('➔');
        if (parts.length >= 2) {
          startStation = startStation || parts[0].trim();
          endStation = endStation || parts[1].trim();
        }
      }
    }
    startStation = startStation || '出发站';
    endStation = endStation || '到达站';

    // Platforms or Wharf tags
    let startPlatform = '';
    let endPlatform = '';
    const wharfMatchStart = startStation.match(/(Wharf\s*\d+|Stand\s*[A-Z]|\d+号站台|Platform\s*\d+)/i);
    if (wharfMatchStart) startPlatform = wharfMatchStart[0];
    const wharfMatchEnd = endStation.match(/(Wharf\s*\d+|Stand\s*[A-Z]|\d+号站台|Platform\s*\d+)/i);
    if (wharfMatchEnd) endPlatform = wharfMatchEnd[0];

    // Stops & Duration
    const stopsOrDuration = item.stopsCount || (item.duration ? `耗时约 ${item.duration}` : '快速直达');

    // Payment & Policy Pills
    const paymentPills = [];
    const rawPayTip = (item.paymentTip || '') + ' ' + (item.tips || '');
    if (/免费|无需购票|直接登船/i.test(rawPayTip)) {
      paymentPills.push({ text: '免费无须刷卡', type: 'free', icon: '🆓' });
    } else if (/Apple\s*Pay/i.test(rawPayTip)) {
      paymentPills.push({ text: 'Apple Pay / 芯片卡', type: 'pay', icon: '💳' });
    } else if (/刷卡|信用卡|Opal/i.test(rawPayTip)) {
      paymentPills.push({ text: '芯片信用卡 / 挥卡', type: 'pay', icon: '💳' });
    }
    if (/一人一卡|一卡一人/i.test(rawPayTip)) {
      paymentPills.push({ text: '严格一人一卡', type: 'policy', icon: '⚠️' });
    }

    // Cost Pill
    let costChip = null;
    if (item.cost) {
      costChip = item.cost.split('|')[0].trim();
    }

    // Exit Steps & Walking Connection Chain
    let exitSteps = [];
    if (item.exitInfo) {
      if (item.exitInfo.includes('➔')) {
        const segs = item.exitInfo.split('➔').map(s => s.trim());
        exitSteps = segs.map((seg, idx) => {
          let type = 'walk';
          let icon = '🚶';
          if (/出口|Gate|出站|出闸机/i.test(seg)) {
            type = 'exit';
            icon = '🚪';
          } else if (/酒店|海滩|门口|大厅|出发层|到达|公园/i.test(seg) || idx === segs.length - 1) {
            type = 'dest';
            icon = '🎯';
          } else if (/换乘|Stand|路公交/i.test(seg)) {
            type = 'transfer';
            icon = '🔄';
          }
          return { text: seg, type, icon };
        });
      } else {
        const matchExit = item.exitInfo.match(/([A-Za-z0-9\s/]+出口|出码头|出站|出闸机)/);
        if (matchExit) {
          exitSteps.push({ text: matchExit[0], type: 'exit', icon: '🚪' });
          const remain = item.exitInfo.replace(matchExit[0], '').replace(/^[，,、\s➔]+/, '').trim();
          if (remain) {
            exitSteps.push({ text: remain, type: 'walk', icon: '🚶' });
          }
        } else {
          exitSteps.push({ text: item.exitInfo, type: 'exit', icon: '🚪' });
        }
      }
    }

    // Uber Backup extraction
    let uberBackup = '';
    if (item.pitstops && item.pitstops.some(p => /Uber/i.test(p))) {
      uberBackup = item.pitstops.find(p => /Uber/i.test(p));
    } else if (/Uber/i.test(rawPayTip)) {
      const m = rawPayTip.match(/(Uber[^\n。！？)]+)/i);
      if (m) uberBackup = m[0];
    }

    return {
      lineName,
      lineColor,
      transitType,
      transitIcon,
      startStation,
      endStation,
      startPlatform,
      endPlatform,
      stopsOrDuration,
      paymentPills,
      costChip,
      exitSteps,
      uberBackup
    };
  }

  // Helper Parser: Smart Road Trip & Drive Extractor
  function parseDriveInfo(item) {
    let roadCode = '';
    const corpus = (item.name || '') + ' ' + (item.desc || '') + ' ' + (item.tips || '');
    const roadMatch = corpus.match(/\b(SH\s?\d+[A-Z]?)\b/i);
    if (roadMatch) {
      roadCode = roadMatch[1].replace(/\s+/, '').toUpperCase();
    } else if (/穿山隧道|隧道/i.test(item.name)) {
      roadCode = '穿山隧道';
    } else if (/公路|自驾|盘山/i.test(item.name)) {
      roadCode = '公路自驾';
    }

    const distance = item.distance || '';
    const duration = item.duration || '';

    // Milestones
    const milestones = [];
    let startPlace = '';
    let endPlace = '';
    if (item.name && item.name.includes('➔')) {
      const cleanName = item.name.replace(/^自驾段\s*\d*：/, '').replace(/\([^)]*\)/g, '').trim();
      const parts = cleanName.split('➔');
      if (parts.length >= 2) {
        startPlace = parts[0].trim();
        endPlace = parts[1].trim();
      }
    }

    if (startPlace) {
      milestones.push({ icon: '🏁', name: startPlace, isStart: true });
    }

    if (item.pitstops && item.pitstops.length > 0) {
      item.pitstops.forEach(p => {
        if (/路段|风光|平原好开|Uber/i.test(p)) return;
        const cleanP = p.replace(/\([^)]*\)/g, '').trim();
        let icon = '☕';
        if (/Lookout|观景|全景|湖|山口|巨石/i.test(cleanP)) icon = '🏞️';
        else if (/加油|BP/i.test(cleanP)) icon = '⛽';
        else if (/停车/i.test(cleanP)) icon = '🅿️';
        milestones.push({ icon, name: cleanP });
      });
    }

    if (endPlace && (!milestones.length || milestones[milestones.length - 1].name !== endPlace)) {
      milestones.push({ icon: '🎯', name: endPlace, isEnd: true });
    }

    // Road Cautions
    const cautions = [];
    if (/弯|弯道|坡陡|盘山/i.test(corpus)) {
      cautions.push({ icon: '⚠️', text: '多急弯·减速慢行' });
    }
    if (/让行|Slow Vehicle/i.test(corpus)) {
      cautions.push({ icon: '🛑', text: '设有慢车让行道 (Slow Bay)' });
    }
    if (/加油|BP Connect|补油/i.test(corpus)) {
      cautions.push({ icon: '⛽', text: '沿途加油补给提醒', isGas: true });
    }
    if (/平原|平坦|好开/i.test(corpus)) {
      cautions.push({ icon: '🟢', text: '平原开阔好开', isSafe: true });
    }
    if (/风向|横风/i.test(corpus)) {
      cautions.push({ icon: '🌬️', text: '山口注意风向' });
    }

    // Facilities & Parking
    const facilities = [];
    if (item.parking) {
      facilities.push({ icon: '🅿️', text: item.parking });
    }
    if (/卫生间|厕所|Toilet/i.test(corpus) && !facilities.some(f => f.text.includes('卫生间'))) {
      facilities.push({ icon: '🚾', text: '公共卫生间设施' });
    }

    return {
      roadCode,
      distance,
      duration,
      milestones,
      cautions,
      facilities
    };
  }

  // Helper Parser: Smart Dining & Food Extractor
  function parseFoodInfo(item) {
    const text = `${item.name || ''} ${item.desc || ''} ${item.tips || ''}`;

    // Category / Vibe badge
    let vibeIcon = '🍽️';
    let vibeName = '特色餐饮';
    if (/肉派|烘焙|Bakehouse|Bakery/i.test(text)) {
      vibeIcon = '🥧';
      vibeName = '手工烘焙 · 补给快修';
    } else if (/日料|三文鱼|Kohan|刺身|Salmon/i.test(text)) {
      vibeIcon = '🍣';
      vibeName = '湖景日料 · 水产刺身';
    } else if (/酒吧|微醺|鸡尾酒|精酿|Rooftop|Bar|Beer/i.test(text)) {
      vibeIcon = '🍸';
      vibeName = '景观酒吧 · 水岸微醺';
    } else if (/集市|美食广场|Food Court|Riverside Market|汉堡|Burgers|轻食|便当/i.test(text)) {
      vibeIcon = '🍔';
      vibeName = '水岸轻食 · 美食集市';
    } else if (/晚宴|Twenty Seven Steps|Ma Maison|正餐|餐酒馆/i.test(text)) {
      vibeIcon = '🍷';
      vibeName = '精致晚宴 · 招牌主餐';
    } else if (/Brunch|早午餐|咖啡|Espresso|Denim\s*Co|Child\s*Sister|C1/i.test(text)) {
      vibeIcon = '☕';
      vibeName = '澳式早午餐 · 咖啡';
    }

    // Reservation status
    let reserveClass = 'is-free';
    let reserveText = '⚡ 免预约 · 随到随享';
    if (/提前\s*2~3\s*周|建议提前预约|需提前预约|已预约|提前预约/i.test(text)) {
      reserveClass = 'is-required';
      reserveText = '📅 热门需提前预约';
    } else if (/机动|弹性|视饥饿程度/i.test(text)) {
      reserveClass = 'is-flex';
      reserveText = '💡 弹性餐饮 · 机动选择';
    }

    // Cost Pill
    let costChip = item.cost ? item.cost.split('(')[0].trim() : '';
    if (!costChip) {
      const m = text.match(/(~?\$[0-9]+(?:\s*-\s*\$?[0-9]+)?\s*(?:AUD|NZD)(?:\/[^\s，。)）]+)?)/i);
      if (m) costChip = m[1].trim();
    }

    // Must-try / Signature Dish Tags
    const mustTry = [];
    const dishCandidates = [
      { pattern: /高山.*鹿肉|鹿肉/i, tag: '🦌 高山鹿肉' },
      { pattern: /鸭胸|煎鸭胸/i, tag: '🦆 脆皮煎鸭胸' },
      { pattern: /高山三文鱼|三文鱼饭|三文鱼刺身/i, tag: '🐟 高山纯净三文鱼' },
      { pattern: /鲑鱼派/i, tag: '🥧 招牌鲑鱼派' },
      { pattern: /牛肉派/i, tag: '🥩 现烤牛肉派' },
      { pattern: /肉派/i, tag: '🥧 招牌现烤肉派' },
      { pattern: /白葡萄酒|长相思|Sauvignon/i, tag: '🍷 新西兰白葡萄酒' },
      { pattern: /Fish\s*&\s*Chips|炸鱼薯条/i, tag: '🍟 现炸 Fish & Chips' },
      { pattern: /手冲|Espresso|澳白|Flat White/i, tag: '☕ 精品咖啡' },
      { pattern: /鸡尾酒|特调/i, tag: '🍸 港湾特调鸡尾酒' },
      { pattern: /精酿|精酿啤酒/i, tag: '🍺 澳洲特色精酿' },
      { pattern: /汉堡|Betty'?s\s*Burgers/i, tag: '🍔 招牌安格斯汉堡' }
    ];
    dishCandidates.forEach(cand => {
      if (cand.pattern.test(text) && !mustTry.includes(cand.tag)) {
        mustTry.push(cand.tag);
      }
    });

    // Booking Website URL
    let bookingUrl = null;
    const urlMatch = text.match(/\b([a-z0-9-]+\.(?:co\.nz|com\.au|com))\b/i);
    if (urlMatch) {
      bookingUrl = `https://${urlMatch[1]}`;
    }

    return {
      vibeIcon,
      vibeName,
      reserveClass,
      reserveText,
      costChip,
      mustTry,
      bookingUrl
    };
  }

  // Helper Parser: Smart Attractions & Activities Extractor
  function parseSpotInfo(item) {
    const text = `${item.name || ''} ${item.desc || ''} ${item.tips || ''}`;

    // Category badge
    let catIcon = '📍';
    let catName = '经典景点';
    if (/徒步|Track|步道|Hooker Valley|Tasman Glacier|冰川/i.test(text)) {
      catIcon = '🥾';
      catName = '高山冰川徒步';
    } else if (/观星|银河|暗夜/i.test(text)) {
      catIcon = '🌌';
      catName = '国际暗夜保护区观星';
    } else if (/动物园|羊驼|Taronga|Featherdale|Alpaca|考拉|袋鼠|Willowbank|柳岸|奇异鸟|Kiwi/i.test(text)) {
      catIcon = '🐨';
      catName = '野生动物探访';
    } else if (/观景台|Lookout|日落|全景|Mt John|巨石阵|Castle Hill|海湾|Pukaki|缆车|Gondola/i.test(text)) {
      catIcon = '🌅';
      catName = '观景摄影地标';
    } else if (/历史|大楼|教堂|海关|广场|歌剧院|植物园|雅芳河|市区|街区/i.test(text)) {
      catIcon = '🏛️';
      catName = '城市人文漫步';
    } else if (/集市|商圈|Mall|Market|超市|采购|店铺/i.test(text)) {
      catIcon = '🛍️';
      catName = '特色集市商圈';
    } else if (/入境|行李|寄存|值机|通关|安检/i.test(text)) {
      catIcon = '🛂';
      catName = '机场通关与手续';
    }

    // Cost / Admission Pill
    let costChip = '🆓 免费游览';
    let isFree = true;
    if (item.cost && !/^\$0/i.test(item.cost)) {
      costChip = `🎟️ ${item.cost.split('(')[0].trim()}`;
      isFree = false;
    }

    // Gear & Weather Cautions
    const gearTags = [];
    if (/防风|保暖|羽绒服|外套/i.test(text)) {
      gearTags.push({ icon: '🧥', text: '防风保暖衣物' });
    }
    if (/徒步鞋/i.test(text)) {
      gearTags.push({ icon: '🥾', text: '防滑徒步鞋' });
    }
    if (/护照|SmartGate|闸机/i.test(text)) {
      gearTags.push({ icon: '🛂', text: '电子护照自助通关' });
    }
    if (/无须参加观星团|自主观星/i.test(text)) {
      gearTags.push({ icon: '✨', text: '自主漫步观星' });
    }

    return {
      catIcon,
      catName,
      costChip,
      isFree,
      gearTags
    };
  }

  // Helper Parser: Smart Lodging & Hotel Extractor
  function parseHotelInfo(item) {
    const text = `${item.name || ''} ${item.desc || ''} ${item.tips || ''}`;

    let checkInTag = '';
    let checkOutTag = '';
    let isStaying = false;

    if (item.checkInTime) {
      if (/连住/i.test(item.checkInTime)) {
        isStaying = true;
        checkInTag = `🛌 ${item.checkInTime}`;
      } else {
        checkInTag = `🔑 ${item.checkInTime}`;
      }
    }
    if (item.checkOutTime) {
      checkOutTag = `🚪 ${item.checkOutTime}`;
    }

    let roomBadge = item.roomType || '';
    if (!roomBadge) {
      if (/公寓/i.test(item.name)) roomBadge = '湖景一室公寓';
      else if (/旅馆|Motel/i.test(item.name)) roomBadge = '海滨汽车旅馆';
      else if (/酒店/i.test(item.name)) roomBadge = '星级优选客房';
      else roomBadge = '精选住宿客房';
    }

    const amenities = [];
    if (item.parking) {
      if (/免费/i.test(item.parking)) amenities.push({ icon: '🅿️', text: '住客专属免费车位' });
      else amenities.push({ icon: '🅿️', text: '提供泊车/停车楼' });
    } else {
      amenities.push({ icon: '🅿️', text: '市区停车指引' });
    }

    if (/早餐|SAILMAKER/i.test(text)) {
      amenities.push({ icon: '🍳', text: '含精选早餐' });
    }
    if (/钥匙箱|自助|密码/i.test(text)) {
      amenities.push({ icon: '🔐', text: '密码箱自助入住' });
    }

    return {
      checkInTag,
      checkOutTag,
      isStaying,
      roomBadge,
      amenities,
      phone: item.phone || ''
    };
  }

  // Helper Parser: Smart Flight & Boarding Pass Extractor
  function parseFlightInfo(item) {
    const text = `${item.name || ''} ${item.desc || ''} ${item.flightRoute || ''} ${item.terminal || ''}`;
    let depCode = 'DEP', depCity = '出发地', arrCode = 'ARR', arrCity = '目的地';

    if (/广州|CAN/i.test(text)) {
      if (depCode === 'DEP') { depCode = 'CAN'; depCity = '广州白云'; }
      else { arrCode = 'CAN'; arrCity = '广州白云'; }
    }
    if (/布里斯班|BNE/i.test(text)) {
      if (depCode === 'DEP' && !/顺利降落|到达/i.test(item.name)) { depCode = 'BNE'; depCity = '布里斯班'; }
      else { arrCode = 'BNE'; arrCity = '布里斯班'; }
    }
    if (/基督城|CHC/i.test(text)) {
      if (depCode === 'DEP' && /启程|出发|起飞/.test(item.name)) { depCode = 'CHC'; depCity = '基督城'; }
      else { arrCode = 'CHC'; arrCity = '基督城'; }
    }
    if (/悉尼|SYD/i.test(text)) {
      if (depCode === 'DEP' && /启程|出发|第一程/.test(item.name)) { depCode = 'SYD'; depCity = '悉尼'; }
      else { arrCode = 'SYD'; arrCity = '悉尼'; }
    }
    if (/香港|HKG/i.test(text)) {
      if (depCode === 'DEP' && /第二程/.test(item.name)) { depCode = 'HKG'; depCity = '香港国际'; }
      else { arrCode = 'HKG'; arrCity = '香港国际'; }
    }
    if (/北京|PEK|PKX/i.test(text)) {
      arrCode = 'PEK'; arrCity = '北京首都';
    }

    // Arrival item handling (like item-2-1 落地布里斯班)
    if (/落地|到达|降落/i.test(item.name)) {
      depCode = 'CAN'; depCity = '广州白云';
      arrCode = 'BNE'; arrCity = '布里斯班';
    }

    let duration = '跨洋直飞';
    const durMatch = text.match(/(?:飞行约|飞行)\s*([0-9]+(?:\.[0-9]+)?\s*(?:小时|h)?\s*[0-9]*\s*分?(?:钟)?)/i);
    if (durMatch) duration = durMatch[1].trim();

    return {
      depCode,
      depCity,
      arrCode,
      arrCity,
      duration,
      flightCode: item.flightCode || item.name,
      flightStatus: item.flightStatus || '🟢 计划/准点',
      terminal: item.terminal || '看即时大牌',
      gate: item.gate || '待公布',
      boardingTime: item.boardingTime || '未公布',
      estDeparture: item.estDeparture || item.time,
      estArrival: item.estArrival || '准点'
    };
  }

  // Progressive Disclosure Drawer Renderer (V41.0 - Single Unified Detail & Notes Vault)
  function renderCardDetailDrawerHtml(itemId, { desc, tips, parking, cost, pitstops, uberBackup, extraHtml = '' }) {
    const hasDesc = !!desc && desc.trim().length > 0;
    const hasTips = !!tips && tips.trim().length > 0;
    const hasParking = !!parking && parking.trim().length > 0;
    const hasCost = !!cost && cost.trim().length > 0;
    const hasUber = !!uberBackup && uberBackup.trim().length > 0;
    const hasPitstops = Array.isArray(pitstops) && pitstops.length > 0;

    if (!hasDesc && !hasTips && !hasParking && !hasCost && !hasUber && !hasPitstops && !extraHtml) {
      return '';
    }

    let pitstopsContentHtml = '';
    if (hasPitstops) {
      const tags = pitstops.map(p => `<span class="drawer-pitstop-tag">🛑 ${p}</span>`).join('');
      pitstopsContentHtml = `
        <div class="drawer-pitstops-block">
          <div class="drawer-section-title">🛑 沿途经停与路线备忘</div>
          <div class="drawer-pitstops-tags">${tags}</div>
        </div>
      `;
    }

    return `
      <div class="card-detail-drawer" id="drawer-${itemId}">
        <button type="button" class="drawer-toggle-btn" onclick="toggleItemDetailDrawer('${itemId}', event)" aria-expanded="false">
          <span class="drawer-toggle-left">
            <span class="drawer-toggle-icon">💡</span>
            <span class="drawer-toggle-label">展开详情与备忘</span>
          </span>
          <span class="drawer-toggle-chevron">▾</span>
        </button>
        <div class="drawer-collapse-container">
          <div class="drawer-collapse-inner">
            <div class="drawer-inner-content">
              ${hasDesc ? `
                <div class="drawer-desc-block">
                  <div class="drawer-section-title">📝 行程指引与说明</div>
                  <p>${desc}</p>
                </div>
              ` : ''}
              ${hasTips ? `
                <div class="drawer-tips-block">
                  <div class="drawer-section-title">⚠️ 避坑与重要提示</div>
                  <div>${tips}</div>
                </div>
              ` : ''}
              ${hasParking ? `
                <div class="drawer-parking-block">
                  <div class="drawer-section-title">🅿️ 泊车与设施指南</div>
                  <div>${parking}</div>
                </div>
              ` : ''}
              ${pitstopsContentHtml}
              ${hasCost ? `
                <div class="drawer-cost-block">
                  <div class="drawer-section-title">💰 预估开销与费用说明</div>
                  <div>${cost}</div>
                </div>
              ` : ''}
              ${hasUber ? `
                <div class="drawer-uber-block">
                  <div class="drawer-section-title">🚕 打车 (Uber) 备选方案</div>
                  <div>${uberBackup}</div>
                </div>
              ` : ''}
              ${extraHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Render Parallel Row-Aligned Dual-Column Timeline View
  function renderTimelineView() {
    const items = window.tripStore.getFilteredItinerary(activeDestinationFilter);
    const completedMap = getCompletedItems();

    if (!items || items.length === 0) {
      timelineContainer.innerHTML = `
        <div class="empty-state animate-fade-in">
          <div class="empty-icon">🧳</div>
          <div class="empty-title">暂无该目的地的行程计划</div>
          <div class="empty-desc">随时切回【全部行程】以查看完整行程安排！</div>
        </div>
      `;
      return;
    }

    let html = '';
    items.forEach((day, index) => {
      const destConfig = window.tripStore.getDestinationConfig(day.destinationCode);
      
      const destBadge = `
        <span class="destination-chip" style="background: ${destConfig.accentBg}; color: ${destConfig.gradientFrom}; border-color: ${destConfig.gradientFrom}40;">
          ${destConfig.flag} ${destConfig.name}
        </span>
      `;

      // Weather badge placeholder ID
      const weatherBadgeId = `weather-badge-day-${day.dayNum}`;

      // Plan Switcher Logic for Multi-Plan Days
      const dayPlanKey = `day-${day.dayNum}`;
      const currentPlan = activeDayPlans[dayPlanKey] || 'A';
      const hasPlanOptions = (day.items || []).some(item => item.plan);

      let planSwitcherHtml = '';
      if (hasPlanOptions) {
        planSwitcherHtml = `
          <div class="day-plan-switcher-container">
            <div class="plan-switcher-label">💡 行程方案选择:</div>
            <div class="plan-switcher-tabs">
              <button class="plan-switch-btn ${currentPlan === 'A' ? 'active plan-a-active' : ''}" onclick="switchDayPlan('${dayPlanKey}', 'A', event)">
                ☀️ Plan A (晴朗冰川全景版)
              </button>
              <button class="plan-switch-btn ${currentPlan === 'B' ? 'active plan-b-active' : ''}" onclick="switchDayPlan('${dayPlanKey}', 'B', event)">
                🌧️ Plan B (雨雪天气避雨版)
              </button>
            </div>
          </div>
        `;
      }

      // Filter Day Items according to active plan selection
      const visibleItems = (day.items || []).filter(item => !item.plan || item.plan === currentPlan);

      // Render Day's Timeline Items in Parallel Row Grids
      const timelineNodesHtml = visibleItems.map(item => {
        const isCurrentActiveItem = currentActiveItemId === item.id;
        const activeItemClass = isCurrentActiveItem ? 'is-live-active-item' : '';
        const itemRowId = `timeline-item-${item.id}`;

        const isCompleted = !!completedMap[item.id];
        const completedClass = isCompleted ? 'is-completed-item' : '';

        const mapUrl = window.MapsHelper.getSearchUrl(item.mapQuery || item.name, item.lat, item.lng);
        const dirUrl = window.MapsHelper.getDirectionsUrl(item.mapQuery || item.name);
        const taUrl = window.MapsHelper.getTripAdvisorUrl(item.mapQuery || item.name);

        const hasSubSpots = item.subSpots && item.subSpots.length > 0;
        const subSpotsContainerHtml = renderSubSpotsHtml(item.subSpots);


        const imageHtml = item.imageUrl ? `
          <div class="spot-image-card" onclick="openImageLightbox('${item.imageUrl}', '${(item.name || '').replace(/'/g, "\\'")}')">
            <img src="${item.imageUrl}" alt="${item.name}" loading="lazy" class="spot-image-thumb" onerror="this.parentElement.style.display='none'">
            <div class="spot-image-badge">📷 真实地标参考图</div>
          </div>
        ` : '';

        // Helper to calculate time duration from range strings like "07:30 - 08:30" or "11:00 - 12:20"
        function calculateTimeDuration(timeStr) {
          if (!timeStr) return null;
          const matches = timeStr.match(/(\d{1,2}:\d{2})/g);
          if (!matches || matches.length < 2) return null;

          const startStr = matches[0];
          const endStr = matches[matches.length - 1];
          const [h1, m1] = startStr.split(':').map(Number);
          const [h2, m2] = endStr.split(':').map(Number);

          let startMins = h1 * 60 + m1;
          let endMins = h2 * 60 + m2;

          if (endMins < startMins) {
            endMins += 24 * 60; // Cross midnight
          }

          const diffMins = endMins - startMins;
          if (diffMins <= 0) return null;

          const hours = Math.floor(diffMins / 60);
          const mins = diffMins % 60;

          if (hours > 0 && mins > 0) return `${hours}小时${mins}分钟`;
          if (hours > 0) return `${hours}小时`;
          return `${mins}分钟`;
        }

        function renderTimeBadgeHtml(timeStr) {
          const duration = calculateTimeDuration(timeStr);
          const durationHtml = duration ? `<div class="item-duration-chip">⏱️ ${duration}</div>` : '';
          const checkBtnHtml = `
            <button class="item-check-btn ${isCompleted ? 'is-checked' : ''}" 
                    onclick="toggleItemCompletion('${item.id}', event)" 
                    title="${isCompleted ? '取消打卡' : '标记已完成'}">
              ${isCompleted ? '✓' : ''}
            </button>
          `;
          return `
            <div class="item-time-badge">
              ${checkBtnHtml}
              <div class="item-time-text">${timeStr}</div>
              ${durationHtml}
            </div>
          `;
        }

        // Flight Item Node Card (V2 - Apple Boarding Pass & Airport Corridor)
        if (item.type === 'flight') {
          const flInfo = parseFlightInfo(item);

          const corridorHtml = `
            <div class="flight-route-corridor">
              <div class="flight-airport-box is-start">
                <span class="flight-airport-code">${flInfo.depCode}</span>
                <span class="flight-airport-name">${flInfo.depCity}</span>
              </div>
              <div class="flight-mid-track">
                <span class="flight-duration-chip">⏱️ ${flInfo.duration}</span>
                <div class="flight-mid-line">
                  <span class="flight-mid-plane">✈️</span>
                </div>
              </div>
              <div class="flight-airport-box is-end">
                <span class="flight-airport-code">${flInfo.arrCode}</span>
                <span class="flight-airport-name">${flInfo.arrCity}</span>
              </div>
            </div>
          `;

          const gridHtml = `
            <div class="flight-v2-grid">
              <div class="flight-grid-node">
                <span class="flight-grid-label">航站楼</span>
                <span class="flight-grid-value">${flInfo.terminal}</span>
              </div>
              <div class="flight-grid-node">
                <span class="flight-grid-label">登机口</span>
                <span class="flight-grid-value">${flInfo.gate}</span>
              </div>
              <div class="flight-grid-node">
                <span class="flight-grid-label">登机时间</span>
                <span class="flight-grid-value">${flInfo.boardingTime}</span>
              </div>
              <div class="flight-grid-node">
                <span class="flight-grid-label">起落时刻</span>
                <span class="flight-grid-value">${flInfo.estDeparture} ➔ ${flInfo.estArrival}</span>
              </div>
            </div>
          `;

          const drawerHtml = renderCardDetailDrawerHtml(item.id, {
            desc: item.desc,
            tips: item.tips,
            cost: item.cost
          });

          return `
            <div class="timeline-row-grid timeline-item-type-flight ${activeItemClass} ${completedClass}" id="${itemRowId}">
              <div class="timeline-primary-col">
                ${renderTimeBadgeHtml(item.time)}
                <div class="item-content">
                  <div class="flight-card-v2 apple-glass-card">
                    <div class="flight-v2-header">
                      <div class="flight-code-group">
                        <span class="flight-code-badge">✈️ ${flInfo.flightCode}</span>
                        ${isCompleted ? '<span class="timeline-completed-tag">✓ 已打卡</span>' : ''}
                        ${isCurrentActiveItem ? '<span class="live-active-tag">🟢 进行中</span>' : ''}
                      </div>
                      <span class="flight-status-badge">${flInfo.flightStatus}</span>
                    </div>

                    ${corridorHtml}
                    ${gridHtml}
                    ${imageHtml}
                    ${drawerHtml}
                  </div>
                </div>
              </div>
            </div>
          `;
        }

        // Hotel Item Node Card (V2 - Apple Liquid Glass & Luxury Key Pass)
        if (item.type === 'hotel') {
          const hInfo = parseHotelInfo(item);

          let timeCorridorHtml = '';
          if (hInfo.checkInTag || hInfo.checkOutTag) {
            timeCorridorHtml = `
              <div class="hotel-time-corridor">
                ${hInfo.checkInTag ? `<span class="hotel-time-item ${hInfo.isStaying ? 'is-staying' : 'is-checkin'}">${hInfo.checkInTag}</span>` : ''}
                ${hInfo.checkOutTag ? `<span class="hotel-time-item is-checkout">${hInfo.checkOutTag}</span>` : ''}
              </div>
            `;
          }

          let amenitiesHtml = '';
          if (hInfo.amenities && hInfo.amenities.length > 0) {
            const chips = hInfo.amenities.map(a => `<span class="hotel-fac-chip">${a.icon} ${a.text}</span>`).join('');
            amenitiesHtml = `<div class="hotel-facility-chips">${chips}</div>`;
          }

          const callBtnHtml = hInfo.phone ? `
            <a href="tel:${hInfo.phone}" class="action-chip hotel-call-btn interactive-hover" title="一键拨打酒店前台电话">
              📞 拨打电话
            </a>
          ` : '';

          const drawerHtml = renderCardDetailDrawerHtml(item.id, {
            desc: item.desc,
            tips: item.tips,
            parking: item.parking,
            cost: item.cost
          });

          return `
            <div class="timeline-row-grid timeline-item-type-hotel ${activeItemClass} ${completedClass}" id="${itemRowId}">
              <div class="timeline-primary-col">
                ${renderTimeBadgeHtml(item.time)}
                <div class="item-content">
                  <div class="hotel-card-v2 apple-glass-card">
                    <div class="hotel-v2-header">
                      <div class="hotel-v2-title-group">
                        <span style="font-size: 1.25rem;">🏨</span>
                        <span class="hotel-v2-title">${item.name}</span>
                        ${isCompleted ? '<span class="timeline-completed-tag">✓ 已打卡</span>' : ''}
                        ${isCurrentActiveItem ? '<span class="live-active-tag">🟢 当前焦点</span>' : ''}
                      </div>
                      ${hInfo.roomBadge ? `<span class="hotel-room-badge">🛏️ ${hInfo.roomBadge}</span>` : ''}
                    </div>

                    ${timeCorridorHtml}
                    ${amenitiesHtml}
                    ${imageHtml}

                    ${callBtnHtml ? `<div class="spot-actions">${callBtnHtml}</div>` : ''}

                    ${drawerHtml}
                  </div>
                </div>
              </div>
            </div>
          `;
        }

        // Dedicated Transit Item Node Card (V2 - Apple Frosted Glass Stepper & Visual Exit Chain)
        if (item.type === 'transit') {
          const tInfo = parseTransitInfo(item);

          // Payment & Policy chips HTML
          const paymentChipsHtml = tInfo.paymentPills.map(p => `
            <span class="${p.type === 'policy' ? 'transit-v2-policy-chip' : 'transit-v2-pay-chip'}">
              ${p.icon} ${p.text}
            </span>
          `).join('');

          const costChipHtml = tInfo.costChip ? `
            <span class="transit-v2-cost-chip">💰 ${tInfo.costChip}</span>
          ` : '';

          // Stepper Visual Track HTML
          const stepperHtml = `
            <div class="transit-v2-stepper">
              <div class="transit-v2-node start-node">
                <div class="transit-v2-dot-wrapper">
                  <span class="transit-v2-dot"></span>
                </div>
                <div class="transit-v2-station-meta">
                  <div class="transit-v2-station-name">${tInfo.startStation}</div>
                  <div class="transit-v2-station-sub">
                    <span class="transit-action-tag tap-on">🟢 进站挥卡</span>
                    ${tInfo.startPlatform ? `<span class="transit-platform-tag">${tInfo.startPlatform}</span>` : ''}
                  </div>
                </div>
              </div>

              <div class="transit-v2-track-connector">
                <div class="transit-v2-track-line"></div>
                <span class="transit-v2-track-badge">⏱️ ${tInfo.stopsOrDuration}</span>
              </div>

              <div class="transit-v2-node end-node">
                <div class="transit-v2-dot-wrapper">
                  <span class="transit-v2-dot end-dot"></span>
                </div>
                <div class="transit-v2-station-meta">
                  <div class="transit-v2-station-name">${tInfo.endStation}</div>
                  <div class="transit-v2-station-sub">
                    <span class="transit-action-tag tap-off">🔴 出站挥卡</span>
                    ${tInfo.endPlatform ? `<span class="transit-platform-tag">${tInfo.endPlatform}</span>` : ''}
                  </div>
                </div>
              </div>
            </div>
          `;

          // Exit chain HTML
          let exitChainHtml = '';
          if (tInfo.exitSteps && tInfo.exitSteps.length > 0) {
            const stepsHtml = tInfo.exitSteps.map((step, idx) => {
              const arrow = idx < tInfo.exitSteps.length - 1 ? '<span class="exit-chain-arrow">➔</span>' : '';
              let pillClass = 'is-walk';
              if (step.type === 'exit') pillClass = 'is-exit';
              else if (step.type === 'dest') pillClass = 'is-destination';
              return `
                <span class="exit-step-pill ${pillClass}">
                  ${step.icon} ${step.text}
                </span>
                ${arrow}
              `;
            }).join('');

            exitChainHtml = `
              <div class="transit-v2-exit-chain">
                <div class="exit-chain-header">
                  <span class="exit-chain-icon">🚪</span>
                  <span>出站指引与接驳链</span>
                </div>
                <div class="exit-chain-pills">
                  ${stepsHtml}
                </div>
              </div>
            `;
          }

          // Progressive disclosure detail drawer
          const drawerHtml = renderCardDetailDrawerHtml(item.id, {
            desc: item.desc,
            tips: item.tips,
            cost: item.cost,
            parking: item.parking,
            uberBackup: tInfo.uberBackup
          });

          return `
            <div class="timeline-row-grid timeline-item-type-transit ${activeItemClass} ${completedClass}" id="${itemRowId}">
              <div class="timeline-primary-col">
                ${renderTimeBadgeHtml(item.time)}
                <div class="item-content">
                  <div class="transit-card-v2 apple-glass-card" style="--route-color: ${tInfo.lineColor};">
                    <div class="transit-v2-header">
                      <div class="transit-v2-line-group">
                        <span class="transit-v2-line-badge">
                          ${tInfo.transitIcon} ${tInfo.lineName}
                        </span>
                        ${isCompleted ? '<span class="timeline-completed-tag">✓ 已打卡</span>' : ''}
                        ${isCurrentActiveItem ? `<span class="live-active-tag">🟢 当前焦点</span>` : ''}
                      </div>
                      <div class="transit-v2-pill-group">
                        ${paymentChipsHtml}
                        ${costChipHtml}
                      </div>
                    </div>

                    ${stepperHtml}
                    ${exitChainHtml}
                    ${imageHtml}
                    ${drawerHtml}
                  </div>
                </div>
              </div>
            </div>
          `;
        }

        // Dedicated Drive Item Node Card (V2 - Apple Frosted Glass Road Book & Milestones)
        if (item.type === 'drive') {
          const dInfo = parseDriveInfo(item);

          // Metrics Pills (Distance & Duration)
          let metricsHtml = '';
          if (dInfo.distance || dInfo.duration) {
            metricsHtml = `
              <div class="drive-v2-metrics">
                ${dInfo.distance ? `<span class="drive-metric-chip">🚗 ${dInfo.distance}</span>` : ''}
                ${dInfo.duration ? `<span class="drive-metric-chip">⏱️ ${dInfo.duration}</span>` : ''}
              </div>
            `;
          }

          // Cautions Tags
          let cautionsHtml = '';
          if (dInfo.cautions && dInfo.cautions.length > 0) {
            const tags = dInfo.cautions.map(c => `
              <span class="drive-caution-chip ${c.isSafe ? 'is-safe' : ''} ${c.isGas ? 'is-gas' : ''}">
                ${c.icon} ${c.text}
              </span>
            `).join('');
            cautionsHtml = `<div class="drive-caution-tags">${tags}</div>`;
          }

          // Milestone track
          let milestonesHtml = '';
          if (dInfo.milestones && dInfo.milestones.length > 0) {
            const mNodes = dInfo.milestones.map((m, idx) => {
              const arrow = idx < dInfo.milestones.length - 1 ? '<span class="milestone-arrow">➔</span>' : '';
              return `
                <span class="milestone-node ${m.isStart ? 'is-start' : ''} ${m.isEnd ? 'is-end' : ''}">
                  ${m.icon} ${m.name}
                </span>
                ${arrow}
              `;
            }).join('');

            milestonesHtml = `
              <div class="drive-milestone-track">
                ${mNodes}
              </div>
            `;
          }

          // Facilities / Parking bar
          let facilitiesHtml = '';
          if (dInfo.facilities && dInfo.facilities.length > 0) {
            const facChips = dInfo.facilities.map(f => `
              <span class="drive-facility-chip">${f.icon} ${f.text}</span>
            `).join('');
            facilitiesHtml = `<div class="drive-facility-bar">${facChips}</div>`;
          }

          // Progressive disclosure detail drawer
          const drawerHtml = renderCardDetailDrawerHtml(item.id, {
            desc: item.desc,
            tips: item.tips,
            parking: item.parking,
            cost: item.cost,
            pitstops: item.pitstops
          });

          return `
            <div class="timeline-row-grid timeline-item-type-drive ${activeItemClass} ${completedClass}" id="${itemRowId}">
              <div class="timeline-primary-col">
                ${renderTimeBadgeHtml(item.time)}
                <div class="item-content">
                  <div class="drive-card-v2 apple-glass-card">
                    <div class="drive-v2-header">
                      <div class="drive-v2-shield-group">
                        ${dInfo.roadCode ? `<span class="drive-shield-badge">${dInfo.roadCode}</span>` : ''}
                        <span class="drive-v2-title">${item.name}</span>
                        ${isCompleted ? '<span class="timeline-completed-tag">✓ 已打卡</span>' : ''}
                        ${isCurrentActiveItem ? '<span class="live-active-tag">🟢 当前焦点</span>' : ''}
                      </div>
                      ${metricsHtml}
                    </div>

                    ${cautionsHtml}
                    ${milestonesHtml}
                    ${facilitiesHtml}
                    ${imageHtml}
                    <div class="drive-actions-group">
                      <a href="${dirUrl}" target="_blank" class="drive-nav-btn interactive-hover" title="在 Google Maps 中一键开启自驾路线导航">
                        🧭 开启自驾导航
                      </a>
                    </div>
                    ${drawerHtml}
                  </div>
                </div>
              </div>
            </div>
          `;
        }

        // Dedicated Food Item Node Card (V2 - Apple Liquid Glass & Fine Dining)
        if (item.type === 'food') {
          const fInfo = parseFoodInfo(item);

          let mustTryHtml = '';
          if (fInfo.mustTry && fInfo.mustTry.length > 0) {
            const chips = fInfo.mustTry.map(d => `<span class="food-try-chip">${d}</span>`).join('');
            mustTryHtml = `
              <div class="food-must-try-strip">
                <span class="food-must-try-label">🍽️ 招牌必尝:</span>
                ${chips}
              </div>
            `;
          }

          const bookingBtnHtml = fInfo.bookingUrl ? `
            <a href="${fInfo.bookingUrl}" target="_blank" class="action-chip interactive-hover" style="background: rgba(244, 63, 94, 0.18); border-color: rgba(244, 63, 94, 0.4); color: #fecdd3;" title="访问官方预约网站">
              🌐 官网预约
            </a>
          ` : '';

          const drawerHtml = renderCardDetailDrawerHtml(item.id, {
            desc: item.desc,
            tips: item.tips,
            parking: item.parking,
            cost: item.cost,
            pitstops: item.pitstops
          });

          return `
            <div class="timeline-row-grid timeline-item-type-food ${activeItemClass} ${completedClass}" id="${itemRowId}">
              <div class="timeline-primary-col">
                ${renderTimeBadgeHtml(item.time)}
                <div class="item-content">
                  <div class="food-card-v2 apple-glass-card">
                    <div class="food-v2-header">
                      <div class="food-v2-title-group">
                        <span style="font-size: 1.25rem;">${fInfo.vibeIcon}</span>
                        <span class="food-v2-title">${item.name}</span>
                        ${isCompleted ? '<span class="timeline-completed-tag">✓ 已打卡</span>' : ''}
                        ${isCurrentActiveItem ? '<span class="live-active-tag">🟢 当前焦点</span>' : ''}
                      </div>
                      <div class="food-v2-pill-group">
                        <span class="food-v2-badge">${fInfo.vibeName}</span>
                        <span class="food-reserve-pill ${fInfo.reserveClass}">${fInfo.reserveText}</span>
                        ${fInfo.costChip ? `<span class="food-cost-pill">💰 ${fInfo.costChip}</span>` : ''}
                      </div>
                    </div>

                    ${mustTryHtml}
                    ${imageHtml}
                    ${subSpotsContainerHtml}

                    ${bookingBtnHtml ? `<div class="spot-actions">${bookingBtnHtml}</div>` : ''}

                    ${drawerHtml}
                  </div>
                </div>
              </div>
            </div>
          `;
        }

        // Dedicated Spot / Attractions Node Card (V2 - Apple Liquid Glass & Nature Explorer)
        const sInfo = parseSpotInfo(item);
        const durationText = calculateTimeDuration(item.time);

        let gearHtml = '';
        if (sInfo.gearTags && sInfo.gearTags.length > 0) {
          const chips = sInfo.gearTags.map(g => `<span class="spot-gear-chip">${g.icon} ${g.text}</span>`).join('');
          gearHtml = `<div class="spot-metric-bar">${chips}</div>`;
        }

        const spotDrawerHtml = renderCardDetailDrawerHtml(item.id, {
          desc: item.desc,
          tips: item.tips,
          parking: item.parking,
          cost: item.cost,
          pitstops: item.pitstops
        });

        return `
          <div class="timeline-row-grid timeline-item-type-${item.type || 'spot'} ${activeItemClass} ${completedClass}" id="${itemRowId}">
            <div class="timeline-primary-col">
              ${renderTimeBadgeHtml(item.time)}
              <div class="item-content">
                <div class="spot-card-v2 apple-glass-card">
                  <div class="spot-v2-header">
                    <div class="spot-v2-title-group">
                      <span style="font-size: 1.25rem;">${sInfo.catIcon}</span>
                      <span class="spot-v2-title">${item.name}</span>
                      ${isCompleted ? '<span class="timeline-completed-tag">✓ 已打卡</span>' : ''}
                      ${isCurrentActiveItem ? '<span class="live-active-tag">🟢 当前焦点</span>' : ''}
                    </div>
                    <div class="spot-metric-bar">
                      <span class="spot-v2-badge">${sInfo.catName}</span>
                      ${durationText ? `<span class="spot-metric-chip">⏱️ ${durationText}</span>` : ''}
                      <span class="spot-metric-chip ${sInfo.isFree ? 'is-free' : 'is-paid'}">${sInfo.costChip}</span>
                    </div>
                  </div>

                  ${gearHtml}
                  ${imageHtml}
                  ${subSpotsContainerHtml}
                  ${spotDrawerHtml}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      const dayKey = `day-${day.dayNum}`;
      const isExpanded = !!expandedDays[dayKey];
      const isTodayDay = currentActiveDayNum === day.dayNum;

      // Completion stats for day header badge
      const completedCount = visibleItems.filter(it => !!completedMap[it.id]).length;
      const totalCount = visibleItems.length;
      let completionBadgeHtml = '';
      if (totalCount > 0) {
        if (completedCount === totalCount) {
          completionBadgeHtml = `<span class="day-completion-badge is-all-done">🎉 今日全部达成</span>`;
        } else if (completedCount > 0) {
          completionBadgeHtml = `<span class="day-completion-badge">✓ 已打卡 ${completedCount}/${totalCount}</span>`;
        }
      }

      // Connected Daily Route Map (Google Maps Multi-Waypoint)
      const hasDrive = visibleItems.some(i => i.type === 'drive');
      const routeMode = hasDrive ? 'driving' : 'walking';
      const routeIcon = hasDrive ? '🚗' : '🚶';
      const routeLabel = hasDrive ? '自驾' : '游览';
      const dailyRouteUrl = window.MapsHelper ? window.MapsHelper.getDailyRouteUrl(visibleItems, routeMode) : null;
      const dailyRouteChip = dailyRouteUrl ? `
        <a href="${dailyRouteUrl}" target="_blank" class="day-route-chip interactive-hover" title="在 Google Maps 中一键查看今日全天连贯${routeLabel}路线与耗时">
          <span>${routeIcon} 全天${routeLabel}路线 ↗</span>
        </a>
      ` : '';

      html += `
        <div class="day-card animate-fade-in stagger-${(index % 4) + 1} ${isExpanded ? '' : 'collapsed'} ${isTodayDay ? 'is-today-card' : ''}" id="day-card-${day.dayNum}" style="z-index: ${100 - day.dayNum};">
          <div class="day-header" onclick="toggleDayExpand(${day.dayNum}, event)">
            <div class="day-header-row-1">
              <div class="day-badge-container">
                <span class="day-number" style="color: ${destConfig.gradientFrom};">DAY ${day.dayNum}</span>
                ${isTodayDay ? `<span class="today-ribbon-badge">📍 今日</span>` : ''}
              </div>
              <div class="day-title-box">
                <span class="day-title-text">${day.title}</span>
                <div class="day-date">
                  <span>📅 ${day.date} · 📍 ${day.city}</span>
                  <span class="day-items-count">${visibleItems.length} 项行程</span>
                  ${completionBadgeHtml}
                </div>
              </div>
              <div class="day-header-top-right">
                ${getDayDestinationBadges(day)}
              </div>
            </div>
            <div class="day-header-row-2">
              <div id="${weatherBadgeId}" class="weather-mount-box">
                <div class="weather-loading-text">🌤️ 气象获取中...</div>
                ${dailyRouteChip}
              </div>
            </div>
          </div>
          <div class="day-body">
            ${planSwitcherHtml}
            ${timelineNodesHtml}
          </div>
        </div>
      `;

      // Fetch weather & astronomy for this day (supporting multi-city & official agency links)
      if (window.weatherService) {
        window.weatherService.getWeatherForDay(day).then(w => {
          const badgeEl = document.getElementById(weatherBadgeId);
          if (badgeEl && w && w.locations) {
            const locationChips = w.locations.map(loc => {
              const windSpeed = loc.windInfo ? loc.windInfo.speed : 14;
              const windIcon = loc.windInfo ? loc.windInfo.icon : '🍃';
              const windTagFull = loc.windInfo ? loc.windInfo.tag : '🍃 14km/h 微风';
              const verifyLink = loc.sourceApiUrl
                ? `<a href="${loc.sourceApiUrl}" target="_blank" class="popover-source-link">📡 Open-Meteo API 原始数据 ↗ <span style="opacity:0.6;font-size:0.7rem;">(JSON 可直接阅读验证)</span></a>`
                : '';
              const agencyLink = `<a href="${loc.agencyUrl}" target="_blank" class="popover-source-link">🏛️ ${loc.agencyName}（${loc.city} 官方精准预报）↗</a>`;
              const historicalNote = loc.isHistorical
                ? `<br><br>💡 <b>注意</b>：目标日期超出预报窗口，当前显示为历史气候参考。`
                : '';
              return `
                <div class="weather-badge-wrapper" onclick="toggleWeatherPopover(this, event)">
                  <div class="weather-badge-chip interactive-hover" title="点击查看 ${loc.city} 天气数据来源与验证">
                    <span>${loc.icon} ${loc.city} ${loc.tempDisplay}</span>
                    <span class="weather-divider">·</span>
                    <span>${windIcon} ${windSpeed}km/h</span>
                  </div>
                  <div class="weather-detail-popover">
                    <button class="popover-close-btn" type="button" onclick="closeAllPopovers(event)" ontouchend="closeAllPopovers(event)" title="关闭" aria-label="关闭">✕</button>
                    <div class="popover-title">🌤️ ${loc.city} 天气数据详情</div>
                    <div class="popover-body">
                      🌡️ <b>温度区间</b>：${loc.tempDisplay}<br>
                      ${loc.icon} <b>天气状况</b>：${loc.isHistorical ? '10月历史气候参考' : loc.text}<br>
                      🍃 <b>风力风速</b>：${windTagFull}<br>
                      🌅 <b>日出</b>：${w.sunrise} · 🌇 <b>日落</b>：${w.sunset}${historicalNote}
                    </div>
                    <div class="popover-links-group">
                      ${verifyLink}
                      ${agencyLink}
                    </div>
                  </div>
                </div>
              `;
            }).join('');

            const sunChip = `
              <a href="${w.primaryAgencyUrl}" target="_blank" class="weather-sun-chip interactive-hover" title="点击打开 ${w.primaryAgencyName} 官方网站查看日出日落时刻">
                <span>🌅 ${w.sunrise}</span>
                <span class="weather-divider">·</span>
                <span>🌇 ${w.sunset}</span>
              </a>
            `;

            const agencyLinksHtml = w.locations.map(loc => `
              <a href="${loc.agencyUrl}" target="_blank" class="popover-source-link">🌐 ${loc.city} · ${loc.agencyName} 官方预报 ↗</a>
            `).join('');

            const clothingWrapper = `
              <div class="weather-clothing-wrapper">
                <button class="weather-clothing-btn interactive-hover" onclick="toggleClothingPopover(this, event)">
                  <span>👔 穿衣建议</span>
                </button>
                <div class="weather-clothing-popover">
                  <button class="popover-close-btn" type="button" onclick="closeAllPopovers(event)" ontouchend="closeAllPopovers(event)" title="关闭" aria-label="关闭">✕</button>
                  <div class="popover-title">👗 ${day.city} 穿衣与气象建议</div>
                  <div class="popover-body">${w.clothingAdvice}</div>
                  <div class="popover-links-group">
                    ${agencyLinksHtml}
                  </div>
                </div>
              </div>
            `;

            badgeEl.innerHTML = `
              <div class="weather-widget-group">
                ${locationChips}
                ${sunChip}
                ${clothingWrapper}
                ${dailyRouteChip}
              </div>
            `;
          }
        });
      }
    });

    timelineContainer.innerHTML = html;
    updateExpandAllBtnState();
  }

  // Render Interactive Map View
  function renderMapView() {
    const days = window.tripStore.getFilteredItinerary(activeDestinationFilter);

    if (!days || days.length === 0) {
      timelineContainer.innerHTML = `
        <div class="empty-state animate-fade-in">
          <div class="empty-icon">🗺️</div>
          <div class="empty-title">暂无地图数据</div>
        </div>
      `;
      return;
    }

    // Ensure selectedMapDayNum is valid within current filter
    let selectedDay = days.find(d => d.dayNum === selectedMapDayNum);
    if (!selectedDay) {
      selectedDay = days[0];
      selectedMapDayNum = selectedDay.dayNum;
    }

    // Day Selector Pill Row
    const dayPillsHtml = days.map(d => `
      <button class="map-day-pill ${d.dayNum === selectedMapDayNum ? 'active' : ''}" onclick="selectMapDay(${d.dayNum})">
        DAY ${d.dayNum} (${d.city})
      </button>
    `).join('');

    // Filter Items by selected Day Plan
    const dayPlanKey = `day-${selectedDay.dayNum}`;
    const currentPlan = activeDayPlans[dayPlanKey] || 'A';
    const hasPlanOptions = (selectedDay.items || []).some(item => item.plan);
    const visibleMapItems = (selectedDay.items || []).filter(item => !item.plan || item.plan === currentPlan);

    let mapPlanSwitcherHtml = '';
    if (hasPlanOptions) {
      mapPlanSwitcherHtml = `
        <div class="day-plan-switcher-container" style="margin-bottom: 0.8rem; background: rgba(15, 23, 42, 0.7); padding: 0.5rem 0.8rem; border-radius: 8px;">
          <div class="plan-switcher-label" style="font-size: 0.82rem;">💡 行程方案:</div>
          <div class="plan-switcher-tabs">
            <button class="plan-switch-btn ${currentPlan === 'A' ? 'active plan-a-active' : ''}" onclick="switchDayPlan('${dayPlanKey}', 'A', event)" style="padding: 0.25rem 0.65rem; font-size: 0.8rem;">☀️ Plan A</button>
            <button class="plan-switch-btn ${currentPlan === 'B' ? 'active plan-b-active' : ''}" onclick="switchDayPlan('${dayPlanKey}', 'B', event)" style="padding: 0.25rem 0.65rem; font-size: 0.8rem;">🌧️ Plan B</button>
          </div>
        </div>
      `;
    }

    // Default focused spot or query for Google Maps embed
    const firstSpotWithMap = visibleMapItems.find(i => i.mapQuery) || visibleMapItems[0];
    const defaultMapQuery = firstSpotWithMap ? (firstSpotWithMap.mapQuery || firstSpotWithMap.name) : selectedDay.city;
    const initialEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(defaultMapQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

    // Flatten visible items and sub-spots for the sidebar map list
    let mapListHtml = '';
    visibleMapItems.forEach(item => {
      mapListHtml += `
        <div class="map-spot-card" onclick="focusMapSpot('${encodeURIComponent(item.mapQuery || item.name)}', this)">
          <div class="map-spot-time">${item.time} · ${(item.type || 'spot').toUpperCase()} ${item.cost ? `· 💰 ${item.cost}` : ''}</div>
          <div class="map-spot-name">${item.name}</div>
          ${item.desc ? `<div class="map-spot-desc">${item.desc}</div>` : ''}
        </div>
      `;

      if (item.subSpots && item.subSpots.length > 0) {
        item.subSpots.forEach(sub => {
          const subName = typeof sub === 'string' ? sub : sub.name;
          const subQuery = typeof sub === 'object' && sub.mapQuery ? sub.mapQuery : subName;

          mapListHtml += `
            <div class="map-spot-card" style="margin-left: 1rem; border-left: 2px solid #38bdf8;" onclick="focusMapSpot('${encodeURIComponent(subQuery)}', this)">
              <div class="map-spot-time" style="color: #64748b;">📍 子地标</div>
              <div class="map-spot-name" style="font-size: 0.88rem; color: #f1f5f9;">${subName}</div>
            </div>
          `;
        });
      }
    });

    timelineContainer.innerHTML = `
      <div class="map-view-container animate-fade-in">
        <div class="map-day-selector">
          ${dayPillsHtml}
        </div>

        <div class="map-card-wrapper">
          <div class="map-frame-container">
            <iframe id="google-map-iframe" src="${initialEmbedUrl}" allowfullscreen loading="lazy"></iframe>
          </div>

          <div class="map-spots-sidebar">
            <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 0.5rem; color: #ffffff;">
              🗓️ Day ${selectedDay.dayNum} 精准地标与节点
            </div>
            ${mapPlanSwitcherHtml}
            ${mapListHtml}
          </div>
        </div>
      </div>
    `;
  }

  // Global Map View Interactivity Functions
  window.selectMapDay = function(dayNum) {
    selectedMapDayNum = dayNum;
    renderMapView();
  };

  window.focusMapSpot = function(encodedQuery, cardElement) {
    const iframe = document.getElementById('google-map-iframe');
    if (iframe) {
      iframe.src = `https://maps.google.com/maps?q=${encodedQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
    }

    const cards = document.querySelectorAll('.map-spot-card');
    cards.forEach(c => c.classList.remove('active'));
    if (cardElement) cardElement.classList.add('active');
  };

  // Weather Clothing Advice Popover Interactive Handler
  window.toggleClothingPopover = function(btnElement, event) {
    if (event) event.stopPropagation();
    const wrapper = btnElement.closest('.weather-clothing-wrapper');
    if (!wrapper) return;
    
    const currentCard = btnElement.closest('.day-card');

    // Close other popovers & remove elevated z-index from other cards
    document.querySelectorAll('.weather-clothing-wrapper').forEach(w => {
      if (w !== wrapper) {
        w.classList.remove('active');
        const c = w.closest('.day-card');
        if (c) c.classList.remove('has-active-popover');
      }
    });
    // Also close any open weather detail popovers
    document.querySelectorAll('.weather-badge-wrapper').forEach(w => {
      w.classList.remove('active');
      const c = w.closest('.day-card');
      if (c) c.classList.remove('has-active-popover');
    });

    const willBeActive = !wrapper.classList.contains('active');
    wrapper.classList.toggle('active');
    if (currentCard) {
      if (willBeActive) {
        currentCard.classList.add('has-active-popover');
      } else {
        currentCard.classList.remove('has-active-popover');
      }
    }
  };

  // Weather Detail Popover Interactive Handler (data source verification)
  window.toggleWeatherPopover = function(wrapperElement, event) {
    if (event) event.stopPropagation();
    const currentCard = wrapperElement.closest('.day-card');

    // Close all other weather detail popovers
    document.querySelectorAll('.weather-badge-wrapper').forEach(w => {
      if (w !== wrapperElement) {
        w.classList.remove('active');
        const c = w.closest('.day-card');
        if (c) c.classList.remove('has-active-popover');
      }
    });
    // Also close any open clothing popovers
    document.querySelectorAll('.weather-clothing-wrapper').forEach(w => {
      w.classList.remove('active');
      const c = w.closest('.day-card');
      if (c) c.classList.remove('has-active-popover');
    });

    const willBeActive = !wrapperElement.classList.contains('active');
    wrapperElement.classList.toggle('active');
    if (currentCard) {
      if (willBeActive) {
        currentCard.classList.add('has-active-popover');
      } else {
        currentCard.classList.remove('has-active-popover');
      }
    }
  };

  // Close All Open Popovers (Weather & Clothing)
  window.closeAllPopovers = function(event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }
    document.querySelectorAll('.weather-clothing-wrapper, .weather-badge-wrapper').forEach(w => {
      w.classList.remove('active');
      const c = w.closest('.day-card');
      if (c) c.classList.remove('has-active-popover');
    });
  };

  // Global Outside Click / Tap to Dismiss Popovers
  const handleOutsideDismiss = (e) => {
    if (!e.target.closest('.weather-clothing-wrapper, .weather-badge-wrapper')) {
      window.closeAllPopovers();
    }
  };
  document.addEventListener('click', handleOutsideDismiss);
  document.addEventListener('touchend', (e) => {
    if (!e.target.closest('.weather-clothing-wrapper, .weather-badge-wrapper')) {
      window.closeAllPopovers();
    }
  }, { passive: true });

  // Image Lightbox Modal Handlers
  window.openImageLightbox = function(imageUrl, captionText) {
    const modal = document.getElementById('image-lightbox-modal');
    const img = document.getElementById('lightbox-img');
    const caption = document.getElementById('lightbox-caption');

    if (modal && img) {
      img.src = imageUrl;
      if (caption) caption.textContent = captionText || '地标实景参考图';
      modal.classList.add('active');
    }
  };

  window.closeImageLightbox = function(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('image-lightbox-modal');
    if (modal) modal.classList.remove('active');
  };

  /* ==========================================================================
     Phase 2: Travel Checklist & Customs Vault Service
     ========================================================================== */
  const CHECKLIST_STORAGE_KEY = 'trip_note_checklist_state_v1';

  const CHECKLIST_DATA = [
    // 🛂 必备证件与凭证 (docs)
    {
      id: 'doc-passport',
      category: 'docs',
      label: '护照原件 (Passport)',
      detail: '有效期必须在 6 个月以上（出行建议大于 2027 年 4 月）；建议在手机相册、云端及邮箱备份护照首页照片。',
      critical: true
    },
    {
      id: 'doc-au-visa',
      category: 'docs',
      label: '澳大利亚电子签准签信 (VEVO / Visa Grant Notice)',
      detail: '打印 1~2 份纸质准签信备查，手机保存带有 Visa Grant Number 的电子 PDF，布里斯班/悉尼入境海关可能抽查。',
      critical: true
    },
    {
      id: 'doc-nz-eta',
      category: 'docs',
      label: '新西兰 NZeTA 电子签证与 IVL 国际游客税凭证',
      detail: '确保状态为 Issued，在官方 NZeTA App 或手机相册保存获批确认信与二维码，基督城入境检查。',
      critical: true
    },
    {
      id: 'doc-driver-license',
      category: 'docs',
      label: '中国驾照原件 + 国际翻译认证件 (NZTA 认可)',
      detail: '南岛自驾租车（Snap Rentals）取车时必须同时出示两件原件，且驾照有效期需覆盖行程结束。',
      critical: true
    },
    {
      id: 'doc-credit-cards',
      category: 'docs',
      label: '双标/多币种国际信用卡 (Visa / Mastercard)',
      detail: '租车押金预授权必须使用主驾驶员本人的凸字信用卡；确保开通境外感应免密支付与 Apple Pay。',
      critical: true
    },
    {
      id: 'doc-hotel-flight',
      category: 'docs',
      label: '全程往返机票行程单与酒店确认单 (Itinerary & Vouchers)',
      detail: '打印中英文行程单或存为离线 PDF，国际入境问询与办理退税 (TRS) 时可出示离境证明。',
      critical: false
    },

    // 🎒 关键随身行李与户外装备 (gear)
    {
      id: 'gear-adapter',
      category: 'gear',
      label: '澳标 / 新标三脚八字扁脚转换插头 (Type I)',
      detail: '澳新电源为三孔倒八字扁插（230V/50Hz）；国内标准三扁头可用，国内两扁头可用，但笔记本三脚插头需转换插头，建议带多口插线板。',
      critical: true
    },
    {
      id: 'gear-phone-mount',
      category: 'gear',
      label: '车载手机支架与车载双口快速充电器',
      detail: '新西兰南岛（SH75/SH79/SH73）盘山公路与右舵自驾导航必备，租车行一般不配手机支架。',
      critical: true
    },
    {
      id: 'gear-hiking-shoes',
      category: 'gear',
      label: '防滑专业登山徒步鞋 (鞋底洗净)',
      detail: '库克山 Hooker Valley 吊桥徒步与好牧羊人教堂碎石路必备；特别注意：入境前鞋底泥土必须洗净无草籽！',
      critical: true
    },
    {
      id: 'gear-windbreaker',
      category: 'gear',
      label: '防风防雨户外冲锋衣与保暖内胆 (洋葱式穿搭)',
      detail: '南岛春季（10月）昼夜温差极大（6°C ~ 20°C），库克山山风强劲，推荐“洋葱式”多层穿搭。',
      critical: false
    },
    {
      id: 'gear-sunscreen',
      category: 'gear',
      label: '高倍防晒霜 (SPF50+ PA++++) 与 UV 防紫外线墨镜',
      detail: '新西兰位于南极臭氧空洞边缘，日照紫外线极度强烈，即使阴天或徒步 30 分钟也极易晒伤灼伤皮肤。',
      critical: false
    },
    {
      id: 'gear-powerbank',
      category: 'gear',
      label: '大容量随身充电宝 (带容量标识，随身登机)',
      detail: '全程拍照与全天地图导航耗电较快，充电宝严禁放入托运行李，必须随身登机（额定能量不超过 100Wh）。',
      critical: false
    },
    {
      id: 'gear-offline-map',
      category: 'gear',
      label: 'Google 地图南岛离线区域预先下载',
      detail: '行前在手机 Google Maps 下载基督城、阿卡罗阿、蒂卡波湖、库克山区域离线包，防山区完全无移动网络信号。',
      critical: false
    },

    // ⚠️ 澳新海关申报避坑红线 (customs)
    {
      id: 'customs-fruit-meat',
      category: 'customs',
      label: '【红线严禁】绝对不得携带新鲜水果、蔬菜、肉制品',
      detail: '包括飞机上发放未吃完的苹果香蕉、牛肉干、鸭脖、火腿肠等，海关搜救犬嗅探极准，未申报初犯罚款 $400~$1000 澳元/纽币！',
      critical: true
    },
    {
      id: 'customs-honey',
      category: 'customs',
      label: '【红线严禁】绝对不得携带任何天然蜂蜜、蜂胶或花粉',
      detail: '新西兰拥有全球最严蜂蜜进口禁令（保护本国麦卢卡蜂群免受病害），严禁境外携带任何蜂类产品入境。',
      critical: true
    },
    {
      id: 'customs-dirty-shoes',
      category: 'customs',
      label: '【强制申报】登山鞋、徒步帐篷底面必须彻底洗净',
      detail: '鞋底粘附泥土、草籽会被生物安全局认定为高风险；入境前用刷子洗净鞋底泥巴，入境卡（Passenger Card）如实勾选 Outdoor Gear 走人工查验。',
      critical: true
    },
    {
      id: 'customs-medicine',
      category: 'customs',
      label: '【药品申报】常备药品保留原盒原包装与英文说明书',
      detail: '严禁携带含“伪麻黄碱 (Pseudoephedrine)”的感冒药（如新康泰克、白加黑等）；常规消炎药、止痛药如实申报即可通过。',
      critical: true
    },
    {
      id: 'customs-tobacco',
      category: 'customs',
      label: '【烟酒限额】香烟极严免税限制',
      detail: '澳大利亚免税限额仅 25 支香烟或 25 克烟草；新西兰免税限额仅 50 支香烟，超量必须申报纳税，瞒报将遭没收和罚金。',
      critical: false
    },
    {
      id: 'customs-declaration-card',
      category: 'customs',
      label: '【金牌保命法则】凡是拿不准的物品，一律在入境卡上勾“YES”',
      detail: '只要在旅客申报卡上如实打勾走申报通道，即使物品不允许入境也只会由官员依法销毁，绝不产生任何罚款或违法记录！',
      critical: true
    }
  ];

  let currentChecklistCategory = 'all';

  function getChecklistState() {
    try {
      const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveChecklistState(state) {
    try {
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save checklist state:', e);
    }
  }

  function updateChecklistProgressUI() {
    const state = getChecklistState();
    const total = CHECKLIST_DATA.length;
    const checkedCount = CHECKLIST_DATA.filter(item => !!state[item.id]).length;
    const percent = Math.round((checkedCount / total) * 100);

    const progressText = document.getElementById('checklist-progress-text');
    const progressFill = document.getElementById('checklist-progress-fill');
    const pill = document.getElementById('checklist-progress-pill');

    if (progressText) progressText.textContent = `${checkedCount} / ${total} 项 (${percent}%)`;
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (pill) {
      pill.textContent = `${percent}%`;
      pill.style.background = percent === 100 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.15)';
      pill.style.color = percent === 100 ? '#6ee7b7' : '#34d399';
    }
  }

  function renderChecklistItems() {
    const container = document.getElementById('checklist-items-container');
    if (!container) return;

    const state = getChecklistState();
    const filtered = CHECKLIST_DATA.filter(item => {
      if (currentChecklistCategory === 'all') return true;
      return item.category === currentChecklistCategory;
    });

    container.innerHTML = filtered.map(item => {
      const isChecked = !!state[item.id];
      return `
        <div class="checklist-item ${isChecked ? 'checked' : ''} ${item.critical ? 'critical' : ''}" onclick="toggleChecklistItem('${item.id}', event)">
          <div class="checklist-checkbox-box">
            ${isChecked ? '✓' : ''}
          </div>
          <div class="checklist-item-content">
            <div class="checklist-item-label">${item.label}</div>
            <div class="checklist-item-detail">${item.detail}</div>
          </div>
        </div>
      `;
    }).join('');

    updateChecklistProgressUI();
  }

  window.openChecklistModal = function(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('checklist-modal');
    if (modal) {
      renderChecklistItems();
      modal.classList.add('active');
    }
  };

  window.closeChecklistModal = function(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('checklist-modal');
    if (modal) modal.classList.remove('active');
  };

  window.toggleChecklistItem = function(id, event) {
    if (event) event.stopPropagation();
    const state = getChecklistState();
    state[id] = !state[id];
    saveChecklistState(state);
    renderChecklistItems();
  };

  window.filterChecklistCategory = function(cat, event) {
    if (event) event.stopPropagation();
    currentChecklistCategory = cat;
    document.querySelectorAll('.checklist-tab').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-cat') === cat);
    });
    renderChecklistItems();
  };

  window.resetChecklist = function(event) {
    if (event) event.stopPropagation();
    if (confirm('确定要重置所有备忘清单的勾选状态吗？')) {
      saveChecklistState({});
      renderChecklistItems();
      if (typeof showToast === 'function') showToast('已重置备忘清单勾选状态');
    }
  };

  // Initialize Checklist Progress Badge on startup
  updateChecklistProgressUI();

  /* ==========================================================================
     Phase 2: Global Instant Search (Cmd+K Spotlight)
     ========================================================================== */
  let searchIndex = [];
  let currentSearchResults = [];
  let selectedSearchIndex = -1;

  function buildSearchIndex() {
    searchIndex = [];
    const allDays = (window.tripStore && typeof window.tripStore.getAllDays === 'function')
      ? window.tripStore.getAllDays()
      : (window.tripStore && typeof window.tripStore.getFilteredItinerary === 'function'
          ? window.tripStore.getFilteredItinerary('all')
          : (window.tripStore ? window.tripStore.itinerary : []));
    
    allDays.forEach(day => {
      // Index Day header
      searchIndex.push({
        dayNum: day.dayNum,
        itemId: null,
        dayTitle: day.title,
        dayDate: day.date,
        dayCity: day.city,
        type: 'day',
        title: `DAY ${day.dayNum} · ${day.title}`,
        time: day.date,
        location: day.city,
        searchableText: `${day.title || ''} ${day.city || ''} ${day.date || ''} day${day.dayNum} 第${day.dayNum}天`.toLowerCase(),
        snippet: `${day.date} · ${day.city}`
      });

      // Index day items
      if (Array.isArray(day.items)) {
        day.items.forEach(item => {
          const subSpotsText = Array.isArray(item.subSpots) 
            ? item.subSpots.map(s => {
                if (typeof s === 'string') return s;
                return `${s.name || ''} ${s.tips || ''} ${s.mapQuery || ''}`;
              }).join(' ')
            : '';

          const itemTitle = item.name || item.title || item.flightCode || item.hotelName || '行程节点';
          const itemDesc = item.desc || item.notes || '';
          const itemTips = [item.tips, item.drivingTips, item.warnings, item.paymentTip, item.exitInfo].filter(Boolean).join(' ');
          const itemExtra = [
            item.flightCode,
            item.flightRoute,
            item.terminal,
            item.gate,
            item.boardingTime,
            item.hotelName,
            item.bookingRef,
            item.carModel,
            item.rentalCompany,
            item.pickupLocation,
            item.dropoffLocation,
            item.startStation,
            item.endStation,
            item.lineName,
            item.cost,
            item.mapQuery
          ].filter(Boolean).join(' ');

          const fullText = [
            itemTitle,
            item.type || '',
            itemDesc,
            itemTips,
            itemExtra,
            subSpotsText,
            day.title || '',
            day.city || '',
            `day${day.dayNum}`
          ].join(' ').toLowerCase();

          searchIndex.push({
            dayNum: day.dayNum,
            itemId: item.id,
            dayTitle: day.title,
            dayDate: day.date,
            dayCity: day.city,
            type: item.type || 'spot',
            title: itemTitle,
            time: item.time || '',
            location: day.city || '',
            searchableText: fullText,
            notes: itemDesc,
            tips: itemTips || itemExtra,
            snippet: itemDesc || itemTips || itemExtra || subSpotsText,
            plan: item.plan || null,
            item: item
          });
        });
      }
    });
  }

  function getTypeBadgeIcon(type) {
    switch (type) {
      case 'flight': return '✈️';
      case 'hotel': return '🏨';
      case 'food': return '🍽️';
      case 'drive': return '🚗';
      case 'transit': return '🚆';
      case 'walk': return '🚶';
      case 'day': return '📅';
      default: return '🏔️';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function performSearch(query) {
    const resultsContainer = document.getElementById('spotlight-results');
    const statsEl = document.getElementById('spotlight-stats');
    const clearBtn = document.getElementById('spotlight-clear-btn');
    if (!resultsContainer) return;

    const trimmed = (query || '').trim().toLowerCase();
    if (clearBtn) clearBtn.classList.toggle('visible', trimmed.length > 0);

    if (!trimmed) {
      currentSearchResults = [];
      selectedSearchIndex = -1;
      resultsContainer.innerHTML = `
        <div class="spotlight-empty-state">
          <div class="spotlight-empty-icon">🔍</div>
          <p>输入关键字检索行程、景点、航班、酒店、美食或避坑贴士</p>
          <div style="margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: center;">
            <span class="spotlight-quick-tag" onclick="fillSearchInput('航班')">✈️ 航班大牌</span>
            <span class="spotlight-quick-tag" onclick="fillSearchInput('酒店')">🏨 酒店入住</span>
            <span class="spotlight-quick-tag" onclick="fillSearchInput('还车')">🚗 租车还车</span>
            <span class="spotlight-quick-tag" onclick="fillSearchInput('三文鱼')">🐟 三文鱼</span>
            <span class="spotlight-quick-tag" onclick="fillSearchInput('Hooker')">🏔️ 库克山徒步</span>
            <span class="spotlight-quick-tag" onclick="fillSearchInput('退税')">🛍️ 退税TRS</span>
            <span class="spotlight-quick-tag" onclick="fillSearchInput('烟花')">🎆 达令港烟花</span>
          </div>
        </div>
      `;
      if (statsEl) statsEl.textContent = '输入关键词即时检索全行程';
      return;
    }

    // Split search terms for multi-word search
    const terms = trimmed.split(/\s+/).filter(t => t.length > 0);
    const matches = searchIndex.filter(entry => {
      return terms.every(term => entry.searchableText.includes(term));
    });

    currentSearchResults = matches;
    selectedSearchIndex = matches.length > 0 ? 0 : -1;

    if (statsEl) {
      statsEl.textContent = matches.length > 0 ? `找到 ${matches.length} 项相关行程` : '未找到匹配项';
    }

    if (matches.length === 0) {
      resultsContainer.innerHTML = `
        <div class="spotlight-empty-state">
          <div class="spotlight-empty-icon">🍃</div>
          <p>未找到与 "<b>${escapeHtml(trimmed)}</b>" 相关的行程或地标</p>
          <p style="font-size: 0.8rem; margin-top: 0.5rem; opacity: 0.7;">尝试搜索：酒店名称、城市、还车、徒步、航班号</p>
        </div>
      `;
      return;
    }

    // Group matches by Day
    const groups = {};
    matches.forEach((item, idx) => {
      const key = `DAY ${item.dayNum} · ${item.dayTitle}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push({ item, idx });
    });

    let html = '';
    Object.keys(groups).forEach(groupTitle => {
      const groupItems = groups[groupTitle];
      html += `
        <div class="spotlight-group">
          <div class="spotlight-group-title">
            <span>${groupTitle}</span>
            <span>${groupItems.length} 项</span>
          </div>
      `;

      groupItems.forEach(({ item, idx }) => {
        const icon = getTypeBadgeIcon(item.type);
        const isActive = idx === selectedSearchIndex;

        // Build match highlight snippet
        let snippet = item.snippet || item.notes || item.tips || item.location || '';
        if (snippet.length > 90) snippet = snippet.substring(0, 90) + '...';
        
        // Highlight terms
        let highlightedTitle = escapeHtml(item.title);
        let highlightedSnippet = escapeHtml(snippet);
        terms.forEach(term => {
          const reg = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          highlightedTitle = highlightedTitle.replace(reg, '<mark>$1</mark>');
          highlightedSnippet = highlightedSnippet.replace(reg, '<mark>$1</mark>');
        });

        html += `
          <div class="spotlight-item ${isActive ? 'active' : ''}" data-index="${idx}" onclick="selectSearchResult(${idx}, event)">
            <span class="spotlight-item-badge">${icon}</span>
            <div class="spotlight-item-info">
              <div class="spotlight-item-top">
                <span class="spotlight-item-title">${highlightedTitle}</span>
                ${item.time ? `<span class="spotlight-item-time">${item.time}</span>` : ''}
              </div>
              <div class="spotlight-item-match">${highlightedSnippet}</div>
            </div>
          </div>
        `;
      });

      html += `</div>`;
    });

    resultsContainer.innerHTML = html;
  }

  window.openSearchModal = function(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('search-modal');
    const input = document.getElementById('spotlight-search-input');
    if (modal) {
      buildSearchIndex();
      modal.classList.add('active');
      if (input) {
        input.value = '';
        input.focus();
        performSearch('');
      }
    }
  };

  window.closeSearchModal = function(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('search-modal');
    if (modal) modal.classList.remove('active');
  };

  window.clearSearchInput = function(event) {
    if (event) event.stopPropagation();
    const input = document.getElementById('spotlight-search-input');
    if (input) {
      input.value = '';
      input.focus();
      performSearch('');
    }
  };

  window.fillSearchInput = function(text) {
    const input = document.getElementById('spotlight-search-input');
    if (input) {
      input.value = text;
      input.focus();
      performSearch(text);
    }
  };

  window.selectSearchResult = function(index, event) {
    if (event) event.stopPropagation();
    const entry = currentSearchResults[index];
    if (!entry) return;

    window.closeSearchModal();

    // 1. If destination filter is active and hides this day, reset to all
    if (activeDestinationFilter !== 'all') {
      const allDays = (window.tripStore && typeof window.tripStore.getAllDays === 'function')
        ? window.tripStore.getAllDays()
        : (window.tripStore?.itinerary || []);
      const targetDay = allDays.find(d => d.dayNum === entry.dayNum);
      if (targetDay && targetDay.destinationCode !== activeDestinationFilter) {
        activeDestinationFilter = 'all';
        document.querySelectorAll('.filter-chip').forEach(c => {
          c.classList.toggle('active', c.getAttribute('data-filter') === 'all');
        });
        renderTimelineView();
      }
    }

    // 2. Switch back to timeline if in map view
    if (activeViewMode !== 'timeline') {
      const timelineBtn = document.querySelector('.view-btn[data-view="timeline"]');
      if (timelineBtn) timelineBtn.click();
    }

    // 3. If item belongs to a specific Plan (e.g. Plan B), switch to it
    if (entry.plan && entry.dayNum) {
      const dayPlanKey = `day-${entry.dayNum}`;
      if (activeDayPlans[dayPlanKey] !== entry.plan && typeof switchDayPlan === 'function') {
        switchDayPlan(dayPlanKey, entry.plan);
      }
    }

    // 4. Expand target Day card
    const dayKey = `day-${entry.dayNum}`;
    expandedDays[dayKey] = true;
    const cardEl = document.getElementById(`day-card-${entry.dayNum}`);
    if (cardEl) {
      cardEl.classList.remove('collapsed');
      const arrowIcon = cardEl.querySelector('.day-toggle-arrow-btn .toggle-icon');
      if (arrowIcon) arrowIcon.textContent = '▲';
    }
    updateExpandAllBtnState();

    // 5. Scroll to item row or day card with smooth animation
    setTimeout(() => {
      let targetEl = null;
      if (entry.itemId) {
        targetEl = document.getElementById(`timeline-item-${entry.itemId}`) || document.getElementById(entry.itemId);
      }
      if (!targetEl && cardEl) {
        targetEl = cardEl;
      }

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.classList.remove('search-target-highlight');
        // Force reflow
        void targetEl.offsetWidth;
        targetEl.classList.add('search-target-highlight');
        setTimeout(() => {
          targetEl.classList.remove('search-target-highlight');
        }, 2500);
      }

      showToast(`📍 已直达 DAY ${entry.dayNum} · ${entry.title}`);
    }, 120);
  };

  function updateSelectedSearchResultUI() {
    const items = document.querySelectorAll('.spotlight-item');
    items.forEach(el => {
      const idx = parseInt(el.getAttribute('data-index'), 10);
      el.classList.toggle('active', idx === selectedSearchIndex);
      if (idx === selectedSearchIndex) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  // Input event listener on search input
  const searchInputEl = document.getElementById('spotlight-search-input');
  if (searchInputEl) {
    searchInputEl.addEventListener('input', (e) => {
      performSearch(e.target.value);
    });
  }

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K / '/' and Arrow navigation)
  document.addEventListener('keydown', (e) => {
    const searchModal = document.getElementById('search-modal');
    const isSearchActive = searchModal && searchModal.classList.contains('active');

    // Cmd+K or Ctrl+K or '/' to toggle search
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (isSearchActive) {
        window.closeSearchModal();
      } else {
        window.openSearchModal();
      }
      return;
    }

    // '/' to search (if not typing in input)
    if (e.key === '/' && !isSearchActive && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      window.openSearchModal();
      return;
    }

    // Escape to close modals
    if (e.key === 'Escape') {
      if (isSearchActive) {
        e.preventDefault();
        window.closeSearchModal();
        return;
      }
      const checkModal = document.getElementById('checklist-modal');
      if (checkModal && checkModal.classList.contains('active')) {
        e.preventDefault();
        window.closeChecklistModal();
        return;
      }
      const currModal = document.getElementById('currency-modal');
      if (currModal && currModal.classList.contains('active')) {
        e.preventDefault();
        window.closeCurrencyModal();
        return;
      }
    }

    // Search results Arrow navigation and Enter
    if (isSearchActive && currentSearchResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedSearchIndex = (selectedSearchIndex + 1) % currentSearchResults.length;
        updateSelectedSearchResultUI();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedSearchIndex = (selectedSearchIndex - 1 + currentSearchResults.length) % currentSearchResults.length;
        updateSelectedSearchResultUI();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedSearchIndex >= 0 && selectedSearchIndex < currentSearchResults.length) {
          window.selectSearchResult(selectedSearchIndex);
        }
      }
    }
  });

  /* ==========================================================================
     Phase 3: Multi-Timezone Live Clocks
     ========================================================================== */
  function updateTimezoneClocks() {
    const now = new Date();

    function formatTz(timeZone) {
      try {
        const timeFmt = new Intl.DateTimeFormat('zh-CN', {
          timeZone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        const dateFmt = new Intl.DateTimeFormat('zh-CN', {
          timeZone,
          month: '2-digit',
          day: '2-digit',
          weekday: 'short'
        });
        return {
          time: timeFmt.format(now),
          date: dateFmt.format(now)
        };
      } catch (e) {
        return { time: '--:--', date: '--/--' };
      }
    }

    function calcHourDiff(targetTz, baseTz = 'Asia/Shanghai') {
      try {
        const targetStr = now.toLocaleString('en-US', { timeZone: targetTz });
        const baseStr = now.toLocaleString('en-US', { timeZone: baseTz });
        const diffMs = new Date(targetStr) - new Date(baseStr);
        const diffHours = Math.round(diffMs / (1000 * 60 * 60));
        return diffHours >= 0 ? `+${diffHours}h` : `${diffHours}h`;
      } catch (e) {
        return targetTz === 'Australia/Sydney' ? '+2h' : '+4h';
      }
    }

    const bj = formatTz('Asia/Shanghai');
    const syd = formatTz('Australia/Sydney');
    const nz = formatTz('Pacific/Auckland');

    const bjTimeEl = document.getElementById('tz-beijing-time');
    const bjDateEl = document.getElementById('tz-beijing-date');
    if (bjTimeEl) bjTimeEl.textContent = bj.time;
    if (bjDateEl) bjDateEl.textContent = bj.date;

    const sydTimeEl = document.getElementById('tz-sydney-time');
    const sydDateEl = document.getElementById('tz-sydney-date');
    const sydDiffEl = document.getElementById('tz-sydney-diff');
    if (sydTimeEl) sydTimeEl.textContent = syd.time;
    if (sydDateEl) sydDateEl.textContent = syd.date;
    if (sydDiffEl) sydDiffEl.textContent = calcHourDiff('Australia/Sydney');

    const nzTimeEl = document.getElementById('tz-nz-time');
    const nzDateEl = document.getElementById('tz-nz-date');
    const nzDiffEl = document.getElementById('tz-nz-diff');
    if (nzTimeEl) nzTimeEl.textContent = nz.time;
    if (nzDateEl) nzDateEl.textContent = nz.date;
    if (nzDiffEl) nzDiffEl.textContent = calcHourDiff('Pacific/Auckland');
  }

  // Initial update and periodic refresh
  updateTimezoneClocks();
  setInterval(updateTimezoneClocks, 20000);

  /* ==========================================================================
     Phase 3: 3-Way Currency Converter (NZD · AUD · CNY)
     ========================================================================== */
  const STORAGE_KEY_CURRENCY_RATES = 'TRIP_NOTE_CURRENCY_RATES_V1';

  // Reliable benchmark exchange rates (Base: NZD)
  const defaultRates = {
    NZD: 1,
    CNY: 4.35, // 1 NZD ≈ 4.35 CNY
    AUD: 0.925 // 1 NZD ≈ 0.925 AUD (1 AUD ≈ 1.08 NZD, 1 AUD ≈ 4.70 CNY)
  };

  let currentRates = { ...defaultRates };
  let activeCurrency = 'NZD';

  const CURRENCY_PRESETS = {
    NZD: {
      symbol: '$',
      label: '新西兰元',
      values: [10, 25, 50, 100, 200, 500]
    },
    AUD: {
      symbol: '$',
      label: '澳大利亚元',
      values: [10, 25, 50, 100, 200, 500]
    },
    CNY: {
      symbol: '¥',
      label: '人民币',
      values: [10, 50, 100, 200, 500, 1000]
    }
  };

  function loadCachedCurrencyRates() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CURRENCY_RATES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.rates && parsed.rates.CNY && parsed.rates.AUD) {
          currentRates = {
            NZD: 1,
            CNY: Number(parsed.rates.CNY) || defaultRates.CNY,
            AUD: Number(parsed.rates.AUD) || defaultRates.AUD
          };
          updateRateBannerUI(parsed.timestamp ? `已更新: ${new Date(parsed.timestamp).toLocaleDateString()}` : '离线缓存汇率');
          return;
        }
      }
    } catch (e) {}
    updateRateBannerUI('基准离线汇率');
  }

  function updateRateBannerUI(statusText) {
    const textEl = document.getElementById('rate-indicator-text');
    const timeEl = document.getElementById('rate-update-time');
    if (textEl) {
      const nzdCny = currentRates.CNY.toFixed(2);
      const audCny = (currentRates.CNY / currentRates.AUD).toFixed(2);
      const audNzd = (1 / currentRates.AUD).toFixed(2);
      textEl.innerHTML = `<span>1 NZD ≈ ${nzdCny} CNY</span> · <span>1 AUD ≈ ${audCny} CNY</span> · <span>1 AUD ≈ ${audNzd} NZD</span>`;
    }
    if (timeEl && statusText) {
      timeEl.textContent = statusText;
    }
  }

  function renderCurrencyPresetChips(currCode) {
    const container = document.getElementById('currency-preset-chips');
    if (!container) return;
    const config = CURRENCY_PRESETS[currCode] || CURRENCY_PRESETS.NZD;
    
    // Check current input value to highlight matched chip
    const activeInput = document.getElementById(`curr-input-${currCode.toLowerCase()}`);
    const currentVal = activeInput ? parseFloat(activeInput.value) : null;

    container.innerHTML = config.values.map(val => {
      const isSelected = !isNaN(currentVal) && Math.abs(currentVal - val) < 0.001;
      return `<button type="button" class="curr-chip ${isSelected ? 'is-selected' : ''}" onclick="setCurrencyPreset(${val}, event)">${config.symbol}${val}</button>`;
    }).join('');
  }

  function highlightSelectedPresetChip(currCode, amount) {
    const container = document.getElementById('currency-preset-chips');
    if (!container) return;
    const valNum = parseFloat(amount);
    container.querySelectorAll('.curr-chip').forEach(chip => {
      const chipText = chip.textContent.replace(/[^0-9.]/g, '');
      const chipVal = parseFloat(chipText);
      chip.classList.toggle('is-selected', !isNaN(valNum) && Math.abs(chipVal - valNum) < 0.001);
    });
  }

  window.selectActiveCurrency = function(code, event, shouldFocusInput = false) {
    if (event) event.stopPropagation();
    activeCurrency = (code || 'NZD').toUpperCase();

    // 1. Update target tabs
    const targetTabs = document.querySelectorAll('.curr-target-tab');
    targetTabs.forEach(tab => {
      const isThis = tab.getAttribute('data-curr') === activeCurrency;
      tab.classList.toggle('is-active', isThis);
      tab.setAttribute('aria-selected', isThis ? 'true' : 'false');
    });

    // 2. Update currency input rows
    const inputRows = document.querySelectorAll('.currency-input-row');
    inputRows.forEach(row => {
      const isThis = row.getAttribute('data-curr') === activeCurrency;
      row.classList.toggle('is-active-curr', isThis);
    });

    // 3. Re-render preset chips for active currency
    renderCurrencyPresetChips(activeCurrency);

    // 4. Optionally focus input
    if (shouldFocusInput) {
      const input = document.getElementById(`curr-input-${activeCurrency.toLowerCase()}`);
      if (input) input.focus();
    }
  };

  window.openCurrencyModal = function(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('currency-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      window.selectActiveCurrency(activeCurrency || 'NZD');
      const activeInput = document.getElementById(`curr-input-${activeCurrency.toLowerCase()}`);
      if (activeInput && (!activeInput.value || Number(activeInput.value) === 0)) {
        const defaultAmount = activeCurrency === 'CNY' ? 100 : 50;
        window.setCurrencyPreset(defaultAmount);
      }
    }
  };

  window.closeCurrencyModal = function(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('currency-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  const currencyModalEl = document.getElementById('currency-modal');
  if (currencyModalEl) {
    currencyModalEl.addEventListener('click', (e) => {
      if (e.target === currencyModalEl) {
        window.closeCurrencyModal();
      }
    });
  }

  window.setCurrencyPreset = function(amount, event) {
    if (event) event.stopPropagation();
    const targetCode = activeCurrency || 'NZD';
    const targetInput = document.getElementById(`curr-input-${targetCode.toLowerCase()}`);
    if (targetInput) {
      targetInput.value = amount;
      syncCurrencyValues(targetCode, amount);
      highlightSelectedPresetChip(targetCode, amount);
    }
  };

  function syncCurrencyValues(sourceCode, amount) {
    const num = parseFloat(amount);
    const nzdInput = document.getElementById('curr-input-nzd');
    const audInput = document.getElementById('curr-input-aud');
    const cnyInput = document.getElementById('curr-input-cny');

    if (isNaN(num) || num <= 0) {
      if (sourceCode !== 'NZD' && nzdInput) nzdInput.value = '';
      if (sourceCode !== 'AUD' && audInput) audInput.value = '';
      if (sourceCode !== 'CNY' && cnyInput) cnyInput.value = '';
      highlightSelectedPresetChip(sourceCode, null);
      return;
    }

    // Convert source to base NZD
    let baseNzd = num;
    if (sourceCode === 'AUD') {
      baseNzd = num / currentRates.AUD;
    } else if (sourceCode === 'CNY') {
      baseNzd = num / currentRates.CNY;
    }

    // Calculate counterparts
    const calcAud = (baseNzd * currentRates.AUD).toFixed(2);
    const calcCny = (baseNzd * currentRates.CNY).toFixed(2);
    const calcNzd = baseNzd.toFixed(2);

    if (sourceCode !== 'NZD' && nzdInput) nzdInput.value = calcNzd;
    if (sourceCode !== 'AUD' && audInput) audInput.value = calcAud;
    if (sourceCode !== 'CNY' && cnyInput) cnyInput.value = calcCny;

    highlightSelectedPresetChip(sourceCode, amount);
  }

  // Setup Currency Inputs listeners
  ['nzd', 'aud', 'cny'].forEach(code => {
    const upper = code.toUpperCase();
    const input = document.getElementById(`curr-input-${code}`);
    if (input) {
      input.addEventListener('input', (e) => {
        if (activeCurrency !== upper) {
          window.selectActiveCurrency(upper, null, false);
        }
        syncCurrencyValues(upper, e.target.value);
      });
      input.addEventListener('focus', function() {
        if (activeCurrency !== upper) {
          window.selectActiveCurrency(upper, null, false);
        }
        this.select();
      });
    }
  });

  window.refreshLiveRates = async function(event) {
    if (event) event.stopPropagation();
    const timeEl = document.getElementById('rate-update-time');
    if (timeEl) timeEl.textContent = '🔄 正在获取最新外汇牌价...';
    try {
      const resp = await fetch('https://open.er-api.com/v6/latest/NZD');
      if (!resp.ok) throw new Error('Network response not ok');
      const data = await resp.json();
      if (data && data.rates && data.rates.CNY && data.rates.AUD) {
        currentRates = {
          NZD: 1,
          CNY: Number(data.rates.CNY),
          AUD: Number(data.rates.AUD)
        };
        localStorage.setItem(STORAGE_KEY_CURRENCY_RATES, JSON.stringify({
          rates: currentRates,
          timestamp: Date.now()
        }));
        updateRateBannerUI(`✅ 实时汇率 (${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })})`);
        const activeInput = document.getElementById(`curr-input-${activeCurrency.toLowerCase()}`);
        if (activeInput && activeInput.value) {
          syncCurrencyValues(activeCurrency, activeInput.value);
        }
        if (typeof showToast === 'function') showToast('💱 汇率数据已成功更新为最新牌价！');
        return;
      }
      throw new Error('Invalid rate payload');
    } catch (e) {
      console.warn('Currency live fetch failed, fallback to offline rates:', e);
      updateRateBannerUI('离线基准汇率 (网络未连接)');
      if (typeof showToast === 'function') showToast('⚠️ 暂无网络，已沿用本地离线汇率');
    }
  };

  loadCachedCurrencyRates();

  /* ==========================================================================
     Phase 3: Emergency Print / A4 Sheet Trigger
     ========================================================================== */
  window.triggerPrintItinerary = function(event) {
    if (event) event.stopPropagation();

    // 1. Expand all days in DOM and state to ensure complete printed output
    const allDays = (window.tripStore && window.tripStore.getAllDays) 
      ? window.tripStore.getAllDays() 
      : (window.tripStore && window.tripStore.itinerary) || [];
    allDays.forEach(day => {
      expandedDays[`day-${day.dayNum}`] = true;
      const card = document.getElementById(`day-card-${day.dayNum}`);
      if (card) {
        card.classList.remove('collapsed');
        const arrowIcon = card.querySelector('.day-toggle-arrow-btn .toggle-icon');
        if (arrowIcon) arrowIcon.textContent = '▲';
      }
    });
    updateExpandAllBtnState();

    // 2. Open print dialog
    setTimeout(() => {
      window.print();
    }, 150);
  };
});

