import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function paydunyaApiPlugin(): Plugin {
  return {
    name: 'paydunya-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/paydunya/create-invoice' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const masterKey = process.env.VITE_PAYDUNYA_MASTER_KEY || 'DbDQF7UZ-eGTd-AvLI-rKX0-TRalACuat69v';
              const publicKey = process.env.VITE_PAYDUNYA_PUBLIC_KEY || 'live_public_sQarWhJMc6Tgjy1uDroFvTxuSer';
              const privateKey = process.env.VITE_PAYDUNYA_PRIVATE_KEY || 'live_private_vp0fK771yioUfxI5MUz9pDscnrY';
              const token = process.env.VITE_PAYDUNYA_TOKEN || 'pBMNpVEEk3jX2VINqMvJ';

              const paydunyaRes = await fetch('https://app.paydunya.com/api/v1/checkout-invoice/create', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'PAYDUNYA-MASTER-KEY': masterKey,
                  'PAYDUNYA-PUBLIC-KEY': publicKey,
                  'PAYDUNYA-PRIVATE-KEY': privateKey,
                  'PAYDUNYA-TOKEN': token,
                },
                body: JSON.stringify(parsed),
              });

              const data = await paydunyaRes.json();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ response_code: '99', error: String(err) }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), paydunyaApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
