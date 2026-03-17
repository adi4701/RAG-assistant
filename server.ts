import { spawn } from 'child_process';

console.log('Starting custom server...');

// Start the Next.js standalone server
const nextProcess = spawn('node', ['.next/standalone/server.js'], { stdio: 'inherit' });

// Start the Python backend
const pythonProcess = spawn('sh', ['-c', 'cd lexrag/backend && pip3 install -r requirements.txt && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000'], { stdio: 'inherit' });

// Handle exit
process.on('SIGINT', () => {
  nextProcess.kill('SIGINT');
  pythonProcess.kill('SIGINT');
  process.exit();
});

process.on('SIGTERM', () => {
  nextProcess.kill('SIGTERM');
  pythonProcess.kill('SIGTERM');
  process.exit();
});
