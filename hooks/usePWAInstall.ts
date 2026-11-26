"use client";

import { useEffect, useState } from 'react';
import { useClientValue } from '@/lib/useClientValue';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const STANDALONE_QUERY = '(display-mode: standalone)';

/** Application ouverte depuis l'écran d'accueil (déjà installée) */
const readStandalone = () =>
  window.matchMedia(STANDALONE_QUERY).matches ||
  (window.navigator as unknown as { standalone?: boolean }).standalone === true;

const subscribeStandalone = (onChange: () => void) => {
  const query = window.matchMedia(STANDALONE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

const readIsIOS = () => /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [justInstalled, setJustInstalled] = useState(false);
  // Lus dans le navigateur sans effet (false au rendu serveur et à l'hydratation)
  const isStandalone = useClientValue(readStandalone, false, subscribeStandalone);
  const isIOS = useClientValue(readIsIOS, false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setJustInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setJustInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled: isStandalone || justInstalled,
    isIOS,
    install,
  };
}
