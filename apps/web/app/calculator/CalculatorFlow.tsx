"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  AlertCircle,
  ArrowRight,
  BarChart2,
  BookOpen,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  FileText,
  Heart,
  Info,
  Lock,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  User,
  X
} from "lucide-react";
import { compute } from "@ble/core/calculators";
import type { CalculatorResult } from "@ble/core/calculators";
import type { TenantConfig } from "@ble/tenant-schema";
import {
  defaultCalculatorStore,
  getCalculatorStorageKey,
  type CalculatorInputs,
  type CalculatorLeadInfo,
  type CalculatorRefineInfo,
  type CalculatorStore,
  type CalculatorTier
} from "./_state";

const stateOptions = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY"
] as const;

const loadingMessages = [
  "Analyzing your retirement inputs...",
  "Calculating your estimated income range...",
  "Preparing your retirement snapshot..."
] as const;

const concernLabels: Record<Exclude<CalculatorRefineInfo["primaryConcern"], "">, string> = {
  market_volatility: "Market Volatility",
  outliving_savings: "Outliving My Savings",
  income_stability: "Stable Monthly Income",
  taxes: "Tax Planning",
  unsure: "Not Sure Yet"
};

const statusLabels: Record<Exclude<CalculatorRefineInfo["retirementStatus"], "">, string> = {
  working: "Currently Working",
  retiring_within_1_year: "Retiring Within the Next Year",
  retiring_in_1_3_years: "Planning to Retire in 1-3 Years",
  already_retired: "Already Retired"
};

const maritalLabels: Record<Exclude<CalculatorRefineInfo["maritalStatus"], "">, string> = {
  single: "Single",
  married: "Married"
};

const preferenceLabels: Record<Exclude<CalculatorRefineInfo["incomePreference"], "">, string> = {
  guaranteed: "Predictable Income Is My Top Priority",
  growth: "Higher Potential, Even With Some Fluctuation",
  balanced: "A Mix of Stability and Growth",
  unsure: "Not Sure Yet"
};

const profileAssessment: Record<CalculatorTier, string> = {
  high: "Strong candidate for further review",
  medium: "Worth exploring in more detail",
  low: "Good starting point for planning"
};

type CalculatorFlowProps = {
  tenant: TenantConfig;
  mode: "inputs" | "unlock" | "result";
};

type Screen = "inputs" | "loading" | "gate" | "results" | "booking";

type FieldErrors<T extends string> = Partial<Record<T, string | undefined>>;

function currentRateDate(): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(new Date());
}

function currency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function readStore(storageKey: string): CalculatorStore {
  if (typeof window === "undefined") {
    return defaultCalculatorStore;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return defaultCalculatorStore;
    }

    const parsed = JSON.parse(raw) as Partial<CalculatorStore>;

    return {
      ...defaultCalculatorStore,
      ...parsed,
      inputs: { ...defaultCalculatorStore.inputs, ...parsed.inputs },
      leadInfo: { ...defaultCalculatorStore.leadInfo, ...parsed.leadInfo },
      refineInfo: { ...defaultCalculatorStore.refineInfo, ...parsed.refineInfo }
    };
  } catch {
    return defaultCalculatorStore;
  }
}

function computeResult(inputs: CalculatorInputs): CalculatorResult {
  return compute("retirementIncome", inputs);
}

function trackEvent(eventName: string, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("ble:tracking", {
      detail: { eventName, payload }
    })
  );
}

