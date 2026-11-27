/**
 * CausalFunnel User Analytics Tracking Script
 * Version: 1.0.0
 * Lightweight, zero-dependency client tracking library.
 * Automatically tracks page views, user clicks, and viewport dimensions with session persistence.
 */
(function (window, document) {
  'use strict';

  // Prevent multiple initializations
  if (window.__CAUSAL_TRACKER_INITIALIZED__) {
    return;
  }
  window.__CAUSAL_TRACKER_INITIALIZED__ = true;

  // Determine current script tag and options
  const currentScript = document.currentScript || (function () {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const DEFAULT_ENDPOINT = 'http://localhost:5000/api/events';
  const endpoint = (currentScript && currentScript.getAttribute('data-endpoint')) ||
                   window.CAUSAL_TRACKER_ENDPOINT ||
                   (window.location.origin.includes('localhost') ? 'http://localhost:5000/api/events' : '/api/events');

  const STORAGE_KEY = 'cf_session_id';
  const STORAGE_EXPIRY_KEY = 'cf_session_last_active';
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout

  /**
   * Generates a unique RFC4122 v4 UUID
   */
  function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Cookie helpers
   */
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  }

  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + date.toUTCString() + '; path=/; SameSite=Lax';
  }

  /**
   * Retrieves or initializes persistent session ID
   */
  function getSessionId() {
    const now = Date.now();
    let sessionId = null;
    let lastActive = null;

    try {
      sessionId = localStorage.getItem(STORAGE_KEY);
      lastActive = parseInt(localStorage.getItem(STORAGE_EXPIRY_KEY), 10);
    } catch (e) {
      // localStorage may be disabled in private mode
      sessionId = getCookie(STORAGE_KEY);
      lastActive = parseInt(getCookie(STORAGE_EXPIRY_KEY), 10);
    }

    // Check session expiration (if inactive for more than 30 mins, start new session)
    if (!sessionId || !lastActive || (now - lastActive > SESSION_TIMEOUT_MS)) {
      sessionId = 'sess_' + generateUUID();
    }

    // Update timestamp
    updateSessionActivity(sessionId);
    return sessionId;
  }

  function updateSessionActivity(sessionId) {
    const now = String(Date.now());
    try {
      localStorage.setItem(STORAGE_KEY, sessionId);
      localStorage.setItem(STORAGE_EXPIRY_KEY, now);
    } catch (e) {
      setCookie(STORAGE_KEY, sessionId, 30);
      setCookie(STORAGE_EXPIRY_KEY, now, 30);
    }
  }

  function resetSession() {
    const newSessionId = 'sess_' + generateUUID();
    updateSessionActivity(newSessionId);
    console.log('[CausalTracker] New session initiated:', newSessionId);
    return newSessionId;
  }

  /**
   * Sanitizes text snippet from clicked elements
   */
  function getElementText(el) {
    if (!el) return '';
    let text = el.innerText || el.textContent || el.value || el.alt || el.title || '';
    return text.trim().replace(/\s+/g, ' ').slice(0, 100);
  }

  /**
   * Sends event payload to backend API
   */
  function sendEvent(payload) {
    const jsonString = JSON.stringify(payload);

    // Prefer navigator.sendBeacon for fast, non-blocking telemetry that survives unloads
    let sent = false;
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const blob = new Blob([jsonString], { type: 'application/json' });
        sent = navigator.sendBeacon(endpoint, blob);
      } catch (err) {
        sent = false;
      }
    }

    if (!sent && typeof fetch === 'function') {
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonString,
        keepalive: true,
      }).catch(function (err) {
        console.warn('[CausalTracker] Event transmission failed:', err);
      });
    }
  }

  /**
   * Dispatches tracking event
   */
  function track(eventType, details) {
    const sessionId = getSessionId();
    const eventData = {
      session_id: sessionId,
      event_type: eventType,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      viewport_width: window.innerWidth || document.documentElement.clientWidth || 0,
      viewport_height: window.innerHeight || document.documentElement.clientHeight || 0,
      click_x: details && details.click_x != null ? details.click_x : null,
      click_y: details && details.click_y != null ? details.click_y : null,
      target_tag: details && details.target_tag ? details.target_tag : null,
      target_id: details && details.target_id ? details.target_id : null,
      target_class: details && details.target_class ? details.target_class : null,
      target_text: details && details.target_text ? details.target_text : null,
      metadata: details && details.metadata ? details.metadata : {}
    };

    sendEvent(eventData);
  }

  /**
   * Tracks Page View event
   */
  let lastTrackedUrl = null;
  function trackPageView(forcedUrl) {
    const currentUrl = forcedUrl || window.location.href;
    // Debounce duplicate page_view on identical URL in quick succession
    if (lastTrackedUrl === currentUrl) {
      return;
    }
    lastTrackedUrl = currentUrl;

    track('page_view', {
      metadata: {
        title: document.title,
        referrer: document.referrer || '',
        screen_resolution: window.screen ? `${window.screen.width}x${window.screen.height}` : '',
      }
    });
  }

  /**
   * Tracks Click events
   */
  function setupClickListener() {
    document.addEventListener('click', function (event) {
      const target = event.target;
      if (!target) return;

      // Extract coordinates relative to the page document (supports scrolling)
      const pageX = event.pageX != null ? event.pageX : (event.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft));
      const pageY = event.pageY != null ? event.pageY : (event.clientY + (document.documentElement.scrollTop || document.body.scrollTop));

      const targetTag = target.tagName ? target.tagName.toLowerCase() : '';
      const targetId = target.id || '';
      const targetClass = target.className && typeof target.className === 'string' ? target.className.slice(0, 100) : '';
      const targetText = getElementText(target);

      track('click', {
        click_x: Math.round(pageX),
        click_y: Math.round(pageY),
        target_tag: targetTag,
        target_id: targetId,
        target_class: targetClass,
        target_text: targetText,
      });
    }, true); // Use capture phase so all clicks are intercepted
  }

  /**
   * Hooks into SPA navigation (pushState, replaceState, popstate)
   */
  function setupSpaNavigationListener() {
    window.addEventListener('popstate', function () {
      trackPageView();
    });

    const originalPushState = history.pushState;
    if (originalPushState) {
      history.pushState = function () {
        const result = originalPushState.apply(this, arguments);
        setTimeout(function () { trackPageView(); }, 10);
        return result;
      };
    }

    const originalReplaceState = history.replaceState;
    if (originalReplaceState) {
      history.replaceState = function () {
        const result = originalReplaceState.apply(this, arguments);
        setTimeout(function () { trackPageView(); }, 10);
        return result;
      };
    }
  }

  /**
   * Initialize Tracker
   */
  function init() {
    setupClickListener();
    setupSpaNavigationListener();

    // Trigger initial page view when DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      trackPageView();
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        trackPageView();
      });
    }

    console.log('[CausalTracker] Initialized on session:', getSessionId());
  }

  // Public API exposed on window.CausalTracker
  window.CausalTracker = {
    track: track,
    trackPageView: trackPageView,
    getSessionId: getSessionId,
    resetSession: resetSession,
    endpoint: endpoint
  };

  init();

})(window, document);
