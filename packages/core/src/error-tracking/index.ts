import { logError } from "../logger";
import { retryFetch } from "../retry";

type SentryDsn = {
  endpoint: string;
  projectId: string;
  publicKey: string;
};

function parseSentryDsn(dsn: string): SentryDsn | null {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace("/", "");
    const publicKey = url.username;

    if (!projectId || !publicKey) {
      return null;
    }

    return {
      endpoint: `${url.protocol}//${url.host}/api/${projectId}/envelope/`,
      projectId,
      publicKey
    };
  } catch {
    return null;
  }
}

export async function captureException(error: unknown, context: Record<string, string | number | boolean | undefined>) {
  logError("Captured exception", error, context);

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }

  const sentry = parseSentryDsn(dsn);
  if (!sentry) {
    logError("Invalid Sentry DSN", new Error("SENTRY_DSN could not be parsed"), context);
    return;
  }

  const eventId = crypto.randomUUID().replaceAll("-", "");
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : "Error";
  const stacktrace = error instanceof Error ? error.stack : undefined;
  const timestamp = new Date().toISOString();

  const envelope = [
    JSON.stringify({
      event_id: eventId,
      dsn,
      sent_at: timestamp
    }),
    JSON.stringify({ type: "event" }),
    JSON.stringify({
      event_id: eventId,
      platform: "javascript",
      level: "error",
      timestamp,
      message: errorMessage,
      exception: {
        values: [
          {
            type: errorName,
            value: errorMessage,
            stacktrace
          }
        ]
      },
      tags: context
    })
  ].join("\n");

  await retryFetch(sentry.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-sentry-envelope",
      "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${sentry.publicKey}, sentry_client=base-lead-engine/0.1`
    },
    body: envelope,
    cache: "no-store"
  });
}
