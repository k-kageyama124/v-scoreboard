import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/v-scoreboard/',  // ← この行を追加！
  server: {
    host: true
  }
});
