import Link from "next/link";

export function Navbar() {
  const links = [
    { label: "Armar PC", href: "/builder" },
    { label: "Componentes", href: "/components" },
    { label: "Comparador", href: "/compare" },
    { label: "Guías", href: "/guides" },
  ];

  return (
    <aside className="sticky top-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#191923]">
      <div className="flex h-20 items-center px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E79B2] text-lg font-bold text-[#FBFEF9]">
            N
          </div>
          <span className="text-2xl font-black tracking-tight text-[#FBFEF9]">
            NexBuild
          </span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-4 py-8">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-[#0E79B2]"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Footer del sidebar */}
      <div className="p-6">
        <p className="text-xs text-white/30">© 2026 NexBuild</p>
      </div>
    </aside>
  );
}