"use client";

import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import type { TenantConfig } from "@ble/tenant-schema";

export type CaptureValues = Record<string, string | number | boolean>;

export type LeadCaptureSubmit = (payload: {
  fields: CaptureValues;
  stepId?: string;
  isPartial: boolean;
}) => Promise<void>;

export type LeadCaptureProps = {
  tenant: TenantConfig;
  onSubmit: LeadCaptureSubmit;
  storageKey?: string;
};

function readStoredValues(storageKey: string): CaptureValues {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return {};
  }

  const parsed = JSON.parse(raw) as unknown;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as CaptureValues) : {};
}

function LeadCaptureShell({ tenant, onSubmit, storageKey = `ble:${tenant.identity.slug}:lead` }: LeadCaptureProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<CaptureValues>(() => readStoredValues(storageKey));
  const [status, setStatus] = useState<"idle" | "submitting" | "complete">("idle");
  const [showExitIntent, setShowExitIntent] = useState(false);
  const steps = tenant.leadCapture.steps;
  const step = steps[stepIndex] ?? steps[0];
  const progress = useMemo(() => Math.round(((stepIndex + 1) / steps.length) * 100), [stepIndex, steps.length]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(values));
  }, [storageKey, values]);

  useEffect(() => {
    function handleMouseLeave(event: MouseEvent) {
      if (event.clientY <= 0) {
        setShowExitIntent(true);
      }
    }

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  if (!step) {
    return null;
  }
  const activeStep = step;

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    const isLastStep = stepIndex === steps.length - 1;
    await onSubmit({ fields: values, stepId: activeStep.id, isPartial: !isLastStep });

    if (isLastStep) {
      window.localStorage.removeItem(storageKey);
      setStatus("complete");
      return;
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
    setStatus("idle");
  }

  return (
    <form
      className="lead-form"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <div className="progress" aria-label={`Step ${String(stepIndex + 1)} of ${String(steps.length)}`}>
        <span style={{ width: `${String(progress)}%` }} />
      </div>
      <h2>{activeStep.title}</h2>
      {activeStep.description ? <p>{activeStep.description}</p> : null}
      {activeStep.fields.map((field) => (
        <label key={field.id}>
          <span>{field.label}</span>
          {field.type === "select" ? (
            <select
              name={field.id}
              required={field.required}
              value={String(values[field.id] ?? "")}
              onChange={(event) => {
                setValues((current) => ({ ...current, [field.id]: event.target.value }));
              }}
            >
              <option value="">Choose one</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              name={field.id}
              type={field.type === "email" ? "email" : field.type === "number" ? "number" : "text"}
              required={field.required}
              value={String(values[field.id] ?? "")}
              onChange={(event) => {
                setValues((current) => ({ ...current, [field.id]: event.target.value }));
              }}
              onBlur={() => {
                if (field.capturePartial && values[field.id]) {
                  void onSubmit({ fields: values, stepId: activeStep.id, isPartial: true });
                }
              }}
            />
          )}
        </label>
      ))}
      <button type="submit" disabled={status === "submitting"}>
        {status === "complete" ? "Submitted" : stepIndex === steps.length - 1 ? "Get Demo Plan" : "Continue"}
      </button>
      {showExitIntent ? (
        <div className="exit-intent" role="dialog" aria-label="Save progress">
          <p>Your progress is saved on this device.</p>
          <button
            type="button"
            onClick={() => {
              setShowExitIntent(false);
            }}
          >
            Keep going
          </button>
        </div>
      ) : null}
    </form>
  );
}

export function Quiz(props: LeadCaptureProps) {
  return <LeadCaptureShell {...props} />;
}

export function Calculator(props: LeadCaptureProps) {
  return <LeadCaptureShell {...props} />;
}

export function MultiStepForm(props: LeadCaptureProps) {
  return <LeadCaptureShell {...props} />;
}

export function SingleForm(props: LeadCaptureProps) {
  return <LeadCaptureShell {...props} />;
}
