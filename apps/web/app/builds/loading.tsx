export default function BuildsLoading() {
  return (
    <div
      role="status"
      aria-label="Cargando armados guardados"
      className="mx-auto w-full max-w-6xl animate-pulse py-4 motion-reduce:animate-none sm:py-8"
    >
      <div className="h-4 w-36 rounded bg-white/10" />
      <div className="mt-4 h-10 w-64 rounded bg-white/10" />
      <div className="mt-3 h-5 w-full max-w-lg rounded bg-white/5" />
      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-72 rounded-2xl border border-white/10 bg-white/[0.035]"
          />
        ))}
      </div>
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
