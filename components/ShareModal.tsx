"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Mail, 
  MessageCircle, 
  Copy, 
  Check, 
  Sparkles, 
  Download, 
  Shield, 
  Users, 
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  UserCheck,
  Eye,
  Settings2,
  Send,
  Loader2,
  MailCheck,
  Film,
  Play,
  Video
} from "lucide-react";
import { toPng } from "html-to-image";
import { auth } from "@/lib/firebase";
import { clampStepDuration, getAnimationDuration, getPositionAtTime } from "@/lib/animationExport";
import { encodeCanvasToMp4 } from "@/lib/canvasMp4Encoder";
import { getPremiumTheme, premiumOverlay, premiumShell } from "@/lib/premiumModalTheme";

export interface SharePlayerItem {
  number: number | string;
  name: string;
  position?: string;
  isStarter?: boolean;
}

export interface MatchSchemaItem {
  id: string;
  name: string;
  previewImage?: string;
  date?: string;
  description?: string;
  formation?: string;
  sport?: string;
}

export interface ShareData {
  type: "schema" | "carte_3d";
  title: string;
  subtitle?: string;
  sport?: string;
  clubName?: string;
  matchInfo?: string;
  formation?: string;
  notes?: string;
  players?: SharePlayerItem[];
  starters?: SharePlayerItem[];
  substitutes?: SharePlayerItem[];
  phasesCount?: number;
  imageElementRef?: React.RefObject<HTMLDivElement | null>;
  imageUrl?: string;
  gifUrl?: string;
  gifError?: boolean;
  /** Image de chaque étape, dans l'ordre (data URLs) : source du GIF et de la vidéo */
  renderAnimationFrame?: (position: number) => HTMLCanvasElement | null;
  isAnimation?: boolean;
  keyframes?: any[];
  playbackSpeed?: number;
  matchSchemas?: MatchSchemaItem[];
}

const VIDEO_FPS = 30;
const VIDEO_BITRATE = 5_000_000;
const VIDEO_LOOPS = 2;
const VIDEO_FRAME_MS = 1000 / VIDEO_FPS;
const ENCODER_MARGIN_MS = 1500;

// "Animation FOOTBALL (2 étapes)" => "Animation_FOOTBALL_2_etapes_2026-11-07.gif"
const buildExportFilename = (prefix: string, title: string, extension: string): string => {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les accents
    .replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, " ") // la date est déjà ajoutée en fin de nom
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(new RegExp(`^${prefix}(_|$)`, "i"), "");
  const date = new Date().toISOString().slice(0, 10);
  return [prefix, slug, date].filter(Boolean).join("_") + `.${extension}`;
};

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareData | null;
  userEmail?: string;
  userName?: string;
  isModernSleek?: boolean;
}

