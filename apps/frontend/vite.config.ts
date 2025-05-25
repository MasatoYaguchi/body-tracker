import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,  // 5173 → 3000 に変更
    host: true,  // Codespacesでの外部アクセス許可
    open: false  // 自動ブラウザ起動を無効化
  }
})
