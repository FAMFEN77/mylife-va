import "./globals.css";
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";

import { AuthProvider } from "./providers/AuthProvider";
import { APP_NAME, APP_URL } from "@/lib/brand";

const metadataBase = (() => {
  try {
    return new URL(APP_URL);
  } catch {
    return undefined;
  }
})();

const description =
  "Virtuele assistent voor teams die planning, taken, uren en klantcommunicatie automatiseert.";

export const metadata: Metadata = {
  title: APP_NAME,
  description,
  applicationName: APP_NAME,
  metadataBase,
  openGraph: {
    title: APP_NAME,
    description,
    url: APP_URL,
    siteName: APP_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description,
  },
  icons: {
    icon: [
      { url: "/logoTK2.png", sizes: "286x69", type: "image/png" },
      { url: "/brand/logoTK.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

const display = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
