(function () {
  const FIXED_COMPANY_NAME = "其軒投資有限公司";

  const SUPABASE_URL = "https://iwwnclfqyjygxncnitkd.supabase.co";
  const SUPABASE_KEY = "sb_publishable_9nexyqqATbzJel06RgnO5w_lFY-R6gm";
  const params = new URLSearchParams(location.search);
  const slug = "b-original";

  window.PAGE_SLUG = slug;
  const detectedTrafficSource = detectTrafficSource();
  if (detectedTrafficSource) rememberTrafficSource(detectedTrafficSource);
  window.TRAFFIC_SOURCE = detectedTrafficSource || rememberedTrafficSource();

  const defaults = {
    slug,
    company_name: FIXED_COMPANY_NAME,
    line_id: "@118jknol",
    line_url: "https://line.me/R/ti/p/@118jknol",
    pixel_ids: [],
    tiktok_pixel_ids: [],
    active: true
  };

  window.PAGE_CONFIG_READY = loadConfig();
  window.trackPageEvent = trackPageEvent;

  async function loadConfig() {
    let config = defaults;
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/site_settings?id=eq.1&select=line_url,line_id,pixel_ids&limit=1`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      const rows = response.ok ? await response.json() : [];
      if (rows[0]) {
        config = {
          ...defaults,
          line_url: rows[0].line_url || defaults.line_url,
          line_id: rows[0].line_id || defaults.line_id,
          pixel_ids: Array.isArray(rows[0].pixel_ids) ? rows[0].pixel_ids : defaults.pixel_ids
        };
      }
    } catch (_) {}

    window.PAGE_CONFIG = config;
    applyConfig(config);
    return config;
  }

  function applyConfig(config) {
    document.querySelectorAll("[data-company-name]").forEach(el => {
      el.textContent = FIXED_COMPANY_NAME;
    });
    document.title = `快速貸款試算｜${FIXED_COMPANY_NAME}`;
    document.querySelectorAll("a[href]").forEach(link => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("javascript:")) return;
      const url = new URL(href, location.href);
      url.searchParams.set("page", slug);
      link.href = url.pathname.split("/").pop() + url.search;
    });
    if (config.active === false) {
      document.body.innerHTML = '<main style="font-family:sans-serif;text-align:center;padding:80px 20px"><h1>此頁面目前暫停服務</h1><p>請稍後再試。</p></main>';
      return;
    }
    const { facebookIds, tiktokIds } = splitPixelIds(config.pixel_ids || []);
    installPixels(facebookIds);
    installTikTokPixels(tiktokIds);
  }

  function splitPixelIds(pixels) {
    const list = Array.isArray(pixels) ? pixels : String(pixels || "").split(/[\s,]+/);
    const facebookIds = [];
    const tiktokIds = [];
    list.forEach(pixel => {
      const id = String((pixel && typeof pixel === "object" ? pixel.id : pixel) || "").trim();
      if (!id) return;
      if (pixel && typeof pixel === "object" && pixel.enabled === false) return;
      const platform = String((pixel && typeof pixel === "object" ? pixel.platform : "") || "").toLowerCase();
      if (platform === "tiktok") tiktokIds.push(id);
      else facebookIds.push(id);
    });
    return { facebookIds, tiktokIds };
  }

  function installPixels(ids) {
    const cleanIds = Array.isArray(ids) ? ids : String(ids || "").split(/[\s,]+/);
    cleanIds.filter(Boolean).forEach(id => {
      if (document.querySelector(`[data-pixel-id="${id}"]`)) return;
      const marker = document.createElement("meta");
      marker.dataset.pixelId = id;
      document.head.appendChild(marker);
      if (!window.fbq) {
        window.fbq = function () { window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments); };
        window.fbq.queue = [];
        window.fbq.loaded = true;
        window.fbq.version = "2.0";
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://connect.facebook.net/en_US/fbevents.js";
        document.head.appendChild(script);
      }
      window.fbq("init", id);
    });
    if (cleanIds.filter(Boolean).length) window.fbq("track", "PageView");
  }

  function trackPageEvent(eventName, params) {
    if (!window.fbq) return;
    window.fbq("track", eventName, { page_slug: slug, ...(params || {}) });
  }

  function installTikTokPixels(ids) {
    const cleanIds = (Array.isArray(ids) ? ids : String(ids || "").split(/[\s,]+/)).filter(Boolean);
    if (!cleanIds.length) return;
    if (!window.ttq) {
      !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=i+"?sdkid="+e+"&lib="+t;var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(a,s)}}(window,document,"ttq");
    }
    cleanIds.forEach(id => {
      if (document.querySelector(`[data-tiktok-pixel-id="${id}"]`)) return;
      const marker = document.createElement("meta");
      marker.dataset.tiktokPixelId = id;
      document.head.appendChild(marker);
      window.ttq.load(id);
    });
    window.ttq.page();
    if (/\/loan\.html$/i.test(location.pathname)) trackTikTokEvent("ViewContent", { content_type: "loan_options" });
  }

  function trackTikTokEvent(eventName, params) {
    if (!window.ttq) return;
    window.ttq.track(eventName, { page_slug: slug, ...(params || {}) });
  }

  window.trackTikTokEvent = trackTikTokEvent;

  function detectTrafficSource() {
    const source = String(params.get("utm_source") || params.get("source") || "").toLowerCase();
    if (params.get("fbclid") || /facebook|meta|(^|[^a-z])fb([^a-z]|$)/.test(source)) return "FB";
    if (params.get("ttclid") || /tiktok|tik_tok|(^|[^a-z])tk([^a-z]|$)/.test(source)) return "TikTok";
    return "";
  }

  function rememberTrafficSource(source) {
    localStorage.setItem(`traffic_source_${slug}`, JSON.stringify({ source, saved_at: Date.now() }));
  }

  function rememberedTrafficSource() {
    try {
      const saved = JSON.parse(localStorage.getItem(`traffic_source_${slug}`) || "null");
      return saved && Date.now() - saved.saved_at < 86400000 ? saved.source : "";
    } catch (_) {
      return "";
    }
  }
})();
