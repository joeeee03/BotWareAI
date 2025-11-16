// Combined server that serves both backend API and Next.js frontend
import { spawn } from 'child_process';

console.log('[Combined Server] 🚀 Starting backend and frontend...');

const FRONTEND_PORT = process.env.PORT || '3000';
const BACKEND_PORT = '3001';

console.log(`[Combined Server] Frontend will run on port ${FRONTEND_PORT}`);
console.log(`[Combined Server] Backend will run on port ${BACKEND_PORT}`);

let backendProcess;
let frontendProcess;

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
  
  // Set backend URL for Next.js rewrites
  const env = {
    ...process.env,
    PORT: FRONTEND_PORT,
    NODE_ENV: 'production',
    NEXT_PUBLIC_BACKEND_URL: `http://localhost:${BACKEND_PORT}`,
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

  console.log('[Combined Server] ✅ Both services started successfully!');
  console.log(`[Combined Server] 🌍 Access your app at http://localhost:${FRONTEND_PORT}`);
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
