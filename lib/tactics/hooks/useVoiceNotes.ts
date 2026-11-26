"use client";
// Tableau tactique : dictée vocale des notes tactiques (reconnaissance vocale du navigateur, formules PRO).
// Le texte dicté s'ajoute aux notes du match ; la reconnaissance en cours s'arrête au démontage du tableau.
import React, { useEffect, useRef, useState } from "react";
import { handleToggleMicRecording as handleToggleMicRecordingAction } from "@/lib/tactics/actions/handleToggleMicRecording";

interface Options {
  isProOrAdmin: boolean;
  setIsCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSleekToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setTacticalNotes: React.Dispatch<React.SetStateAction<string>>;
}

export function useVoiceNotes({ isProOrAdmin, setIsCheckoutOpen, setSleekToastMessage, setTacticalNotes }: Options) {
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      // Voulu : au démontage, on arrête la reconnaissance vocale en cours (créée après le montage)
      // eslint-disable-next-line react-hooks/exhaustive-deps -- ref d'objet, pas de nœud DOM
      const recognition = recognitionRef.current;
      if (recognition) {
        try {
          recognition.stop();
        } catch { /* déjà arrêtée */ }
      }
    };
  }, []);

  /** Démarre ou arrête la dictée (réservée aux formules PRO : sinon, proposition d'abonnement) */
  const handleToggleMicRecording = () =>
    handleToggleMicRecordingAction({
      isProOrAdmin, isRecordingVoice, recognitionRef, setIsCheckoutOpen, setIsRecordingVoice,
      setSleekToastMessage, setSpeechError, setTacticalNotes,
    });

  return { isRecordingVoice, speechError, setSpeechError, handleToggleMicRecording };
}
