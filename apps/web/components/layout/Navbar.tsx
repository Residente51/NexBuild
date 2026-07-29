export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Nex<span className="text-blue-500">Build</span>
          </h2>
        </div>

        {/* Navegación */}
        <nav className="hidden gap-8 md:flex">
          <a href="#" className="text-zinc-300 transition hover:text-white">
            Builds
          </a>

          <a href="#" className="text-zinc-300 transition hover:text-white">
            Componentes
          </a>

          <a href="#" className="text-zinc-300 transition hover:text-white">
            Guías
          </a>

          <a href="#" className="text-zinc-300 transition hover:text-white">
            Comparador
          </a>
        </nav>

        {/* Acciones */}
        <div className="flex items-center gap-3">
          <button className="rounded-lg px-4 py-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-white">
            Buscar
          </button>

          <button className="rounded-lg px-4 py-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-white">
            Iniciar sesión
          </button>

          <button className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-500">
            ✨ Crear mi PC
          </button>
        </div>
      </div>
    </header>
  );
}