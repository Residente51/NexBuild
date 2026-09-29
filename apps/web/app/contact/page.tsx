import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto y feedback",
  description:
    "Conoce el canal público disponible para compartir feedback sobre NexBuild o reportar un problema.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    url: "/contact",
    title: "Contacto y feedback",
    description:
      "Canal público para compartir feedback sobre NexBuild o reportar un problema.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ContactPage() {
  return (
    <article className="mx-auto w-full max-w-5xl space-y-6 pb-4 sm:space-y-8">
      <header className="rounded-[2rem] border border-white/10 bg-[#111119] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#38BDF8]">
          Contacto / Feedback
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-[#FBFEF9] sm:text-5xl lg:text-6xl">
          Ayúdanos a mejorar NexBuild
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/65 sm:text-lg">
          Si encontraste un error, una especificación que debería revisarse o tienes
          una idea concreta, puedes compartirla a través del repositorio público del
          proyecto.
        </p>
      </header>

      <section
        aria-labelledby="contact-channel-title"
        className="rounded-[2rem] border border-[#0E79B2]/30 bg-[#0E79B2]/10 px-5 py-10 sm:px-8 lg:px-12 lg:py-14"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300">
          Canal disponible
        </p>
        <h2 id="contact-channel-title" className="mt-3 text-3xl font-black tracking-tight text-[#FBFEF9]">
          Repositorio público en GitHub
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/65">
          NexBuild no publica por ahora un correo oficial ni opera un formulario de
          contacto. Para mantener un canal real y verificable, el punto de contacto
          disponible es el repositorio público.
        </p>
        <a
          href="https://github.com/Residente51/NexBuild"
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0E79B2] px-8 py-3 font-semibold text-[#FBFEF9] transition-colors duration-150 hover:bg-[#0A5C87] active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
        >
          Abrir repositorio
          <span aria-hidden="true" className="ml-2">↗</span>
        </a>
      </section>

      <section
        aria-labelledby="useful-feedback-title"
        className="rounded-[2rem] border border-white/10 bg-white/[0.025] px-5 py-10 sm:px-8 lg:px-12 lg:py-14"
      >
        <h2 id="useful-feedback-title" className="text-2xl font-black tracking-tight text-[#FBFEF9]">
          Qué información ayuda
        </h2>
        <ul className="mt-6 grid gap-3 text-sm leading-relaxed text-white/65 sm:grid-cols-2">
          <li className="rounded-2xl border border-white/10 bg-[#111119] p-5">
            La página o herramienta donde ocurrió el problema.
          </li>
          <li className="rounded-2xl border border-white/10 bg-[#111119] p-5">
            Qué esperabas que ocurriera y qué viste en su lugar.
          </li>
          <li className="rounded-2xl border border-white/10 bg-[#111119] p-5">
            El componente o dato específico que necesita revisión.
          </li>
          <li className="rounded-2xl border border-white/10 bg-[#111119] p-5">
            Pasos simples para reproducir el comportamiento, si aplica.
          </li>
        </ul>
        <p className="mt-6 text-sm leading-relaxed text-white/50">
          No publiques contraseñas, enlaces de inicio de sesión, cookies ni otros
          datos sensibles en un canal público.
        </p>
      </section>
    </article>
  );
}
