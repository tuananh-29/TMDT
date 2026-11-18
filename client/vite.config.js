import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      // 2 trang: site bán hàng (index.html) và trang quản trị (admin.html)
      input: { main: resolve(__dirname, 'index.html'), admin: resolve(__dirname, 'admin.html') }
    }
  }
});



