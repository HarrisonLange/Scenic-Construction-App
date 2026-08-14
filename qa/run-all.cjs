const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { createAppServer } = require('../server');

const root = path.resolve(__dirname, '..');
const checks = [
  ['vocabulary-consistency.cjs', '--summary'],
  ['release-audit.cjs'],
  ['interaction-smoke.cjs'],
  ['storage-resilience.cjs'],
  ['profile-isolation.cjs'],
  ['safety-quiz.cjs'],
];
const testDataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'sdscpa-progress-test-'));
const server = createAppServer(root, path.join(testDataDirectory, 'student-progress.json'));

function run([file, ...args]) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(__dirname, file), ...args], { stdio: 'inherit' });
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

server.listen(8099, '127.0.0.1', async () => {
  let exitCode = 0;
  for (const check of checks) {
    const code = await run(check);
    if (code !== 0) { exitCode = code; break; }
  }
  server.close(() => {
    fs.rmSync(testDataDirectory, { recursive: true, force: true });
    process.exitCode = exitCode;
  });
});
server.on('error', (error) => {
  console.error(`Unable to start the local test server: ${error.message}`);
  process.exitCode = 2;
});
