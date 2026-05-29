import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const proxyOptions = (target, servicePrefix) => ({
  target,
  changeOrigin: true,
  rewrite: (path) => path.replace(new RegExp(`^${servicePrefix}`), ''),
  configure: (proxy) => {
    proxy.on('proxyReq', (proxyReq) => {
      proxyReq.removeHeader('cookie');
      proxyReq.removeHeader('origin');
      proxyReq.removeHeader('referer');
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const host = env.DEV_BACKEND_HOST || 'rafsi.davidovic.io';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/user-service':    proxyOptions(`http://${host}:8080`, '/user-service'),
        '/banking-service': proxyOptions(`http://${host}:8081`, '/banking-service'),
        '/trading-service': proxyOptions(`http://${host}:8082`, '/trading-service'),
      },
    },
  };
});
