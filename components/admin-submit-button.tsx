"use client";
import { useFormStatus } from "react-dom";
export function AdminSubmitButton({ children, pending = "Saving…" }: { children: string; pending?: string }) { const { pending: isPending } = useFormStatus(); return <button type="submit" disabled={isPending} aria-live="polite">{isPending ? pending : children}</button>; }
