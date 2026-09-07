import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NexBuild — Configurador de PC",
    template: "%s | NexBuild",
  },
  description:
    "Configura un PC compatible y compara precios referenciales para el mercado chileno.",
};

// A request-scoped CSP nonce requires dynamic rendering.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-CL"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-dvh flex-col overflow-hidden bg-[#191923] text-[#FBFEF9] selection:bg-[#0E79B2] selection:text-[#FBFEF9] md:flex-row">
        <a
          href="#main-content"
          className="sr-only z-[100] rounded-lg bg-[#0E79B2] px-4 py-3 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Saltar al contenido principal
        </a>
        <Navbar />
        <main
          id="main-content"
          tabIndex={-1}
          className="h-full min-w-0 flex-1 overflow-y-auto p-4 lg:p-8"
        >
          {children}
        </main>
      </body>
    </html>
  );
}
