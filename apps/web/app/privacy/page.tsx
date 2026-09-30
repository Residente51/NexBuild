import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidad",
  description:
    "Información clara sobre los datos y servicios que NexBuild utiliza actualmente.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    url: "/privacy",
    title: "Privacidad en NexBuild",
    description:
      "Información clara sobre los datos y servicios que NexBuild utiliza actualmente.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const PRIVACY_SECTIONS = [
  {
    title: "Inicio de sesión por magic link",
    body: "Cuando decides iniciar sesión, proporcionas un correo electrónico. Supabase Auth lo procesa para enviarte un enlace de acceso y mantener tu sesión. NexBuild no usa una contraseña propia para este flujo.",
  },
  {
    title: "Supabase y almacenamiento",
    body: "NexBuild usa Supabase para autenticación, backend y base de datos. Los datos necesarios para esas funciones se procesan mediante esa infraestructura.",
  },
  {
    title: "Cookies de sesión necesarias",
    body: "La autenticación utiliza cookies técnicas para reconocer y renovar una sesión. Son necesarias para funciones asociadas a una cuenta, como acceder a tus armados guardados.",
  },
  {
    title: "Builds guardadas",
    body: "Si guardas una configuración con tu sesión iniciada, la selección y sus datos derivados quedan asociados a tu cuenta para que puedas retomarla y administrarla.",
  },
  {
    title: "Builds compartidas",
    body: "Una configuración compartida puede consultarse mediante su enlace. Quien tenga ese enlace puede ver el snapshot público de la build; la lectura pública no incluye la identidad de la persona propietaria.",
  },
  {
    title: "Datos técnicos mínimos",
    body: "La aplicación y sus proveedores de infraestructura pueden procesar datos técnicos básicos de una solicitud, como dirección IP, información del navegador y marcas de tiempo, para entregar, proteger y diagnosticar el servicio.",
  },
  {
    title: "Analítica básica",
    body: "NexBuild usa Vercel Web Analytics para medir visitas y algunas acciones generales del producto. Desde NexBuild no se envían correos, identificadores de cuenta, identificadores de builds ni el contenido de tus configuraciones como eventos de analítica.",
  },
] as const;

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-5xl space-y-6 pb-4 sm:space-y-8">
      <header className="rounded-[2rem] border border-white/10 bg-[#111119] px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#38BDF8]">
          Privacidad
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-[#FBFEF9] sm:text-5xl lg:text-6xl">
          Qué datos intervienen hoy
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/65 sm:text-lg">
          Esta página describe de forma práctica el funcionamiento actual de
          NexBuild. No intenta reemplazar una política legal extensa con afirmaciones
          que el producto todavía no puede sostener.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {PRIVACY_SECTIONS.map((section) => (
          <section
            key={section.title}
            className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-7"
          >
            <h2 className="text-xl font-bold text-[#FBFEF9]">{section.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">{section.body}</p>
          </section>
        ))}
      </div>

      <section
        aria-labelledby="analytics-title"
        className="rounded-[2rem] border border-[#0E79B2]/30 bg-[#0E79B2]/10 px-5 py-10 sm:px-8 lg:px-12 lg:py-14"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300">
          Estado actual
        </p>
        <h2 id="analytics-title" className="mt-3 text-2xl font-black tracking-tight text-[#FBFEF9]">
          Analítica acotada y sin cookies propias
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/65">
          Vercel Web Analytics entrega métricas agregadas de navegación y eventos
          seleccionados para entender qué funciones resultan útiles. NexBuild no añade
          cookies propias para esta analítica, excluye las rutas privadas y compartidas,
          y elimina los parámetros de las URLs antes del envío. Vercel también puede
          procesar datos técnicos de la solicitud según su propia infraestructura y
          documentación.
        </p>
      </section>
    </article>
  );
}
