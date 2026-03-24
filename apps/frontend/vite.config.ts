import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Codespacesでの外部アクセス許可
    open: false, // 自動ブラウザ起動を無効化
  },
  // Vite 8は互換レイヤーでesbuild設定を自動変換
  esbuild: {
    drop: ['console', 'debugger'],
  },
});
