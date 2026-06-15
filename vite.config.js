import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendOrigin = process.env.BACKEND_ORIGIN || 'http://127.0.0.1:8000';
const allowedHostsEnv = process.env.VITE_ALLOWED_HOSTS;

const allowedHosts =
  allowedHostsEnv === 'all'
    ? true
    : allowedHostsEnv
      ? allowedHostsEnv.split(',').map(host => host.trim()).filter(Boolean)
      : undefined;

const apiProxy = {
  target: backendOrigin,
  changeOrigin: true,
  secure: false,
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env.VITE_HOST || '127.0.0.1',
    port: Number(process.env.VITE_PORT || 5173),
    strictPort: true,
    allowedHosts,
    proxy: {
      '/api': apiProxy,
    },
  },
  preview: {
    host: process.env.VITE_HOST || '127.0.0.1',
    port: Number(process.env.VITE_PREVIEW_PORT || 4173),
    strictPort: true,
    allowedHosts,
    proxy: {
      '/api': apiProxy,
    },
  },
});
