import { createServer } from 'node:http';
import handler from '../api/auth.js';

// Apenas para desenvolvimento. Vercel executa api/auth.js diretamente.
createServer(async (req, res) => {
  if (req.url !== '/api/auth') { res.writeHead(404).end(); return; }
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > 8192) { res.writeHead(413).end(); return; }
  }
  req.body = body;
  await handler(req, res);
}).listen(3001, '127.0.0.1', () => console.log('API local em http://127.0.0.1:3001'));
