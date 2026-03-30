/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_AGENCY_WHATSAPP?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
