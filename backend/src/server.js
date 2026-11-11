import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.port, () => {
  console.log(`[api] MySQL Lab API: http://localhost:${env.port}/api`);
  console.log(`[api] Môi trường: ${env.nodeEnv}`);
});

const shutdown = (signal) => {
  console.log(`[api] Nhận ${signal} — đang đóng server...`);
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
