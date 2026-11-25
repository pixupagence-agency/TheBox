// Tableau tactique : ancien handleToggleMicRecording() de components/TacticsBoard.tsx (code inchangé ; les valeurs
// du tableau qu'il utilise arrivent dans boardCtx).
import React from "react";

export interface HandleToggleMicRecordingCtx {
  isProOrAdmin: boolean;
  isRecordingVoice: boolean;
  recognitionRef: React.RefObject<any>;
  setIsCheckoutOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRecordingVoice: React.Dispatch<React.SetStateAction<boolean>>;
  setSleekToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setSpeechError: React.Dispatch<React.SetStateAction<string | null>>;
  setTacticalNotes: React.Dispatch<React.SetStateAction<string>>;
}

export function handleToggleMicRecording(boardCtx: HandleToggleMicRecordingCtx) {
  const { isProOrAdmin, isRecordingVoice, recognitionRef, setIsCheckoutOpen, setIsRecordingVoice, setSleekToastMessage, setSpeechError, setTacticalNotes } = boardCtx;
  if (!isProOrAdmin) {
    setSleekToastMessage("🔒 L'enregistrement des notes vocales est réservé aux formules PRO & PRO+.");
    setIsCheckoutOpen(true);
    return;
  }
  const SpeechRecognitionAPI =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  if (isRecordingVoice) {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) { }
      recognitionRef.current = null;
    }
    setIsRecordingVoice(false);
    setSpeechError(null);
    return;
  }

  if (!SpeechRecognitionAPI) {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => {
          alert(
            "Le microphone fonctionne, mais la reconnaissance vocale automatique (SpeechRecognition) n'est pas disponible sur ce navigateur. Veuillez utiliser Google Chrome, Microsoft Edge ou Safari."
          );
        })
        .catch(() => {
          alert(
            "Accès au microphone bloqué ou refusé. Veuillez autoriser l'accès au microphone dans la barre d'adresse de votre navigateur."
          );
        });
    } else {
      alert("La dictée vocale n'est pas supportée sur ce navigateur.");
    }
    return;
  }

  try {
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "fr-FR";

    recognition.onstart = () => {
      setIsRecordingVoice(true);
      setSpeechError(null);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }

      if (finalTranscript) {
        setTacticalNotes((prev) => {
          const needsSpace = prev && !prev.endsWith("\n") && !prev.endsWith(" ");
          return prev + (needsSpace ? " " : "") + finalTranscript;
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        setSpeechError("Microphone bloqué par le navigateur.");
        alert("Accès au microphone refusé. Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur.");
        setIsRecordingVoice(false);
        recognitionRef.current = null;
      } else if (event.error === "no-speech") {
        // ignore transient no-speech
      } else {
        setSpeechError(`Erreur micro : ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current) {
        try {
          recognition.start();
        } catch (e) {
          setIsRecordingVoice(false);
          recognitionRef.current = null;
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  } catch (err) {
    console.error("Erreur d'initialisation micro:", err);
    alert("Impossible de démarrer le microphone.");
    setIsRecordingVoice(false);
  }
}
