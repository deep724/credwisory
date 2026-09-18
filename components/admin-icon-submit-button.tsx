"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type Props = { className: string; label: string; tooltip?: string; pendingLabel?: string; children: ReactNode };

export function AdminIconSubmitButton({ className, label, tooltip = label, pendingLabel = "Saving", children }: Props) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending} aria-label={pending ? pendingLabel : label} aria-busy={pending || undefined} data-tooltip={pending ? pendingLabel : tooltip} title={pending ? pendingLabel : tooltip}>{pending ? <span className="cw-admin-icon-spinner" aria-hidden="true" /> : children}</button>;
}
