"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";

/** Texte sur une ligne qui défile (aller-retour) uniquement s'il dépasse la largeur disponible. */
export const MarqueeText = ({ text, className = "" }: { text: string; className?: string }) => {
  const boxRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const box = boxRef.current;
    const inner = textRef.current;
    if (!box || !inner) return;
    const measure = () => setOverflow(Math.max(0, Math.ceil(inner.scrollWidth - box.clientWidth)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [text]);

  const scrolling = overflow > 1;
  return (
    <span ref={boxRef} className={`block overflow-hidden whitespace-nowrap ${className}`} title={text}>
      {scrolling && (
        <style>{`@keyframes tb-marquee{0%,15%{transform:translateX(0)}85%,100%{transform:translateX(calc(-1 * var(--tb-mq-dist)))}}@media (prefers-reduced-motion: reduce){.tb-marquee{animation:none!important}}`}</style>
      )}
      <span
        ref={textRef}
        className={`inline-block ${scrolling ? "tb-marquee" : ""}`}
        style={scrolling ? ({
          "--tb-mq-dist": `${overflow}px`,
          animation: `tb-marquee ${Math.max(3, overflow / 18 + 2)}s ease-in-out infinite alternate`,
        } as React.CSSProperties) : undefined}
      >
        {text}
      </span>
    </span>
  );
};
