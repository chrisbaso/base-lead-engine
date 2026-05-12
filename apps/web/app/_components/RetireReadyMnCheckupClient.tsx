"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Mail, Phone } from "lucide-react";
import type { TenantConfig } from "@ble/tenant-schema";
import type { CaptureValues } from "@ble/core/lead-capture/components";
import { getClientTrackingConfig } from "@ble/core/tracking";
import { retireReadyMnCopy } from "@ble/tenant-retire-ready-mn/copy";
import {
  calculateRetirementIncomeScore,
  type PrimaryConcern,
  type RetirementScoreResult,
  type SavingsBucket
} from "@ble/tenant-retire-ready-mn/lib/retirement-score-engine";
import {
  calculateAnnuityBuyerIntent,
  type AnnuityIntentResult,
  type IncomePreference
} from "@ble/tenant-retire-ready-mn/lib/annuity-intent-engine";
import { recordRetireReadyContentEventAction, recordRetireReadyStepAction, submitLeadAction } from "../actions";

type RetireReadyMnCheckupClientProps = {
  tenant: TenantConfig;
  heroVariantId: string;
  quizFrameId: string;
};

type CheckupValues = {
  currentAge: string;
  targetRetirementAge: string;
  currentSavingsBucket: SavingsBucket | "";
  monthlySocialSecurity: string;
  desiredMonthlyIncome: string;
  primaryConcern: PrimaryConcern | "";
  incomePreference: IncomePreference | "";
  firstName: string;
  email: string;
  lastName: string;
  phone: string;
  tcpaConsent: boolean;
};

type StepId =
  | "age"
  | "savings"
  | "social-security"
  | "desired-income"
  | "primary-concern"
  | "income-preference"
  | "email-gate"
  | "phone-match";

type Step = {
  id: StepId;
  title: string;
  helper: string;
};

const steps: Step[] = [
  { id: "age", title: "Retirement timeline", helper: "Start with where you are and when you want income to begin." },
  { id: "savings", title: "Current savings", helper: "Use the bucket that best matches retirement accounts and investable assets." },
  { id: "social-security", title: "Social Security", helper: "Enter the estimated monthly amount at full retirement age." },
  { id: "desired-income", title: "Desired income", helper: "Use today's dollars, before detailed tax modeling." },
  { id: "primary-concern", title: "Primary concern", helper: "This helps frame your score summary." },
  { id: "income-preference", title: "Income preference", helper: "Choose the planning question you most want answered next." },
  { id: "email-gate", title: "Your score is ready", helper: "Enter your first name and email to reveal the score." },
  { id: "phone-match", title: "Minnesota specialist match", helper: "Add phone consent only if you want a local specialist handoff." }
];

const fallbackStep: Step = {
  id: "age",
  title: "Retirement timeline",
  helper: "Start with where you are and when you want income to begin."
};

const savingsOptions: Array<{ value: SavingsBucket; label: string }> = [
  { value: "under-250000", label: "Under $250K" },
  { value: "250000-500000", label: "$250K-$500K" },
  { value: "500000-1000000", label: "$500K-$1M" },
  { value: "1000000-2000000", label: "$1M-$2M" },
  { value: "over-2000000", label: "Over $2M" }
];

const concernOptions: Array<{ value: PrimaryConcern; label: string }> = [
  { value: "outliving_savings", label: "Outliving savings" },
  { value: "market_crash", label: "Market crash" },
  { value: "taxes", label: "Taxes" },
  { value: "leaving_legacy", label: "Leaving legacy" },
  { value: "healthcare_costs", label: "Healthcare costs" }
];

const incomePreferenceOptions: Array<{ value: IncomePreference; label: string }> = [
  { value: "dependable_income", label: "A dependable monthly income floor" },
  { value: "growth_flexibility", label: "Growth and withdrawal flexibility" },
  { value: "tax_efficiency", label: "A more tax-aware income plan" },
  { value: "legacy_flexibility", label: "Flexibility for family or legacy goals" },
  { value: "not_sure", label: "I am not sure yet" }
];

