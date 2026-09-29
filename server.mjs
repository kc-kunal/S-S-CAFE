import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const PORT = 3000;
const HOST = '127.0.0.1';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = createServer(async (req, res) => {
  let filePath = req.url === '/' ? '/standalone.html' : req.url;
  const ext = extname(filePath) || '.html';
  const contentType = MIME_TYPES[ext] || 'text/plain';

  try {
    const fullPath = join(process.cwd(), filePath);
    const content = await readFile(fullPath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('S&S Cafe Server is running.\n');
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found\n');
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`☕ S&S Cafe Server listening on http://${HOST}:${PORT}`);
});
