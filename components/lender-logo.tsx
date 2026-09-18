"use client";

/* eslint-disable @next/next/no-img-element -- local artwork and admin upload previews keep their intrinsic aspect ratio. */
import { useState, type SyntheticEvent } from "react";
import { lenderLogoSources } from "@/lib/lender-logo-assets";

type Props = {
  name: string;
  slug?: string;
  logoUrl?: string;
  size?: "table" | "card" | "header";
  preview?: boolean;
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
  onError?: () => void;
};

export function LenderLogo({ size = "table", ...props }: Props) {
  const sources = lenderLogoSources(props.slug || "", props.name, props.logoUrl, props.preview);
  return <LogoImage key={sources.join("|")} {...props} size={size} sources={sources} />;
}

function LogoImage({ name, size, sources, onLoad, onError }: Props & { sources: string[] }) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const source = sources[index];
  const initials = name.trim().split(/\s+/).filter(Boolean).map((word) => word[0]).slice(0, 3).join("").toUpperCase() || "?";
  return <span className={`cw-lender-logo cw-lender-logo--${size}`} role="img" aria-label={`${name || "Lender"} logo${source ? "" : " unavailable"}`}>
    {!source || !loaded ? <span className="cw-lender-logo__fallback" aria-hidden="true">{initials}</span> : null}
    {source ? <img className={`cw-lender-logo__image${loaded ? " is-loaded" : ""}`} src={source} alt="" decoding="async" onLoad={(event) => { setLoaded(true); onLoad?.(event); }} onError={() => { setLoaded(false); setIndex((value) => value + 1); onError?.(); }} /> : null}
  </span>;
}
