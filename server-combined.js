// Combined server with HTTP proxy for Socket.IO and API
import { spawn } from 'child_process';
import http from 'http';
import httpProxy from 'http-proxy';

console.log('[Combined Server] 🚀 Starting backend and frontend...');

const PUBLIC_PORT = process.env.PORT || '3000';
const BACKEND_PORT = '3001';
const FRONTEND_PORT = '8080';

console.log(`[Combined Server] Public proxy will run on port ${PUBLIC_PORT}`);
console.log(`[Combined Server] Backend will run on port ${BACKEND_PORT}`);
console.log(`[Combined Server] Frontend will run on port ${FRONTEND_PORT}`);

let backendProcess;
let frontendProcess;

// Create proxy server
const proxy = httpProxy.createProxyServer({
  ws: true, // Enable WebSocket proxying
  changeOrigin: true,
  timeout: 60000
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('[PROXY] ❌ Error:', err.message);
  if (res && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway');
  }
});

// Start backend first
console.log('[Combined Server] 📡 Starting backend...');
backendProcess = spawn('node', ['--no-warnings', 'backend/dist/server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: BACKEND_PORT,
    NODE_ENV: 'production'
  }
});

backendProcess.on('error', (err) => {
  console.error('[Combined Server] ❌ Backend error:', err);
  process.exit(1);
});

backendProcess.on('exit', (code) => {
  console.log(`[Combined Server] Backend exited with code ${code}`);
  if (code !== 0 && code !== null) {
    console.error('[Combined Server] ❌ Backend crashed, shutting down...');
    process.exit(code);
  }
});

// Wait for backend to initialize, then start frontend
setTimeout(() => {
  console.log('[Combined Server] 🌐 Starting frontend (Next.js standalone)...');
  
  const env = {
    ...process.env,
    PORT: FRONTEND_PORT,
    NODE_ENV: 'production',
    HOSTNAME: '0.0.0.0'
  };
  
  frontendProcess = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env
  });

  frontendProcess.on('error', (err) => {
    console.error('[Combined Server] ❌ Frontend error:', err);
    cleanup();
    process.exit(1);
  });

  frontendProcess.on('exit', (code) => {
    console.log(`[Combined Server] Frontend exited with code ${code}`);
    if (code !== 0 && code !== null) {
      console.error('[Combined Server] ❌ Frontend crashed, shutting down...');
      cleanup();
      process.exit(code);
    }
  });

  // Start proxy server after both services are up
  setTimeout(() => {
    console.log('[Combined Server] 🔀 Starting HTTP proxy...');
    
    const proxyServer = http.createServer((req, res) => {
      const url = req.url || '/';
      
      // Proxy Socket.IO and API requests to backend
      if (url.startsWith('/socket.io') || url.startsWith('/api/')) {
        console.log(`[PROXY] → Backend: ${req.method} ${url}`);
        proxy.web(req, res, { target: `http://localhost:${BACKEND_PORT}` });
      } else {
        // Proxy everything else to Next.js frontend
        proxy.web(req, res, { target: `http://localhost:${FRONTEND_PORT}` });
      }
    });

    // Handle WebSocket upgrade for Socket.IO
    proxyServer.on('upgrade', (req, socket, head) => {
      const url = req.url || '/';
      console.log(`[PROXY] → WebSocket upgrade: ${url}`);
      
      if (url.startsWith('/socket.io')) {
        proxy.ws(req, socket, head, { target: `http://localhost:${BACKEND_PORT}` });
      } else {
        proxy.ws(req, socket, head, { target: `http://localhost:${FRONTEND_PORT}` });
      }
    });

    proxyServer.listen(PUBLIC_PORT, '0.0.0.0', () => {
      console.log('[Combined Server] ✅ All services started successfully!');
      console.log(`[Combined Server] 🌍 Access your app at http://localhost:${PUBLIC_PORT}`);
    });
  }, 3000);
}, 5000);

// Cleanup function
function cleanup() {
  console.log('[Combined Server] 🧹 Cleaning up...');
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill('SIGTERM');
  }
  if (frontendProcess && !frontendProcess.killed) {
    frontendProcess.kill('SIGTERM');
  }
}

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('[Combined Server] 📴 Received SIGTERM, shutting down gracefully...');
  cleanup();
  setTimeout(() => process.exit(0), 1000);
});

process.on('SIGINT', () => {
  console.log('[Combined Server] 📴 Received SIGINT, shutting down gracefully...');
  cleanup();
  setTimeout(() => process.exit(0), 1000);
});

process.on('uncaughtException', (err) => {
  console.error('[Combined Server] ❌ Uncaught exception:', err);
  cleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Combined Server] ❌ Unhandled rejection at:', promise, 'reason:', reason);
  cleanup();
  process.exit(1);
});
