import express from 'express';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import analyzeHandler from './api/analyze.js';
import extractHandler from './api/extract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createServer() {
  const app = express();

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  // API routes
  app.post('/api/analyze', async (req, res) => {
    await analyzeHandler(req, res);
  });

  app.post('/api/extract', async (req, res) => {
    await extractHandler(req, res);
  });

  app.listen(3001, () => {
    console.log('Server running at http://localhost:3001');
  });
}

createServer(); 