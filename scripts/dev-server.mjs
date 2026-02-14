import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootArg = process.argv[2] || '.';
const root = path.resolve(process.cwd(), rootArg);
const port = 5173;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

const server = http.createServer(async (req, res) => {
  const reqPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(root, decodeURIComponent(reqPath.split('?')[0]));
  try {
    const body = await readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
    res.end(body);
  } catch {
    try {
      const fallback = await readFile(path.join(root, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fallback);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`ASCII Depths dev server running: http://localhost:${port}`);
});
