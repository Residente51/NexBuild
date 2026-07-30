interface EmptyStateProps {
  search: string;
}

export function EmptyState({
  search,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-center">
      <p className="text-lg text-zinc-400">
        No se encontraron componentes para{" "}
        <span className="text-white">{search}</span>.
      </p>
    </div>
  );
}