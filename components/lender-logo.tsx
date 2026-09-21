"use client";

/* eslint-disable @next/next/no-img-element -- verified local SVG marks retain their natural proportions. */
import { useState } from "react";
import type { SyntheticEvent } from "react";
import { lenderLogoSources, lenderTextTileLabel } from "@/lib/lender-logo-assets";

type Props = {
  name: string;
  slug?: string;
  lenderType?: string;
  /** Existing data is accepted for compatibility, but never used as image artwork. */
  logoUrl?: string;
  size?: "table" | "card" | "header";
  preview?: boolean;
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
  onError?: () => void;
};

export function LenderLogo({ size = "table", ...props }: Props) {
  const sources = lenderLogoSources(props.slug || "", props.name, props.lenderType);
  const label = lenderTextTileLabel(props.slug || "", props.name);
  return <LogoImage key={`${sources.join("|")}:${label}`} {...props} size={size} sources={sources} label={label} />;
}

function LogoImage({ name, size, sources, label, onLoad, onError }: Props & { sources: string[]; label: string }) {
  const [failed, setFailed] = useState(false);
  const source = failed ? undefined : sources[0];
  const accessibleLabel = `${name || "Lender"} logo`;
  return <span className={`cw-lender-logo cw-lender-logo--${size} cw-lender-logo--${source ? "symbol" : "text"}`} title={name}
    role={source ? undefined : "img"} aria-label={source ? undefined : accessibleLabel}>
    {source ? <img className="cw-lender-logo__image" src={source} alt={accessibleLabel} width={40} height={40} decoding="async" onLoad={onLoad} onError={() => { setFailed(true); onError?.(); }} />
      : <span className="cw-lender-logo__fallback" aria-hidden="true">{label === "Poonawalla" ? <>Poona<wbr />walla</> : label}</span>}
  </span>;
}
