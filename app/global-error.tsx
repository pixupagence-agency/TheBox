'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="bg-[#07090e] text-white flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-xl font-bold mb-2">Une erreur est survenue</h2>
        <p className="text-xs text-slate-400 mb-4">{error?.message || 'Erreur application'}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-[#00E599] text-[#0d1117] font-bold text-xs rounded-xl"
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
