// Backend + Frontend en el mismo dominio Railway
import { spawn } from 'child_process';

console.log('[Combined] 🚀 Starting backend and frontend...');

const BACKEND_PORT = '3001';
const FRONTEND_PORT = '3002';
const PUBLIC_PORT = process.env.PORT || '8080';

// Variables para el backend
const backendEnv = {
  ...process.env,
  PORT: BACKEND_PORT,
  NODE_ENV: 'production'
};

// Variables para el frontend (se conecta al mismo dominio)
const frontendEnv = {
  ...process.env,
  PORT: FRONTEND_PORT,
  NODE_ENV: 'production',
  HOSTNAME: '0.0.0.0',
  // Frontend usa rutas relativas (mismo dominio) - NO agregar /api porque ya está en las rutas
  NEXT_PUBLIC_API_URL: '',
  NEXT_PUBLIC_SOCKET_URL: ''
};

// Iniciar backend
console.log('[Combined] 📡 Starting backend...');
const backendProcess = spawn('node', ['--no-warnings', 'backend/dist/server.js'], {
  stdio: 'inherit',
  env: backendEnv
});

// Iniciar frontend después del backend
setTimeout(() => {
  console.log('[Combined] 🌐 Starting frontend...');
  const frontendProcess = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: frontendEnv
  });

  frontendProcess.on('error', (err) => {
    console.error('[Combined] ❌ Frontend error:', err);
  });

  frontendProcess.on('exit', (code) => {
    console.log(`[Combined] Frontend exited with code ${code}`);
  });
}, 3000);

// Crear proxy con soporte WebSocket después de que ambos servicios estén listos
setTimeout(() => {
  console.log('[Combined] 🔀 Starting proxy with WebSocket support...');
  
  import('http').then(({ default: http }) => {
    const proxyServer = http.createServer((req, res) => {
      const url = req.url || '/';
      
      // Determinar target
      let targetPort;
      if (url.startsWith('/api/') || url.startsWith('/socket.io') || url === '/health') {
        targetPort = BACKEND_PORT;
        console.log(`[Proxy] → Backend: ${req.method} ${url}`);
      } else {
        targetPort = FRONTEND_PORT;
        console.log(`[Proxy] → Frontend: ${req.method} ${url}`);
      }
      
      // Proxy simple
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
      
      proxyReq.on('error', (err) => {
        console.error('[Proxy] Error:', err.message);
        res.writeHead(502);
        res.end('Bad Gateway');
      });
      
      req.pipe(proxyReq);
    });
    
    // Manejar WebSocket upgrade para Socket.IO
    proxyServer.on('upgrade', (req, socket, head) => {
      const url = req.url || '/';
      const targetPort = url.startsWith('/socket.io') ? BACKEND_PORT : FRONTEND_PORT;
      
      console.log(`[Proxy] → WebSocket upgrade: ${url} to port ${targetPort}`);
      
      const options = {
        hostname: 'localhost',
        port: targetPort,
        path: url,
        headers: req.headers
      };
      
      const proxyReq = http.request(options);
      
      proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
        proxySocket.on('error', (err) => {
          console.error('[Proxy] WebSocket error:', err.message);
          socket.end();
        });
        
        socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
                     'Upgrade: websocket\r\n' +
                     'Connection: Upgrade\r\n' +
                     '\r\n');
        
        proxySocket.pipe(socket);
        socket.pipe(proxySocket);
        
        proxySocket.write(proxyHead);
      });
      
      proxyReq.on('error', (err) => {
        console.error('[Proxy] WebSocket upgrade error:', err.message);
        socket.end();
      });
      
      proxyReq.end();
    });
    
    // Usar el puerto público para el proxy
    proxyServer.listen(PUBLIC_PORT, '0.0.0.0', () => {
      console.log(`[Combined] ✅ Proxy running on port ${PUBLIC_PORT}`);
      console.log(`[Combined] 🌍 Access your app at http://localhost:${PUBLIC_PORT}`);
    });
  });
}, 8000);

backendProcess.on('error', (err) => {
  console.error('[Combined] ❌ Error:', err);
  process.exit(1);
});

backendProcess.on('exit', (code) => {
  console.log(`[Combined] Exited with code ${code}`);
  process.exit(code || 0);
});

process.on('SIGTERM', () => {
  backendProcess.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  backendProcess.kill('SIGINT');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('[Combined] ❌ Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Combined] ❌ Unhandled rejection at:', promise, 'reason:', reason);
  backendProcess.kill('SIGTERM');
  process.exit(1);
});