function calculateScore(inputs: CalculatorInputs, refineInfo: CalculatorRefineInfo, phone?: string): { score: number; tier: CalculatorTier } {
  let score = 0;

  if (inputs.currentAge >= 65) {
    score += 3;
  } else if (inputs.currentAge >= 60) {
    score += 2;
  } else if (inputs.currentAge >= 55) {
    score += 1;
  }

  if (inputs.retirementSavings >= 1000000) {
    score += 4;
  } else if (inputs.retirementSavings >= 500000) {
    score += 3;
  } else if (inputs.retirementSavings >= 250000) {
    score += 2;
  } else if (inputs.retirementSavings >= 100000) {
    score += 1;
  }

  if (refineInfo.retirementStatus === "already_retired" || refineInfo.retirementStatus === "retiring_within_1_year") {
    score += 3;
  } else if (refineInfo.retirementStatus === "retiring_in_1_3_years") {
    score += 2;
  }

  if (
    refineInfo.primaryConcern === "market_volatility" ||
    refineInfo.primaryConcern === "outliving_savings" ||
    refineInfo.primaryConcern === "income_stability"
  ) {
    score += 2;
  } else if (refineInfo.primaryConcern === "taxes") {
    score += 1;
  }

  if (refineInfo.incomePreference === "guaranteed") {
    score += 2;
  } else if (refineInfo.incomePreference === "balanced") {
    score += 1;
  }

  if (phone && phone.trim().length > 0) {
    score += 1;
  }

  if (score >= 8) {
    return { score, tier: "high" };
  }

  if (score >= 4) {
    return { score, tier: "medium" };
  }

  return { score, tier: "low" };
}

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) {
    return null;
  }

  return (
    <div className="calc-error">
      <AlertCircle aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
  hint,
  optional
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
  hint?: string | undefined;
  optional?: boolean | undefined;
}) {
  return (
    <label className="calc-form-field">
      <span>
        {label}
        {optional ? <em>(optional)</em> : null}
      </span>
      {children}
      {hint && !error ? <small>{hint}</small> : null}
      <FieldError message={error} />
    </label>
  );
}

function SnapshotRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="snapshot-row">
      <div className="snapshot-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function IncomePreview({ result, blurred = false }: { result: CalculatorResult; blurred?: boolean }) {
  return (
    <div className="income-preview-card">
      <p>Illustrative Monthly Income Range</p>
      <div className={blurred ? "income-preview-number blurred-values" : "income-preview-number"}>
        {currency(result.monthly.low)}
        <span>-</span>
        {currency(result.monthly.high)}
      </div>
      <small>per month</small>
      <div className="income-preview-annual">
        {currency(result.annual.low)} - {currency(result.annual.high)} / year
      </div>
    </div>
  );
}

