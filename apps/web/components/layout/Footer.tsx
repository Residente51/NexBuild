import Link from "next/link";

const FOOTER_GROUPS = [
  {
    title: "Producto",
    links: [
      { label: "Componentes", href: "/components" },
      { label: "Comparar", href: "/compare" },
      { label: "Armar PC", href: "/builder" },
    ],
  },
  {
    title: "NexBuild",
    links: [
      { label: "Acerca de", href: "/about" },
      { label: "Contacto / Feedback", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidad", href: "/privacy" },
      { label: "Términos", href: "/terms" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="shrink-0 px-4 pb-4 lg:px-8 lg:pb-8">
      <div className="mx-auto w-full max-w-[90rem] rounded-[2rem] border border-white/10 bg-[#111119] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-10 border-b border-white/10 pb-9 lg:grid-cols-[1.35fr_2fr] lg:gap-16">
          <div className="max-w-sm">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-lg text-xl font-black tracking-tight text-[#FBFEF9] transition-colors duration-150 hover:text-[#38BDF8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
            >
              NexBuild
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Arma mejor. Compra inteligente.
            </p>
          </div>

          <nav
            aria-label="Navegación del pie de página"
            className="grid gap-8 sm:grid-cols-3"
          >
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm font-bold text-[#FBFEF9]">
                  {group.title}
                </h2>
                <ul className="mt-3 space-y-1">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-flex min-h-11 items-center rounded-lg text-sm text-white/60 transition-colors duration-150 hover:text-[#38BDF8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <p className="pt-6 text-xs text-white/40">© 2026 NexBuild</p>
      </div>
    </footer>
  );
}
