import express from 'express';
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Route for Google Sheets Sync
app.post('/api/sync-sheets', async (req, res) => {
  const { requests } = req.body;
  const scriptUrl = process.env.APPS_SCRIPT_URL;

  if (!scriptUrl) {
    return res.status(500).json({ error: 'Konfigurasi APPS_SCRIPT_URL belum diatur di Vercel Environment Variables.' });
  }

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    const result = await response.json();
    
    if (result.result === 'success') {
      res.json({ success: true, message: 'Data berhasil disinkronkan' });
    } else {
      throw new Error(result.error || 'Gagal sinkronisasi');
    }
  } catch (error: any) {
    res.status(500).json({ error: `Gagal sinkronisasi: ${error.message}` });
  }
});

export default app;
