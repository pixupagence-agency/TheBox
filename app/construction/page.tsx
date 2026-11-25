import type { Metadata } from "next";
import LogoIcon from "@/components/LogoIcon";

// Page affichée sur thebox-tactic.com tant que le site n'est pas ouvert au public (voir proxy.ts)
export const metadata: Metadata = {
  title: "The Box - Bientôt disponible",
  description: "The Box, l'application de coaching et de tableau tactique, arrive bientôt.",
  robots: { index: false, follow: false },
};

export default function UnderConstruction() {
  return (
    <main className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center px-4 py-12 text-center">
      <LogoIcon className="w-16 h-16 text-[#00E599]" aria-hidden="true" />
      <h1 className="mt-6 text-3xl sm:text-4xl font-extrabold tracking-tight">The Box</h1>
      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#00E599]">Zone de décision tactique</p>
      <p className="mt-8 max-w-md text-base text-slate-300 leading-relaxed">
        Notre site est en construction. L&apos;application de coaching et de tableau tactique arrive très bientôt.
      </p>
      <p className="mt-6 text-sm text-slate-500">
        Une question ?{" "}
        <a href="mailto:support@thebox-tactique.com" className="text-slate-300 underline underline-offset-4 hover:text-white">
          support@thebox-tactique.com
        </a>
      </p>
    </main>
  );
}
