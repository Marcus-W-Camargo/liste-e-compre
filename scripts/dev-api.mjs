import { createServer } from 'node:http';
import handler from '../server/auth-handler.mjs';
createServer((req, res) => {
  if (req.url?.split('?')[0] !== '/api/auth') {
    res.writeHead(404);
    res.end();
    return;
  }
  void handler(req, res);
}).listen(3001, '127.0.0.1', () =>
  console.log('API local: http://127.0.0.1:3001 (acesso pelo Vite em :5173)'),
);
