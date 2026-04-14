import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Route for Google Sheets Sync
app.post('/api/sync-sheets', async (req, res) => {
  const { requests } = req.body;
  const scriptUrl = process.env.APPS_SCRIPT_URL;

  if (!scriptUrl) {
    return res.status(500).json({ error: 'Konfigurasi APPS_SCRIPT_URL belum diatur di menu Secrets.' });
  }

  try {
    console.log('Syncing to Apps Script:', scriptUrl);
    
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    const result = await response.json();
    
    if (result.result === 'success') {
      res.json({ success: true, message: 'Data berhasil disinkronkan ke Google Sheets via Apps Script' });
    } else {
      throw new Error(result.error || 'Gagal sinkronisasi via Apps Script');
    }
  } catch (error: any) {
    console.error('Error syncing to Apps Script:', error);
    res.status(500).json({ error: `Gagal sinkronisasi: ${error.message}` });
  }
});

async function setupVite() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }
}

async function startServer() {
  const PORT = 3000;
  await setupVite();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

export default app;
