// Lightweight GA4 utility with strong guards, queue, and debouncing

type GAParams = Record<string, any> | undefined;

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    __ga4Initialized__?: boolean;
  }
}

const ENABLED = (import.meta as any).env?.VITE_ENABLE_GA4 === "true";
const GA4_ID = (import.meta as any).env?.VITE_GA4_ID as string | undefined;
const IS_PROD = (import.meta as any).env?.PROD === true;

// Internal state
let isInitialized = false;
let initInFlight = false;
let eventQueue: Array<{ name: string; params?: GAParams }> = [];
let lastPagePath = "";
let lastEventKey = "";
let lastEventTs = 0;

// Helpers
function now(): number {
  return Date.now();
}

function shouldSend(): boolean {
  if (!IS_PROD) return false; // production-only
  if (!ENABLED) return false; // feature flag
  if (!GA4_ID) return false; // no id
  // Basic path filter: skip potentially sensitive admin/dev routes if ever added
  const pathname = typeof location !== "undefined" ? location.pathname : "";
  if (pathname.startsWith("/admin") || pathname.startsWith("/dev")) return false;
  return true;
}

function injectScriptOnce(id: string): void {
  if (document.getElementById("ga4-script")) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  script.id = "ga4-script";
  document.head.appendChild(script);

  // base gtag
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).gtag = function gtag() {
    window.dataLayer!.push(arguments);
  } as any;

  window.gtag!("js", new Date());
  window.gtag!("config", id, {
    anonymize_ip: true,
    allow_google_signals: false,
    // send_page_view is controlled manually for SPA
    send_page_view: false,
  });
}

export function initGA4(): void {
  if (!shouldSend()) return; // no-op outside of allowed env
  if (isInitialized || window.__ga4Initialized__ || initInFlight) return;

  initInFlight = true;
  try {
    injectScriptOnce(GA4_ID!);
    isInitialized = true;
    window.__ga4Initialized__ = true;

    // Flush queued events
    if (eventQueue.length > 0) {
      for (const evt of eventQueue) {
        try {
          window.gtag && window.gtag("event", evt.name, evt.params || {});
        } catch {
          // swallow
        }
      }
      eventQueue = [];
    }
  } finally {
    initInFlight = false;
  }
}

// Debounced SPA page_view sender
let pageViewTimer: number | undefined;
export function sendPageView(path: string): void {
  if (!shouldSend()) return;
  const trimmed = (path || "/").trim();
  if (trimmed === lastPagePath) {
    // prevent duplicate consecutive page_view
    return;
  }

  // debounce multiple rapid route changes
  if (pageViewTimer) {
    clearTimeout(pageViewTimer);
  }

  pageViewTimer = window.setTimeout(() => {
    lastPagePath = trimmed;
    const params = {
      page_title: document.title || "Bongbi",
      page_location: typeof location !== "undefined" ? location.href : undefined,
      page_path: trimmed,
    } as Record<string, any>;

    if (!window.gtag || !isInitialized) {
      eventQueue.push({ name: "page_view", params });
      return;
    }
    window.gtag("event", "page_view", params);
  }, 150);
}

// General event tracker with light throttle (1s for identical event+params)
export function track(event: string, params?: GAParams): void {
  if (!shouldSend()) return;
  if (!event || typeof event !== "string") return;

  // PII guard: shallow scan for obvious keys
  if (params) {
    const forbidden = ["email", "name", "phone", "customer", "company", "username"];
    for (const key of forbidden) {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        // strip PII
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [key]: _removed, ...rest } = params;
        params = rest;
      }
    }
  }

  // throttle identical events within 1s
  const key = `${event}:${JSON.stringify(params || {})}`;
  const t = now();
  if (key === lastEventKey && t - lastEventTs < 1000) {
    return;
  }
  lastEventKey = key;
  lastEventTs = t;

  if (!window.gtag || !isInitialized) {
    eventQueue.push({ name: event, params });
    return;
  }

  try {
    window.gtag("event", event, params || {});
  } catch {
    // no-op
  }
}

export default { initGA4, sendPageView, track };


