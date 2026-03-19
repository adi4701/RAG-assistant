const { spawn } = require('child_process');
const path = require('path');

// Render and other platforms provide the PORT environment variable
const PORT = process.env.PORT || 3000;
process.env.PORT = PORT; 

console.log(`[Entrypoint] Starting LexRAG on port ${PORT}...`);

// 1. Start Next.js Standalone Server
// In the production Docker image, this script sits alongside the Next.js server.js
const nextProcess = spawn('node', ['server.js'], { 
  stdio: 'inherit',
  env: { ...process.env }
});

// 2. Start Python FastAPI Backend
const pythonProcess = spawn('python3', ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'], { 
  stdio: 'inherit',
  cwd: path.join(__dirname, 'lexrag/backend'),
  env: { ...process.env }
});

// Handle process termination
const cleanup = () => {
  console.log('[Entrypoint] Shutting down...');
  nextProcess.kill();
  pythonProcess.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

nextProcess.on('exit', (code) => {
  console.log(`[Next.js] Exited with code ${code}`);
  if (code !== 0) cleanup();
});

pythonProcess.on('exit', (code) => {
  console.log(`[Python] Exited with code ${code}`);
  if (code !== 0) cleanup();
});
