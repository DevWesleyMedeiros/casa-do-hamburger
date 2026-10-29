import { build, preview } from 'vite';

// Servir o build de produção evita HMR e replay de efeitos do StrictMode de dev.
await build({ mode: 'test', logLevel: 'warn' });
const baseURL = new URL(process.env['E2E_BASE_URL'] ?? 'http://127.0.0.1:5173');
const server = await preview({
  preview: { host: baseURL.hostname, port: Number(baseURL.port || 80), strictPort: true },
});
const stop = () => server.httpServer.close(() => process.exit(0));
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
