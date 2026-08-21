export default {
  // Handle HTTP requests (visiting worker URL or manual /ping)
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/status') {
      const targetUrl = env.RENDER_APP_URL || 'https://tcloud-2f7u.onrender.com';
      const healthEndpoint = env.HEALTH_ENDPOINT || '/api/files';
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Render Keep-Alive Worker</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; background: #0D0F17; color: #fff; }
            .card { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); }
            .badge { background: #315BFF; color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; color: #D6E85E; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>🚀 Render Ping Worker Active</h2>
            <p><span class="badge">24/7 Keep-Alive</span></p>
            <p>Target: <code>${targetUrl}${healthEndpoint}</code></p>
            <p>Pings every 14 minutes 24/7 to prevent Render free server from sleeping.</p>
          </div>
        </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    if (url.pathname === '/ping') {
      const result = await this.pingRender(env);
      return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response('Not Found', { status: 404 });
  },

  // Cron trigger (runs automatically every 14 minutes 24/7)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(this.pingRender(env));
  },

  async pingRender(env) {
    const baseUrl = env.RENDER_APP_URL || 'https://tcloud-2f7u.onrender.com';
    const endpoint = env.HEALTH_ENDPOINT || '/api/files';
    const fullUrl = `${baseUrl.replace(/\/$/, '')}${endpoint}`;

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'RenderPingWorker/1.0' },
      });
      console.log(`[Ping Success] ${fullUrl} -> Status ${response.status}`);
      return { success: true, status: response.status, url: fullUrl, timestamp: new Date().toISOString() };
    } catch (err) {
      console.error(`[Ping Error] ${fullUrl} -> ${err.message}`);
      return { success: false, error: err.message, url: fullUrl, timestamp: new Date().toISOString() };
    }
  }
};
