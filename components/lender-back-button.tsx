import Link from "next/link";

export function LenderBackButton() {
  return (
    <Link className="cw-apply-back" href="/lenders">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg>
      <span>Back to lenders</span>
    </Link>
  );
}