function ResultChart({ result, blurred = false }: { result: CalculatorResult; blurred?: boolean }) {
  const data = result.projection.map((point) => ({
    age: point.age,
    low: point.valueLow,
    high: point.valueHigh
  }));

  return (
    <div className={blurred ? "result-chart blurred-chart" : "result-chart"}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-rule)" vertical={false} />
          <XAxis dataKey="age" tickLine={false} axisLine={false} tick={{ fill: "var(--color-ink-muted)", fontSize: 12 }} />
          <YAxis
            tickFormatter={(value: number) => currency(value)}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-ink-muted)", fontSize: 12 }}
            width={76}
          />
          <Tooltip
            formatter={(value) => (typeof value === "number" ? currency(value) : "")}
            contentStyle={{
              background: "var(--color-paper)",
              border: "1px solid var(--color-rule)",
              borderRadius: 0,
              color: "var(--color-ink)"
            }}
          />
          <Area type="monotone" dataKey="high" stroke="var(--color-brand)" fill="var(--color-brand)" fillOpacity={0.14} />
          <Area type="monotone" dataKey="low" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.12} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MethodologySection({ result, copy }: { result: CalculatorResult; copy?: string | undefined }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="methodology">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
        }}
      >
        <Info aria-hidden="true" />
        How we calculate this
        {open ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
      </button>
      {open ? (
        <div className="methodology-panel">
          {copy
            ? copy.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)
            : (
              <>
                <p>
                  Your estimate is based on current fixed-income payout rates for your target retirement age.
                  The range reflects strategy types from conservative guaranteed-income approaches to balanced
                  strategies with more growth potential.
                </p>
                <p>This is an educational illustration only and does not represent any specific financial product or guarantee.</p>
              </>
            )}
          <p>
            Current rate band used: {(result.assumptions.lowPayoutRate * 100).toFixed(1)}% -{" "}
            {(result.assumptions.highPayoutRate * 100).toFixed(1)}%, reviewed {currentRateDate()}.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ExitIntentModal({
  preview,
  onSubmit,
  onClose
}: {
  preview: CalculatorResult;
  onSubmit: (email: string) => void;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="exit-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="exit-title">
      <div className="exit-modal">
        <button className="exit-close" type="button" onClick={onClose} aria-label="Close">
          <X aria-hidden="true" />
        </button>
        {submitted ? (
          <div className="exit-success">
            <CheckCircle2 aria-hidden="true" />
            <h2 id="exit-title">Check your inbox</h2>
            <p>Your income snapshot is on its way.</p>
          </div>
        ) : (
          <>
            <div className="exit-icon">
              <Mail aria-hidden="true" />
            </div>
            <h2 id="exit-title">Wait - do not lose your estimate</h2>
            <p>
              We can email your {currency(preview.monthly.low)} - {currency(preview.monthly.high)} monthly
              retirement income snapshot so you can review it later.
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!email.includes("@")) {
                  setError("Please enter a valid email address.");
                  return;
                }
                onSubmit(email);
                setSubmitted(true);
                window.setTimeout(onClose, 1800);
              }}
            >
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setError(undefined);
                  setEmail(event.target.value);
                }}
                placeholder="jane@example.com"
                autoFocus
              />
              <FieldError message={error} />
              <button className="primary-button" type="submit">
                <Mail aria-hidden="true" /> Email my estimate
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function InlineRefineCard({
  firstName,
  value,
  onSubmit
}: {
  firstName: string;
  value: CalculatorRefineInfo;
  onSubmit: (value: CalculatorRefineInfo) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | undefined>();

  if (submitted) {
    return (
      <div className="refine-success">
        <CheckCircle2 aria-hidden="true" />
        <div>
          <strong>Snapshot personalized.</strong>
          <p>Your profile assessment has been updated based on your answers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-refine-card">
      <button
        type="button"
        onClick={() => {
          setExpanded((current) => !current);
        }}
      >
        <span className="refine-spark">
          <Sparkles aria-hidden="true" />
        </span>
        <span>
          <strong>{firstName || "Want"} a more personalized assessment?</strong>
          <small>Answer 4 quick questions to refine your profile and score.</small>
        </span>
        {expanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
      </button>
      {expanded ? (
        <form
          className="inline-refine-fields"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.maritalStatus || !draft.retirementStatus || !draft.primaryConcern || !draft.incomePreference) {
              setError("Please answer all four refinement questions.");
              return;
            }

            onSubmit(draft);
            setSubmitted(true);
          }}
        >
          <FormField label="Marital Status">
            <select
              value={draft.maritalStatus}
              onChange={(event) => {
                setError(undefined);
                setDraft((current) => ({
                  ...current,
                  maritalStatus: event.target.value as CalculatorRefineInfo["maritalStatus"]
                }));
              }}
            >
              <option value="">Select...</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
            </select>
          </FormField>
          <FormField label="Retirement Status">
            <select
              value={draft.retirementStatus}
              onChange={(event) => {
                setError(undefined);
                setDraft((current) => ({
                  ...current,
                  retirementStatus: event.target.value as CalculatorRefineInfo["retirementStatus"]
                }));
              }}
            >
              <option value="">Select...</option>
              <option value="working">Currently Working</option>
              <option value="retiring_in_1_3_years">Retiring in 1-3 Years</option>
              <option value="retiring_within_1_year">Retiring This Year</option>
              <option value="already_retired">Already Retired</option>
            </select>
          </FormField>
          <FormField label="Biggest Concern">
            <select
              value={draft.primaryConcern}
              onChange={(event) => {
                setError(undefined);
                setDraft((current) => ({
                  ...current,
                  primaryConcern: event.target.value as CalculatorRefineInfo["primaryConcern"]
                }));
              }}
            >
              <option value="">Select...</option>
              <option value="market_volatility">Market Volatility</option>
              <option value="outliving_savings">Outliving Savings</option>
              <option value="income_stability">Stable Income</option>
              <option value="taxes">Tax Planning</option>
              <option value="unsure">Not Sure</option>
            </select>
          </FormField>
          <FormField label="Income Priority">
            <select
              value={draft.incomePreference}
              onChange={(event) => {
                setError(undefined);
                setDraft((current) => ({
                  ...current,
                  incomePreference: event.target.value as CalculatorRefineInfo["incomePreference"]
                }));
              }}
            >
              <option value="">Select...</option>
              <option value="guaranteed">Predictability first</option>
              <option value="growth">Growth potential</option>
              <option value="balanced">Mix of both</option>
              <option value="unsure">Not sure</option>
            </select>
          </FormField>
          <FieldError message={error} />
          <button className="primary-button" type="submit">
            <Sparkles aria-hidden="true" /> Personalize my results
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function CalculatorFlow({ tenant, mode }: CalculatorFlowProps) {
  const router = useRouter();
  const storageKey = getCalculatorStorageKey(tenant.identity.slug);
  const [store, setStore] = useState<CalculatorStore>(() => readStore(storageKey));
  const [screen, setScreen] = useState<Screen>(mode === "inputs" ? "inputs" : mode === "unlock" ? "gate" : "results");
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [inputErrors, setInputErrors] = useState<FieldErrors<"currentAge" | "retirementAge" | "retirementSavings" | "state">>({});
  const [gateErrors, setGateErrors] = useState<FieldErrors<"firstName" | "email">>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitIntentFired, setExitIntentFired] = useState(false);
  const result = useMemo(() => computeResult(store.inputs), [store.inputs]);
  const compliance = tenant.compliance;
  const calculator = tenant.calculator;
  const content = tenant.content;
  const licensedStates = compliance?.statesLicensed ?? [];
  const canServeState = !compliance?.requireStateGating || licensedStates.includes(store.inputs.state);
  const isRefined =
    store.refineInfo.maritalStatus !== "" &&
    store.refineInfo.primaryConcern !== "" &&
    store.refineInfo.retirementStatus !== "" &&
    store.refineInfo.incomePreference !== "";

  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...store,
        computedResult: result
      })
    );
  }, [result, storageKey, store]);

  useEffect(() => {
    if (screen !== "loading") {
      return;
    }

    const messageInterval = window.setInterval(() => {
      setLoadingIndex((current) => (current + 1) % loadingMessages.length);
    }, 850);
    const gateTimeout = window.setTimeout(() => {
      setScreen("gate");
      router.push("/calculator/unlock");
    }, 2600);

    return () => {
      window.clearInterval(messageInterval);
      window.clearTimeout(gateTimeout);
    };
  }, [router, screen]);

  useEffect(() => {
    if (screen !== "gate" || exitIntentFired) {
      return;
    }

    const handleMouseLeave = (event: MouseEvent) => {
      if (event.clientY <= 0) {
        setShowExitIntent(true);
        setExitIntentFired(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [exitIntentFired, screen]);

  function updateInputs(next: Partial<CalculatorInputs>) {
    setStore((current) => ({
      ...current,
      inputs: { ...current.inputs, ...next },
      computedResult: result
    }));
  }

  function updateLeadInfo(next: Partial<CalculatorLeadInfo>) {
    setStore((current) => ({
      ...current,
      leadInfo: { ...current.leadInfo, ...next }
    }));
  }

  function startOver() {
    setStore(defaultCalculatorStore);
    setInputErrors({});
    setGateErrors({});
    setNotice(null);
    setExitIntentFired(false);
    setShowExitIntent(false);
    setScreen("inputs");
    router.push("/calculator");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateInputs() {
    const nextErrors: typeof inputErrors = {};

    if (store.inputs.currentAge < 50 || store.inputs.currentAge > 80) {
      nextErrors.currentAge = "Age must be between 50 and 80.";
    }

    if (store.inputs.retirementAge < 55 || store.inputs.retirementAge > 90) {
      nextErrors.retirementAge = "Retirement age must be between 55 and 90.";
    } else if (store.inputs.retirementAge <= store.inputs.currentAge) {
      nextErrors.retirementAge = "Retirement age must be greater than current age.";
    }

    if (store.inputs.retirementSavings < 1 || store.inputs.retirementSavings > 50000000) {
      nextErrors.retirementSavings = "Enter savings between $1 and $50,000,000.";
    }

    if (store.inputs.state.length !== 2) {
      nextErrors.state = "Please select your state.";
    }

    setInputErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleEstimateClick() {
    if (!validateInputs()) {
      return;
    }

    if (!canServeState) {
      setNotice(compliance.unlicensedStateMessage.replaceAll("{state}", store.inputs.state));
      trackEvent("LeadDisqualified", { state: store.inputs.state });
      return;
    }

    setLoadingIndex(0);
    setScreen("loading");
    trackEvent("LeadStepCompleted", {
      stepId: "calculator-inputs",
      age: store.inputs.currentAge,
      state: store.inputs.state,
      retirementSavings: store.inputs.retirementSavings,
      retirementAge: store.inputs.retirementAge
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleUnlock() {
    const nextErrors: typeof gateErrors = {};

    if (!store.leadInfo.firstName.trim()) {
      nextErrors.firstName = "Please enter your first name.";
    }

    if (!store.leadInfo.email.includes("@")) {
      nextErrors.email = "Please enter a valid email address.";
    }

    setGateErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setStore((current) => ({
      ...current,
      isUnlocked: true,
      leadId: current.leadId ?? crypto.randomUUID(),
      computedResult: result
    }));
    setScreen("results");
    router.push("/calculator/result");
    trackEvent("LeadCompleted", {
      email: store.leadInfo.email,
      monthlyLow: result.monthly.low,
      monthlyHigh: result.monthly.high
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleRefineSubmit(refineInfo: CalculatorRefineInfo) {
    const scored = calculateScore(store.inputs, refineInfo, store.leadInfo.phone);
    setStore((current) => ({
      ...current,
      refineInfo,
      score: scored.score,
      tier: scored.tier
    }));
    trackEvent("LeadQualified", {
      score: scored.score,
      tier: scored.tier,
      primaryConcern: refineInfo.primaryConcern
    });
  }

  function handleExitIntentSubmit(email: string) {
    updateLeadInfo({ email });
    trackEvent("exit_intent_captured", { email });
  }

  return (
    <main className="calculator-page calculator-upgraded">
      <div className="calculator-centered">
        {screen === "inputs" ? (
          <section className="calc-step-card">
            <div className="calc-heading">
              <div className="calc-icon-circle">
                <Calculator aria-hidden="true" />
              </div>
              <h1>Estimate Your Retirement Paycheck in 30 Seconds</h1>
              <p>
                Enter four quick numbers to see how much monthly income your retirement savings could potentially produce.
              </p>
              <div className="calc-trust-row">
                {["Secure and private", "Educational only", "No commitment"].map((label) => (
                  <span key={label}>
                    <ShieldCheck aria-hidden="true" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <form
              className="calc-panel"
              onSubmit={(event) => {
                event.preventDefault();
                handleEstimateClick();
              }}
              noValidate
            >
              <div className="calc-panel-title">
                <span>1</span>
                <h2>Your Quick Numbers</h2>
              </div>
              <div className="calc-grid-two">
                <FormField label="Current Age" error={inputErrors.currentAge} hint="Ages 50-80">
                  <input
                    type="number"
                    min={50}
                    max={80}
                    value={store.inputs.currentAge}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      setInputErrors((current) => ({ ...current, currentAge: undefined }));
                      updateInputs({
                        currentAge: value,
                        retirementAge: Math.max(store.inputs.retirementAge, value + 1)
                      });
                    }}
                  />
                </FormField>
                <FormField label="State" error={inputErrors.state}>
                  <select
                    value={store.inputs.state}
                    onChange={(event) => {
                      setNotice(null);
                      setInputErrors((current) => ({ ...current, state: undefined }));
                      updateInputs({ state: event.target.value });
                    }}
                  >
                    {stateOptions.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
              <div className="calc-grid-two">
                <FormField
                  label="Estimated Retirement Savings ($)"
                  error={inputErrors.retirementSavings}
                  hint="Include 401(k), IRA, and other accounts"
                >
                  <div className="money-input">
                    <span>$</span>
                    <input
                      type="number"
                      min={1}
                      max={50000000}
                      value={store.inputs.retirementSavings}
                      onChange={(event) => {
                        setInputErrors((current) => ({ ...current, retirementSavings: undefined }));
                        updateInputs({ retirementSavings: Number(event.target.value) });
                      }}
                    />
                  </div>
                </FormField>
                <FormField
                  label="Target Retirement Age"
                  error={inputErrors.retirementAge}
                  hint="When you plan to start drawing income"
                >
                  <input
                    type="number"
                    min={55}
                    max={90}
                    value={store.inputs.retirementAge}
                    onChange={(event) => {
                      setInputErrors((current) => ({ ...current, retirementAge: undefined }));
                      updateInputs({ retirementAge: Number(event.target.value) });
                    }}
                  />
                </FormField>
              </div>
              <div className="calc-info-note">
                <Info aria-hidden="true" />
                <p>
                  Your savings figure is used only to generate an illustrative income range. It is not shared with
                  any financial institution or product provider in this local build.
                </p>
              </div>
              {notice ? (
                <div className="state-notice">
                  {notice.split("\n\n").map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {compliance ? (
                    <a href={compliance.brokerCheckUrl} rel="noreferrer" target="_blank">
                      FINRA BrokerCheck
                    </a>
                  ) : null}
                </div>
              ) : null}
              <button className="primary-button big-button" type="submit">
                <Calculator aria-hidden="true" />
                Calculate My Estimate
                <ArrowRight aria-hidden="true" />
              </button>
              <p className="calc-lockline">
                <Lock aria-hidden="true" />
                Your information is encrypted and never sold to third parties.
              </p>
            </form>
          </section>
        ) : null}

        {screen === "loading" ? (
          <section className="calc-loading">
            <div className="calc-spinner">
              <BarChart2 aria-hidden="true" />
            </div>
            <h1>{loadingMessages[loadingIndex]}</h1>
            <div className="loading-dots">
              {loadingMessages.map((message, index) => (
                <span key={message} className={index === loadingIndex ? "active" : undefined} />
              ))}
            </div>
            <p>This usually takes just a moment...</p>
          </section>
        ) : null}

        {screen === "gate" ? (
          <section className="gate-card">
            <div className="gate-preview">
              <span className="gate-ready">
                <CheckCircle2 aria-hidden="true" />
                Your estimate is ready
              </span>
              <IncomePreview result={result} blurred />
              <ResultChart result={result} blurred />
              <div className="gate-lock-pill">
                <Lock aria-hidden="true" />
                Enter your details to reveal
              </div>
            </div>
            <div className="gate-form-area">
              <h1>{calculator?.resultDisplay.headline ?? "Your Retirement Income Estimate Is Ready"}</h1>
              <p>Enter your details below to unlock your personalized monthly income range.</p>
              <form
                className="gate-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleUnlock();
                }}
                noValidate
              >
                <FormField label="First Name" error={gateErrors.firstName}>
                  <div className="icon-input">
                    <User aria-hidden="true" />
                    <input
                      type="text"
                      value={store.leadInfo.firstName}
                      onChange={(event) => {
                        setGateErrors((current) => ({ ...current, firstName: undefined }));
                        updateLeadInfo({ firstName: event.target.value });
                      }}
                      placeholder="Jane"
                      autoComplete="given-name"
                    />
                  </div>
                </FormField>
                <FormField
                  label="Email Address"
                  error={gateErrors.email}
                  hint="We will send a copy of your income snapshot to this address."
                >
                  <div className="icon-input">
                    <Mail aria-hidden="true" />
                    <input
                      type="email"
                      value={store.leadInfo.email}
                      onChange={(event) => {
                        setGateErrors((current) => ({ ...current, email: undefined }));
                        updateLeadInfo({ email: event.target.value });
                      }}
                      placeholder="jane@example.com"
                      autoComplete="email"
                    />
                  </div>
                </FormField>
                <FormField label="Phone Number" optional hint="Optional - only if you would like a personalized review call.">
                  <div className="icon-input">
                    <Phone aria-hidden="true" />
                    <input
                      type="tel"
                      value={store.leadInfo.phone ?? ""}
                      onChange={(event) => {
                        updateLeadInfo({ phone: event.target.value });
                      }}
                      placeholder="(612) 555-0100"
                      autoComplete="tel"
                    />
                  </div>
                </FormField>
                <p className="calc-lockline">
                  <Lock aria-hidden="true" />
                  Your information stays private. We never sell your data.
                </p>
                <button className="primary-button big-button" type="submit">
                  <ArrowRight aria-hidden="true" />
                  Show My Income Estimate
                </button>
                <p className="gate-consent">
                  <ShieldCheck aria-hidden="true" />
                  By submitting this form, you agree that a licensed professional may follow up regarding your
                  retirement income estimate. No obligation.
                </p>
              </form>
            </div>
            <button className="text-button start-over-link" type="button" onClick={startOver}>
              <RefreshCw aria-hidden="true" />
              Start over with different inputs
            </button>
          </section>
        ) : null}

        {screen === "results" ? (
          <section className="results-flow">
            <div className="income-card">
              <div className="income-card-bar" />
              <div className="income-card-body">
                <span className="result-pill">
                  <TrendingUp aria-hidden="true" />
                  {store.leadInfo.firstName || "Your"} Estimated Retirement Paycheck
                </span>
                <p>
                  Based on <strong>{currency(store.inputs.retirementSavings)}</strong> in savings starting at age{" "}
                  <strong>{store.inputs.retirementAge}</strong>:
                </p>
                <div className="result-hero-number">
                  {currency(result.monthly.low)} - {currency(result.monthly.high)} / month
                </div>
                <MethodologySection result={result} copy={calculator?.assumptions} />
                <h2>What does this number actually mean for you, {store.leadInfo.firstName || "there"}?</h2>
              </div>
            </div>

            <div className="chart-card">
              <h2>Thirty-year income band</h2>
              <ResultChart result={result} />
            </div>

            {!isRefined ? (
              <InlineRefineCard firstName={store.leadInfo.firstName} value={store.refineInfo} onSubmit={handleRefineSubmit} />
            ) : null}

            <div className="snapshot-card">
              <div className="income-card-bar" />
              <div className="snapshot-card-body">
                <div className="snapshot-title-row">
                  <div>
                    <FileText aria-hidden="true" />
                    <div>
                      <h2>{store.leadInfo.firstName || "Your"} Retirement Income Snapshot</h2>
                      <p>Generated {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date())}</p>
                    </div>
                  </div>
                  <span>
                    <ShieldCheck aria-hidden="true" />
                    Educational
                  </span>
                </div>
                <div className="snapshot-list">
                  <SnapshotRow icon={<User aria-hidden="true" />} label="Age" value={`${String(store.inputs.currentAge)} years old`} />
                  <SnapshotRow icon={<MapPin aria-hidden="true" />} label="State" value={store.inputs.state} />
                  <SnapshotRow icon={<DollarSign aria-hidden="true" />} label="Retirement Savings" value={currency(store.inputs.retirementSavings)} />
                  <SnapshotRow icon={<Calendar aria-hidden="true" />} label="Target Retirement Age" value={`Age ${String(store.inputs.retirementAge)}`} />
                  {isRefined ? (
                    <>
                      <SnapshotRow
                        icon={<Heart aria-hidden="true" />}
                        label="Marital Status"
                        value={maritalLabels[store.refineInfo.maritalStatus as Exclude<CalculatorRefineInfo["maritalStatus"], "">]}
                      />
                      <SnapshotRow
                        icon={<Info aria-hidden="true" />}
                        label="Retirement Status"
                        value={statusLabels[store.refineInfo.retirementStatus as Exclude<CalculatorRefineInfo["retirementStatus"], "">]}
                      />
                      <SnapshotRow
                        icon={<BookOpen aria-hidden="true" />}
                        label="Primary Concern"
                        value={concernLabels[store.refineInfo.primaryConcern as Exclude<CalculatorRefineInfo["primaryConcern"], "">]}
                      />
                      <SnapshotRow
                        icon={<Target aria-hidden="true" />}
                        label="Income Preference"
                        value={preferenceLabels[store.refineInfo.incomePreference as Exclude<CalculatorRefineInfo["incomePreference"], "">]}
                      />
                    </>
                  ) : null}
                </div>
                <div className="profile-summary">
                  <div>
                    <p>Estimated Monthly Income</p>
                    <strong>
                      {currency(result.monthly.low)} - {currency(result.monthly.high)}
                    </strong>
                    <small>
                      {currency(result.annual.low)} - {currency(result.annual.high)} annually
                    </small>
                  </div>
                  <div>
                    <p>Profile Assessment</p>
                    <strong>{profileAssessment[store.tier]}</strong>
                    <small>{isRefined ? "Based on your full profile" : "Complete your profile above for a refined assessment"}</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="dark-cta-card">
              {isRefined && store.tier !== "low" ? (
                <span className={store.tier === "high" ? "tier-pill high" : "tier-pill medium"}>
                  {store.tier === "high" ? <CheckCircle2 aria-hidden="true" /> : <Info aria-hidden="true" />}
                  {store.tier === "high"
                    ? "Strong candidate for a personalized income review"
                    : "Worth exploring retirement income strategies in depth"}
                </span>
              ) : null}
              <h2>Ready to See What This Means for You?</h2>
              <p>
                A licensed retirement income professional can walk you through strategies tailored to your situation,
                regardless of what the market does.
              </p>
              <span className="rate-line">
                <Clock aria-hidden="true" />
                Estimates reflect payout rates as of {currentRateDate()}.
              </span>
              <div className="result-cta-column">
                <button
                  className="white-cta"
                  type="button"
                  onClick={() => {
                    setScreen("booking");
                    trackEvent("booking_cta_clicked", { tier: store.tier });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  {calculator?.resultDisplay.ctaLabel ?? "Schedule a call"}
                  <ArrowRight aria-hidden="true" />
                </button>
                <button className="secondary-button" type="button">
                  Refine my estimate above
                </button>
                <button className="text-button" type="button">
                  We sent a copy to {store.leadInfo.email || "your email"}
                </button>
              </div>
              <p className="dark-cta-foot">No cost. No obligation. Educational review only.</p>
            </div>

            <button className="text-button start-over-link" type="button" onClick={startOver}>
              <RefreshCw aria-hidden="true" />
              Try a different scenario
            </button>
            {compliance ? <p className="calculator-disclosure">{compliance.calculatorDisclosure}</p> : null}
          </section>
        ) : null}

        {screen === "booking" ? (
          <section className="booking-card">
            <div className="income-card-bar" />
            <div className="booking-card-body">
              <div className="booking-success">
                <CheckCircle2 aria-hidden="true" />
              </div>
              <h1>You are all set, {store.leadInfo.firstName || "there"}.</h1>
              <p>
                Book a free call to walk through your numbers. No obligation, no pressure.
              </p>
              <span className="booking-urgency">
                <Clock aria-hidden="true" />
                Limited review slots available this week
              </span>
              {content?.schedulingUrl ? (
                <iframe src={content.schedulingUrl} title="Book your retirement income review" />
              ) : (
                <div className="schedule-fallback">
                  <p>Scheduling is not configured for this tenant yet.</p>
                  <Link href="/schedule">Open the schedule page</Link>
                </div>
              )}
              <p className="booking-disclaimer">All consultations are free and educational. No product purchase required.</p>
              <button className="secondary-button" type="button" onClick={startOver}>
                Run Another Estimate
              </button>
            </div>
          </section>
        ) : null}
      </div>

      {showExitIntent ? (
        <ExitIntentModal
          preview={result}
          onSubmit={handleExitIntentSubmit}
          onClose={() => {
            setShowExitIntent(false);
          }}
        />
      ) : null}
    </main>
  );
}
