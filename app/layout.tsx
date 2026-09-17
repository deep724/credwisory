import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./site-polish.css";
import "./lender-mobile-polish.css";
import "./lender-mobile-comparison.css";
import "./mobile-responsive.css";
import "./consent-polish.css";
import "./lead-popup.css";
import "./lead-popup-mobile.css";
import "./homepage-journey.css";
import "./homepage-anchor.css";
import "./blog.css";

export const metadata: Metadata = {
  title: {
    default: "Credwisory | Education loans, made clear.",
    template: "%s | Credwisory",
  },
  description: "Education-loan guidance, made clearer.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>{children}</body>
    </html>
  );
}
