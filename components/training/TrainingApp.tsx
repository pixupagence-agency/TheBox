"use client";

// Module Training : point d'entrée de la route /training (connexion requise, éditeur chargé côté client).
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

const Loading = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#07090e] text-slate-300 text-sm font-semibold">Chargement de l&apos;atelier…</div>
);

// Konva a besoin du navigateur : l'éditeur n'est jamais rendu côté serveur
const TrainingEditor = dynamic(() => import("./TrainingEditor"), { ssr: false, loading: Loading });

export default function TrainingApp() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  if (user === undefined) return <Loading />;
  if (!user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#07090e] p-6">
        <div className="max-w-sm w-full rounded-3xl border border-[#1a2130] bg-[#0b0f17] p-6 text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#00E599]">Training</p>
          <h1 className="text-lg font-black text-white">Connectez-vous pour créer vos ateliers</h1>
          <p className="text-sm text-slate-400">Le module Training utilise votre compte The Box.</p>
          <Link href="/" className="inline-flex h-12 items-center justify-center rounded-xl bg-[#00E599] px-6 text-sm font-black text-[#04120c]">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }
  return <TrainingEditor />;
}
