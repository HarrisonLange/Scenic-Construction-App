const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const checks = [
  ['vocabulary-consistency.cjs', '--summary'],
  ['release-audit.cjs'],
  ['interaction-smoke.cjs'],
  ['storage-resilience.cjs'],
  ['profile-isolation.cjs'],
  ['safety-quiz.cjs'],
];
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.fbx': 'application/octet-stream',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.stl': 'model/stl',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
};

const server = http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname); }
  catch (error) { response.writeHead(400).end('Bad request'); return; }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.resolve(root, `.${pathname}`);
  if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) { response.writeHead(error.code === 'ENOENT' ? 404 : 500).end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    response.end(data);
  });
});

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
  server.close(() => { process.exitCode = exitCode; });
});
server.on('error', (error) => {
  console.error(`Unable to start the local test server: ${error.message}`);
  process.exitCode = 2;
});
