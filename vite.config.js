import { defineConfig } from 'vite'
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

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/user-service':    proxyOptions('http://rafsi.davidovic.io:8080', '/user-service'),
      '/banking-service': proxyOptions('http://rafsi.davidovic.io:8081', '/banking-service'),
      '/trading-service': proxyOptions('http://rafsi.davidovic.io:8082', '/trading-service'),
    },
  },
})
