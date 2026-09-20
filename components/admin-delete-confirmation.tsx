"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type DeleteResult = { ok?: boolean; error?: string } | void;

type Props = {
  title: string;
  description: ReactNode;
  triggerLabel: string;
  successMessage: string;
  onConfirm: () => Promise<DeleteResult>;
  onSuccess?: () => void;
  confirmationValues?: string[];
  confirmationHint?: ReactNode;
  triggerClassName?: string;
};

export function AdminDeleteConfirmation({
  title,
  description,
  triggerLabel,
  successMessage,
  onConfirm,
  onSuccess,
  confirmationValues,
  confirmationHint,
  triggerClassName = "cw-admin-icon-action is-delete",
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [toast, setToast] = useState(false);
  const needsConfirmation = Boolean(confirmationValues?.length);
  const mayDelete = !needsConfirmation || confirmationValues?.includes(confirmation.trim());

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(false), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const close = () => {
    if (pending) return;
    dialog.current?.close();
    setError("");
    setConfirmation("");
    window.setTimeout(() => trigger.current?.focus(), 0);
  };
  const open = () => {
    setError("");
    setConfirmation("");
    dialog.current?.showModal();
  };
  const remove = async () => {
    if (pending || !mayDelete) return;
    setPending(true);
    setError("");
    try {
      const result = await onConfirm();
      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      if (result && "ok" in result && result.ok === false) {
        setError("The record could not be deleted. Please try again.");
        return;
      }
      dialog.current?.close();
      setToast(true);
      window.setTimeout(() => trigger.current?.focus(), 0);
      window.setTimeout(() => onSuccess?.(), 750);
    } catch {
      setError("The record could not be deleted. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return <>
    <button ref={trigger} type="button" className={triggerClassName} aria-label={triggerLabel} data-tooltip="Delete" title="Delete" onClick={open} disabled={pending}>
      <TrashIcon />
      <span className="cw-sr-only">Delete</span>
    </button>
    <dialog
      ref={dialog}
      className="cw-admin-delete-confirmation"
      aria-labelledby={titleId}
      aria-describedby={error ? errorId : descriptionId}
      onCancel={(event) => { if (pending) event.preventDefault(); else close(); }}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}
    >
      <div className="cw-admin-delete-confirmation__body">
        <span className="cw-admin-delete-confirmation__icon" aria-hidden="true"><TrashIcon /></span>
        <div className="cw-admin-delete-confirmation__content">
          <p className="cw-admin-eyebrow">Confirm deletion</p>
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId} className="cw-admin-delete-confirmation__description">{description}</p>
        </div>
        <p className="cw-admin-delete-confirmation__warning">This action may not be reversible.</p>
        {needsConfirmation ? <label className="cw-admin-delete-confirmation__input">{confirmationHint || <>Type <b>DELETE</b> to continue.</>}<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" aria-describedby={error ? errorId : undefined} disabled={pending} /></label> : null}
        {error ? <p id={errorId} className="cw-admin-error" role="alert">{error}</p> : null}
        <div className="cw-admin-delete-confirmation__actions">
          <button type="button" className="cw-admin-delete-confirmation__cancel" onClick={close} disabled={pending}>Cancel</button>
          <button type="button" className="cw-admin-delete-confirmation__confirm" onClick={() => void remove()} disabled={pending || !mayDelete}>{pending ? <><span className="cw-admin-icon-spinner" aria-hidden="true" />Deleting…</> : <><TrashIcon />Delete</>}</button>
        </div>
      </div>
    </dialog>
    {toast ? <p className="cw-admin-delete-toast" role="status">{successMessage}</p> : null}
  </>;
}

export function TrashIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M10 11v6m4-6v6M9 7l1-2h4l1 2m-9 0 1 13h10l1-13" /></svg>;
}
