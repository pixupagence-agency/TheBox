"use client";

import React, { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ isModernSleek?: boolean }> = ({ isModernSleek }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA in standalone mode, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        type="button"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer shadow-sm ${
          isModernSleek
            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
            : "bg-[#00E599] hover:bg-[#00c978] text-[#0d1117] font-black"
        }`}
        title="Installer The Box sur votre écran d'accueil"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Installer l&apos;App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          type="button"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer border ${
            isModernSleek
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
              : "bg-[#102420] text-[#00E599] border-[#00e599]/40 hover:bg-[#18362b]"
          }`}
          title="Installer sur iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span>Installer (iOS)</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-[#0d1117] border border-[#1f293d] p-5 shadow-2xl text-white relative">
              <div className="flex items-center justify-between border-b border-[#1f293d] pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#00E599]" />
                  <h3 className="text-sm font-black uppercase text-white">Installer sur iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2333]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>Pour installer <strong>The Box</strong> sur votre écran d&apos;accueil iOS :</p>
                <ol className="list-decimal list-inside space-y-2 font-bold bg-[#090d14] p-3 rounded-xl border border-[#1a2130]">
                  <li>Appuyez sur le bouton <strong>Partager</strong> <span className="text-[#00E599]">⎋</span> dans la barre Safari.</li>
                  <li>Faites défiler vers le bas et choisissez <strong>Sur l&apos;écran d&apos;accueil</strong> ➕.</li>
                  <li>Confirmez en appuyant sur <strong>Ajouter</strong>.</li>
                </ol>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2 rounded-xl bg-[#00E599] text-[#0d1117] font-black text-xs uppercase hover:bg-[#00c978] transition cursor-pointer"
              >
                J&apos;ai compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
