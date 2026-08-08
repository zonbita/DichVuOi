/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** `1`/`0` — ép bật/tắt form email-mật khẩu (mặc định: bật khi Vite DEV). */
  readonly VITE_ALLOW_PASSWORD_AUTH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
