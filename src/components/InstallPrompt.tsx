import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      setIsPwaInstalled(true);
      return;
    }

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const appInstalled = () => {
      setIsPwaInstalled(true);
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', appInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', appInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setVisible(false);
    setDeferredPrompt(null);
  };

  if (isPwaInstalled) return null;

  return (
    <>
      {!visible && deferredPrompt && (
        <button
          type="button"
          onClick={handleInstall}
          className="fixed bottom-5 right-5 z-40 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:scale-[1.02]"
        >
          Install app
        </button>
      )}

      {visible && (
        <div className="fixed inset-x-4 bottom-4 z-50 md:left-auto md:right-6 md:w-[420px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Install app</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">Add Reclaim to your home screen</h3>
              </div>
              <button
                type="button"
                onClick={() => setVisible(false)}
                className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Dismiss install prompt"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-600">
              Get quick access to your device tracker and enjoy a more app-like experience on mobile.
            </p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleInstall}
                className="flex-1 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30"
              >
                Install
              </button>
              <button
                type="button"
                onClick={() => setVisible(false)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
