/* ==========================================================================
   Trip Note - Main App Controller (V8 - Parallel Row-Aligned Dual Column)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  let activeDestinationFilter = 'all';
  let activeViewMode = 'timeline'; // 'timeline' | 'map'
  let selectedMapDayNum = 1;
  let activeDayPlans = { 'day-5': 'A' }; // Store active plan selection ('A' | 'B') per multi-plan day
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

        // Parent Action Buttons (Cancelled if Sub-Spots exist!)
        const parentActionsHtml = !hasSubSpots ? `
          <div class="spot-actions">
            <a href="${dirUrl}" target="_blank" class="action-chip nav-btn interactive-hover">
              🧭 导航
            </a>
            <a href="${mapUrl}" target="_blank" class="action-chip interactive-hover">
              📍 定位
            </a>
            <a href="${taUrl}" target="_blank" class="action-chip ta-btn interactive-hover" title="在猫途鹰 TripAdvisor 查看网友真实点评与攻略">
              🦉 猫途鹰
            </a>
          </div>
        ` : '';

        // Generate Row Extension Column Speech Bubble (Aligned directly right next to this row!)
        let extensionColHtml = '';
        const parkingHtml = item.parking ? `<div class="bubble-parking-tag">🅿️ 停车指南: ${item.parking}</div>` : '';
        const costHtml = item.cost ? `<div class="bubble-cost-tag">💰 预估开销: ${item.cost}</div>` : '';
        const tipsHtml = item.tips ? `<div class="bubble-warning-box">${item.tips}</div>` : '';
        
        let pitstopsHtml = '';
        if (item.pitstops && item.pitstops.length > 0) {
          const tags = item.pitstops.map(p => `🛑 ${p}`).join(' · ');
          pitstopsHtml = `<div class="bubble-pitstops-box"><strong>🚗 自驾避坑/路线提醒:</strong> ${tags}</div>`;
        }

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

        // Flight Item Node Card (Primary: Name, Code, Route, Desc. Extension: Live Status Grid)
        if (item.type === 'flight') {
          const flightExtensionHtml = `
            <div class="speech-bubble-card">
              <div class="bubble-flight-header">
                <span class="bubble-flight-title">📡 实时航班信息</span>
                <span class="flight-status-chip">${item.flightStatus || '🟢 计划/准点'}</span>
              </div>
              <div class="flight-live-grid" style="margin-top: 0.4rem;">
                <div class="flight-grid-item">
                  <span class="flight-grid-label">航站楼</span>
                  <span class="flight-grid-val">${item.terminal || '看即时大牌'}</span>
                </div>
                <div class="flight-grid-item">
                  <span class="flight-grid-label">登机口</span>
                  <span class="flight-grid-val">${item.gate || '待更新'}</span>
                </div>
                <div class="flight-grid-item">
                  <span class="flight-grid-label">登机时间</span>
                  <span class="flight-grid-val">${item.boardingTime || '未公布'}</span>
                </div>
                <div class="flight-grid-item">
                  <span class="flight-grid-label">预计起飞/到达</span>
                  <span class="flight-grid-val">${item.estDeparture || item.time} ➔ ${item.estArrival || '准点'}</span>
                </div>
              </div>
              ${parkingHtml}
              ${costHtml}
              ${tipsHtml}
            </div>
          `;

          return `
            <div class="timeline-row-grid timeline-item-type-flight ${activeItemClass} ${completedClass}" id="${itemRowId}">
              <div class="timeline-primary-col">
                ${renderTimeBadgeHtml(item.time)}
                <div class="item-content">
                  <div class="flight-node-card">
                    <div class="flight-header-line">
                      <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <span style="font-size: 1.3rem;">✈️</span>
                        <span class="flight-node-title">${item.name}</span>
                        ${isCompleted ? '<span class="timeline-completed-tag">✓ 已打卡</span>' : ''}
                        <span class="flight-type-badge">${item.flightCode || '航班'}</span>
                        ${isCurrentActiveItem ? `<span class="live-active-tag">🟢 进行中</span>` : ''}
                      </div>
                    </div>
                    <div class="flight-node-sub">${item.flightRoute || ''} ${item.desc ? `· ${item.desc}` : ''}</div>
                  </div>
                </div>
              </div>
              <div class="timeline-extension-col">
                ${flightExtensionHtml}
              </div>
            </div>
          `;
        }

        // Hotel Item Node Card (Primary: Name, Room, Phone, Actions. Extension: Check-in/out info)
        if (item.type === 'hotel') {
          let hotelTimeTags = '';
          if (item.checkInTime || item.checkOutTime) {
            hotelTimeTags = `
              <div class="bubble-hotel-header">
                <span class="bubble-hotel-title">🏨 入住与退房提醒</span>
              </div>
              <div style="margin-top: 0.4rem; display: flex; flex-wrap: wrap; gap: 0.4rem;">
                ${item.checkInTime ? `<span class="bubble-hotel-time-tag">🔑 ${item.checkInTime}</span>` : ''}
                ${item.checkOutTime ? `<span class="bubble-hotel-time-tag">🚪 ${item.checkOutTime}</span>` : ''}
              </div>
            `;
          }

          const hotelExtensionHtml = `
            <div class="speech-bubble-card">
              ${hotelTimeTags}
              ${parkingHtml}
              ${costHtml}
              ${tipsHtml}
              ${pitstopsHtml}
            </div>
          `;

          return `
            <div class="timeline-row-grid timeline-item-type-hotel ${activeItemClass} ${completedClass}" id="${itemRowId}">
              <div class="timeline-primary-col">
                ${renderTimeBadgeHtml(item.time)}
                <div class="item-content">
                  <div class="hotel-node-card">
                    <div class="hotel-header-line">
                      <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span style="font-size: 1.4rem;">🏨</span>
                        <div>
                          <div class="hotel-node-title">
                            ${item.name} 
                            ${isCompleted ? '<span class="timeline-completed-tag">✓ 已打卡</span>' : ''}
                            ${isCurrentActiveItem ? `<span class="live-active-tag">🟢 当前焦点</span>` : ''}
                          </div>
                          <div class="hotel-node-sub">
                            ${item.roomType ? `<span>${item.roomType}</span>` : ''}
                            ${item.phone ? ` · 📞 ${item.phone}` : ''}
                            ${item.desc ? ` · <span>${item.desc}</span>` : ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    ${imageHtml}

                    <div class="spot-actions">
                      <a href="${dirUrl}" target="_blank" class="action-chip interactive-hover" title="导航至酒店">
                        🧭 导航
                      </a>
                      <a href="${mapUrl}" target="_blank" class="action-chip interactive-hover" title="在地图上查看坐标">
                        📍 定位
                      </a>
                      <a href="${taUrl}" target="_blank" class="action-chip ta-btn interactive-hover" title="在猫途鹰 TripAdvisor 查看住客评分与对比">
                        🦉 猫途鹰
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div class="timeline-extension-col">
                ${hotelExtensionHtml}
              </div>
            </div>
          `;
        }

        // Other Item Types Extension Bubble (Spot, Food, Transit, Drive)
        if (parkingHtml || costHtml || tipsHtml || pitstopsHtml) {
          extensionColHtml = `
            <div class="speech-bubble-card">
              ${parkingHtml}
              ${costHtml}
              ${tipsHtml}
              ${pitstopsHtml}
            </div>
          `;
        }

        // Dedicated Transit Item Node Card
        if (item.type === 'transit') {
          function renderTransitRouteCardHtml(item) {
            if (!item.lineName && !item.startStation) return '';

            const lineColor = item.lineColor || '#0284c7';
            let transitIcon = '🚆';
            if (item.transitType === 'ferry') transitIcon = '⛴️';
            else if (item.transitType === 'bus') transitIcon = '🚌';
            else if (item.transitType === 'walk') transitIcon = '🚶';
            else if (item.transitType === 'flight') transitIcon = '✈️';

            const payTipHtml = item.paymentTip ? `
              <span class="transit-pay-chip">💳 ${item.paymentTip.includes('Apple Pay') ? 'Apple Pay / 感应卡' : '刷卡乘车'}</span>
            ` : '';
            
            return `
              <div class="transit-route-card" style="border-left: 4px solid ${lineColor}; --route-color: ${lineColor};">
                <div class="transit-route-header">
                  <span class="transit-line-badge" style="background: ${lineColor};">
                    ${transitIcon} ${item.lineName || '公共交通路线'}
                  </span>
                  ${payTipHtml}
                </div>

                <div class="transit-stepper-box">
                  <div class="stepper-node start-node">
                    <span class="stepper-dot" style="border-color: ${lineColor};"></span>
                    <div class="stepper-text">
                      <div class="stepper-station-name">${item.startStation || '上车站'}</div>
                      <div class="stepper-sub-tag">上车 · 进站</div>
                    </div>
                  </div>

                  <div class="stepper-connector">
                    <div class="stepper-line" style="background: linear-gradient(90deg, ${lineColor}, #38bdf8);"></div>
                    <span class="stepper-stops-chip">⏱️ ${item.stopsCount || '途经站点'}</span>
                  </div>

                  <div class="stepper-node end-node">
                    <span class="stepper-dot end-dot" style="background: ${lineColor}; border-color: ${lineColor};"></span>
                    <div class="stepper-text">
                      <div class="stepper-station-name">${item.endStation || '下车站'}</div>
                      <div class="stepper-sub-tag">下车 · 出站</div>
                    </div>
                  </div>
                </div>

                ${item.exitInfo ? `<div class="transit-exit-info">🚶 出站指引: ${item.exitInfo}</div>` : ''}
                ${item.paymentTip ? `<div class="transit-payment-tip">${item.paymentTip}</div>` : ''}
              </div>
            `;
          }

          const transitRouteHtml = renderTransitRouteCardHtml(item);
          let transitTitleIcon = '🚆';
          if (item.transitType === 'ferry') transitTitleIcon = '⛴️';
          else if (item.transitType === 'bus') transitTitleIcon = '🚌';
          else if (item.transitType === 'walk') transitTitleIcon = '🚶';

          return `
            <div class="timeline-row-grid timeline-item-type-transit ${activeItemClass} ${completedClass}" id="${itemRowId}">
              <div class="timeline-primary-col">
                ${renderTimeBadgeHtml(item.time)}
                <div class="item-content">
                  <div class="transit-node-card">
                    <div class="transit-node-title">
                      ${transitTitleIcon} ${item.name} 
                      ${isCompleted ? '<span class="timeline-completed-tag">✓ 已打卡</span>' : ''}
                      ${isCurrentActiveItem ? `<span class="live-active-tag">🟢 当前焦点</span>` : ''}
                    </div>
                    ${item.desc ? `<div style="font-size: 0.88rem; color: var(--text-muted); margin-top: 0.3rem;">${item.desc}</div>` : ''}
                    ${transitRouteHtml}
                    ${imageHtml}
                    ${subSpotsContainerHtml}
                    ${parentActionsHtml}
                  </div>
                </div>
              </div>
              <div class="timeline-extension-col">
                ${extensionColHtml}
              </div>
            </div>
          `;
        }

        // Drive Item Node Card
        if (item.type === 'drive') {
          return `
            <div class="timeline-row-grid timeline-item-type-drive ${activeItemClass} ${completedClass}" id="${itemRowId}">
              <div class="timeline-primary-col">
                ${renderTimeBadgeHtml(item.time)}
                <div class="item-content">
                  <div class="drive-node-card">
                    <div class="drive-node-title">
                      🚗 ${item.name} (${item.distance || ''} · ${item.duration || ''}) 
                      ${isCompleted ? '<span class="timeline-completed-tag">✓ 已打卡</span>' : ''}
                      ${isCurrentActiveItem ? `<span class="live-active-tag">🟢 当前焦点</span>` : ''}
                    </div>
                    ${item.desc ? `<div style="font-size: 0.85rem; color: var(--text-muted);">${item.desc}</div>` : ''}
                    ${imageHtml}
                    ${parentActionsHtml}
                  </div>
                </div>
              </div>
              <div class="timeline-extension-col">
                ${extensionColHtml}
              </div>
            </div>
          `;
        }

        // Standard Spot / Food Item Node Card
        return `
          <div class="timeline-row-grid timeline-item-type-${item.type || 'spot'} ${activeItemClass} ${completedClass}" id="${itemRowId}">
            <div class="timeline-primary-col">
              ${renderTimeBadgeHtml(item.time)}
              <div class="item-content">
                <div class="spot-node-title">
                  ${item.type === 'food' ? '🥩' : '📍'} ${item.name} 
                  ${isCompleted ? '<span class="timeline-completed-tag">✓ 已打卡</span>' : ''}
                  ${isCurrentActiveItem ? `<span class="live-active-tag">🟢 当前焦点</span>` : ''}
                </div>
                ${item.desc ? `<div class="spot-node-desc">${item.desc}</div>` : ''}
                ${imageHtml}
                ${subSpotsContainerHtml}
                ${parentActionsHtml}
              </div>
            </div>
            <div class="timeline-extension-col">
              ${extensionColHtml}
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
              const agencyLink = `<a href="${loc.agencyUrl}" target="_blank" class="popover-source-link">🏛️ ${loc.agencyName} 官方气象参考 ↗</a>`;
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
              <a href="${loc.agencyUrl}" target="_blank" class="popover-source-link">🌐 ${loc.city} - ${loc.agencyName} 官方预报 ↗</a>
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

  window.openCurrencyModal = function(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('currency-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      const nzdInput = document.getElementById('curr-input-nzd');
      if (nzdInput && (!nzdInput.value || Number(nzdInput.value) === 0)) {
        window.setCurrencyPreset(50);
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

  window.setCurrencyPreset = function(nzdAmount, event) {
    if (event) event.stopPropagation();
    const nzdInput = document.getElementById('curr-input-nzd');
    if (nzdInput) {
      nzdInput.value = nzdAmount;
      syncCurrencyValues('NZD', nzdAmount);
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
  }

  // Setup Currency Inputs listeners
  ['nzd', 'aud', 'cny'].forEach(code => {
    const input = document.getElementById(`curr-input-${code}`);
    if (input) {
      input.addEventListener('input', (e) => {
        syncCurrencyValues(code.toUpperCase(), e.target.value);
      });
      input.addEventListener('focus', function() {
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
        const nzdInput = document.getElementById('curr-input-nzd');
        if (nzdInput && nzdInput.value) {
          syncCurrencyValues('NZD', nzdInput.value);
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

