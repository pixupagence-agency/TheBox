"use client";

import React, { useState, useEffect } from "react";
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
  MailCheck
} from "lucide-react";
import { toPng } from "html-to-image";

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
  matchSchemas?: MatchSchemaItem[];
}

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
    return new File([blob], filename, { type: "image/png" });
  };

  // Build Unified WhatsApp Message without any application URL / link
  const generateWhatsAppMessage = (): string => {
    const sections: string[] = [];

    if (is3D) {
      // 1. Header spécifique Vue 3D
      sections.push(`🛡️ *COMPOSITION DU GROUPE*\n⚽ *Équipe :* ${clubLabel}`);

      // 2. Joueurs (Titulaires et Remplaçants)
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
      const timestamp = new Date().toISOString().slice(0, 10);
      const cleanTitle = activeSchemaTitle.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `Schema_${cleanTitle}_${timestamp}.png`;
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

    if (includeSchemas && activeImageUrl) {
      try {
        const file = await dataURLtoFile(
          activeImageUrl,
          `Schema_${activeSchemaTitle.replace(/[^a-zA-Z0-9]/g, "_")}.png`
        );

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: activeSchemaTitle,
            text: message,
            files: [file],
          });
          setImageShareStatus("Message et schéma partagés !");
          setIsSharingImage(false);
          return;
        }
      } catch (e) {
        console.warn("Native share failed, using fallback", e);
      }

      try {
        handleDownloadImage();
        await handleCopyImageToClipboard();
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
      const res = await fetch("/api/send-schema-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: target,
          subject,
          body,
          imageUrl: includeSchemas ? activeImageUrl : undefined,
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border-2 ${
          isModernSleek ? "bg-white border-slate-200 text-slate-900" : "bg-[#0d1117] border-[#1f293d] text-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${
          isModernSleek ? "bg-slate-100 border-slate-200 text-slate-900" : "bg-[#090d14] border-[#1f293d] text-white"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${is3D ? "bg-amber-500/20 text-amber-500 border border-amber-500/40" : "bg-[#00E599]/20 text-[#00E599] border border-[#00E599]/40"}`}>
              {is3D ? <Sparkles className="w-5 h-5" /> : <Settings2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-sm sm:text-base font-black uppercase tracking-wider ${
                  isModernSleek ? "text-slate-900" : "text-white"
                }`}>
                  Partager le Briefing Tactique
                </h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  isModernSleek ? "bg-slate-200 border-slate-300 text-emerald-700" : "bg-[#162032] border-[#22334e] text-[#00E599]"
                }`}>
                  {sportLabel}
                </span>
              </div>
              <p className={`text-xs font-medium ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                Personnalisez les éléments à intégrer dans votre message unique
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isModernSleek ? "text-slate-400 hover:text-slate-900 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-[#1a2333]"
            }`}
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          
          {/* SELECTION CONTROL PANEL */}
          <div className={`border-2 rounded-xl p-3.5 space-y-3 ${
            isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#090d14] border-[#1f293d]"
          }`}>
            <div className={`flex items-center justify-between border-b pb-2 ${
              isModernSleek ? "border-slate-200" : "border-[#1f293d]"
            }`}>
              <span className="text-[11px] uppercase font-black tracking-wider text-amber-500 flex items-center gap-1.5">
                <Settings2 className="w-4 h-4" />
                <span>Éléments inclus dans le message unique :</span>
              </span>
              <button
                onClick={() => setShowLivePreview(!showLivePreview)}
                className={`text-[10px] font-black flex items-center gap-1 cursor-pointer transition ${
                  isModernSleek ? "text-slate-500 hover:text-emerald-600" : "text-slate-400 hover:text-[#00E599]"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showLivePreview ? "Masquer l'aperçu texte" : "Voir aperçu texte"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: Convocations - TITULAIRES & REMPLAÇANTS */}
              <div className={`p-2.5 rounded-xl border transition flex flex-col justify-between ${
                includePlayers 
                  ? (isModernSleek ? "bg-emerald-50 border-emerald-400 text-slate-900" : "bg-[#102420] border-[#00E599]/60 text-white")
                  : (isModernSleek ? "bg-white border-slate-200 text-slate-500 opacity-70" : "bg-[#121926]/60 border-[#1f293d] text-slate-400 opacity-60")
              }`}>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includePlayers}
                    onChange={(e) => setIncludePlayers(e.target.checked)}
                    className="w-4 h-4 accent-[#00E599] rounded cursor-pointer"
                  />
                  <span className="text-xs font-black flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#00E599]" />
                    <span>JOUEURS ({totalPlayersCount})</span>
                  </span>
                </label>
                <span className={`text-[9.5px] font-bold block mt-1 pl-6 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                  {activeStarters.length} titulaires {activeSubstitutes.length > 0 ? `+ ${activeSubstitutes.length} remplaçants` : ""}
                </span>

                {includePlayers && (
                  <div className={`mt-2 pt-2 border-t pl-6 text-[10px] font-bold flex items-center gap-1 ${
                    isModernSleek ? "border-slate-200 text-emerald-700" : "border-[#1f293d] text-emerald-400"
                  }`}>
                    <UserCheck className="w-3 h-3" />
                    <span>Titulaires & remplaçants séparés</span>
                  </div>
                )}
              </div>

              {/* Option 2: Schémas Tactiques */}
              <div className={`p-2.5 rounded-xl border transition flex flex-col justify-between ${
                includeSchemas 
                  ? (isModernSleek ? "bg-emerald-50 border-emerald-400 text-slate-900" : "bg-[#102420] border-[#00E599]/60 text-white")
                  : (isModernSleek ? "bg-white border-slate-200 text-slate-500 opacity-70" : "bg-[#121926]/60 border-[#1f293d] text-slate-400 opacity-60")
              }`}>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeSchemas}
                    onChange={(e) => setIncludeSchemas(e.target.checked)}
                    className="w-4 h-4 accent-[#00E599] rounded cursor-pointer"
                  />
                  <span className="text-xs font-black flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    <span>Schémas</span>
                  </span>
                </label>
                <span className={`text-[9.5px] font-bold block mt-1 pl-6 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                  {hasMultipleSchemas ? `${selectedSchemaIds.length}/${data.matchSchemas?.length} sélectionnés` : "Visuel terrain + plan"}
                </span>

                {includeSchemas && (
                  <div className={`mt-2 pt-2 border-t pl-6 text-[10px] font-bold flex items-center gap-1 ${
                    isModernSleek ? "border-slate-200 text-emerald-700" : "border-[#1f293d] text-emerald-400"
                  }`}>
                    <ImageIcon className="w-3 h-3" />
                    <span>Image HD incluse</span>
                  </div>
                )}
              </div>

              {/* Option 3: Notes & Consignes */}
              <div className={`p-2.5 rounded-xl border transition flex flex-col justify-between ${
                includeNotes 
                  ? (isModernSleek ? "bg-emerald-50 border-emerald-400 text-slate-900" : "bg-[#102420] border-[#00E599]/60 text-white")
                  : (isModernSleek ? "bg-white border-slate-200 text-slate-500 opacity-70" : "bg-[#121926]/60 border-[#1f293d] text-slate-400 opacity-60")
              }`}>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeNotes}
                    onChange={(e) => setIncludeNotes(e.target.checked)}
                    className="w-4 h-4 accent-[#00E599] rounded cursor-pointer"
                  />
                  <span className="text-xs font-black flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-500" />
                    <span>Consignes</span>
                  </span>
                </label>
                <span className={`text-[9.5px] font-bold block mt-1 pl-6 ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>
                  Instructions du coach
                </span>

                {includeNotes && (
                  <div className={`mt-2 pt-2 border-t pl-6 text-[10px] font-bold truncate ${
                    isModernSleek ? "border-slate-200 text-sky-700" : "border-[#1f293d] text-sky-400"
                  }`}>
                    {customCoachNote.trim() ? "Note saisie" : "Consigne active"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LIVE TEXT MESSAGE PREVIEW (Collapsible) */}
          {showLivePreview && (
            <div className={`border rounded-xl p-3 animate-in fade-in ${
              isModernSleek ? "bg-slate-100 border-emerald-400/60" : "bg-[#05080e] border-emerald-500/40"
            }`}>
              <div className="flex items-center justify-between mb-1.5 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                <span>Aperçu en direct du texte généré (sans lien d&apos;application) :</span>
                <button
                  onClick={handleCopySummary}
                  className={`flex items-center gap-1 cursor-pointer font-bold lowercase ${
                    isModernSleek ? "text-slate-600 hover:text-slate-900" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Copy className="w-3 h-3 text-[#00E599]" />
                  <span>copier</span>
                </button>
              </div>
              <pre className={`text-[11px] font-mono whitespace-pre-wrap p-2.5 rounded-lg border max-h-48 overflow-y-auto leading-relaxed scrollbar-thin select-all ${
                isModernSleek ? "bg-white text-slate-800 border-slate-200" : "bg-[#090d14] text-slate-300 border-[#1f293d]"
              }`}>
                {generateWhatsAppMessage()}
              </pre>
            </div>
          )}

          {/* MULTI-SCHEMA SELECTOR (if match has multiple schemas) */}
          {includeSchemas && hasMultipleSchemas && (
            <div className={`border rounded-xl p-3 ${
              isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#090d14] border-[#1f293d]"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] uppercase font-black tracking-wider flex items-center gap-1.5 ${
                  isModernSleek ? "text-amber-700" : "text-amber-300"
                }`}>
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sélectionnez les schémas à envoyer :</span>
                </span>
                <span className={`text-[9px] font-bold ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Cochez pour inclure / Cliquez pour prévisualiser</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {/* Option to view the current pitch / main briefing if data.imageUrl exists */}
                {data.imageUrl && data.matchSchemas && data.matchSchemas.length > 0 && (
                  <div
                    className={`px-3 py-2 rounded-lg border shrink-0 transition flex items-center gap-2 cursor-pointer ${
                      userPreviewSchema === null
                        ? "bg-[#102420] border-[#00E599] text-[#00E599] shadow-sm shadow-[#00e599]/20"
                        : isModernSleek ? "bg-white border-slate-300 text-slate-800 hover:border-slate-400" : "bg-[#121926] border-[#1f293d] text-slate-300 hover:border-slate-500"
                    }`}
                    onClick={() => setUserPreviewSchema(null)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={data.imageUrl} 
                      alt="Terrain actuel" 
                      className="w-8 h-5 object-cover rounded bg-black border border-white/20"
                    />
                    <div>
                      <span className="text-[10px] font-black block truncate max-w-[120px]">Terrain actuel</span>
                      <span className={`text-[8px] block ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>Vue principale</span>
                    </div>
                  </div>
                )}
                {data.matchSchemas?.map((sc) => {
                  const isChecked = selectedSchemaIds.includes(sc.id);
                  const isPreviewing = userPreviewSchema?.id === sc.id;
                  return (
                    <div
                      key={sc.id}
                      className={`px-3 py-2 rounded-lg border shrink-0 transition flex items-center gap-2 ${
                        isPreviewing 
                          ? "bg-[#102420] border-[#00E599] text-[#00E599] shadow-sm shadow-[#00e599]/20" 
                          : isModernSleek ? "bg-white border-slate-300 text-slate-800 hover:border-slate-400" : "bg-[#121926] border-[#1f293d] text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSchemaSelection(sc.id)}
                        className="w-3.5 h-3.5 accent-[#00E599] rounded cursor-pointer"
                        title="Inclure ce schéma dans le message"
                      />
                      <button
                        onClick={() => setUserPreviewSchema(sc)}
                        className="flex items-center gap-2 cursor-pointer text-left"
                      >
                        {sc.previewImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={sc.previewImage} 
                            alt={sc.name} 
                            className="w-8 h-5 object-cover rounded bg-black border border-white/20"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                        )}
                        <div>
                          <span className="text-[10px] font-black block truncate max-w-[120px]">{sc.name}</span>
                          {sc.formation && <span className={`text-[8px] block ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>{sc.formation}</span>}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VISUAL PITCH & PLAYERS SCHEMA IMAGE PREVIEW */}
          {includeSchemas && (
            activeImageUrl ? (
              <div className={`border-2 transition rounded-xl overflow-hidden shadow-2xl relative group ${
                isModernSleek ? "bg-slate-100 border-slate-200 hover:border-emerald-500/50" : "bg-[#070b13] border-[#1f293d] hover:border-[#00E599]/50"
              }`}>
                <div className={`px-3 py-1.5 border-b flex items-center justify-between text-[11px] font-black ${
                  isModernSleek ? "bg-slate-200/80 border-slate-300 text-slate-800" : "bg-[#111827] border-[#1f293d]"
                }`}>
                  <span className="text-[#00E599] uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Aperçu HD du terrain & joueurs ({activeSchemaTitle})</span>
                  </span>
                  <span className={`text-[9.5px] ${isModernSleek ? "text-slate-600" : "text-slate-400"}`}>Format Haute Définition HD</span>
                </div>
                
                <div className={`relative p-2 flex items-center justify-center ${
                  isModernSleek ? "bg-slate-50" : "bg-[#090d14]"
                }`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={activeImageUrl} 
                    alt={activeSchemaTitle}
                    className="w-auto max-w-full h-auto max-h-[360px] object-contain rounded-lg border border-black/20 shadow-xl"
                  />

                  {/* Floating Action Overlay on Top of Image */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/15 shadow-xl">
                    <button
                      onClick={handleDownloadImage}
                      className="p-1.5 text-slate-200 hover:text-[#00E599] transition cursor-pointer text-[11px] font-bold flex items-center gap-1 hover:bg-white/5 rounded-lg"
                      title="Télécharger l'image PNG haute définition"
                    >
                      <Download className="w-3.5 h-3.5 text-[#00E599]" />
                      <span>{downloadedImage ? "Téléchargée !" : "Télécharger PNG"}</span>
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      onClick={handleCopyImageToClipboard}
                      className="p-1.5 text-slate-200 hover:text-[#00E599] transition cursor-pointer text-[11px] font-bold flex items-center gap-1 hover:bg-white/5 rounded-lg"
                      title="Copier l'image directement dans le presse-papier"
                    >
                      {copiedImage ? <Check className="w-3.5 h-3.5 text-[#00E599]" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{copiedImage ? "Image copiée !" : "Copier l'image"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`border border-dashed rounded-xl p-6 text-center text-xs ${
                isModernSleek ? "bg-slate-50 border-slate-300 text-slate-500" : "bg-[#090d14] border-[#1f293d] text-slate-400"
              }`}>
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-400 animate-pulse" />
                <p className="font-bold">Génération du visuel du terrain...</p>
              </div>
            )
          )}

          {/* PLAYERS CONVOCATION DETAIL (TITULAIRES & REMPLAÇANTS) */}
          {includePlayers && allGroupPlayers.length > 0 && (
            <div className={`border rounded-xl p-3.5 space-y-3 ${
              isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#090d14] border-[#1f293d]"
            }`}>
              {/* Starters Section */}
              {activeStarters.length > 0 && (
                <div>
                  <div className={`flex items-center justify-between border-b pb-1.5 mb-2 ${
                    isModernSleek ? "border-slate-200" : "border-[#1f293d]"
                  }`}>
                    <span className={`text-[10px] uppercase font-black tracking-wider flex items-center gap-1.5 ${
                      isModernSleek ? "text-slate-700" : "text-slate-300"
                    }`}>
                      <Users className={`w-3.5 h-3.5 ${isModernSleek ? "text-emerald-800" : "text-[#00E599]"}`} />
                      <span>TITULAIRES ({activeStarters.length}) :</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded border text-[9.5px] font-bold ${
                      isModernSleek ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "text-emerald-400 bg-emerald-950/60 border-emerald-500/30"
                    }`}>
                      Sur le schéma
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {activeStarters.map((p, i) => (
                      <span
                        key={i}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${
                          isModernSleek 
                            ? "bg-white border-emerald-300 text-slate-800 shadow-sm" 
                            : "bg-[#121926] border-emerald-500/30 text-slate-200"
                        }`}
                      >
                        <span className={`font-mono text-[9px] ${isModernSleek ? "text-slate-400" : "text-slate-500"}`}>{i + 1}.</span>
                        <strong className={isModernSleek ? "text-emerald-800 font-extrabold" : "text-emerald-400"}>#{p.number}</strong>
                        <span>{p.name || "Joueur"}</span>
                        {p.position && <span className={`text-[9px] ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>({p.position})</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Substitutes Section */}
              {activeSubstitutes.length > 0 && (
                <div>
                  <div className={`flex items-center justify-between border-b pb-1.5 mb-2 ${
                    isModernSleek ? "border-slate-200" : "border-[#1f293d]"
                  }`}>
                    <span className={`text-[10px] uppercase font-black tracking-wider flex items-center gap-1.5 ${
                      isModernSleek ? "text-slate-700" : "text-slate-400"
                    }`}>
                      <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                      <span>REMPLAÇANTS ({activeSubstitutes.length}) :</span>
                    </span>
                    <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-500/30 text-[9.5px] font-bold">
                      Banc
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {activeSubstitutes.map((p, i) => (
                      <span
                        key={i}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${
                          isModernSleek 
                            ? "bg-white border-amber-300 text-slate-800 shadow-sm" 
                            : "bg-[#121926] border-amber-500/20 text-slate-300"
                        }`}
                      >
                        <span className={`font-mono text-[9px] ${isModernSleek ? "text-slate-400" : "text-slate-500"}`}>{i + 1}.</span>
                        <strong className="text-amber-600 dark:text-amber-400">#{p.number}</strong>
                        <span>{p.name || "Remplaçant"}</span>
                        {p.position && <span className={`text-[9px] ${isModernSleek ? "text-slate-500" : "text-slate-400"}`}>({p.position})</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EDITABLE COACH NOTES (if enabled) */}
          {includeNotes && (
            <div className={`border rounded-xl p-3.5 space-y-1.5 ${
              isModernSleek ? "bg-slate-50 border-slate-200" : "bg-[#090d14] border-[#1f293d]"
            }`}>
              <label className={`text-[10px] uppercase font-black tracking-wider flex items-center gap-1.5 ${
                isModernSleek ? "text-sky-700" : "text-sky-300"
              }`}>
                <FileText className="w-3.5 h-3.5 text-sky-500" />
                <span>Consignes ou mot personnalisé du coach :</span>
              </label>
              <textarea
                value={customCoachNote}
                onChange={(e) => setCustomCoachNote(e.target.value)}
                placeholder="Ex: Rendez-vous au vestiaire à 13h30. Focus sur l'intensité dès l'entame et le pressing haut..."
                rows={2}
                className={`w-full rounded-lg p-2 text-xs focus:outline-none transition resize-none border ${
                  isModernSleek 
                    ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500" 
                    : "bg-[#0d1117] border-[#1f293d] text-slate-200 placeholder-slate-600 focus:border-[#00E599]"
                }`}
              />
            </div>
          )}

          {/* Status Message Alert */}
          {imageShareStatus && (
            <div className="bg-[#102420] border border-[#00E599] p-2.5 rounded-xl text-xs font-bold text-[#00E599] flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00E599]" />
              <span>{imageShareStatus}</span>
            </div>
          )}

          {/* Email Send Feedback Alert */}
          {emailSendSuccess && (
            <div className="bg-[#102420] border-2 border-[#00E599] p-3 rounded-xl text-xs font-bold text-[#00E599] flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00E599]" />
              <span>{emailSendSuccess}</span>
            </div>
          )}
          {emailSendError && (
            <div className="bg-red-950/80 border border-red-500 p-3 rounded-xl text-xs font-bold text-red-300 flex items-center gap-2.5 animate-in fade-in">
              <X className="w-4 h-4 shrink-0 text-red-400" />
              <span>{emailSendError}</span>
            </div>
          )}

          {/* Action Buttons Grid */}
          <div className="space-y-2.5 pt-1">
            <span className={`text-[11px] uppercase font-black tracking-wider block ${
              isModernSleek ? "text-slate-600" : "text-slate-400"
            }`}>
              Envoyer le message groupé :
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* WhatsApp Button */}
              <button
                onClick={handleShareWhatsApp}
                disabled={isSharingImage}
                className="flex items-center justify-center gap-3 p-3 bg-[#25D366] hover:bg-[#20bd5a] text-[#07130a] font-black text-xs uppercase rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer group active:scale-[0.98] disabled:opacity-50"
              >
                <div className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center text-black">
                  <MessageCircle className="w-4 h-4 fill-current" />
                </div>
                <div className="text-left leading-tight">
                  <span className="block text-[12.5px]">Partager sur WhatsApp</span>
                  <span className="block text-[9.5px] opacity-80 font-bold lowercase">
                    {includeSchemas ? "Message + image HD" : "Message texte formaté"}
                  </span>
                </div>
              </button>

              {/* Email Button */}
              <button
                onClick={handleShareEmail}
                className="flex items-center justify-center gap-3 p-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase rounded-xl transition shadow-lg shadow-blue-600/20 cursor-pointer group active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center text-white">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="text-left leading-tight">
                  <span className="block text-[12.5px]">M&apos;envoyer par E-mail</span>
                  <span className="block text-[9.5px] opacity-80 font-bold lowercase">
                    {includeSchemas ? "Schéma HD + briefing pour transfert" : "Briefing pour transfert"}
                  </span>
                </div>
              </button>
            </div>

            {/* Secondary Actions: Copy Summary & Download PNG */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                onClick={handleCopySummary}
                className={`flex-1 w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  copiedText 
                    ? "bg-emerald-950/80 border-[#00E599] text-[#00E599]" 
                    : isModernSleek ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800" : "bg-[#121926] hover:bg-[#1a253a] border-[#1f293d] text-slate-300"
                }`}
              >
                {copiedText ? <Check className="w-4 h-4 text-[#00E599]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedText ? "Texte copié !" : "Copier le texte du message"}</span>
              </button>

              {includeSchemas && (
                <button
                  onClick={handleDownloadImage}
                  className={`flex-1 w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    isModernSleek ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800" : "bg-[#121926] hover:bg-[#1a253a] border-[#1f293d] text-slate-200"
                  }`}
                >
                  <Download className="w-4 h-4 text-[#00E599]" />
                  <span>{downloadedImage ? "Image téléchargée !" : "Télécharger l'image PNG HD"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`flex items-center justify-between px-5 py-3 border-t text-[10px] font-bold ${
          isModernSleek ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-[#090d14] border-[#1f293d] text-slate-500"
        }`}>
          <span className="flex items-center gap-1.5 text-[#00E599]">
            <Shield className="w-3.5 h-3.5" />
            <span>Staff Technique • {clubLabel}</span>
          </span>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 font-black uppercase text-[10px] rounded-lg border transition cursor-pointer ${
              isModernSleek ? "bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-800" : "bg-[#121926] hover:bg-[#1a2333] border-[#1f293d] text-slate-300"
            }`}
          >
            Fermer
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL : VISUALISATEUR ET APERÇU DE L'EMAIL AVANT ENVOI */}
      {/* ========================================================= */}
      {isEmailPreviewOpen && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => setIsEmailPreviewOpen(false)}
        >
          <div 
            className="bg-[#0d1117] border-2 border-[#1f293d] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Email Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1f293d] bg-[#090d14]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                      Aperçu de l&apos;E-mail avant envoi
                    </h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-400">
                      Format identique WhatsApp
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    Visualisez le message et copiez son contenu complet en un clic
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEmailPreviewOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-[#1f293d] transition cursor-pointer"
                title="Fermer l'aperçu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Meta & Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 scrollbar-thin">
              
              {/* Header fields: Expéditeur / Destinataire / Objet */}
              <div className="bg-[#090d14] border border-[#1f293d] rounded-xl p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-[#1f293d]/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Expéditeur :</span>
                    <span className="text-slate-200 font-bold">Staff Technique • {clubLabel}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Prêt à envoyer
                  </span>
                </div>

                {/* Destinataire (Adresse de l'utilisateur pour transfert) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f293d]/60 pb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-slate-400 font-bold uppercase text-[10px] shrink-0">Votre E-mail (Destinataire) :</span>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="votre.email@exemple.com"
                      className="bg-[#05080e] border border-[#1f293d] focus:border-[#00E599] rounded-lg px-2.5 py-1 text-xs text-white font-medium outline-none transition w-full sm:w-72"
                    />
                  </div>
                  <span className="text-[10px] text-blue-300 bg-blue-950/80 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold self-start sm:self-auto shrink-0">
                    Pour transfert à vos contacts
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-slate-400 font-bold uppercase text-[10px] shrink-0">Objet :</span>
                    <span className="text-blue-300 font-black truncate">{generateEmailData().subject}</span>
                  </div>
                  <button
                    onClick={handleCopyEmailSubject}
                    className="shrink-0 px-2 py-1 bg-[#121926] hover:bg-[#1a253a] border border-[#1f293d] rounded-lg text-[10px] font-bold text-slate-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
                    title="Copier uniquement l'objet du mail"
                  >
                    {copiedEmailSubject ? <Check className="w-3 h-3 text-[#00E599]" /> : <Copy className="w-3 h-3 text-blue-400" />}
                    <span>{copiedEmailSubject ? "Objet copié !" : "Copier objet"}</span>
                  </button>
                </div>
              </div>

              {/* Notice explicative : Envoi vers l'adresse du coach pour transfert */}
              <div className="bg-[#091a2e] border border-[#1e3a5f] rounded-xl p-3 text-xs text-blue-200 flex items-start gap-2.5">
                <span className="text-base shrink-0">✉️</span>
                <div className="leading-relaxed">
                  <span className="font-bold text-white block">Comment ça marche ?</span>
                  Le schéma et le briefing complet sont envoyés directement à votre boîte mail. Dès réception, cliquez sur <strong>« Transférer »</strong> dans votre messagerie pour l&apos;adresser à vos joueurs, votre staff ou vos dirigeants.
                </div>
              </div>

              {/* Feedback messages d'envoi d'e-mail */}
              {emailSendSuccess && (
                <div className="bg-[#102420] border-2 border-[#00E599] p-3 rounded-xl text-xs font-bold text-[#00E599] flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-[#00E599]" />
                  <span>{emailSendSuccess}</span>
                </div>
              )}
              {emailSendError && (
                <div className="bg-red-950/80 border border-red-500 p-3 rounded-xl text-xs font-bold text-red-200 flex items-center gap-2.5 animate-in fade-in">
                  <X className="w-5 h-5 shrink-0 text-red-400" />
                  <span>{emailSendError}</span>
                </div>
              )}

              {/* Email Content Box */}
              <div className="bg-[#070b13] border-2 border-[#1f293d] rounded-xl p-4 relative group">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1f293d] text-[10px] uppercase font-black tracking-wider text-slate-400">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>Corps de l&apos;e-mail prêt à être envoyé :</span>
                  </span>
                  <span className="text-slate-500 font-mono text-[9px] lowercase">texte brut formaté</span>
                </div>

                <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap bg-[#05080e] p-3 rounded-lg border border-[#1a2333] max-h-64 overflow-y-auto leading-relaxed scrollbar-thin select-all">
                  {generateEmailData().body}
                </pre>
              </div>

              {/* Schema Image Attachment Notice */}
              {includeSchemas && activeImageUrl && (
                <div className="bg-[#102420] border border-[#00E599]/40 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 text-[#00E599]">
                    <ImageIcon className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="font-black block">Schéma visuel HD inclus</span>
                      <span className="text-[10px] text-slate-300 font-medium">L&apos;image du schéma tactique sera directement intégrée dans l&apos;e-mail envoyé.</span>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadImage}
                    className="px-2.5 py-1.5 bg-[#00E599] hover:bg-[#00c583] text-[#07130a] font-black text-[10px] uppercase rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Download className="w-3 h-3" />
                    <span>{downloadedImage ? "Téléchargée !" : "Télécharger PNG"}</span>
                  </button>
                </div>
              )}

              {/* Status Alert if copied */}
              {copiedEmailBody && (
                <div className="bg-[#102420] border border-[#00E599] p-3 rounded-xl text-xs font-black text-[#00E599] flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Tout le corps du message est copié dans votre presse-papier !</span>
                </div>
              )}
            </div>

            {/* Email Modal Footer Actions */}
            <div className="p-4 border-t border-[#1f293d] bg-[#090d14] flex flex-col sm:flex-row items-center gap-2.5">
              {/* PRIMARY CTA: SEND DIRECTLY TO COACH'S EMAIL */}
              <button
                onClick={handleSendEmailToUser}
                disabled={isSendingEmail || !recipientEmail}
                className="flex-1 w-full py-3 px-4 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition cursor-pointer shadow-lg bg-gradient-to-r from-emerald-500 to-[#00E599] hover:from-emerald-400 hover:to-[#00c583] text-[#07130a] shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>ENVOI EN COURS VERS VOTRE BOÎTE...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-black" />
                    <span>M&apos;ENVOYER LE SCHÉMA PAR E-MAIL</span>
                  </>
                )}
              </button>

              {/* SECONDARY CTA: COPY ALL EMAIL BODY */}
              <button
                onClick={handleCopyEmailBody}
                className="w-full sm:w-auto py-3 px-4 bg-[#121926] hover:bg-[#1a253a] border border-[#1f293d] hover:border-slate-500 text-slate-200 hover:text-white rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 transition cursor-pointer"
                title="Copier le texte complet"
              >
                {copiedEmailBody ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3] text-[#00E599]" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copier texte</span>
                  </>
                )}
              </button>

              {/* TERTIARY CTA: OPEN MAILTO */}
              <button
                onClick={handleLaunchNativeMailto}
                className="w-full sm:w-auto py-3 px-3 bg-transparent hover:bg-[#1a2333] border border-transparent hover:border-[#1f293d] text-slate-400 hover:text-slate-200 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Ouvrir votre logiciel e-mail par défaut"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Messagerie</span>
              </button>

              {/* Close/Back button */}
              <button
                onClick={() => setIsEmailPreviewOpen(false)}
                className="w-full sm:w-auto py-3 px-4 bg-transparent hover:bg-[#1a2333] text-slate-400 hover:text-slate-200 rounded-xl font-bold text-xs uppercase transition cursor-pointer"
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
