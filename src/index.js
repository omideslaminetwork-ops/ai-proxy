export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // هر چیزی که به /api/* بخوره، پروکسی میشه
    if (url.pathname.startsWith('/api/')) {
      // ✅ مقصدت رو اینجا تنظیم کن (فقط این خط رو بعداً طبق نیازت عوض می‌کنی)
      const upstream = new URL(
        url.pathname.replace('/api/', '/v1/'),
        'https://api.example.com'
      );
      upstream.search = url.search;

      const headers = new Headers(request.headers);
      headers.delete('host');

      // کلید از Secret میاد (مرحله 6 می‌سازیم)
      headers.set('Authorization', `Bearer ${env.API_KEY}`);

      // اگر محتوا مشخص نیست، JSON درنظر بگیر
      if (!headers.has('content-type')) headers.set('content-type', 'application/json');

      const resp = await fetch(upstream.toString(), {
        method: request.method,
        headers,
        body: ['GET','HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
        redirect: 'follow'
      });

      // CORS برای فرانت
      const h = new Headers(resp.headers);
      h.set('Access-Control-Allow-Origin', '*');
      h.set('Access-Control-Allow-Headers', '*');
      h.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
      return new Response(resp.body, { status: resp.status, headers: h });
    }

    // سلامت
    return new Response(JSON.stringify({ ok: true, service: 'ai-proxy' }), {
      headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
