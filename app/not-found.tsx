import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold mb-2">Page introuvable</h2>
      <p className="text-sm text-slate-400 mb-4">La ressource demandée n&apos;existe pas.</p>
      <Link 
        href="/" 
        className="px-4 py-2 bg-[#00E599] text-[#0d1117] font-bold text-xs rounded-xl hover:bg-[#06b87d] transition"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
