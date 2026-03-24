import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Codespacesでの外部アクセス許可
    open: false, // 自動ブラウザ起動を無効化
  },
  build: {
    minify: 'esbuild', // Vite 8のデフォルトoxcではなくesbuildを使用
  },
  esbuild: {
    // console.error/warnは残してデバッグ可能に
    pure: ['console.log', 'console.info', 'console.debug', 'console.trace', 'debugger'],
  },
});
