"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("ble:error", {
        detail: { message: error.message, digest: error.digest }
      })
    );
  }, [error]);

  return (
    <main className="shell">
      <section className="hero">
        <p className="brand">Base Lead Engine</p>
        <h1>Something went wrong</h1>
        <p className="subhead">Please try again. Your previous answers remain saved on this device.</p>
        <button type="button" onClick={reset}>
          Retry
        </button>
      </section>
    </main>
  );
}
