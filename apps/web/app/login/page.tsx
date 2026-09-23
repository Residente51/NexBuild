import type { Metadata } from "next";
import Link from "next/link";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { requestMagicLink } from "./actions";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback: "El enlace no es válido o ya expiró. Solicita uno nuevo.",
  invalid_email: "Ingresa un correo electrónico válido.",
  send_failed: "No pudimos enviar el enlace. Intenta nuevamente.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorCode = typeof params.error === "string" ? params.error : "";
  const destination = getSafeRedirectPath(
    typeof params.next === "string" ? params.next : "/",
  );
  const linkSent = params.sent === "1";

  return (
    <div className="mx-auto flex min-h-full max-w-lg items-center py-10">
      <section className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#38BDF8]">
          Tu cuenta NexBuild
        </p>
        <h1 className="mt-3 text-3xl font-black text-white">
          Iniciar sesión
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/60">
          Te enviaremos un enlace seguro a tu correo. No necesitas contraseña.
        </p>

        {linkSent && (
          <p
            role="status"
            className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
          >
            Revisa tu correo y abre el enlace para continuar.
          </p>
        )}

        {ERROR_MESSAGES[errorCode] && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100"
          >
            {ERROR_MESSAGES[errorCode]}
          </p>
        )}

        <form action={requestMagicLink} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={destination} />
          <div>
            <label htmlFor="email" className="text-sm font-medium text-white/80">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              maxLength={254}
              className="mt-2 min-h-11 w-full rounded-xl border border-white/15 bg-black/20 px-4 text-white outline-none placeholder:text-white/30 focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/30"
              placeholder="tu@correo.cl"
            />
          </div>
          <button
            type="submit"
            className="min-h-11 w-full rounded-xl bg-[#0E79B2] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1593d3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
          >
            Enviar enlace de acceso
          </button>
        </form>

        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center text-sm text-white/60 hover:text-[#38BDF8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
        >
          Volver al inicio
        </Link>
      </section>
    </div>
  );
}
