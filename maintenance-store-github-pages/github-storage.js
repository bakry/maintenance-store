(function () {
  const originalFetch = window.fetch.bind(window);
  const config = window.MAINTENANCE_STORE_CONFIG || {};
  const statePath = "/api/state";
  const exportPath = "/api/export";

  function isApiPath(input, path) {
    const value = typeof input === "string" ? input : input && input.url;
    if (!value) return false;
    try {
      return new URL(value, window.location.href).pathname === path;
    } catch {
      return value === path;
    }
  }

  function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  function supabaseReady() {
    return Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY);
  }

  function supabaseHeaders() {
    return {
      apikey: config.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${config.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    };
  }

  function supabaseBaseUrl() {
    return `${String(config.SUPABASE_URL).replace(/\/$/, "")}/rest/v1/${encodeURIComponent(config.SUPABASE_TABLE || "app_state")}`;
  }

  async function readInitialData() {
    const response = await originalFetch(config.INITIAL_DATA_URL || "data/application-data.json", { cache: "no-store" });
    if (!response.ok) return new Response("", { status: 204 });
    return new Response(await response.text(), {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  async function getState() {
    if (!supabaseReady()) {
      return jsonResponse({ error: "Supabase config is missing" }, 503);
    }

    const id = encodeURIComponent(config.SUPABASE_STATE_ID || "maintenance-store");
    const url = `${supabaseBaseUrl()}?id=eq.${id}&select=state`;
    const response = await originalFetch(url, { headers: supabaseHeaders(), cache: "no-store" });
    if (!response.ok) return response;

    const rows = await response.json();
    if (rows && rows[0] && rows[0].state) return jsonResponse(rows[0].state);
    return readInitialData();
  }

  async function saveState(request) {
    if (!supabaseReady()) {
      return jsonResponse({ error: "Supabase config is missing" }, 503);
    }

    const state = JSON.parse(await request.text());
    const response = await originalFetch(supabaseBaseUrl(), {
      method: "POST",
      headers: {
        ...supabaseHeaders(),
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        id: config.SUPABASE_STATE_ID || "maintenance-store",
        state,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) return response;
    return jsonResponse({ ok: true });
  }

  window.fetch = function patchedFetch(input, options = {}) {
    if (isApiPath(input, statePath)) {
      const request = new Request(input, options);
      return request.method === "POST" ? saveState(request) : getState();
    }

    if (isApiPath(input, exportPath)) {
      return jsonResponse({ error: "Exports are downloaded by the browser on GitHub Pages" }, 501);
    }

    return originalFetch(input, options);
  };
})();
