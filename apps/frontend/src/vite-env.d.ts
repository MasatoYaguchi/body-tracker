// apps/frontend/src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  // 他のVite環境変数があれば追加
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
