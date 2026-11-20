"use client";
import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, Download, Maximize2, Printer, RefreshCw, Share2, ShieldOff, X, Radio, Lock, Globe } from "lucide-react";
import { liveUrls, type EditorAccess } from "@/lib/live/client";

interface Props {
  open: boolean;
  onClose: () => void;
  isLight: boolean;
  matchTitle: string;
  clubName: string;
  publicId: string | null;
  clubSlug: string | null;
  editor: EditorAccess | null;
  busy: boolean;
  error: string | null;
  onPublish: () => void;
  onRegenerate: () => void;
  onRevoke: () => void;
}

const useQr = (text: string, dark = "#0b1220") => {
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (!text) { setSrc(""); return; }
    let alive = true;
    QRCode.toDataURL(text, { margin: 1, width: 360, errorCorrectionLevel: "M", color: { dark, light: "#ffffff" } })
      .then((url) => { if (alive) setSrc(url); })
      .catch(() => { if (alive) setSrc(""); });
    return () => { alive = false; };
  }, [text, dark]);
  return src;
};

const shareLink = async (title: string, url: string) => {
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  if (nav.share) {
    try { await nav.share({ title, text: title, url }); return; } catch { /* annulé */ }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, "_blank", "noopener");
};

const downloadDataUrl = (dataUrl: string, filename: string) => {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
};

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

