/* ==========================================================================
   Trip Note - Google Maps Helper & Mobile App Launcher
   ========================================================================== */

const MapsHelper = {
  /**
   * Generates direct Google Maps location search URL.
   * Works on Desktop & Mobile browsers.
   */
  getSearchUrl(query, lat, lng) {
    if (lat && lng) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
    const encoded = encodeURIComponent(query);
    return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  },

  /**
   * Generates Google Maps Directions URL.
   * On mobile devices (iOS / Android), clicking this link directly opens
   * the native Google Maps app with turn-by-turn navigation ready!
   */
  getDirectionsUrl(destination) {
    const encoded = encodeURIComponent(destination);
    return `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`;
  },

  /**
   * Generates TripAdvisor direct search URL for spot / hotel / food / attraction
   */
  getTripAdvisorUrl(query) {
    const encoded = encodeURIComponent(query);
    return `https://www.tripadvisor.com/Search?q=${encoded}`;
  },

  /**
   * Generates multi-waypoint Google Maps directions URL for an entire day's itinerary.
   * Format: https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...&travelmode=driving
   */
  getDailyRouteUrl(items, travelMode = 'driving') {
    if (!Array.isArray(items) || items.length === 0) return null;

    // Extract valid geographical targets in chronological sequence
    const points = [];
    items.forEach(item => {
      let pt = null;
      if (typeof item.lat === 'number' && typeof item.lng === 'number') {
        pt = `${item.lat},${item.lng}`;
      } else if (item.mapQuery && typeof item.mapQuery === 'string') {
        pt = item.mapQuery.trim();
      }

      if (pt) {
        // Avoid consecutive duplicate waypoints
        if (points.length === 0 || points[points.length - 1] !== pt) {
          points.push(pt);
        }
      }
    });

    if (points.length < 2) return null;

    const origin = encodeURIComponent(points[0]);
    const destination = encodeURIComponent(points[points.length - 1]);

    // Google Maps allows up to 9 waypoints in standard URL
    let waypoints = points.slice(1, -1);
    if (waypoints.length > 8) {
      // Sample intermediate points if too long
      const step = (waypoints.length - 1) / 7;
      const sampled = [];
      for (let i = 0; i < 8; i++) {
        sampled.push(waypoints[Math.round(i * step)]);
      }
      waypoints = sampled;
    }

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${travelMode}`;
    if (waypoints.length > 0) {
      const waypointsParam = waypoints.map(w => encodeURIComponent(w)).join('|');
      url += `&waypoints=${waypointsParam}`;
    }

    return url;
  }
};

window.MapsHelper = MapsHelper;
