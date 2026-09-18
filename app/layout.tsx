import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./lender-logo.css";
import "./site-polish.css";
import "./lender-mobile-polish.css";
import "./lender-mobile-comparison.css";
import "./mobile-responsive.css";
import "./consent-polish.css";
import "./homepage-journey.css";
import "./homepage-anchor.css";
import "./blog.css";
import "./notification-permission.css";
import { NotificationPermissionCard } from "@/components/notification-permission-card";

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
      <body>{children}<NotificationPermissionCard /></body>
    </html>
  );
}
