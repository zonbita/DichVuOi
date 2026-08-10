import { defineConfig, createLogger } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/** Vite hay spam khi client Socket.IO disconnect (HMR / đổi trang) — không phải lỗi app. */
const logger = createLogger();
const logError = logger.error.bind(logger);
logger.error = (msg, options) => {
  if (
    typeof msg === 'string' &&
    /ECONNABORTED|ECONNRESET|EPIPE|ws proxy (socket )?error/i.test(msg)
  ) {
    return;
  }
  logError(msg, options);
};

function quietSocketProxy(proxy: {
  on: (event: string, listener: (...args: never[]) => void) => void;
}) {
  const silent = new Set(['ECONNABORTED', 'ECONNRESET', 'EPIPE']);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (proxy as any).on('error', (err: NodeJS.ErrnoException) => {
    if (err.code && silent.has(err.code)) return;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (proxy as any).on(
    'proxyReqWs',
    (_proxyReq: unknown, _req: unknown, socket: { on: (e: string, cb: (err: NodeJS.ErrnoException) => void) => void }) => {
      socket.on('error', (err) => {
        if (err.code && silent.has(err.code)) return;
      });
    },
  );
}

export default defineConfig({
  customLogger: logger,
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        // Vitest/http-proxy event typings are stricter than runtime — cast keep quiet.
        configure: quietSocketProxy as never,
      },
    },
  },
});