const initialValues: CheckupValues = {
  currentAge: "",
  targetRetirementAge: "",
  currentSavingsBucket: "",
  monthlySocialSecurity: "",
  desiredMonthlyIncome: "",
  primaryConcern: "",
  incomePreference: "",
  firstName: "",
  email: "",
  lastName: "",
  phone: "",
  tcpaConsent: false
};

function currency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function readSource(heroVariantId: string, quizFrameId: string) {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(
    Object.entries({
      url: window.location.href,
      referrer: document.referrer || undefined,
      utmSource: params.get("utm_source") ?? undefined,
      utmMedium: params.get("utm_medium") ?? undefined,
      utmCampaign: params.get("utm_campaign") ?? undefined,
      utmContent: params.get("utm_content") ?? undefined,
      heroVariant: params.get("hero_variant") ?? heroVariantId,
      quizFrame: params.get("quiz_frame") ?? quizFrameId,
      articleSlug: params.get("article_slug") ?? undefined,
      articleCategory: params.get("article_category") ?? undefined,
      ctaVariant: params.get("cta_variant") ?? undefined
    }).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

function emitTracking(eventName: string, payload: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent("ble:tracking", { detail: { eventName, payload } }));
}

function canScore(values: CheckupValues): values is CheckupValues & {
  currentSavingsBucket: SavingsBucket;
  primaryConcern: PrimaryConcern;
} {
  return (
    values.currentAge !== "" &&
    values.targetRetirementAge !== "" &&
    values.currentSavingsBucket !== "" &&
    values.monthlySocialSecurity !== "" &&
    values.desiredMonthlyIncome !== "" &&
    values.primaryConcern !== ""
  );
}

function calculateScore(values: CheckupValues): RetirementScoreResult | null {
  if (!canScore(values)) {
    return null;
  }

  return calculateRetirementIncomeScore({
    currentAge: Number(values.currentAge),
    targetRetirementAge: Number(values.targetRetirementAge),
    currentSavingsBucket: values.currentSavingsBucket,
    monthlySocialSecurity: Number(values.monthlySocialSecurity),
    desiredMonthlyIncome: Number(values.desiredMonthlyIncome),
    primaryConcern: values.primaryConcern
  });
}

function calculateIntent(values: CheckupValues, articleSlug?: string): AnnuityIntentResult | null {
  if (!canScore(values) || values.incomePreference === "") {
    return null;
  }

  return calculateAnnuityBuyerIntent({
    currentAge: Number(values.currentAge),
    targetRetirementAge: Number(values.targetRetirementAge),
    currentSavingsBucket: values.currentSavingsBucket,
    monthlySocialSecurity: Number(values.monthlySocialSecurity),
    desiredMonthlyIncome: Number(values.desiredMonthlyIncome),
    primaryConcern: values.primaryConcern,
    incomePreference: values.incomePreference,
    phone: values.phone,
    tcpaConsent: values.tcpaConsent,
    articleSlug
  });
}

function toCaptureValues(
  values: CheckupValues,
  score: RetirementScoreResult | null,
  intent: AnnuityIntentResult | null
): CaptureValues {
  return {
    currentAge: Number(values.currentAge),
    targetRetirementAge: Number(values.targetRetirementAge),
    currentSavingsBucket: values.currentSavingsBucket,
    monthlySocialSecurity: Number(values.monthlySocialSecurity),
    desiredMonthlyIncome: Number(values.desiredMonthlyIncome),
    primaryConcern: values.primaryConcern,
    incomePreference: values.incomePreference,
    firstName: values.firstName,
    email: values.email,
    lastName: values.lastName,
    phone: values.phone,
    tcpaConsent: values.tcpaConsent,
    ...(score
      ? {
          currentSavings: score.currentSavingsEstimate,
          retirementScore: score.score,
          scoreBand: score.band,
          projectedMonthlyIncome: score.projectedMonthlyIncome,
          monthlyIncomeGap: score.monthlyGap
        }
      : {}),
    ...(intent
      ? {
          annuityIntentScore: intent.score,
          annuityIntentBand: intent.band,
          annuityIntentSegment: intent.segment,
          annuityIntentReasons: intent.reasons,
          recommendedAction: intent.recommendedAction,
          automationPriority: intent.automationPriority,
          nextBestEmailId: intent.nextBestEmailId,
          advisorTalkingPoints: intent.advisorTalkingPoints
        }
      : {})
  };
}

export function RetireReadyMnCheckupClient({
  tenant,
  heroVariantId,
  quizFrameId
}: RetireReadyMnCheckupClientProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<CheckupValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const tracking = useMemo(() => getClientTrackingConfig(tenant), [tenant]);
  const step = steps[stepIndex] ?? fallbackStep;
  const score = useMemo(() => calculateScore(values), [values]);
  const intent = useMemo(() => calculateIntent(values), [values]);
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);

  useEffect(() => {
    const source = readSource(heroVariantId, quizFrameId);
    if (!source.articleSlug) {
      return;
    }

    const sessionKey = `rrmn:quiz-started:${source.articleSlug}`;
    if (window.sessionStorage.getItem(sessionKey)) {
      return;
    }

    window.sessionStorage.setItem(sessionKey, "1");
    void recordRetireReadyContentEventAction({
      eventType: "quiz_started_from_article",
      articleSlug: source.articleSlug,
      ...(source.articleCategory ? { articleCategory: source.articleCategory } : {}),
      ...(source.ctaVariant ? { ctaVariant: source.ctaVariant } : {}),
      metadata: Object.fromEntries(
        Object.entries({ url: source.url, referrer: source.referrer }).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string"
        )
      )
    });
  }, [heroVariantId, quizFrameId]);

  function updateValue<K extends keyof CheckupValues>(key: K, value: CheckupValues[K]) {
    setError(null);
    setValues((current) => ({ ...current, [key]: value }));
  }

  function validateCurrentStep(): string | null {
    if (step.id === "age") {
      const age = Number(values.currentAge);
      const target = Number(values.targetRetirementAge);
      if (!Number.isFinite(age) || age < 45 || age > 85) {
        return "Enter a current age between 45 and 85.";
      }
      if (!Number.isFinite(target) || target < 55 || target > 75 || target <= age) {
        return "Enter a target retirement age between 55 and 75 that is greater than your current age.";
      }
    }

    if (step.id === "savings" && values.currentSavingsBucket === "") {
      return "Select a retirement savings range.";
    }

    if (step.id === "social-security" && Number(values.monthlySocialSecurity) < 0) {
      return "Enter an estimated monthly Social Security benefit.";
    }

    if (step.id === "desired-income" && Number(values.desiredMonthlyIncome) < 1000) {
      return "Enter a desired monthly retirement income of at least $1,000.";
    }

    if (step.id === "primary-concern" && values.primaryConcern === "") {
      return "Select the concern that feels most important.";
    }

    if (step.id === "income-preference" && values.incomePreference === "") {
      return "Select the planning question you most want answered next.";
    }

    if (step.id === "email-gate") {
      if (values.firstName.trim().length === 0) {
        return "Enter your first name.";
      }
      if (!values.email.includes("@")) {
        return "Enter a valid email address.";
      }
    }

    if (step.id === "phone-match") {
      if (values.lastName.trim().length === 0) {
        return "Enter your last name.";
      }
      if (values.phone.replace(/\D/g, "").length < 10) {
        return "Enter a valid phone number.";
      }
      if (!values.tcpaConsent) {
        return "Check the consent box before requesting a specialist match.";
      }
    }

    return null;
  }

  async function handleContinue() {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const source = readSource(heroVariantId, quizFrameId);
      const payload = toCaptureValues(values, score, calculateIntent(values, source.articleSlug));

      emitTracking("LeadStepCompleted", {
        stepId: step.id,
        eventMappings: tracking.eventMappings,
        heroVariant: heroVariantId,
        quizFrame: quizFrameId
      });

      if (step.id === "phone-match") {
        await submitLeadAction({
          fields: payload,
          stepId: step.id,
          isPartial: false,
          source
        });
        setCompleted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      await recordRetireReadyStepAction({
        fields: payload,
        stepId: step.id,
        source
      });

      setStepIndex((current) => Math.min(current + 1, steps.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }

  if (completed && score) {
    return (
      <section className="rrmn-result-panel">
        <CheckCircle2 aria-hidden="true" />
        <h2>You're matched for review.</h2>
        <p>{retireReadyMnCopy.matchIntro.replace("{advisorName}", "a local Minnesota retirement specialist")}</p>
        <ScoreBreakdown score={score} full />
      </section>
    );
  }

  return (
    <section className="rrmn-checkup-card">
      <div className="rrmn-progress" aria-label={`Step ${String(stepIndex + 1)} of ${String(steps.length)}`}>
        <span style={{ width: `${String(progress)}%` }} />
      </div>
      <div className="rrmn-step-heading">
        <span>
          Step {String(stepIndex + 1)} of {String(steps.length)}
        </span>
        <h2>{step.title}</h2>
        <p>{step.helper}</p>
      </div>
      <div className="rrmn-step-body">{renderStep(step.id, values, updateValue)}</div>
      {step.id === "email-gate" && score ? <ScoreBreakdown score={score} /> : null}
      {step.id === "phone-match" && score ? <ScoreBreakdown score={score} full intent={intent} /> : null}
      {error ? <p className="rrmn-form-error">{error}</p> : null}
      <div className="rrmn-step-actions">
        {stepIndex > 0 ? (
          <button
            className="rrmn-secondary-button"
            type="button"
            onClick={() => {
              setStepIndex((current) => Math.max(0, current - 1));
            }}
          >
            <ArrowLeft aria-hidden="true" />
            Back
          </button>
        ) : null}
        <button className="rrmn-primary-button" type="button" onClick={() => void handleContinue()} disabled={submitting}>
          {step.id === "phone-match" ? "Request My Minnesota Match" : step.id === "email-gate" ? "Reveal My Score" : "Continue"}
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
      <p className="rrmn-private-line">
        <LockKeyhole aria-hidden="true" />
        {retireReadyMnCopy.calculatorDisclosure}
      </p>
    </section>
  );
}

function renderStep(
  stepId: StepId,
  values: CheckupValues,
  updateValue: <K extends keyof CheckupValues>(key: K, value: CheckupValues[K]) => void
) {
  if (stepId === "age") {
    return (
      <div className="rrmn-field-grid">
        <label>
          <span>Current age</span>
          <input
            type="number"
            min={45}
            max={85}
            value={values.currentAge}
            onChange={(event) => {
              updateValue("currentAge", event.target.value);
            }}
          />
        </label>
        <label>
          <span>Target retirement age</span>
          <input
            type="number"
            min={55}
            max={75}
            value={values.targetRetirementAge}
            onChange={(event) => {
              updateValue("targetRetirementAge", event.target.value);
            }}
          />
        </label>
      </div>
    );
  }

  if (stepId === "savings") {
    return (
      <div className="rrmn-option-grid">
        {savingsOptions.map((option) => (
          <button
            key={option.value}
            className={values.currentSavingsBucket === option.value ? "selected" : undefined}
            type="button"
            onClick={() => {
              updateValue("currentSavingsBucket", option.value);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  if (stepId === "social-security") {
    return (
      <label className="rrmn-wide-field">
        <span>Estimated monthly Social Security benefit at full retirement age</span>
        <input
          type="number"
          min={0}
          max={8000}
          value={values.monthlySocialSecurity}
          onChange={(event) => {
            updateValue("monthlySocialSecurity", event.target.value);
          }}
        />
      </label>
    );
  }

  if (stepId === "desired-income") {
    return (
      <label className="rrmn-wide-field">
        <span>Desired monthly retirement income in today's dollars</span>
        <input
          type="number"
          min={1000}
          max={50000}
          value={values.desiredMonthlyIncome}
          onChange={(event) => {
            updateValue("desiredMonthlyIncome", event.target.value);
          }}
        />
      </label>
    );
  }

  if (stepId === "primary-concern") {
    return (
      <div className="rrmn-option-grid">
        {concernOptions.map((option) => (
          <button
            key={option.value}
            className={values.primaryConcern === option.value ? "selected" : undefined}
            type="button"
            onClick={() => {
              updateValue("primaryConcern", option.value);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  if (stepId === "income-preference") {
    return (
      <div className="rrmn-option-grid">
        {incomePreferenceOptions.map((option) => (
          <button
            key={option.value}
            className={values.incomePreference === option.value ? "selected" : undefined}
            type="button"
            onClick={() => {
              updateValue("incomePreference", option.value);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  if (stepId === "email-gate") {
    return (
      <div className="rrmn-field-grid">
        <label>
          <span>First name</span>
          <input
            value={values.firstName}
            onChange={(event) => {
              updateValue("firstName", event.target.value);
            }}
          />
        </label>
        <label>
          <span>Email</span>
          <input
            type="email"
            value={values.email}
            onChange={(event) => {
              updateValue("email", event.target.value);
            }}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="rrmn-field-stack">
      <div className="rrmn-field-grid">
        <label>
          <span>Last name</span>
          <input
            value={values.lastName}
            onChange={(event) => {
              updateValue("lastName", event.target.value);
            }}
          />
        </label>
        <label>
          <span>Phone</span>
          <input
            type="tel"
            value={values.phone}
            onChange={(event) => {
              updateValue("phone", event.target.value);
            }}
          />
        </label>
      </div>
      <label className="rrmn-consent">
        <input
          type="checkbox"
          checked={values.tcpaConsent}
          onChange={(event) => {
            updateValue("tcpaConsent", event.target.checked);
          }}
        />
        <span>
          I agree RetireReadyMN and its matched licensed local advisor may call or text me at the number provided
          about my retirement income review, including by automated technology. Consent is not required to use the
          educational checkup.
        </span>
      </label>
    </div>
  );
}

function ScoreBreakdown({
  score,
  full = false,
  intent
}: {
  score: RetirementScoreResult;
  full?: boolean;
  intent?: AnnuityIntentResult | null;
}) {
  return (
    <aside className={`rrmn-score-card ${score.band.toLowerCase()}`}>
      <div>
        <span>{full ? "Full score" : "Partial score"}</span>
        <strong>{score.score}</strong>
        <em>{score.band}</em>
      </div>
      <p>{score.summary}</p>
      {full ? (
        <dl>
          <div>
            <dt>Projected monthly income</dt>
            <dd>{currency(score.projectedMonthlyIncome)}</dd>
          </div>
          <div>
            <dt>Desired monthly income</dt>
            <dd>{currency(score.desiredMonthlyIncome)}</dd>
          </div>
          <div>
            <dt>Estimated monthly gap</dt>
            <dd>{currency(score.monthlyGap)}</dd>
          </div>
        </dl>
      ) : (
        <p className="rrmn-score-lock">
          <Phone aria-hidden="true" />
          Add phone consent on the next step to see the full personalized breakdown and local match option.
        </p>
      )}
      {full && intent ? (
        <p className="rrmn-email-note">
          The useful next step is to identify which expenses need dependable income, then compare cost,
          flexibility, tax, inflation, and survivor tradeoffs.
        </p>
      ) : null}
      {!full ? (
        <p className="rrmn-email-note">
          <Mail aria-hidden="true" />
          Your score summary will also be sent by email after completion.
        </p>
      ) : null}
    </aside>
  );
}
