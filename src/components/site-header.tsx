"use client";

import Link from "next/link";
import { FlaskConical, Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOutDemo } from "@/lib/store";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/browser";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const privatePage = pathname.startsWith("/dashboard") || pathname.startsWith("/practice") ||
    pathname.startsWith("/attempts") || pathname.startsWith("/compare");

  useEffect(() => {
    queueMicrotask(() => setMenuOpen(false));
  }, [pathname]);

  async function signOut() {
    if (isSupabaseConfigured()) {
      await createSupabaseBrowserClient().auth.signOut();
    } else {
      signOutDemo();
    }
    router.push("/");
    router.refresh();
  }

  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-mark"><FlaskConical size={20} /></span>
        InterviewLab
      </Link>
      <nav className="desktop-nav">
        {privatePage ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <ThemeToggle />
            <button className="text-button" onClick={signOut}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/privacy">Privacy</Link>
            <ThemeToggle />
            <Link href="/login" className="button button-small">Start practicing</Link>
          </>
        )}
      </nav>
      <button
        className="menu-toggle"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="mobile-nav"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      {menuOpen && (
        <nav id="mobile-nav" className="mobile-nav">
          {privatePage ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <button className="text-button" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <>
              <Link href="/privacy">Privacy</Link>
              <Link href="/login" className="button button-wide">Start practicing</Link>
            </>
          )}
          <div className="mobile-nav-theme">
            <span>Appearance</span>
            <ThemeToggle />
          </div>
        </nav>
      )}
    </header>
  );
}
