import { Navbar } from "../components/layout/Navbar";
import { Hero } from "../components/sections/Hero";
import { Card } from "../components/ui/Card";

export default function Home() {
  return (
    <>
      <Navbar />

      <Hero />

      <section className="bg-black px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <Card className="p-8">
            <h2 className="text-3xl font-bold text-white">
              Card funcionando 🎉
            </h2>

            <p className="mt-4 text-zinc-400">
              Esta es la primera prueba del componente Card. Más adelante será
              utilizada para mostrar procesadores, tarjetas gráficas,
              memorias RAM, SSD y muchos otros componentes.
            </p>
          </Card>
        </div>
      </section>
    </>
  );
}