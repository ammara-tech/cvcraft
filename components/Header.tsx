"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";

/* The bar at the top: the logo (back to your CVs) and light/dark mode */
export default function Header() {
  return (
    <header className="no-print border-b border-line bg-page">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight" aria-label="CVcraft: your CVs">
          <Logo />
          CVcraft
        </Link>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
