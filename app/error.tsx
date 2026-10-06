'use client';

import React, { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-4">
      <h2 className="text-xl font-bold mb-2">Une erreur inattendue est survenue</h2>
      <p className="text-xs text-slate-400 mb-4 max-w-md text-center">
        {error.message || "Impossible de charger la ressource."}
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-[#00E599] text-[#0d1117] font-bold text-xs rounded-xl hover:bg-[#06b87d] transition cursor-pointer"
      >
        Réessayer
      </button>
    </div>
  );
}
