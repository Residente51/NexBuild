"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Componentes", href: "/components" },
  { label: "Armar PC", href: "/builder" },
];

function Brand() {
  return (
    <Link
      href="/"
      className="flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E79B2] text-lg font-bold text-[#FBFEF9]">
        N
      </span>
      <span className="text-2xl font-black tracking-tight text-[#FBFEF9]">
        NexBuild
      </span>
    </Link>
  );
}

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-1 px-4 py-8">
      {LINKS.map((link) => {
        const isCurrent =
          pathname === link.href ||
          (link.href !== "/" && pathname.startsWith(`${link.href}/`));
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={isCurrent ? "page" : undefined}
            className={`flex min-h-11 items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8] ${
              isCurrent
                ? "bg-[#0E79B2]/15 text-[#38BDF8]"
                : "text-white/70 hover:bg-white/5 hover:text-[#38BDF8]"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-20 items-center px-6">
        <Brand />
      </div>
      <NavigationLinks onNavigate={onNavigate} />
      <div className="p-6">
        <p className="text-xs text-white/40">© 2026 NexBuild</p>
      </div>
    </>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const drawer = drawerRef.current;
    const trigger = triggerRef.current;
    const focusable = drawer?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    focusable?.[0]?.focus();
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      trigger?.focus();
    };
  }, [isOpen]);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#191923] px-4 md:hidden">
        <Brand />
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir navegación"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-white/80 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
        >
          <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      <aside className="sticky left-0 top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/10 bg-[#191923] md:flex">
        <SidebarContent />
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Cerrar navegación"
            className="absolute inset-0 h-full w-full bg-black/70"
            onClick={() => setIsOpen(false)}
          />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className="relative flex h-dvh w-[min(20rem,85vw)] flex-col border-r border-white/10 bg-[#191923] shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar menú"
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl text-white/70 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
            >
              <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <SidebarContent onNavigate={() => setIsOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
