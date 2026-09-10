"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteOwnedBuild,
  duplicateOwnedBuild,
  renameOwnedBuild,
} from "@/app/actions/ownedBuilds";

type MutationResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export type SavedBuildMutation =
  | { type: "rename"; id: string; name: string }
  | { type: "duplicate"; id: string }
  | { type: "delete"; id: string };

type MutationActions = {
  rename: (id: string, name: string) => Promise<MutationResult>;
  duplicate: (id: string) => Promise<MutationResult>;
  delete: (id: string) => Promise<MutationResult>;
};

const mutationActions: MutationActions = {
  rename: renameOwnedBuild,
  duplicate: duplicateOwnedBuild,
  delete: deleteOwnedBuild,
};

const UNEXPECTED_MUTATION_ERROR =
  "No pudimos completar la acción. Intenta nuevamente.";

/** Keeps client mutations ID-only, except for the new display name on rename. */
export async function performSavedBuildMutation(
  mutation: SavedBuildMutation,
  actions: MutationActions = mutationActions,
): Promise<MutationResult> {
  try {
    switch (mutation.type) {
      case "rename":
        return await actions.rename(mutation.id, mutation.name);
      case "duplicate":
        return await actions.duplicate(mutation.id);
      case "delete":
        return await actions.delete(mutation.id);
    }
  } catch {
    return { success: false, error: UNEXPECTED_MUTATION_ERROR };
  }
}

type SavedBuildActionsProps = {
  buildId: string;
  buildName: string;
};

export function BuildMutationError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100"
    >
      {message}
    </p>
  );
}

export function SavedBuildActions({
  buildId,
  buildName,
}: SavedBuildActionsProps) {
  const router = useRouter();
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const deleteTriggerRef = useRef<HTMLButtonElement>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    SavedBuildMutation["type"] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runMutation(
    mutation: SavedBuildMutation,
    onSuccess?: () => void,
    onError?: (message: string) => void,
  ) {
    setError(null);
    setDeleteError(null);
    setPendingAction(mutation.type);
    startTransition(async () => {
      const result = await performSavedBuildMutation(mutation);
      setPendingAction(null);

      if (!result.success) {
        (onError ?? setError)(result.error);
        return;
      }

      onSuccess?.();
      router.refresh();
    });
  }

  function handleRename(formData: FormData) {
    runMutation(
      {
        type: "rename",
        id: buildId,
        name: String(formData.get("name") ?? ""),
      },
      () => setIsRenaming(false),
    );
  }

  function handleDelete() {
    runMutation(
      { type: "delete", id: buildId },
      () => deleteDialogRef.current?.close(),
      setDeleteError,
    );
  }

  const controlsDisabled = isPending;

  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <button
          type="button"
          aria-label={`Renombrar ${buildName}`}
          disabled={controlsDisabled}
          onClick={() => {
            setError(null);
            setIsRenaming((value) => !value);
          }}
          className="min-h-11 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white/75 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
        >
          Renombrar
        </button>
        <button
          type="button"
          aria-label={`Duplicar ${buildName}`}
          disabled={controlsDisabled}
          onClick={() =>
            runMutation({ type: "duplicate", id: buildId })
          }
          className="min-h-11 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white/75 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
        >
          {isPending && pendingAction === "duplicate"
            ? "Duplicando…"
            : "Duplicar"}
        </button>
        <button
          ref={deleteTriggerRef}
          type="button"
          aria-label={`Eliminar ${buildName}`}
          disabled={controlsDisabled}
          onClick={() => {
            setError(null);
            setDeleteError(null);
            deleteDialogRef.current?.showModal();
          }}
          className="min-h-11 rounded-xl border border-red-400/20 px-4 py-2 text-sm font-medium text-red-200 transition-colors hover:border-red-400/40 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
        >
          Eliminar
        </button>
      </div>

      {isRenaming && (
        <form action={handleRename} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label htmlFor={`build-name-${buildId}`} className="sr-only">
            Nuevo nombre
          </label>
          <input
            id={`build-name-${buildId}`}
            name="name"
            defaultValue={buildName}
            required
            maxLength={80}
            autoFocus
            disabled={controlsDisabled}
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/30 disabled:opacity-50"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={controlsDisabled}
              className="min-h-11 flex-1 rounded-xl bg-[#0E79B2] px-4 text-sm font-bold text-white hover:bg-[#1593d3] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8] sm:flex-none"
            >
              {isPending && pendingAction === "rename"
                ? "Guardando…"
                : "Guardar"}
            </button>
            <button
              type="button"
              disabled={controlsDisabled}
              onClick={() => setIsRenaming(false)}
              className="min-h-11 flex-1 rounded-xl border border-white/10 px-4 text-sm font-medium text-white/70 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8] sm:flex-none"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <BuildMutationError message={error} />

      <dialog
        ref={deleteDialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`delete-title-${buildId}`}
        aria-describedby={`delete-description-${buildId}`}
        onCancel={() => setDeleteError(null)}
        onClose={() => deleteTriggerRef.current?.focus()}
        onClick={(event) => {
          if (event.target === event.currentTarget && !controlsDisabled) {
            event.currentTarget.close();
          }
        }}
        className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-2xl border border-white/10 bg-[#20202c] p-0 text-white shadow-2xl backdrop:bg-black/75"
      >
        <div className="p-6">
          <h2 id={`delete-title-${buildId}`} className="text-xl font-bold">
            ¿Eliminar esta configuración?
          </h2>
          <p
            id={`delete-description-${buildId}`}
            className="mt-3 text-sm leading-6 text-white/65"
          >
            “{buildName}” se eliminará de tus armados guardados. Esta acción no
            se puede deshacer.
          </p>

          <BuildMutationError message={deleteError} />

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={controlsDisabled}
              onClick={() => deleteDialogRef.current?.close()}
              className="min-h-11 rounded-xl border border-white/10 px-4 text-sm font-medium text-white/75 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={controlsDisabled}
              onClick={handleDelete}
              className="min-h-11 rounded-xl bg-red-500 px-4 text-sm font-bold text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
            >
              {isPending && pendingAction === "delete"
                ? "Eliminando…"
                : "Sí, eliminar"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
