import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./editorial.css";

export const metadata: Metadata = {
  title: {
    default: "Escrow — Secure payments for buyers and sellers",
    template: "%s · Escrow",
  },
  description:
    "A modern escrow platform that holds payment until both sides are satisfied. Buyer protection, seller protection, transparent fees.",
};

export const viewport: Viewport = {
  themeColor: "#F7F6FC",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          Fonts are loaded at runtime via a stylesheet so the build never depends
          on network access. The CSS variables --font-sans / --font-display name
          these families and fall back to a system stack if the request fails.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
