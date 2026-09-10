/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare global {
  interface Navigator {
    getBattery?: () => Promise<{
      level: number;
      charging: boolean;
      addEventListener: (type: string, listener: () => void) => void;
    }>;
  }
}

export {};
