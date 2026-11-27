/**
 * CausalFunnel Production Telemetry & Analytics Tracking Script
 * Version: 2.0.0
 * Lightweight (<4KB), non-blocking, resilient client analytics library.
 * Features:
 * - Session tracking with 30-min inactivity sliding window (localStorage + Cookie fallback)
 * - Automatic page_view & click capturing with coordinate normalization
 * - DOM element CSS selector path generation
 * - Micro-batched event queue with instant flush on unload (sendBeacon + fetch keepalive)
 * - SPA route change detection (History API pushState/replaceState/popstate)
 * - Scroll depth tracking (50%, 90%)
 * - Safe fail-open error handling (never crashes host application)
 */
(function (window, document) {
  'use strict';

  try {
    if (window.__CAUSAL_TRACKER_INITIALIZED__) {
      return;
    }
    window.__CAUSAL_TRACKER_INITIALIZED__ = true;

    // Detect endpoint from script tag attribute, global variable, or default
    const currentScript = document.currentScript || (function () {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

    const endpoint = (currentScript && currentScript.getAttribute('data-endpoint')) ||
                     window.CAUSAL_TRACKER_ENDPOINT ||
                     (window.location.origin.includes('localhost') ? 'http://localhost:5000/api/events' : '/api/events');

    const STORAGE_KEY = 'cf_session_id';
    const STORAGE_EXPIRY_KEY = 'cf_session_last_active';
    const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

    // In-memory micro-batch queue
    const eventQueue = [];
    let flushTimer = null;
    const FLUSH_INTERVAL_MS = 1200;
    const MAX_QUEUE_SIZE = 10;

    /**
     * Generates RFC4122 v4 UUID
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
     * Cookie management fallback
     */
    function getCookie(name) {
      try {
        const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
        return match ? decodeURIComponent(match[3]) : null;
      } catch (e) {
        return null;
      }
    }

    function setCookie(name, value, days) {
      try {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + date.toUTCString() + '; path=/; SameSite=Lax';
      } catch (e) {}
    }

    /**
     * Retrieve or initialize active session ID
     */
    function getSessionId() {
      const now = Date.now();
      let sessionId = null;
      let lastActive = null;

      try {
        sessionId = localStorage.getItem(STORAGE_KEY);
        lastActive = parseInt(localStorage.getItem(STORAGE_EXPIRY_KEY), 10);
      } catch (e) {
        sessionId = getCookie(STORAGE_KEY);
        lastActive = parseInt(getCookie(STORAGE_EXPIRY_KEY), 10);
      }

      if (!sessionId || !lastActive || (now - lastActive > SESSION_TIMEOUT_MS)) {
        sessionId = 'sess_' + generateUUID();
      }

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
      console.log('[CausalTracker] Rotated to new session:', newSessionId);
      return newSessionId;
    }

    /**
     * Generates a concise CSS selector path for DOM elements (e.g. "button#add-cart.btn-primary")
     */
    function getDomSelector(el) {
      if (!el || el === document.body || el === document.documentElement) return '';
      try {
        let path = el.tagName ? el.tagName.toLowerCase() : '';
        if (el.id) {
          path += '#' + el.id;
          return path; // Unique ID is sufficient
        }
        if (el.className && typeof el.className === 'string') {
          const classes = el.className.trim().split(/\s+/).filter(c => c && !c.includes(':')).slice(0, 2);
          if (classes.length) path += '.' + classes.join('.');
        }
        if (el.parentElement && el.parentElement !== document.body) {
          const parentTag = el.parentElement.tagName ? el.parentElement.tagName.toLowerCase() : '';
          return parentTag + ' > ' + path;
        }
        return path;
      } catch (e) {
        return el.tagName || '';
      }
    }

    function getElementText(el) {
      if (!el) return '';
      try {
        const text = el.innerText || el.textContent || el.value || el.alt || el.title || '';
        return text.trim().replace(/\s+/g, ' ').slice(0, 80);
      } catch (e) {
        return '';
      }
    }

    /**
     * Flush queued events to backend API
     */
    function flushQueue() {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }

      if (eventQueue.length === 0) return;

      const payload = eventQueue.length === 1 ? eventQueue[0] : [...eventQueue];
      eventQueue.length = 0; // Clear queue
      const jsonString = JSON.stringify(payload);

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
          headers: { 'Content-Type': 'application/json' },
          body: jsonString,
          keepalive: true,
        }).catch(function (err) {
          console.warn('[CausalTracker] Failed sending telemetry:', err);
        });
      }
    }

    /**
     * Schedule batched transmission or flush immediately
     */
    function queueEvent(eventData, immediate) {
      eventQueue.push(eventData);

      if (immediate || eventQueue.length >= MAX_QUEUE_SIZE) {
        flushQueue();
      } else if (!flushTimer) {
        flushTimer = setTimeout(flushQueue, FLUSH_INTERVAL_MS);
      }
    }

    /**
     * Dispatches telemetry event
     */
    function track(eventType, details, immediate) {
      try {
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
          metadata: {
            selector: details && details.selector ? details.selector : '',
            screen_width: window.screen ? window.screen.width : 0,
            screen_height: window.screen ? window.screen.height : 0,
            user_agent: navigator.userAgent ? navigator.userAgent.slice(0, 150) : '',
            ...(details && details.metadata ? details.metadata : {})
          }
        };

        queueEvent(eventData, immediate);
      } catch (err) {
        console.warn('[CausalTracker] Tracking error:', err);
      }
    }

    /**
     * Tracks Page Views
     */
    let lastTrackedUrl = null;
    function trackPageView(forcedUrl) {
      const currentUrl = forcedUrl || window.location.href;
      if (lastTrackedUrl === currentUrl) return;
      lastTrackedUrl = currentUrl;

      track('page_view', {
        metadata: {
          title: document.title,
          referrer: document.referrer || '',
        }
      }, true); // Page views are prioritized to flush immediately
    }

    /**
     * Tracks Click Events
     */
    function setupClickListener() {
      document.addEventListener('click', function (event) {
        try {
          const target = event.target;
          if (!target) return;

          const pageX = event.pageX != null ? event.pageX : (event.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft));
          const pageY = event.pageY != null ? event.pageY : (event.clientY + (document.documentElement.scrollTop || document.body.scrollTop));

          const targetTag = target.tagName ? target.tagName.toLowerCase() : '';
          const targetId = target.id || '';
          const targetClass = target.className && typeof target.className === 'string' ? target.className.slice(0, 80) : '';
          const targetText = getElementText(target);
          const selector = getDomSelector(target);

          track('click', {
            click_x: Math.round(pageX),
            click_y: Math.round(pageY),
            target_tag: targetTag,
            target_id: targetId,
            target_class: targetClass,
            target_text: targetText,
            selector: selector
          }, false);
        } catch (e) {}
      }, true);
    }

    /**
     * Tracks Scroll Depth (50%, 90%)
     */
    function setupScrollTracking() {
      let reached50 = false;
      let reached90 = false;

      window.addEventListener('scroll', function () {
        if (reached90) return;
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight <= 0) return;
        const scrollPercent = (window.scrollY / totalHeight) * 100;

        if (!reached50 && scrollPercent >= 50) {
          reached50 = true;
          track('custom', { metadata: { custom_event: 'scroll_depth', depth: '50%' } });
        }
        if (!reached90 && scrollPercent >= 90) {
          reached90 = true;
          track('custom', { metadata: { custom_event: 'scroll_depth', depth: '90%' } });
        }
      }, { passive: true });
    }

    /**
     * Flush queue on tab close or navigation
     */
    function setupUnloadFlusher() {
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
          flushQueue();
        }
      });
      window.addEventListener('beforeunload', function () {
        flushQueue();
      });
    }

    /**
     * SPA Navigation interceptors
     */
    function setupSpaNavigation() {
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

    function init() {
      setupClickListener();
      setupScrollTracking();
      setupSpaNavigation();
      setupUnloadFlusher();

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        trackPageView();
      } else {
        document.addEventListener('DOMContentLoaded', function () {
          trackPageView();
        });
      }
      console.log('[CausalTracker v2.0] Active. Session:', getSessionId());
    }

    // Public API
    window.CausalTracker = {
      track: track,
      trackPageView: trackPageView,
      flush: flushQueue,
      getSessionId: getSessionId,
      resetSession: resetSession,
      endpoint: endpoint,
      version: '2.0.0'
    };

    init();

  } catch (globalErr) {
    console.warn('[CausalTracker] Safe initialization catch:', globalErr);
  }
})(window, document);
