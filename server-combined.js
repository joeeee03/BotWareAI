// SERVIDOR SIMPLE - Backend + Frontend en Railway
import http from 'http';
import net from 'net';
import { spawn } from 'child_process';

const BACKEND_PORT = 3001;
const FRONTEND_PORT = 3002;
const PUBLIC_PORT = process.env.PORT || 8080;

console.log('[Server] Iniciando proxy en puerto', PUBLIC_PORT);

// PROXY SIMPLE
const proxy = http.createServer((req, res) => {
  const url = req.url || '/';
  const isBackend = url.startsWith('/api/') || url.startsWith('/socket.io') || url === '/health';
  const targetPort = isBackend ? BACKEND_PORT : FRONTEND_PORT;
  
  const options = {
    hostname: 'localhost',
    port: targetPort,
    path: url,
    method: req.method,
    headers: req.headers
  };
  
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', () => {
    res.writeHead(502);
    res.end('Service starting...');
  });
  
  req.pipe(proxyReq);
});

// WebSocket support (arreglado para Socket.IO)
proxy.on('upgrade', (req, socket, head) => {
  const isBackend = (req.url || '').startsWith('/socket.io');
  const targetPort = isBackend ? BACKEND_PORT : FRONTEND_PORT;
  
  console.log(`[Proxy] WebSocket upgrade: ${req.url} -> port ${targetPort}`);
  
  // Conectar directamente al backend/frontend
  const proxySocket = net.connect(targetPort, 'localhost', () => {
    // Reenviar la solicitud HTTP original
    proxySocket.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`);
    
    Object.keys(req.headers).forEach(key => {
      proxySocket.write(`${key}: ${req.headers[key]}\r\n`);
    });
    
    proxySocket.write('\r\n');
    proxySocket.write(head);
    
    // Pipe bidireccional
    socket.pipe(proxySocket);
    proxySocket.pipe(socket);
  });
  
  proxySocket.on('error', (err) => {
    console.error('[Proxy] WebSocket error:', err.message);
    socket.end();
  });
  
  socket.on('error', (err) => {
    console.error('[Proxy] Client socket error:', err.message);
    proxySocket.end();
  });
});

// Iniciar proxy PRIMERO
proxy.listen(PUBLIC_PORT, '0.0.0.0', () => {
  console.log(`[Server] ✅ Proxy listo en puerto ${PUBLIC_PORT}`);
  
  // Iniciar backend
  console.log('[Server] Iniciando backend...');
  const backend = spawn('node', ['backend/dist/server.js'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: BACKEND_PORT, NODE_ENV: 'production' }
  });
  
  backend.on('error', (err) => {
    console.error('[Backend] Error:', err);
    process.exit(1);
  });
  
  // Iniciar frontend
  setTimeout(() => {
    console.log('[Server] Iniciando frontend...');
    const frontend = spawn('node', ['server.js'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: FRONTEND_PORT,
        NODE_ENV: 'production',
        HOSTNAME: '0.0.0.0',
        NEXT_PUBLIC_API_URL: '',
        NEXT_PUBLIC_SOCKET_URL: ''
      }
    });
    
    frontend.on('error', (err) => {
      console.error('[Frontend] Error:', err);
    });
  }, 2000);
});
