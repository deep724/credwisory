"use client";

import { useEffect, useState } from "react";

type Tooltip = { text: string; x: number; y: number } | null;

/** Renders admin action hints outside scroll containers so they cannot be clipped. */
export function AdminActionTooltips() {
  const [tooltip, setTooltip] = useState<Tooltip>(null);
  useEffect(() => {
    const getTrigger = (target: EventTarget | null) => target instanceof Element ? target.closest<HTMLElement>("[data-tooltip]") : null;
    const show = (target: EventTarget | null) => {
      const trigger = getTrigger(target);
      if (!trigger || (trigger instanceof HTMLButtonElement && trigger.disabled)) return;
      const text = trigger.dataset.tooltip;
      if (!text) return;
      const rect = trigger.getBoundingClientRect();
      setTooltip({ text, x: Math.max(16, Math.min(rect.left + rect.width / 2, window.innerWidth - 16)), y: Math.max(8, rect.top - 8) });
    };
    const hide = (event: PointerEvent | FocusEvent) => {
      if (getTrigger(event.target) === getTrigger(event.relatedTarget)) return;
      setTooltip(null);
    };
    const hideOnScroll = () => setTooltip(null);
    const onPointerOver = (event: PointerEvent) => show(event.target);
    const onFocus = (event: FocusEvent) => show(event.target);
    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("pointerout", hide);
    document.addEventListener("focusout", hide);
    window.addEventListener("scroll", hideOnScroll, true);
    return () => { document.removeEventListener("pointerover", onPointerOver); document.removeEventListener("focusin", onFocus); document.removeEventListener("pointerout", hide); document.removeEventListener("focusout", hide); window.removeEventListener("scroll", hideOnScroll, true); };
  }, []);
  return tooltip ? <span className="cw-admin-floating-tooltip" role="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>{tooltip.text}</span> : null;
}
