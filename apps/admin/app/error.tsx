"use client";

import { useEffect } from "react";

export default function AdminErrorBoundary({
  error,
  reset
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("ble:admin-error", {
        detail: { message: error.message, digest: error.digest }
      })
    );
  }, [error]);

  return (
    <main className="auth-denied">
      <h1>Dashboard error</h1>
      <p>The admin view could not load.</p>
      <button type="button" onClick={reset}>
        Retry
      </button>
    </main>
  );
}
