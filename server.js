'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const BODY_LIMIT_BYTES = 64 * 1024;
const DEFAULT_PORT = 8080;
const ID_PATTERN = /^[A-Z0-9][A-Z0-9-]{2,31}$/;
const TOKEN_PATTERN = /^[a-f0-9]{16}$/;
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.fbx': 'application/octet-stream',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.stl': 'model/stl',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

function normalizeStudentId(value) {
  return String(value === null || value === undefined ? '' : value).trim().toUpperCase();
}

function profileToken(studentId) {
  const text = normalizeStudentId(studentId);
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ (code + index), 0x85ebca6b);
  }
  return (first >>> 0).toString(16).padStart(8, '0')
    + (second >>> 0).toString(16).padStart(8, '0');
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeProgress(value) {
  if (!isPlainObject(value)) return {};
  const progress = {};
  for (const [labId, detail] of Object.entries(value)) {
    if (!/^[a-z0-9-]{1,40}$/i.test(labId) || !isPlainObject(detail)) continue;
    progress[labId] = JSON.parse(JSON.stringify(detail));
  }
  return progress;
}

function validLabId(value) {
  return typeof value === 'string' && /^[a-z0-9-]{1,40}$/i.test(value);
}

function mergeProgress(stored, incoming) {
  const merged = { ...sanitizeProgress(stored) };
  for (const [labId, detail] of Object.entries(sanitizeProgress(incoming))) {
    const previous = isPlainObject(merged[labId]) ? merged[labId] : {};
    const next = { ...previous, ...detail };
    if (typeof previous.score === 'number' && typeof detail.score === 'number') {
      next.score = Math.max(previous.score, detail.score);
    }
    merged[labId] = next;
  }
  return merged;
}

function emptyStore() {
  return { version: 1, students: {} };
}

function createProgressStore(dataFile) {
  let writeQueue = Promise.resolve();

  async function read() {
    try {
      const contents = await fs.promises.readFile(dataFile, 'utf8');
      const parsed = JSON.parse(contents);
      if (!isPlainObject(parsed) || !isPlainObject(parsed.students)) {
        throw new TypeError(`Progress file has an invalid structure: ${dataFile}`);
      }
      return parsed;
    } catch (error) {
      if (error && error.code === 'ENOENT') return emptyStore();
      throw error;
    }
  }

  async function write(store) {
    await fs.promises.mkdir(path.dirname(dataFile), { recursive: true });
    const temporaryFile = `${dataFile}.${process.pid}.tmp`;
    await fs.promises.writeFile(temporaryFile, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
    await fs.promises.rename(temporaryFile, dataFile);
  }

  function update(change) {
    const operation = writeQueue.then(async () => {
      const store = await read();
      const result = change(store);
      await write(store);
      return result;
    });
    writeQueue = operation.catch(() => undefined);
    return operation;
  }

  function open(studentId, localProgress) {
    return update((store) => {
      const normalizedId = normalizeStudentId(studentId);
      if (!ID_PATTERN.test(normalizedId)) {
        const error = new TypeError('Enter at least 3 letters or numbers. Hyphens are okay.');
        error.statusCode = 400;
        throw error;
      }
      const token = profileToken(normalizedId);
      const now = new Date().toISOString();
      const previous = isPlainObject(store.students[token]) ? store.students[token] : {};
      const progress = mergeProgress(previous.progress, localProgress);
      store.students[token] = {
        studentId: normalizedId,
        createdAt: typeof previous.createdAt === 'string' ? previous.createdAt : now,
        lastSeenAt: now,
        progress,
      };
      return { profileToken: token, progress };
    });
  }

  function complete(token, labId, detail) {
    return update((store) => {
      if (!TOKEN_PATTERN.test(token) || !isPlainObject(store.students[token])) {
        const error = new Error('Student profile was not found. Sign in again.');
        error.statusCode = 404;
        throw error;
      }
      if (!validLabId(labId) || !isPlainObject(detail)) {
        const error = new TypeError('A valid lab ID and progress detail are required.');
        error.statusCode = 400;
        throw error;
      }
      const incoming = { [labId]: detail };
      store.students[token].progress = mergeProgress(store.students[token].progress, incoming);
      store.students[token].lastSeenAt = new Date().toISOString();
      return { progress: store.students[token].progress };
    });
  }

  function remove(token, labId) {
    return update((store) => {
      if (!TOKEN_PATTERN.test(token) || !isPlainObject(store.students[token])) {
        const error = new Error('Student profile was not found. Sign in again.');
        error.statusCode = 404;
        throw error;
      }
      if (!validLabId(labId)) {
        const error = new TypeError('A valid lab ID is required.');
        error.statusCode = 400;
        throw error;
      }
      const progress = sanitizeProgress(store.students[token].progress);
      delete progress[labId];
      store.students[token].progress = progress;
      store.students[token].lastSeenAt = new Date().toISOString();
      return { progress };
    });
  }

  return { open, complete, remove };
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    request.on('data', (chunk) => {
      if (tooLarge) return;
      size += chunk.length;
      if (size > BODY_LIMIT_BYTES) {
        tooLarge = true;
        const error = new Error('Request body is too large.');
        error.statusCode = 413;
        reject(error);
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (tooLarge) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (error) {
        const invalidJson = new Error('Request body must be valid JSON.');
        invalidJson.statusCode = 400;
        reject(invalidJson);
      }
    });
    request.on('error', reject);
  });
}

function sendJson(response, statusCode, value) {
  const body = JSON.stringify(value);
  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(body);
}

function serveStatic(root, requestPath, response) {
  let pathname = requestPath;
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.resolve(root, `.${pathname}`);
  if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500).end('Not found');
      return;
    }
    response.writeHead(200, {
      'Content-Type': MIME_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(data);
  });
}

function createAppServer(root, dataFile) {
  const store = createProgressStore(dataFile);
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      if (request.method === 'POST' && url.pathname === '/api/profiles/open') {
        const body = await readJsonBody(request);
        const result = await store.open(body.studentId, body.progress);
        sendJson(response, 200, result);
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/progress/complete') {
        const body = await readJsonBody(request);
        const result = await store.complete(String(body.profileToken || ''), String(body.labId || ''), body.detail);
        sendJson(response, 200, result);
        return;
      }
      if (request.method === 'POST' && url.pathname === '/api/progress/remove') {
        const body = await readJsonBody(request);
        const result = await store.remove(String(body.profileToken || ''), String(body.labId || ''));
        sendJson(response, 200, result);
        return;
      }
      if (url.pathname.startsWith('/api/')) {
        sendJson(response, 404, { error: 'API route not found.' });
        return;
      }
      serveStatic(root, decodeURIComponent(url.pathname), response);
    } catch (error) {
      const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
      if (statusCode === 500) {
        console.error('Request failed', { method: request.method, url: request.url, error });
      }
      if (!response.headersSent) sendJson(response, statusCode, { error: error.message || 'Request failed.' });
    }
  });
}

if (require.main === module) {
  const root = __dirname;
  const dataDirectory = process.env.DATA_DIR || '/data';
  const dataFile = path.join(dataDirectory, 'student-progress.json');
  const port = Number.parseInt(process.env.PORT || String(DEFAULT_PORT), 10);
  const server = createAppServer(root, dataFile);
  server.listen(port, '0.0.0.0', () => {
    console.log('SDSCPA labs server listening', { port, dataFile });
  });
  server.on('error', (error) => {
    console.error('Unable to start SDSCPA labs server', { port, dataFile, error });
    process.exitCode = 1;
  });
}

module.exports = { createAppServer, mergeProgress, normalizeStudentId, profileToken };
