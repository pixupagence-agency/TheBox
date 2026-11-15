"use client";

// Module Recording : point d'entrée de la route /recording (connexion requise, éditeur chargé côté client).
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

const Loading = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#07090e] text-slate-300 text-sm font-semibold">Chargement de l&apos;analyse vidéo…</div>
);

// Lecteurs vidéo et stockage local : l'éditeur n'est jamais rendu côté serveur
const RecordingEditor = dynamic(() => import("./RecordingEditor"), { ssr: false, loading: Loading });

export default function RecordingApp() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  if (user === undefined) return <Loading />;
  if (!user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#07090e] p-6">
        <div className="max-w-sm w-full rounded-3xl border border-[#2a2f37] bg-[#11141a] p-6 text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#FF5A4E]">Recording</p>
          <h1 className="text-lg font-black text-white">Connectez-vous pour analyser vos vidéos</h1>
          <p className="text-sm text-slate-400">Le module Recording utilise votre compte The Box.</p>
          <Link href="/" className="inline-flex h-12 items-center justify-center rounded-xl bg-[#FF5A4E] px-6 text-sm font-black text-white">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }
  return <RecordingEditor />;
}
