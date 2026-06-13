"use client";

import { useState, type SyntheticEvent } from "react";
import { createClient } from "@supabase/supabase-js";

type FormState = "idle" | "submitting" | "success" | "error";

const roleOptions = [
  "High school",
  "Travel / club",
  "Legion / townball",
  "Youth association",
  "College",
  "Other"
];

const currentSystemOptions = [
  "Hand signals",
  "The Headset App or similar",
  "PitchCom / GoRout hardware",
  "Wristband cards",
  "Nothing yet"
];

function isProbablyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function createWaitlistClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase waitlist env vars are not configured.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    }
  });
}

export function WaitlistForm() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState("");

  function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    void submitForm(event.currentTarget);
  }

  async function submitForm(form: HTMLFormElement) {
    const formData = new FormData(form);
    const email = readFormString(formData, "email").trim().toLowerCase();
    const role = readFormString(formData, "role");
    const currentSystem = readFormString(formData, "current_system");
    const company = readFormString(formData, "company").trim();

    setError("");

    if (company) {
      setFormState("success");
      form.reset();
      return;
    }

    if (!isProbablyEmail(email)) {
      setFormState("error");
      setError("Enter a valid email address.");
      return;
    }

    setFormState("submitting");

    try {
      const supabase = createWaitlistClient();
      const { error: insertError } = await supabase.from("waitlist").insert({
        email,
        role,
        current_system: currentSystem,
        source: "landing_v1"
      });

      if (insertError) {
        throw insertError;
      }

      form.reset();
      setFormState("success");
    } catch {
      setFormState("error");
      setError("Couldn't send — try again in a minute");
    }
  }

  return (
    <form className="waitlist-form" onSubmit={handleSubmit} noValidate>
      <div className="hidden-field" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="coach@example.com" />
      </div>

      <div className="field">
        <label htmlFor="role">Role</label>
        <select id="role" name="role" defaultValue={roleOptions[0]}>
          {roleOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="current_system">Current system</label>
        <select id="current_system" name="current_system" defaultValue={currentSystemOptions[0]}>
          {currentSystemOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <button className="form-submit" type="submit" disabled={formState === "submitting"}>
        {formState === "submitting" ? "Sending..." : "Submit"}
      </button>

      {formState === "success" ? (
        <div className="form-status success" role="status" aria-live="polite">
          You're on the card ✓ Tell a conference coach who should test it with you.
        </div>
      ) : null}

      {formState === "error" ? (
        <div className="form-status error" role="alert" aria-live="polite">
          {error}
        </div>
      ) : null}

      <p className="fine-print">No spam. One email when your spot opens. Unsubscribe anytime.</p>
    </form>
  );
}
