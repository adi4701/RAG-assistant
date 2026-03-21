const { spawn } = require('child_process');

// Render sets PORT=10000. Both services must agree on this one port.
// We run FastAPI only — it serves the API on $PORT.
// Frontend is deployed separately as a Render Static Site.
const port = process.env.PORT || 10000;

console.log(`[Entrypoint] Starting LexRAG backend on port ${port}...`);

const api = spawn(
  'uvicorn',
  [
    'main:app',
    '--host', '0.0.0.0',
    '--port', String(port),
    '--no-reload',
    '--workers', '1',
  ],
  {
    cwd: process.env.BACKEND_DIR || '/app',
    env: { ...process.env },
    stdio: 'inherit',
  }
);

api.on('error', (err) => {
  console.error('[Entrypoint] Failed to start:', err.message);
  process.exit(1);
});

api.on('exit', (code) => {
  console.log(`[Entrypoint] Exited with code ${code}`);
  process.exit(code || 0);
});

process.on('SIGTERM', () => {
  console.log('[Entrypoint] Shutting down...');
  api.kill('SIGTERM');
});
