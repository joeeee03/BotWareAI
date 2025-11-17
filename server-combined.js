// SIMPLE: Solo backend
import { spawn } from 'child_process';

console.log('[Backend Only] 🚀 Starting backend...');

const PORT = process.env.PORT || '3001';

const backendProcess = spawn('node', ['--no-warnings', 'backend/dist/server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT,
    NODE_ENV: 'production'
  }
});

backendProcess.on('error', (err) => {
  console.error('[Backend] ❌ Error:', err);
  process.exit(1);
});

backendProcess.on('exit', (code) => {
  console.log(`[Backend] Exited with code ${code}`);
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
  console.error('[Backend] ❌ Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Backend] ❌ Unhandled rejection at:', promise, 'reason:', reason);
  backendProcess.kill('SIGTERM');
  process.exit(1);
});
