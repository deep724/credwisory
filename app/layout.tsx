import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./site-polish.css";
import "./lender-mobile-polish.css";
import "./lender-mobile-comparison.css";
import "./mobile-responsive.css";

export const metadata: Metadata = {
  title: { default: "Credwisory", template: "%s | Credwisory" },
  description: "Education-loan guidance, made clearer.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
