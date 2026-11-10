import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import RegisterServiceWorker from "@/components/RegisterServiceWorker";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "CVcraft — a CV that gets read",
  description:
    "Make a clear, one-page CV as a PDF that job sites can read, with tips as you type. Free, no account, and nothing leaves your device.",
  appleWebApp: { capable: true, title: "CVcraft", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eeece7" },
    { media: "(prefers-color-scheme: dark)", color: "#121216" },
  ],
};

// Applies the saved (or the device's) light/dark theme before the page is drawn, so there's no flash
const themeScript = `try{var t=localStorage.getItem("cvcraft:theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-card focus:px-4 focus:py-2">
          Skip to the main content
        </a>
        <Header />
        <main id="main" className="mx-auto max-w-6xl px-4 pb-20 pt-6">
          {children}
        </main>
        <footer className="no-print mx-auto max-w-6xl px-4 pb-10 text-sm text-ink-soft">
          Built by Ammara Badat. Your CVs are saved only on this device: nothing is uploaded.
        </footer>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
