"use client";

import { useEffect, useRef, useState } from "react";
import {
  GUIDED_PRIORITY_LABELS,
  GUIDED_PRIORITIES,
  GUIDED_USE_CASE_LABELS,
  GUIDED_USE_CASES,
  type GuidedPriority,
  type GuidedProfile,
  type GuidedUseCase,
} from "@/lib/build/guidance";

const BUDGET_PRESETS = [600_000, 1_000_000, 1_500_000, 2_000_000] as const;

interface GuidedBuilderWizardProps {
  initialProfile: GuidedProfile;
  onClose: () => void;
  onComplete: (profile: GuidedProfile) => void;
}

export function GuidedBuilderWizard({
  initialProfile,
  onClose,
  onComplete,
}: GuidedBuilderWizardProps) {
  const [step, setStep] = useState(0);
  const [useCase, setUseCase] = useState<GuidedUseCase>(initialProfile.useCase);
  const [budgetInput, setBudgetInput] = useState(String(initialProfile.budget));
  const [priority, setPriority] = useState<GuidedPriority>(initialProfile.priority);
  const [budgetError, setBudgetError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => dialogRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose]);

  const budget = Number(budgetInput);
  const isValidBudget = Number.isFinite(budget) && budget > 0;

  function continueFromBudget() {
    if (!isValidBudget) {
      setBudgetError("Ingresa un presupuesto mayor que cero.");
      return;
    }
    setBudgetError("");
    setStep(2);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/75" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guided-builder-title"
        tabIndex={-1}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#191923] p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#38BDF8] uppercase">
              Paso {step + 1} de 3
            </p>
            <h2 id="guided-builder-title" className="mt-2 text-2xl font-black text-[#FBFEF9]">
              Ayúdame a elegir
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar guía"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <span aria-hidden="true" className="text-2xl leading-none">×</span>
          </button>
        </div>

        <div className="mt-8">
          {step === 0 && (
            <fieldset>
              <legend className="text-lg font-bold text-[#FBFEF9]">
                ¿Para qué usarás principalmente tu PC?
              </legend>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {GUIDED_USE_CASES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={useCase === option}
                    onClick={() => setUseCase(option)}
                    className={`min-h-12 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                      useCase === option
                        ? "border-[#38BDF8] bg-[#0E79B2]/20 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/25"
                    }`}
                  >
                    {GUIDED_USE_CASE_LABELS[option]}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <fieldset>
              <legend className="text-lg font-bold text-[#FBFEF9]">
                ¿Cuál es tu presupuesto en CLP?
              </legend>
              <p className="mt-2 text-sm text-white/55">
                Es una referencia flexible: nunca bloqueará tus elecciones.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {BUDGET_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={budget === preset}
                    onClick={() => {
                      setBudgetInput(String(preset));
                      setBudgetError("");
                    }}
                    className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                      budget === preset
                        ? "border-[#38BDF8] bg-[#0E79B2]/20 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/25"
                    }`}
                  >
                    ${preset.toLocaleString("es-CL")}
                  </button>
                ))}
              </div>
              <label className="mt-5 block text-sm font-semibold text-white/75" htmlFor="guided-budget">
                Otro presupuesto
              </label>
              <div className="mt-2 flex items-center rounded-xl border border-white/15 bg-black/20 px-4 focus-within:border-[#38BDF8]">
                <span className="text-white/45">$</span>
                <input
                  id="guided-budget"
                  inputMode="numeric"
                  type="number"
                  min="1"
                  step="1000"
                  value={budgetInput}
                  onChange={(event) => {
                    setBudgetInput(event.target.value);
                    setBudgetError("");
                  }}
                  aria-describedby={budgetError ? "guided-budget-error" : undefined}
                  aria-invalid={Boolean(budgetError)}
                  className="min-h-12 w-full bg-transparent px-2 text-base text-white outline-none"
                />
              </div>
              {budgetError && (
                <p id="guided-budget-error" role="alert" className="mt-2 text-sm text-builder-danger">
                  {budgetError}
                </p>
              )}
            </fieldset>
          )}

          {step === 2 && (
            <fieldset>
              <legend className="text-lg font-bold text-[#FBFEF9]">
                ¿Qué quieres priorizar?
              </legend>
              <div className="mt-5 space-y-3">
                {GUIDED_PRIORITIES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={priority === option}
                    onClick={() => setPriority(option)}
                    className={`min-h-12 w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                      priority === option
                        ? "border-[#38BDF8] bg-[#0E79B2]/20 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/25"
                    }`}
                  >
                    {GUIDED_PRIORITY_LABELS[option]}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={step === 0 ? onClose : () => setStep((current) => current - 1)}
            className="min-h-11 rounded-xl border border-white/15 px-5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5"
          >
            {step === 0 ? "Cancelar" : "Atrás"}
          </button>
          {step < 2 ? (
            <button
              type="button"
              onClick={() => (step === 1 ? continueFromBudget() : setStep(1))}
              className="min-h-11 rounded-xl bg-[#0E79B2] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0A5C87]"
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!isValidBudget) {
                  setStep(1);
                  setBudgetError("Ingresa un presupuesto mayor que cero.");
                  return;
                }
                onComplete({ useCase, budget, priority });
              }}
              className="min-h-11 rounded-xl bg-[#0E79B2] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0A5C87]"
            >
              Activar guía
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