export default function ShareModal({ isOpen, onClose, data, userEmail, userName, isModernSleek }: ShareModalProps) {
  const [recipientEmail, setRecipientEmail] = useState<string>(userEmail || "");
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailSendSuccess, setEmailSendSuccess] = useState<string | null>(null);
  const [emailSendError, setEmailSendError] = useState<string | null>(null);

  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [downloadedImage, setDownloadedImage] = useState<boolean>(false);
  const [customCoachNote, setCustomCoachNote] = useState<string>("");
  const [isSharingImage, setIsSharingImage] = useState<boolean>(false);
  const [imageShareStatus, setImageShareStatus] = useState<string | null>(null);

  // Modular selection toggles (User selects what to include in the single message)
  const [includePlayers, setIncludePlayers] = useState<boolean>(true);
  // Vue 3D : « joueurs » = titulaires + remplaçants ; « groupe » = liste unique sans distinction
  const [playersListMode, setPlayersListMode] = useState<"joueurs" | "groupe">("joueurs");
  const [includeSchemas, setIncludeSchemas] = useState<boolean>(true);
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);

  // Selected schemas to include if multiple are present
  const [unselectedSchemaIds, setUnselectedSchemaIds] = useState<string[]>([]);
  const [userPreviewSchema, setUserPreviewSchema] = useState<MatchSchemaItem | null>(null);

  // Collapsible text preview
  const [showLivePreview, setShowLivePreview] = useState<boolean>(false);

  // Email Preview Modal States
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState<boolean>(false);
  const [copiedEmailBody, setCopiedEmailBody] = useState<boolean>(false);
  const [copiedEmailSubject, setCopiedEmailSubject] = useState<boolean>(false);

  // 3D Card capture
  const [captured3dUrl, setCaptured3dUrl] = useState<string | null>(null);

  // Animation GIF & Video states
  const [activeMediaTab, setActiveMediaTab] = useState<"image" | "gif" | "video">("gif");
  const [downloadedGif, setDownloadedGif] = useState<boolean>(false);
  const [downloadedVideo, setDownloadedVideo] = useState<boolean>(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [dynamicGifUrl, setDynamicGifUrl] = useState<string | null>(data?.gifUrl || null);
  const [isGeneratingGif, setIsGeneratingGif] = useState<boolean>(false);
  const [recordedVideoExtension, setRecordedVideoExtension] = useState<string>("webm");
  const videoRunIdRef = useRef<number>(0);

  // Nouvelle animation partagée : on repart de zéro pour ne pas afficher le GIF/la vidéo de la précédente
  const renderAnimationFrame = data?.renderAnimationFrame;
  useEffect(() => {
    videoRunIdRef.current += 1;
    setIsRecordingVideo(false);
    setVideoProgress(0);
    setRecordedVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setDynamicGifUrl(null);
    setActiveMediaTab("gif");
  }, [renderAnimationFrame]);

  useEffect(() => {
    if (!isOpen || !data) return;
    if (data.gifUrl) {
      setDynamicGifUrl(data.gifUrl);
    }
  }, [isOpen, data]);

  // Capture 3D card asynchronously if needed
  useEffect(() => {
    if (!isOpen || !data || data.imageUrl) return;

    if (data.type === "carte_3d" && data.imageElementRef?.current) {
      const node = data.imageElementRef.current;
      const width = node.offsetWidth || 500;
      const height = node.scrollHeight || node.offsetHeight || 800;
      toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 0.98,
        width: width,
        height: height,
        canvasWidth: width * 2,
        canvasHeight: height * 2,
      })
        .then((url) => setCaptured3dUrl(url))
        .catch((err) => console.warn("Could not capture 3D card image", err));
    }
  }, [isOpen, data]);

  // Pre-fill coach notes from active tactical notes if present
  useEffect(() => {
    if (isOpen && data) {
      if (data.notes && data.notes !== "Composition officielle transmise pour la rencontre." && data.notes !== "Schéma de jeu préparé pour l'équipe.") {
        setCustomCoachNote(data.notes);
      }
    }
  }, [isOpen, data]);

  // Pre-fill coach's email address from props or localStorage
  useEffect(() => {
    if (userEmail) {
      setRecipientEmail(userEmail);
    } else if (typeof window !== "undefined") {
      try {
        const savedCoaches = localStorage.getItem("thebox_coaches");
        const activeId = localStorage.getItem("thebox_active_coach_id");
        if (savedCoaches) {
          const parsed = JSON.parse(savedCoaches);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const found = parsed.find((c: any) => c.id === activeId) || parsed[0];
            if (found && found.email) {
              setRecipientEmail(found.email);
            }
          }
        }
      } catch (e) {
        console.warn(e);
      }
    }
  }, [userEmail, isOpen]);

  if (!isOpen || !data) return null;

  const allMatchSchemas = data.matchSchemas || [];
  const selectedSchemaIds = allMatchSchemas
    .map((s) => s.id)
    .filter((id) => !unselectedSchemaIds.includes(id));
  const activePreviewSchema = userPreviewSchema || (!data.imageUrl ? allMatchSchemas[0] : null);

  const sportLabel = (data.sport || "Football").toUpperCase();
  const clubLabel = data.clubName || "The Box FC";
  const formationLabel = activePreviewSchema?.formation || data.formation || "4-3-3";
  const activeSchemaTitle = userPreviewSchema?.name || data.title || allMatchSchemas[0]?.name || "Schéma Tactique";
  const activeCoachNoteText = customCoachNote.trim() || data.notes || "";
  const activeSchemaDesc = activePreviewSchema?.description || activeCoachNoteText;
  const activeImageUrl = userPreviewSchema?.previewImage || data.imageUrl || allMatchSchemas[0]?.previewImage || captured3dUrl || null;
  const is3D = data.type === "carte_3d";
  const isAnimMode = Boolean(data.isAnimation || (data.keyframes && data.keyframes.length > 1) || (data.phasesCount && data.phasesCount > 1));

  // Derive starters (players on the tactical pitch) and substitutes
  const activeStarters: SharePlayerItem[] = (() => {
    if (data.starters && data.starters.length > 0) return data.starters;
    if (data.players && data.players.length > 0) {
      const explicit = data.players.filter((p) => p.isStarter);
      if (explicit.length > 0) return explicit;
      return data.players.slice(0, 11);
    }
    return [];
  })();

  const activeSubstitutes: SharePlayerItem[] = (() => {
    if (data.substitutes && data.substitutes.length > 0) return data.substitutes;
    if (data.players && data.players.length > 0) {
      const explicit = data.players.filter((p) => !p.isStarter);
      if (explicit.length > 0 && explicit.length < data.players.length) return explicit;
      if (data.players.length > 11) return data.players.slice(11);
    }
    return [];
  })();

  const allGroupPlayers: SharePlayerItem[] = [...activeStarters, ...activeSubstitutes];
  const totalPlayersCount = allGroupPlayers.length;
  const isGroupList = is3D && playersListMode === "groupe";
  const groupPlayersSorted: SharePlayerItem[] = [...allGroupPlayers].sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));

  // Multi-schema selection toggle
  const toggleSchemaSelection = (schemaId: string) => {
    setUnselectedSchemaIds((prev) =>
      prev.includes(schemaId)
        ? prev.filter((id) => id !== schemaId)
        : [...prev, schemaId]
    );
  };

  // Helper to convert DataURL to File Blob
  const dataURLtoFile = async (dataurl: string, filename: string): Promise<File> => {
    const res = await fetch(dataurl);
    const blob = await res.blob();
    const isGif = dataurl.startsWith("data:image/gif");
    return new File([blob], filename, { type: isGif ? "image/gif" : "image/png" });
  };

  // Build Unified WhatsApp Message without any application URL / link
  const generateWhatsAppMessage = (): string => {
    const sections: string[] = [];

    if (is3D) {
      // 1. Header spécifique Vue 3D
      sections.push(`🛡️ *COMPOSITION DU GROUPE*\n⚽ *Équipe :* ${clubLabel}`);

      // 2. Joueurs : liste unique « Groupe » ou Titulaires / Remplaçants
      if (includePlayers && isGroupList) {
        if (groupPlayersSorted.length > 0) {
          const groupLines: string[] = [`👥 *GROUPE  (${groupPlayersSorted.length}) :*`];
          groupPlayersSorted.forEach((p, idx) => {
            groupLines.push(`  ${idx + 1}. #${p.number} ${p.name || "Joueur"}${p.position && p.position !== "SUB" ? ` (${p.position})` : ""}`);
          });
          sections.push(groupLines.join("\n"));
        }
      } else if (includePlayers) {
        if (activeStarters.length > 0) {
          const starterLines: string[] = [];
          starterLines.push(`👥 *TITULAIRES  (${activeStarters.length}) :*`);
          activeStarters.forEach((p, idx) => {
            starterLines.push(`  ${idx + 1}. #${p.number} ${p.name || "Joueur"}${p.position ? ` (${p.position})` : ""}`);
          });
          sections.push(starterLines.join("\n"));
        }

        if (activeSubstitutes.length > 0) {
          const subLines: string[] = [];
          subLines.push(`🔄 *REMPLAÇANTS  (${activeSubstitutes.length}) :*`);
          activeSubstitutes.forEach((p, idx) => {
            subLines.push(`  ${idx + 1}. #${p.number} ${p.name || "Remplaçant"}${p.position ? ` (${p.position})` : ""}`);
          });
          sections.push(subLines.join("\n"));
        }
      }

      // 3. Consignes du coach
      const noteText = customCoachNote.trim() || (data.notes && data.notes !== "Composition officielle transmise pour la rencontre." ? data.notes.trim() : "");
      if (includeNotes && noteText) {
        sections.push(`📝 *CONSIGNES DU COACH :*\n"${noteText}"`);
      }

      // 4. Signature Staff Technique
      sections.push(`━━━━━━━━━━━━━━━━━━━━\n👤 *Staff Technique • ${clubLabel}*`);

      return sections.join("\n\n");
    }

    // Standard Schemas / Feuille de match view
    const headerLines: string[] = [];
    headerLines.push("📋 *FEUILLE DE MATCH & PLAN TACTIQUE*");
    headerLines.push(`⚽ *Équipe :* ${clubLabel}`);
    if (data.matchInfo) {
      headerLines.push(`🆚 *Rencontre :* ${data.matchInfo}`);
    }
    sections.push(headerLines.join("\n"));

    // 1. Convocations - TITULAIRES & REMPLAÇANTS
    if (includePlayers) {
      if (activeStarters.length > 0) {
        const starterLines: string[] = [];
        starterLines.push(`👥 *TITULAIRES  (${activeStarters.length}) :*`);
        activeStarters.forEach((p, idx) => {
          starterLines.push(`  ${idx + 1}. #${p.number} ${p.name || "Joueur"}${p.position ? ` (${p.position})` : ""}`);
        });
        sections.push(starterLines.join("\n"));
      }

      if (activeSubstitutes.length > 0) {
        const subLines: string[] = [];
        subLines.push(`🔄 *REMPLAÇANTS  (${activeSubstitutes.length}) :*`);
        activeSubstitutes.forEach((p, idx) => {
          subLines.push(`  ${idx + 1}. #${p.number} ${p.name || "Remplaçant"}${p.position ? ` (${p.position})` : ""}`);
        });
        sections.push(subLines.join("\n"));
      }
    }

    // 2. Schémas Tactiques
    if (includeSchemas) {
      const schemaLines: string[] = [];
      schemaLines.push("📐 *SCHÉMAS TACTIQUES :*");

      const includedSchemas = (data.matchSchemas && data.matchSchemas.length > 0)
        ? data.matchSchemas.filter((s) => selectedSchemaIds.includes(s.id))
        : [];

      if (includedSchemas.length > 0) {
        includedSchemas.forEach((sc, i) => {
          schemaLines.push(`${i + 1}. *${sc.name}* (${sc.formation || formationLabel})`);
          if (sc.description) {
            schemaLines.push(`   ↳ _${sc.description}_`);
          }
        });
      } else {
        schemaLines.push(`1. *${activeSchemaTitle}* (${formationLabel})`);
        if (activeSchemaDesc) {
          schemaLines.push(`   ↳ _${activeSchemaDesc}_`);
        }
      }

      sections.push(schemaLines.join("\n"));
    }

    // 3. Notes & Consignes du coach
    const coachNoteToDisplay = customCoachNote.trim() || data.notes?.trim() || activeSchemaDesc || "";
    if (includeNotes && coachNoteToDisplay) {
      sections.push(`📝 *CONSIGNES DU COACH :*\n"${coachNoteToDisplay}"`);
    }

    // Clean Signature (NO APP LINK)
    sections.push(`━━━━━━━━━━━━━━━━━━━━\n👤 *Staff Technique • ${clubLabel}*`);

    return sections.join("\n\n");
  };

  // Build Unified Email Subject & Body - Identical to WhatsApp message format
  const generateEmailData = (): { subject: string; body: string } => {
    const subject = is3D
      ? `🛡️ Composition du Groupe • ${clubLabel}`
      : `[Plan de Jeu] Feuille de match & Schémas tactiques - ${clubLabel}`;

    // The user requested that the email content be IDENTICAL to the WhatsApp message
    const rawMessage = generateWhatsAppMessage();
    const body = rawMessage.replace(/[*_]/g, "");

    return { subject, body };
  };

  // Direct Download Image Helper
  const handleDownloadImage = () => {
    if (!activeImageUrl) return;
    try {
      const filename = buildExportFilename("Schema", activeSchemaTitle, "png");
      const link = document.createElement("a");
      link.download = filename;
      link.href = activeImageUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadedImage(true);
      setTimeout(() => setDownloadedImage(false), 3000);
    } catch (e) {
      console.warn("Erreur téléchargement image", e);
    }
  };

  // Direct Download GIF Animation Helper
  const handleDownloadGif = () => {
    const gifTarget = dynamicGifUrl || data.gifUrl;
    if (!gifTarget) return;
    try {
      const filename = buildExportFilename("Animation", activeSchemaTitle, "gif");
      const link = document.createElement("a");
      link.download = filename;
      link.href = gifTarget;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadedGif(true);
      setTimeout(() => setDownloadedGif(false), 3000);
    } catch (e) {
      console.warn("Erreur téléchargement GIF", e);
    }
  };

  // Direct Download MP4/WebM Video Helper
  const handleDownloadVideo = () => {
    if (!recordedVideoUrl) return;
    try {
      const filename = buildExportFilename("Animation", activeSchemaTitle, recordedVideoExtension);
      const link = document.createElement("a");
      link.download = filename;
      link.href = recordedVideoUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadedVideo(true);
      setTimeout(() => setDownloadedVideo(false), 3000);
    } catch (e) {
      console.warn("Erreur téléchargement vidéo", e);
    }
  };

  // Generate Video using canvas stream & MediaRecorder API
  const handleGenerateVideo = async () => {
    if (isRecordingVideo) return;
    const renderFrame = data.renderAnimationFrame;
    if (!renderFrame) {
      alert("Aucune étape d'animation trouvée pour générer la vidéo.");
      return;
    }

    const runId = ++videoRunIdRef.current;
    try {
      setIsRecordingVideo(true);
      setVideoProgress(5);
      setImageShareStatus("Génération de la vidéo en cours...");

      // Create an offscreen canvas for rendering animated frames
      const targetCanvas = document.createElement("canvas");
      const firstFrame = renderFrame(0);
      if (!firstFrame) throw new Error("Canvas non supporté");
      const stepCount = Math.max(1, data.keyframes?.length || 1);

      // Dimensions paires et limitées : exigées par les encodeurs vidéo H.264
      const videoScale = Math.min(1, 1280 / firstFrame.width);
      targetCanvas.width = Math.floor((firstFrame.width * videoScale) / 2) * 2;
      targetCanvas.height = Math.floor((firstFrame.height * videoScale) / 2) * 2;
      const ctx = targetCanvas.getContext("2d");
      if (!ctx) throw new Error("Canvas non supporté");

      const drawFrame = (position: number) => {
        const source = renderFrame(position);
        if (!source) return;
        ctx.drawImage(source, 0, 0, targetCanvas.width, targetCanvas.height);
        const idx = Math.floor(position);

        // Add a subtle animated phase badge
        ctx.save();
        ctx.fillStyle = "rgba(0, 229, 153, 0.9)";
        ctx.fillRect(30, targetCanvas.height - 50, 160, 30);
        ctx.fillStyle = "#090d14";
        ctx.font = "900 14px system-ui, sans-serif";
        ctx.fillText(`ÉTAPE ${idx + 1} / ${stepCount}`, 45, targetCanvas.height - 30);

        ctx.restore();
      };

      const stepMs = clampStepDuration(data.playbackSpeed);
      const loopDuration = getAnimationDuration(stepCount, stepMs);
      const totalDuration = loopDuration * VIDEO_LOOPS;

      const showVideo = (url: string, extension: string) => {
        setRecordedVideoExtension(extension);
        setRecordedVideoUrl(url);
        setVideoProgress(100);
        setImageShareStatus("Vidéo prête au téléchargement !");
        setTimeout(() => setImageShareStatus(null), 3000);
      };

      const mp4 = await encodeCanvasToMp4({
        canvas: targetCanvas,
        frameCount: Math.round((totalDuration / 1000) * VIDEO_FPS),
        fps: VIDEO_FPS,
        bitrate: VIDEO_BITRATE,
        drawFrame: (frameIndex) =>
          drawFrame(getPositionAtTime(((frameIndex / VIDEO_FPS) * 1000) % loopDuration, stepCount, stepMs)),
        onProgress: (ratio) => setVideoProgress(Math.round(ratio * 18) * 5),
        isCancelled: () => runId !== videoRunIdRef.current,
      });
      if (runId !== videoRunIdRef.current) return;
      if (mp4) {
        showVideo(URL.createObjectURL(mp4), "mp4");
        return;
      }

      // Navigateur sans WebCodecs : enregistrement en temps réel, moins régulier

      // Draw initial frame
      drawFrame(0);

      const stream = targetCanvas.captureStream(VIDEO_FPS);
      let mimeType = "video/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = "video/mp4";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
          mimeType = "video/webm;codecs=vp9";
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          mimeType = "video/webm";
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: VIDEO_BITRATE });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const recordPromise = new Promise<string>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          resolve(url);
        };
      });

      recorder.start();

      // Les positions dépendent du temps écoulé : un appareil lent perd des images mais garde la bonne vitesse.
      // L'encodeur cale à son démarrage et perd les images encore en attente à l'arrêt :
      // ces marges font tomber ces pertes sur des pauses plutôt que sur un déplacement
      const movesEnd = ENCODER_MARGIN_MS + totalDuration;
      const recordingDuration = movesEnd + ENCODER_MARGIN_MS;
      const startedAt = performance.now();
      let elapsed = 0;

      while (elapsed < recordingDuration) {
        if (runId !== videoRunIdRef.current) {
          recorder.stop();
          return;
        }
        const frameStart = performance.now();
        drawFrame(
          elapsed < ENCODER_MARGIN_MS
            ? 0
            : elapsed >= movesEnd
              ? stepCount - 1
              : getPositionAtTime((elapsed - ENCODER_MARGIN_MS) % loopDuration, stepCount, stepMs)
        );
        // Par paliers de 5 % : rafraîchir la fenêtre à chaque image ferait perdre des images à l'enregistrement
        setVideoProgress(Math.round((elapsed / recordingDuration) * 18) * 5);
        const renderTime = performance.now() - frameStart;
        await new Promise((r) => setTimeout(r, Math.max(0, VIDEO_FRAME_MS - renderTime)));
        elapsed = performance.now() - startedAt;
      }

      recorder.stop();
      const videoBlobUrl = await recordPromise;
      if (runId !== videoRunIdRef.current) {
        URL.revokeObjectURL(videoBlobUrl);
        return;
      }
      showVideo(videoBlobUrl, mimeType.startsWith("video/mp4") ? "mp4" : "webm");
    } catch (e) {
      console.error("Erreur génération vidéo:", e);
      if (runId === videoRunIdRef.current) {
        setImageShareStatus(null);
        alert("Erreur lors de la création de la vidéo.");
      }
    } finally {
      if (runId === videoRunIdRef.current) setIsRecordingVideo(false);
    }
  };

  // Direct Copy Image to Clipboard
  const handleCopyImageToClipboard = async () => {
    if (!activeImageUrl) return;
    try {
      const res = await fetch(activeImageUrl);
      const blob = await res.blob();
      if (typeof window !== "undefined" && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopiedImage(true);
        setImageShareStatus("Image copiée dans le presse-papier !");
        setTimeout(() => {
          setCopiedImage(false);
          setImageShareStatus(null);
        }, 3000);
      } else {
        handleDownloadImage();
      }
    } catch (err) {
      console.warn("Échec copie image", err);
      handleDownloadImage();
    }
  };

  // WhatsApp Share with Image and Selected Sections
  const handleShareWhatsApp = async () => {
    setIsSharingImage(true);
    setImageShareStatus("Préparation du message WhatsApp...");

    const message = generateWhatsAppMessage();
    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;

    const mediaToShare = (isAnimMode && (dynamicGifUrl || data.gifUrl)) ? (dynamicGifUrl || data.gifUrl) : activeImageUrl;
    const mediaExtension = (isAnimMode && (dynamicGifUrl || data.gifUrl)) ? "gif" : "png";
    const mediaMime = (isAnimMode && (dynamicGifUrl || data.gifUrl)) ? "image/gif" : "image/png";

    if (includeSchemas && mediaToShare) {
      try {
        const file = await dataURLtoFile(
          mediaToShare,
          buildExportFilename(mediaExtension === "gif" ? "Animation" : "Schema", activeSchemaTitle, mediaExtension)
        );

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: activeSchemaTitle,
            text: message,
            files: [file],
          });
          setImageShareStatus(isAnimMode ? "Message et animation GIF partagés !" : "Message et schéma partagés !");
          setIsSharingImage(false);
          return;
        }
      } catch (e) {
        console.warn("Native share failed, using fallback", e);
      }

      try {
        if (isAnimMode && (dynamicGifUrl || data.gifUrl)) {
          handleDownloadGif();
        } else {
          handleDownloadImage();
          await handleCopyImageToClipboard();
        }
      } catch (e) {
        console.warn(e);
      }
    }

    window.open(whatsappUrl, "_blank");
    setImageShareStatus("Message prêt et image téléchargée !");
    setTimeout(() => {
      setIsSharingImage(false);
      setImageShareStatus(null);
    }, 4000);
  };

  // Email Share - Opens the visual Email Preview window
  const handleShareEmail = () => {
    if (includeSchemas && activeImageUrl) {
      handleDownloadImage();
    }
    setIsEmailPreviewOpen(true);
  };

  // Direct Server-Side Email Sending to User for Forwarding to Contacts
  const handleSendEmailToUser = async () => {
    const target = (recipientEmail || "").trim();
    if (!target || !target.includes("@")) {
      alert("Veuillez renseigner une adresse e-mail valide pour recevoir votre schéma.");
      return;
    }

    setIsSendingEmail(true);
    setEmailSendError(null);
    setEmailSendSuccess(null);

    try {
      const { subject, body } = generateEmailData();
      const mediaToSend = (isAnimMode && (dynamicGifUrl || data.gifUrl)) ? (dynamicGifUrl || data.gifUrl) : activeImageUrl;
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const res = await fetch("/api/send-schema-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          email: target,
          subject,
          body,
          imageUrl: includeSchemas ? mediaToSend : undefined,
          title: activeSchemaTitle,
          clubLabel: clubLabel,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setEmailSendSuccess(`Schéma envoyé avec succès à ${target} ! Vous pouvez ouvrir votre boîte mail et le transférer à vos contacts.`);
        setTimeout(() => {
          setEmailSendSuccess(null);
        }, 9000);
      } else {
        throw new Error(result.error || "Erreur lors de l'envoi de l'e-mail.");
      }
    } catch (err: any) {
      console.error("Erreur envoi mail:", err);
      setEmailSendError(err.message || "Impossible d'envoyer l'e-mail.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Copy whole email body
  const handleCopyEmailBody = async () => {
    const { body } = generateEmailData();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(body);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = body;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedEmailBody(true);
      setTimeout(() => setCopiedEmailBody(false), 3000);
    } catch (err) {
      console.warn("Échec copie email body", err);
    }
  };

  // Copy email subject line
  const handleCopyEmailSubject = async () => {
    const { subject } = generateEmailData();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(subject);
      }
      setCopiedEmailSubject(true);
      setTimeout(() => setCopiedEmailSubject(false), 3000);
    } catch (err) {
      console.warn("Échec copie email subject", err);
    }
  };

  // Launch native mail client with mailto:
  const handleLaunchNativeMailto = () => {
    const { subject, body } = generateEmailData();
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.assign(mailtoUrl);
  };

  // Copy text summary
  const handleCopySummary = async () => {
    const textToCopy = generateWhatsAppMessage().replace(/[*_]/g, "");
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch (err) {
      console.warn("Échec copie presse-papier", err);
    }
  };

  const hasMultipleSchemas = Boolean(data.matchSchemas && data.matchSchemas.length > 1);
  const th = getPremiumTheme(Boolean(isModernSleek));

  return (
    <div className={`${premiumOverlay} z-[100]`}>
      <div
        className={`${premiumShell} w-full max-w-6xl h-[94vh] sm:h-[90vh] ${th.panel}`}
        onClick={(e) => e.stopPropagation()}
      >
        {!isModernSleek && (
          <div className="absolute -top-40 left-40 w-[520px] h-[320px] bg-[#00E599]/[0.05] rounded-full blur-3xl pointer-events-none" />
        )}

        {/* ================= SIDEBAR : CONTENU DU MESSAGE ================= */}
        <aside className={`hidden md:flex w-72 shrink-0 flex-col border-r relative z-10 ${th.sidebar}`}>
          <div className="px-5 pt-6 pb-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${is3D ? th.goldTile : th.accentChip}`}>
                {is3D ? <Sparkles className="h-5 w-5" /> : <Send className="h-5 w-5" />}
              </div>
              <div className="leading-tight min-w-0">
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${th.accent}`}>{sportLabel}</p>
                <p className={`text-sm font-black truncate ${th.text}`}>Briefing tactique</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-5 scrollbar-thin">
            {/* Éléments inclus */}
            <div>
              <p className={`px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] ${th.faint}`}>Contenu du message</p>
              <div className="space-y-1.5">
                {[
                  { key: "players", on: includePlayers, set: setIncludePlayers, icon: Users, label: "Joueurs", desc: isGroupList ? `Groupe de ${totalPlayersCount} joueurs` : `${activeStarters.length} titulaires${activeSubstitutes.length > 0 ? ` · ${activeSubstitutes.length} remplaçants` : ""}` },
                  { key: "schemas", on: includeSchemas, set: setIncludeSchemas, icon: Layers, label: isAnimMode ? "Animation" : "Schémas", desc: hasMultipleSchemas ? `${selectedSchemaIds.length}/${data.matchSchemas?.length} sélectionnés` : isAnimMode ? "GIF, vidéo ou image fixe" : "Visuel HD du terrain" },
                  { key: "notes", on: includeNotes, set: setIncludeNotes, icon: FileText, label: "Consignes", desc: customCoachNote.trim() ? "Note personnalisée" : "Mot du coach" },
                ].map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      role="switch"
                      aria-checked={opt.on}
                      onClick={() => opt.set(!opt.on)}
                      className={`w-full p-3 rounded-xl border flex items-center gap-3 text-left transition cursor-pointer ${opt.on ? th.card : `${th.cardMuted} opacity-70 hover:opacity-100`}`}
                    >
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${opt.on ? th.accentChip : th.chip}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-black ${th.text}`}>{opt.label}</p>
                        <p className={`text-[10.5px] truncate ${th.sub}`}>{opt.desc}</p>
                      </div>
                      <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${opt.on ? (isModernSleek ? "bg-emerald-500" : "bg-[#00E599]") : (isModernSleek ? "bg-slate-200" : "bg-white/10")}`}>
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${opt.on ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                      </span>
                    </button>
                  );
                })}
              </div>
              {is3D && includePlayers && (
                <div className={`mt-2 flex gap-1 p-1 rounded-xl border ${th.segment}`} role="radiogroup" aria-label="Présentation des joueurs">
                  {([
                    { v: "joueurs", l: "Joueurs", t: "Titulaires et remplaçants" },
                    { v: "groupe", l: "Groupe", t: "Liste unique, sans distinction titulaire / remplaçant" },
                  ] as const).map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      role="radio"
                      aria-checked={playersListMode === o.v}
                      title={o.t}
                      onClick={() => setPlayersListMode(o.v)}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${playersListMode === o.v ? th.segmentActive : th.segmentIdle}`}
                    >
                      {playersListMode === o.v && <Check className={`w-3 h-3 ${th.accent}`} />}
                      {o.l}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sélection des schémas */}
            {includeSchemas && hasMultipleSchemas && (
              <div>
                <p className={`px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] ${th.faint}`}>Schémas du match</p>
                <div className="space-y-1">
                  {data.imageUrl && data.matchSchemas && data.matchSchemas.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setUserPreviewSchema(null)}
                      className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition cursor-pointer ${userPreviewSchema === null ? th.navActive : th.navIdle}`}
                    >
                      {userPreviewSchema === null && <span className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${th.navIndicator}`} />}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={data.imageUrl} alt="Terrain actuel" className="w-10 h-6 object-cover rounded-md bg-black border border-white/10" />
                      <span className="min-w-0">
                        <span className="block text-[11px] font-bold truncate">Terrain actuel</span>
                        <span className={`block text-[10px] ${th.faint}`}>Vue principale</span>
                      </span>
                    </button>
                  )}
                  {data.matchSchemas?.map((sc) => {
                    const isChecked = selectedSchemaIds.includes(sc.id);
                    const isPreviewing = userPreviewSchema?.id === sc.id;
                    return (
                      <div
                        key={sc.id}
                        className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition ${isPreviewing ? th.navActive : th.navIdle}`}
                      >
                        {isPreviewing && <span className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${th.navIndicator}`} />}
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSchemaSelection(sc.id)}
                          className="w-3.5 h-3.5 accent-[#00E599] rounded cursor-pointer shrink-0"
                          title="Inclure ce schéma dans le message"
                        />
                        <button type="button" onClick={() => setUserPreviewSchema(sc)} className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer">
                          {sc.previewImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={sc.previewImage} alt={sc.name} className="w-10 h-6 object-cover rounded-md bg-black border border-white/10 shrink-0" />
                          ) : (
                            <ImageIcon className={`w-4 h-4 shrink-0 ${th.faint}`} />
                          )}
                          <span className="min-w-0">
                            <span className="block text-[11px] font-bold truncate">{sc.name}</span>
                            {sc.formation && <span className={`block text-[10px] ${th.faint}`}>{sc.formation}</span>}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="p-3">
            <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${th.cardMuted}`}>
              <Shield className={`w-4 h-4 shrink-0 ${th.accent}`} />
              <div className="min-w-0">
                <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${th.faint}`}>Staff technique</p>
                <p className={`text-xs font-bold truncate ${th.text}`}>{clubLabel}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ================= MAIN ================= */}
        <main className="flex-1 min-w-0 flex flex-col relative z-10 min-h-0">
          <header className={`px-5 sm:px-8 pt-5 sm:pt-6 pb-4 border-b ${th.border}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className={`md:hidden text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${th.accent}`}>{sportLabel}</p>
                <h2 className={`text-lg sm:text-xl font-black tracking-tight ${th.text}`}>Partager le briefing tactique</h2>
                <p className={`text-xs mt-1 ${th.sub}`}>Composez un message unique pour vos joueurs et votre staff.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowLivePreview(!showLivePreview)}
                  className={`hidden sm:flex px-3 py-2 rounded-xl border text-xs font-bold items-center gap-1.5 transition cursor-pointer ${showLivePreview ? th.segmentActive + " border-transparent" : th.ghostBtn}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Aperçu du texte
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={`p-2 rounded-xl border transition cursor-pointer ${th.ghostBtn}`}
                  title="Fermer"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Options mobiles */}
            <div className={`md:hidden mt-4 flex gap-1 p-1 rounded-xl border ${th.segment}`}>
              {[
                { l: "Joueurs", on: includePlayers, set: setIncludePlayers },
                { l: isAnimMode ? "Animation" : "Schémas", on: includeSchemas, set: setIncludeSchemas },
                { l: "Consignes", on: includeNotes, set: setIncludeNotes },
              ].map((o) => (
                <button
                  key={o.l}
                  type="button"
                  onClick={() => o.set(!o.on)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${o.on ? th.segmentActive : th.segmentIdle}`}
                >
                  {o.on && <Check className={`w-3 h-3 ${th.accent}`} />}
                  {o.l}
                </button>
              ))}
            </div>
            {is3D && includePlayers && (
                <div className={`md:hidden mt-2 flex gap-1 p-1 rounded-xl border ${th.segment}`} role="radiogroup" aria-label="Présentation des joueurs">
                  {([
                    { v: "joueurs", l: "Joueurs", t: "Titulaires et remplaçants" },
                    { v: "groupe", l: "Groupe", t: "Liste unique, sans distinction titulaire / remplaçant" },
                  ] as const).map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      role="radio"
                      aria-checked={playersListMode === o.v}
                      title={o.t}
                      onClick={() => setPlayersListMode(o.v)}
                      className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${playersListMode === o.v ? th.segmentActive : th.segmentIdle}`}
                    >
                      {playersListMode === o.v && <Check className={`w-3 h-3 ${th.accent}`} />}
                      {o.l}
                    </button>
                  ))}
                </div>
              )}
          </header>

          <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 sm:py-6 space-y-5 scrollbar-thin">
            {/* Aperçu texte */}
            {showLivePreview && (
              <div className={`rounded-2xl border overflow-hidden ${th.card}`}>
                <div className={`px-4 py-2.5 border-b flex items-center justify-between ${th.border}`}>
                  <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${th.sub}`}>Texte généré</p>
                  <button type="button" onClick={handleCopySummary} className={`text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:opacity-80 ${th.accent}`}>
                    {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedText ? "Copié" : "Copier"}
                  </button>
                </div>
                <pre className={`text-[11.5px] font-mono whitespace-pre-wrap p-4 max-h-56 overflow-y-auto leading-relaxed scrollbar-thin select-all ${th.body}`}>
                  {generateWhatsAppMessage()}
                </pre>
              </div>
            )}

            {/* Visuel / animation */}
            {includeSchemas && (
              activeImageUrl ? (
                <div className={`rounded-2xl border overflow-hidden ${th.card}`}>
                  <div className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 ${th.border}`}>
                    <p className={`text-[11px] font-black flex items-center gap-1.5 ${th.text}`}>
                      {isAnimMode ? <Film className="w-4 h-4 text-purple-400" /> : <ImageIcon className={`w-4 h-4 ${th.accent}`} />}
                      {isAnimMode ? `Animation · ${data.phasesCount || data.keyframes?.length || 2} étapes` : activeSchemaTitle}
                    </p>
                    {isAnimMode ? (
                      <div className={`flex items-center gap-0.5 p-0.5 rounded-lg border ${th.segment}`}>
                        {([
                          { id: "gif", l: "GIF animé" },
                          { id: "video", l: "Vidéo" },
                          { id: "image", l: "Image fixe" },
                        ] as const).map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setActiveMediaTab(tab.id);
                              if (tab.id === "video" && !recordedVideoUrl && !isRecordingVideo) handleGenerateVideo();
                            }}
                            className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold transition cursor-pointer ${activeMediaTab === tab.id ? th.segmentActive : th.segmentIdle}`}
                          >
                            {tab.l}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${th.chip}`}>HD</span>
                    )}
                  </div>

                  <div className={`relative p-3 flex flex-col items-center justify-center min-h-[260px] ${isModernSleek ? "bg-slate-50" : "bg-black/20"}`}>
                    {isAnimMode && activeMediaTab === "gif" && (
                      dynamicGifUrl || data.gifUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={dynamicGifUrl || data.gifUrl || ""} alt="Animation GIF" className="w-auto max-w-full h-auto max-h-[380px] object-contain rounded-xl shadow-xl" />
                      ) : data.gifError ? (
                        <div className="py-10 space-y-1 text-center">
                          <p className="text-xs font-bold text-rose-400">Le GIF animé n&apos;a pas pu être créé.</p>
                          <p className={`text-[11px] ${th.sub}`}>Fermez puis rouvrez le partage pour réessayer, ou utilisez l&apos;onglet Vidéo.</p>
                        </div>
                      ) : (
                        <div className="py-10 space-y-2 text-center">
                          <Loader2 className="w-7 h-7 text-purple-400 animate-spin mx-auto" />
                          <p className={`text-xs font-bold ${th.text}`}>Génération du GIF animé…</p>
                        </div>
                      )
                    )}

                    {isAnimMode && activeMediaTab === "video" && (
                      recordedVideoUrl ? (
                        <video src={recordedVideoUrl} controls autoPlay loop playsInline className="w-auto max-w-full h-auto max-h-[380px] rounded-xl shadow-xl" />
                      ) : isRecordingVideo ? (
                        <div className="py-10 space-y-3 text-center">
                          <Loader2 className="w-7 h-7 text-cyan-400 animate-spin mx-auto" />
                          <p className={`text-xs font-bold ${th.text}`}>Enregistrement de la vidéo ({videoProgress}%)</p>
                          <div className={`w-48 h-1.5 rounded-full overflow-hidden mx-auto ${isModernSleek ? "bg-slate-200" : "bg-white/10"}`}>
                            <div className="h-full bg-cyan-400 transition-all duration-200" style={{ width: `${videoProgress}%` }} />
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 space-y-3 text-center">
                          <Video className="w-7 h-7 text-cyan-400 mx-auto" />
                          <p className={`text-xs font-bold ${th.text}`}>Prêt à créer la vidéo HD</p>
                          <button type="button" onClick={handleGenerateVideo} className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${th.primaryBtn}`}>
                            Générer la vidéo
                          </button>
                        </div>
                      )
                    )}

                    {(!isAnimMode || activeMediaTab === "image") && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={activeImageUrl} alt={activeSchemaTitle} className="w-auto max-w-full h-auto max-h-[380px] object-contain rounded-xl shadow-xl" />
                    )}

                    {/* Actions sur le visuel */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-black/75 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-xl z-20">
                      {isAnimMode && (dynamicGifUrl || data.gifUrl) && (
                        <button onClick={handleDownloadGif} className="h-8 px-2.5 text-[11px] font-bold text-white/90 hover:text-white hover:bg-white/10 rounded-lg inline-flex items-center gap-1.5 transition cursor-pointer" title="Télécharger le GIF animé">
                          <Film className="w-3.5 h-3.5 text-purple-300" />
                          {downloadedGif ? "Téléchargé" : "GIF"}
                        </button>
                      )}
                      {isAnimMode && recordedVideoUrl && (
                        <button onClick={handleDownloadVideo} className="h-8 px-2.5 text-[11px] font-bold text-white/90 hover:text-white hover:bg-white/10 rounded-lg inline-flex items-center gap-1.5 transition cursor-pointer" title="Télécharger la vidéo">
                          <Video className="w-3.5 h-3.5 text-cyan-300" />
                          {downloadedVideo ? "Téléchargée" : "Vidéo"}
                        </button>
                      )}
                      <button onClick={handleDownloadImage} className="h-8 px-2.5 text-[11px] font-bold text-white/90 hover:text-white hover:bg-white/10 rounded-lg inline-flex items-center gap-1.5 transition cursor-pointer" title="Télécharger l'image PNG HD">
                        <Download className="w-3.5 h-3.5 text-[#00E599]" />
                        {downloadedImage ? "Téléchargé" : "PNG"}
                      </button>
                      <span className="h-4 w-px bg-white/15" />
                      <button onClick={handleCopyImageToClipboard} className="h-8 px-2.5 text-[11px] font-bold text-white/90 hover:text-white hover:bg-white/10 rounded-lg inline-flex items-center gap-1.5 transition cursor-pointer" title="Copier l'image dans le presse-papier">
                        {copiedImage ? <Check className="w-3.5 h-3.5 text-[#00E599]" /> : <Copy className="w-3.5 h-3.5 text-amber-300" />}
                        {copiedImage ? "Copiée" : "Copier"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`rounded-2xl border border-dashed p-10 text-center ${th.cardMuted}`}>
                  <Loader2 className={`w-6 h-6 mx-auto mb-2 animate-spin ${th.faint}`} />
                  <p className={`text-xs font-bold ${th.sub}`}>Génération du visuel du terrain…</p>
                </div>
              )
            )}

            {/* Joueurs convoqués */}
            {includePlayers && allGroupPlayers.length > 0 && (
              <div className={`rounded-2xl border p-4 space-y-4 ${th.card}`}>
                {(isGroupList
                  ? [{ list: groupPlayersSorted, label: "Groupe", dot: th.accentDot, numCls: th.accent, tag: "Convoqués" }]
                  : [
                      { list: activeStarters, label: "Titulaires", dot: th.accentDot, numCls: th.accent, tag: "Sur le schéma" },
                      { list: activeSubstitutes, label: "Remplaçants", dot: "bg-amber-500", numCls: th.gold, tag: "Banc" },
                    ]
                ).filter((g) => g.list.length > 0).map((g) => (
                  <div key={g.label}>
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-[11px] font-black uppercase tracking-[0.14em] flex items-center gap-2 ${th.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${g.dot}`} />
                        {g.label}
                        <span className={`tabular-nums ${th.faint}`}>{g.list.length}</span>
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${th.chip}`}>{g.tag}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {g.list.map((p, i) => (
                        <span key={i} className={`text-[11px] font-semibold px-2 py-1 rounded-lg border flex items-center gap-1.5 ${th.cardMuted} ${th.body}`}>
                          <strong className={`font-black tabular-nums ${g.numCls}`}>{p.number}</strong>
                          <span>{p.name || "Joueur"}</span>
                          {p.position && p.position !== "SUB" && <span className={`text-[10px] ${th.faint}`}>{p.position}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Consignes du coach */}
            {includeNotes && (
              <div>
                <label className={`block text-[10px] font-black uppercase tracking-[0.14em] mb-1.5 ${th.sub}`}>Consignes ou mot du coach</label>
                <textarea
                  value={customCoachNote}
                  onChange={(e) => setCustomCoachNote(e.target.value)}
                  placeholder="Ex : rendez-vous au vestiaire à 13h30. Intensité dès l'entame et pressing haut…"
                  rows={3}
                  className={`w-full rounded-xl px-3 py-2.5 text-xs border outline-none transition resize-none leading-relaxed ${th.input}`}
                />
              </div>
            )}

            {/* Retours */}
            {imageShareStatus && (
              <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${th.accentChip}`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {imageShareStatus}
              </div>
            )}
            {emailSendSuccess && (
              <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${th.accentChip}`}>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {emailSendSuccess}
              </div>
            )}
            {emailSendError && (
              <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${th.danger}`}>
                <X className="w-4 h-4 shrink-0" />
                {emailSendError}
              </div>
            )}
          </div>

          {/* Pied : actions d'envoi */}
          <footer className={`px-5 sm:px-8 py-4 border-t flex flex-wrap items-center gap-2 ${th.border}`}>
            <button
              type="button"
              onClick={handleCopySummary}
              className={`h-10 px-3.5 rounded-xl border text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer ${th.ghostBtn}`}
            >
              {copiedText ? <Check className={`w-4 h-4 ${th.accent}`} /> : <Copy className="w-4 h-4" />}
              {copiedText ? "Texte copié" : "Copier le texte"}
            </button>
            {includeSchemas && isAnimMode && (dynamicGifUrl || data.gifUrl) && (
              <button
                type="button"
                onClick={handleDownloadGif}
                className={`h-10 px-3.5 rounded-xl border text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer ${th.ghostBtn}`}
              >
                <Film className="w-4 h-4 text-purple-400" />
                GIF
              </button>
            )}
            {includeSchemas && (
              <button
                type="button"
                onClick={handleDownloadImage}
                className={`h-10 px-3.5 rounded-xl border text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer ${th.ghostBtn}`}
              >
                <Download className={`w-4 h-4 ${th.accent}`} />
                PNG HD
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={handleShareEmail}
                className={`h-10 px-4 rounded-xl border text-xs font-black inline-flex items-center gap-2 transition cursor-pointer ${th.ghostBtn}`}
                title={includeSchemas ? "Recevoir le briefing et le visuel par e-mail pour le transférer" : "Recevoir le briefing par e-mail pour le transférer"}
              >
                <Mail className="w-4 h-4 text-sky-500" />
                M&apos;envoyer par e-mail
              </button>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                disabled={isSharingImage}
                className="h-10 px-4 rounded-xl text-xs font-black inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-[#052e14] shadow-lg shadow-[#25D366]/20 transition cursor-pointer disabled:opacity-50"
                title={includeSchemas ? (isAnimMode ? "Message + animation GIF" : "Message + image HD") : "Message texte formaté"}
              >
                <MessageCircle className="w-4 h-4" />
                Partager sur WhatsApp
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL : VISUALISATEUR ET APERÇU DE L'EMAIL AVANT ENVOI */}
      {/* ========================================================= */}
      {isEmailPreviewOpen && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => setIsEmailPreviewOpen(false)}
        >
          <div 
            className={`w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border relative ${
              isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0b0e14] border-[#1e293b] text-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow visual accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E599]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Email Modal Header */}
            <div className={`flex items-center justify-between px-5 sm:px-6 py-4 border-b relative z-10 ${
              isModernSleek ? "bg-slate-100 border-slate-200 text-slate-900" : "bg-[#090d14] border-[#1f293d] text-white"
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${
                  isModernSleek ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-blue-500/20 text-blue-400 border-blue-500/40"
                }`}>
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm sm:text-base font-black uppercase tracking-wider ${
                      isModernSleek ? "text-slate-900" : "text-white"
                    }`}>
                      Aperçu de l&apos;E-mail avant envoi
                    </h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      isModernSleek ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-blue-950/80 text-blue-400 border-blue-500/30"
                    }`}>
                      Format identique WhatsApp
                    </span>
                  </div>
                  <p className={`text-xs font-medium ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                    Visualisez le message et copiez son contenu complet en un clic
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmailPreviewOpen(false)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition cursor-pointer shrink-0 ${
                  isModernSleek ? "text-slate-400 hover:text-slate-900 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-[#1f293d]"
                }`}
                title="Fermer l'aperçu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Meta & Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 scrollbar-thin">
              
              {/* Header fields: Expéditeur / Destinataire / Objet */}
              <div className={`border rounded-xl p-3 space-y-2 text-xs ${
                isModernSleek ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-[#090d14] border-[#1f293d] text-white"
              }`}>
                <div className={`flex items-center justify-between border-b pb-2 ${
                  isModernSleek ? "border-slate-200" : "border-[#1f293d]/60"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold uppercase text-[10px] ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Expéditeur :</span>
                    <span className={`font-bold ${isModernSleek ? "text-slate-900" : "text-slate-200"}`}>Staff Technique • {clubLabel}</span>
                  </div>
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${
                    isModernSleek ? "text-emerald-700" : "text-emerald-400"
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Prêt à envoyer
                  </span>
                </div>

                {/* Destinataire (Adresse de l'utilisateur pour transfert) */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 ${
                  isModernSleek ? "border-slate-200" : "border-[#1f293d]/60"
                }`}>
                  <div className="flex items-center gap-2 flex-1">
                    <span className={`font-bold uppercase text-[10px] shrink-0 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Votre E-mail (Destinataire) :</span>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="votre.email@exemple.com"
                      className={`border rounded-lg px-2.5 py-1 text-xs font-medium outline-none transition w-full sm:w-72 ${
                        isModernSleek
                          ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500"
                          : "bg-[#05080e] border-[#1f293d] text-white placeholder-slate-500 focus:border-[#00E599]"
                      }`}
                    />
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold self-start sm:self-auto shrink-0 border ${
                    isModernSleek ? "text-blue-700 bg-blue-50 border-blue-200" : "text-blue-300 bg-blue-950/80 border-blue-500/30"
                  }`}>
                    Pour transfert à vos contacts
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`font-bold uppercase text-[10px] shrink-0 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Objet :</span>
                    <span className={`font-black truncate ${isModernSleek ? "text-blue-700" : "text-blue-300"}`}>{generateEmailData().subject}</span>
                  </div>
                  <button
                    onClick={handleCopyEmailSubject}
                    className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer border ${
                      isModernSleek
                        ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-xs"
                        : "bg-[#121926] hover:bg-[#1a253a] border-[#1f293d] text-slate-300 hover:text-white"
                    }`}
                    title="Copier uniquement l'objet du mail"
                  >
                    {copiedEmailSubject ? <Check className="w-3 h-3 text-[#00E599]" /> : <Copy className={`w-3 h-3 ${isModernSleek ? "text-blue-600" : "text-blue-400"}`} />}
                    <span>{copiedEmailSubject ? "Objet copié !" : "Copier objet"}</span>
                  </button>
                </div>
              </div>

              {/* Notice explicative : Envoi vers l'adresse du coach pour transfert */}
              <div className={`border rounded-xl p-3 text-xs flex items-start gap-2.5 ${
                isModernSleek ? "bg-blue-50/80 border-blue-200 text-blue-950" : "bg-[#091a2e] border-[#1e3a5f] text-blue-200"
              }`}>
                <span className="text-base shrink-0">✉️</span>
                <div className="leading-relaxed">
                  <span className={`font-bold block ${isModernSleek ? "text-blue-950" : "text-white"}`}>Comment ça marche ?</span>
                  Le schéma et le briefing complet sont envoyés directement à votre boîte mail. Dès réception, cliquez sur <strong>« Transférer »</strong> dans votre messagerie pour l&apos;adresser à vos joueurs, votre staff ou vos dirigeants.
                </div>
              </div>

              {/* Feedback messages d'envoi d'e-mail */}
              {emailSendSuccess && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in border-2 ${
                  isModernSleek ? "bg-emerald-50 border-emerald-500 text-emerald-800" : "bg-[#102420] border-2 border-[#00E599] text-[#00E599]"
                }`}>
                  <CheckCircle2 className={`w-5 h-5 shrink-0 ${isModernSleek ? "text-emerald-600" : "text-[#00E599]"}`} />
                  <span>{emailSendSuccess}</span>
                </div>
              )}
              {emailSendError && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in border ${
                  isModernSleek ? "bg-rose-50 border-rose-300 text-rose-800" : "bg-red-950/80 border border-red-500 text-red-200"
                }`}>
                  <X className="w-5 h-5 shrink-0 text-rose-500" />
                  <span>{emailSendError}</span>
                </div>
              )}

              {/* Email Content Box */}
              <div className={`border rounded-xl p-4 relative group ${
                isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#070b13] border-2 border-[#1f293d]"
              }`}>
                <div className={`flex items-center justify-between pb-2 mb-2 border-b text-[10px] uppercase font-black tracking-wider ${
                  isModernSleek ? "border-slate-200 text-slate-500" : "border-[#1f293d] text-slate-400"
                }`}>
                  <span className={`flex items-center gap-1.5 ${isModernSleek ? "text-slate-700" : "text-slate-300"}`}>
                    <FileText className={`w-3.5 h-3.5 ${isModernSleek ? "text-blue-600" : "text-blue-400"}`} />
                    <span>Corps de l&apos;e-mail prêt à être envoyé :</span>
                  </span>
                  <span className={`${isModernSleek ? "text-slate-400" : "text-slate-500"} font-mono text-[9px] lowercase`}>texte brut formaté</span>
                </div>

                <pre className={`text-xs font-mono whitespace-pre-wrap p-3 rounded-lg border max-h-64 overflow-y-auto leading-relaxed scrollbar-thin select-all ${
                  isModernSleek
                    ? "bg-white border-slate-300 text-slate-800 shadow-inner"
                    : "bg-[#05080e] border-[#1a2333] text-slate-200"
                }`}>
                  {generateEmailData().body}
                </pre>
              </div>

              {/* Schema Image Attachment Notice */}
              {includeSchemas && activeImageUrl && (
                <div className={`border rounded-xl p-3 flex items-center justify-between text-xs ${
                  isModernSleek ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-[#102420] border border-[#00E599]/40 text-[#00E599]"
                }`}>
                  <div className={`flex items-center gap-2.5 ${isModernSleek ? "text-emerald-800" : "text-[#00E599]"}`}>
                    <ImageIcon className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="font-black block">Schéma visuel HD inclus</span>
                      <span className={`text-[10px] font-medium ${isModernSleek ? "text-emerald-700" : "text-slate-300"}`}>
                        L&apos;image du schéma tactique sera directement intégrée dans l&apos;e-mail envoyé.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadImage}
                    className={`h-8 px-3 font-black text-[10px] uppercase rounded-lg transition cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                      isModernSleek
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        : "bg-[#00E599] hover:bg-[#00c583] text-[#07130a]"
                    }`}
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span>{downloadedImage ? "Téléchargée !" : "Télécharger PNG"}</span>
                  </button>
                </div>
              )}

              {/* Status Alert if copied */}
              {copiedEmailBody && (
                <div className={`border p-3 rounded-xl text-xs font-black flex items-center gap-2 animate-in fade-in ${
                  isModernSleek ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-[#102420] border border-[#00E599] text-[#00E599]"
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Tout le corps du message est copié dans votre presse-papier !</span>
                </div>
              )}
            </div>

            {/* Email Modal Footer Actions */}
            <div className={`p-4 border-t flex flex-col sm:flex-row items-center gap-2 ${
              isModernSleek ? "bg-slate-100 border-slate-200" : "bg-[#090d14] border-[#1f293d]"
            }`}>
              {/* PRIMARY CTA: SEND DIRECTLY TO COACH'S EMAIL */}
              <button
                onClick={handleSendEmailToUser}
                disabled={isSendingEmail || !recipientEmail}
                className="flex-1 w-full h-10 px-4 rounded-xl font-black text-xs uppercase inline-flex items-center justify-center gap-2 whitespace-nowrap transition cursor-pointer shadow-lg bg-gradient-to-r from-emerald-500 to-[#00E599] hover:from-emerald-400 hover:to-[#00c583] text-[#07130a] shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black shrink-0" />
                    <span>ENVOI EN COURS...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-black shrink-0" />
                    <span>M&apos;ENVOYER PAR E-MAIL</span>
                  </>
                )}
              </button>

              {/* SECONDARY CTA: COPY ALL EMAIL BODY */}
              <button
                onClick={handleCopyEmailBody}
                className={`w-full sm:w-auto h-10 px-3.5 rounded-xl font-black text-xs uppercase inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition cursor-pointer border ${
                  isModernSleek
                    ? "bg-white hover:bg-slate-50 border-slate-300 hover:border-slate-400 text-slate-700 shadow-xs"
                    : "bg-[#121926] hover:bg-[#1a253a] border-[#1f293d] hover:border-slate-500 text-slate-200 hover:text-white"
                }`}
                title="Copier le texte complet"
              >
                {copiedEmailBody ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3] text-[#00E599] shrink-0" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 shrink-0" />
                    <span>Copier texte</span>
                  </>
                )}
              </button>

              {/* TERTIARY CTA: OPEN MAILTO */}
              <button
                onClick={handleLaunchNativeMailto}
                className={`w-full sm:w-auto h-10 px-3.5 rounded-xl font-bold text-xs uppercase inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition cursor-pointer border ${
                  isModernSleek
                    ? "bg-white hover:bg-slate-50 border-slate-300 text-slate-700 hover:text-slate-900 shadow-xs"
                    : "bg-[#121926] hover:bg-[#1a2333] border-[#1f293d] text-slate-300 hover:text-white"
                }`}
                title="Ouvrir votre logiciel e-mail par défaut"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>Messagerie</span>
              </button>

              {/* Close/Back button */}
              <button
                onClick={() => setIsEmailPreviewOpen(false)}
                className={`w-full sm:w-auto h-10 px-4 rounded-xl font-bold text-xs uppercase inline-flex items-center justify-center whitespace-nowrap transition cursor-pointer border ${
                  isModernSleek
                    ? "bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-800"
                    : "bg-[#121926] hover:bg-[#1a2333] border-[#1f293d] text-slate-300 hover:text-white"
                }`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