const printPoster = (qr: string, clubName: string, url: string) => {
  const w = window.open("", "_blank", "noopener,width=800,height=1000");
  if (!w) return;
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${escapeHtml(clubName)} · Matchs en direct</title>
<style>@page{size:A4;margin:18mm}body{font-family:system-ui,sans-serif;text-align:center;color:#0b1220}
h1{font-size:34px;margin:10mm 0 4mm}p{font-size:18px;margin:2mm 0}img{width:120mm;height:120mm;margin:10mm auto;display:block}
.u{font-size:13px;color:#475569;word-break:break-all}.b{font-weight:800;letter-spacing:.08em;color:#00a36c}</style></head>
<body><p class="b">SCANNEZ POUR SUIVRE NOS MATCHS</p><h1>${escapeHtml(clubName)}</h1><p>Scores en direct, matchs à venir et résultats</p>
<img src="${qr}" alt="QR code"/><p class="u">${escapeHtml(url)}</p><p class="u">The Box</p>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script></body></html>`);
  w.document.close();
};

export default function LiveShareModal(props: Props) {
  const { open, onClose, isLight, matchTitle, clubName, publicId, clubSlug, editor, busy, error } = props;
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => { setOrigin(window.location.origin); }, []);

  const urls = publicId ? liveUrls(origin, publicId, clubSlug || undefined, editor && !editor.revoked ? editor.token : undefined) : null;
  const matchQr = useQr(urls?.match || "");
  const remoteQr = useQr(urls?.remote || "");
  const clubQr = useQr(urls?.club || "");

  useEffect(() => {
    if (!open) setFullscreen(false);
  }, [open]);

  if (!open) return null;

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch { /* ignore */ }
  };

  const panel = isLight ? "bg-white text-slate-800 border-slate-200" : "bg-[#0d1422] text-slate-100 border-[#22314a]";
  const card = isLight ? "bg-slate-50 border-slate-200" : "bg-[#111a2b] border-[#22314a]";
  const sub = isLight ? "text-slate-500" : "text-slate-400";
  const ghost = isLight ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-100" : "bg-white/[0.04] border-white/10 text-slate-200 hover:bg-white/[0.08]";
  const primary = isLight ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600" : "bg-[#00E599] hover:bg-[#33ebad] text-slate-950 border-[#00E599]";
  const btn = "h-9 px-3 rounded-lg border text-[12px] font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  const QrBox = ({ src, alt }: { src: string; alt: string }) => (
    <div className="w-40 h-40 mx-auto rounded-xl bg-white p-2 border border-slate-200 flex items-center justify-center">
      {src ? <img src={src} alt={alt} className="w-full h-full" /> : <span className="text-[11px] text-slate-400">QR…</span>}
    </div>
  );

  const Badge = ({ kind }: { kind: "public" | "private" }) => (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${kind === "public"
      ? isLight ? "bg-emerald-100 text-emerald-700" : "bg-[#00E599]/15 text-[#00E599]"
      : isLight ? "bg-amber-100 text-amber-700" : "bg-amber-400/15 text-amber-300"}`}>
      {kind === "public" ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
      {kind === "public" ? "PUBLIC" : "PRIVÉ"}
    </span>
  );

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Partager le live"
        className={`w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border shadow-2xl p-4 sm:p-5 ${panel}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-[15px] font-black flex items-center gap-2"><Radio className="w-4 h-4 text-rose-500" />Partager le live</p>
            <p className={`text-[12px] font-semibold truncate ${sub}`}>{matchTitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className={`h-8 w-8 rounded-lg border flex items-center justify-center cursor-pointer ${ghost}`}><X className="w-4 h-4" /></button>
        </div>

        {error && <p className="mb-3 text-[12px] font-bold text-rose-500">{error}</p>}

        {!publicId ? (
          <div className={`rounded-xl border p-5 text-center ${card}`}>
            <p className="text-[13px] font-bold mb-1">Ce match n’est pas encore publié</p>
            <p className={`text-[12px] mb-4 ${sub}`}>La publication crée le lien public du match, l’accès adjoint et la page de votre club.</p>
            <button type="button" disabled={busy} onClick={props.onPublish} className={`${btn} ${primary}`}>
              {busy ? "Publication…" : "Publier le live de ce match"}
            </button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {/* QR du match */}
            <div className={`rounded-xl border p-3.5 flex flex-col gap-2.5 ${card}`}>
              <div className="flex items-center justify-between"><p className="text-[13px] font-black">QR de ce match</p><Badge kind="public" /></div>
              <p className={`text-[11.5px] leading-snug ${sub}`}>Le live en lecture seule : compo avant le match, direct pendant, résumé après.</p>
              <QrBox src={matchQr} alt="QR du match" />
              <div className="grid grid-cols-2 gap-1.5 mt-auto">
                <button type="button" className={`${btn} ${ghost}`} onClick={() => urls && copy("match", urls.match)}>
                  {copied === "match" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}Copier
                </button>
                <button type="button" className={`${btn} ${ghost}`} onClick={() => urls && shareLink(`Suivez ${matchTitle} en direct`, urls.match)}>
                  <Share2 className="w-3.5 h-3.5" />Partager
                </button>
                <button type="button" disabled={!matchQr} className={`${btn} ${primary} col-span-2`} onClick={() => downloadDataUrl(matchQr, "qr-match-live.png")}>
                  <Download className="w-3.5 h-3.5" />Télécharger le QR
                </button>
              </div>
            </div>

            {/* QR adjoint */}
            <div className={`rounded-xl border p-3.5 flex flex-col gap-2.5 ${card}`}>
              <div className="flex items-center justify-between"><p className="text-[13px] font-black">QR adjoint (éditeur)</p><Badge kind="private" /></div>
              <p className={`text-[11.5px] leading-snug ${sub}`}>La télécommande de saisie. Ne le partagez qu’avec votre adjoint : il se ferme à la fin du match.</p>
              {editor && !editor.revoked ? (
                <>
                  <QrBox src={remoteQr} alt="QR adjoint" />
                  <div className="text-center">
                    <p className={`text-[10.5px] font-bold uppercase ${sub}`}>ou code sur {origin.replace(/^https?:\/\//, "")}/telecommande</p>
                    <p className="text-[22px] font-black tracking-[0.25em] font-mono">{editor.code.slice(0, 3)} {editor.code.slice(3)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-auto">
                    <button type="button" className={`${btn} ${ghost}`} onClick={() => urls && copy("remote", urls.remote)}>
                      {copied === "remote" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}Copier
                    </button>
                    <button type="button" className={`${btn} ${ghost}`} onClick={() => urls && shareLink("Télécommande du live", urls.remote)}>
                      <Share2 className="w-3.5 h-3.5" />Partager
                    </button>
                    <button type="button" disabled={busy} className={`${btn} ${ghost}`} onClick={props.onRegenerate} title="Nouveau lien et nouveau code : les anciens ne fonctionnent plus">
                      <RefreshCw className="w-3.5 h-3.5" />Régénérer
                    </button>
                    <button type="button" disabled={busy} className={`${btn} ${ghost}`} onClick={props.onRevoke}>
                      <ShieldOff className="w-3.5 h-3.5" />Révoquer
                    </button>
                    <button type="button" disabled={!remoteQr} className={`${btn} ${primary} col-span-2`} onClick={() => setFullscreen(true)}>
                      <Maximize2 className="w-3.5 h-3.5" />Afficher en plein écran
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4 text-center">
                  <p className={`text-[12px] font-semibold ${sub}`}>{editor?.revoked ? "Accès révoqué : la télécommande est fermée." : "Aucun accès adjoint actif."}</p>
                  <button type="button" disabled={busy} className={`${btn} ${primary}`} onClick={props.onRegenerate}>
                    <RefreshCw className="w-3.5 h-3.5" />Créer un nouvel accès
                  </button>
                </div>
              )}
            </div>

            {/* QR général du club */}
            <div className={`rounded-xl border p-3.5 flex flex-col gap-2.5 ${card}`}>
              <div className="flex items-center justify-between"><p className="text-[13px] font-black">QR général du club</p><Badge kind="public" /></div>
              <p className={`text-[11.5px] leading-snug ${sub}`}>Tous vos matchs : en direct, à venir et terminés. Permanent, à afficher au club-house.</p>
              <QrBox src={clubQr} alt="QR du club" />
              <div className="grid grid-cols-2 gap-1.5 mt-auto">
                <button type="button" className={`${btn} ${ghost}`} disabled={!urls?.club} onClick={() => urls && copy("club", urls.club)}>
                  {copied === "club" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}Copier
                </button>
                <button type="button" className={`${btn} ${ghost}`} disabled={!urls?.club} onClick={() => urls && shareLink(`Les matchs de ${clubName}`, urls.club)}>
                  <Share2 className="w-3.5 h-3.5" />Partager
                </button>
                <button type="button" disabled={!clubQr} className={`${btn} ${primary} col-span-2`} onClick={() => urls && printPoster(clubQr, clubName, urls.club)}>
                  <Printer className="w-3.5 h-3.5" />Imprimer l’affiche A4
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {fullscreen && remoteQr && editor && (
        <div className="fixed inset-0 z-[170] bg-white flex flex-col items-center justify-center gap-4 p-6" onClick={(e) => { e.stopPropagation(); setFullscreen(false); }}>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Télécommande du live · à scanner par l’adjoint</p>
          <img src={remoteQr} alt="QR adjoint" className="w-[min(70vh,80vw)] h-[min(70vh,80vw)]" />
          <p className="text-slate-900 text-4xl font-black tracking-[0.3em] font-mono">{editor.code.slice(0, 3)} {editor.code.slice(3)}</p>
          <p className="text-slate-400 text-xs">Touchez l’écran pour fermer</p>
        </div>
      )}
    </div>
  );
}
