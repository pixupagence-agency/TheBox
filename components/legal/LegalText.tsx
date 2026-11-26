"use client";
// Affichage du texte d'une section légale (mise en forme simple, sans HTML : voir lib/legal/documents.ts).
import React from "react";
import { PLACEHOLDER_RE } from "@/lib/legal/documents";

const TOKEN_RE = /(\*\*[^*]+\*\*|\[À COMPLÉTER[^\]]*\]|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;

/** Gras, adresses e-mail cliquables, informations à compléter surlignées */
function inline(text: string, placeholderClass: string): React.ReactNode[] {
  return text.split(TOKEN_RE).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (new RegExp(`^${PLACEHOLDER_RE.source}$`).test(part)) {
      return <mark key={i} className={`rounded px-1 font-semibold ${placeholderClass}`}>{part}</mark>;
    }
    if (/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(part)) {
      return <a key={i} href={`mailto:${part}`} className="underline underline-offset-2 hover:opacity-80">{part}</a>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

interface Props {
  text: string;
  /** Puce des listes (couleur d'accent du thème) */
  bulletClass?: string;
  placeholderClass?: string;
}

export default function LegalText({ text, bulletClass = "bg-current", placeholderClass = "bg-amber-400/25 text-amber-200" }: Props) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className="space-y-2.5">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim());
        const nodes: React.ReactNode[] = [];
        let list: string[] = [];
        const flushList = (key: string) => {
          if (!list.length) return;
          nodes.push(
            <ul key={key} className="space-y-1.5">
              {list.map((item, li) => (
                <li key={li} className="flex gap-2.5">
                  <span className={`mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full ${bulletClass}`} aria-hidden="true" />
                  <span>{inline(item, placeholderClass)}</span>
                </li>
              ))}
            </ul>
          );
          list = [];
        };
        let para: string[] = [];
        const flushPara = (key: string) => {
          if (!para.length) return;
          nodes.push(<p key={key}>{inline(para.join(" "), placeholderClass)}</p>);
          para = [];
        };
        lines.forEach((line, li) => {
          const item = /^\s*[-•]\s+(.*)$/.exec(line);
          if (item) {
            flushPara(`p${li}`);
            list.push(item[1]);
          } else {
            flushList(`l${li}`);
            para.push(line.trim());
          }
        });
        flushPara("pend");
        flushList("lend");
        return <React.Fragment key={bi}>{nodes}</React.Fragment>;
      })}
    </div>
  );
}
