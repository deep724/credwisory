"use client";

import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { LenderLogo } from "@/components/lender-logo";

/** Legacy widgets own their rows; React alone owns the marked logo slots. */
export function LegacyLenderLogos({ root }: { root: RefObject<HTMLDivElement | null> }) {
  const [slots, setSlots] = useState<HTMLElement[]>([]);
  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const discover = () => {
      const next = Array.from(container.querySelectorAll<HTMLElement>("[data-lender-logo-slot]"));
      setSlots((previous) => previous.length === next.length && previous.every((node, index) => node === next[index]) ? previous : next);
    };
    const observer = new MutationObserver(discover);
    observer.observe(container, { childList: true, subtree: true });
    discover();
    return () => observer.disconnect();
  }, [root]);
  return slots.map((slot, index) => createPortal(<LenderLogo name={slot.dataset.logoName || "Lender"} slug={slot.dataset.logoSlug} logoUrl={slot.dataset.logoUrl} size={slot.dataset.logoSize === "card" ? "card" : "table"} />, slot, String(index)));
}
