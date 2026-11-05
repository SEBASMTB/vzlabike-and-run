/**
 * Simple HTTP proxy from port 81 → port 3000
 * This replaces Caddy in the dev environment so the preview gateway can reach the Next.js app.
 */
const http = require('http');
const { URL } = require('url');

const TARGET_PORT = 3000;
const LISTEN_PORT = 81;

const server = http.createServer((req, res) => {
  // Handle XTransformPort query parameter (like Caddyfile config)
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let targetPort = TARGET_PORT;
  
  if (url.searchParams.has('XTransformPort')) {
    const customPort = parseInt(url.searchParams.get('XTransformPort'), 10);
    if (!isNaN(customPort) && customPort > 0 && customPort < 65536) {
      targetPort = customPort;
    }
  }

  const proxyReq = http.request(
    {
      hostname: 'localhost',
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        'x-forwarded-for': req.socket.remoteAddress,
        'x-forwarded-proto': 'https',
        'x-real-ip': req.socket.remoteAddress,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  proxyReq.on('error', (err) => {
    console.error(`[proxy] Error connecting to :${targetPort}:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway: Next.js server not reachable');
    }
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  console.log(`[proxy] Port ${LISTEN_PORT} → Port ${TARGET_PORT} (listening on 0.0.0.0)`);
});

server.on('error', (err) => {
  console.error(`[proxy] Server error:`, err.message);
  process.exit(1);
});
