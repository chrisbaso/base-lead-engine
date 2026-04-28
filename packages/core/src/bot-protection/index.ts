import { retryFetch } from "../retry";

type VerifyTurnstileOptions = {
  token?: string;
  remoteIp?: string;
};

type TurnstileResponse = {
  success?: boolean;
  "error-codes"?: string[];
};

export async function verifyTurnstile(options: VerifyTurnstileOptions): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return true;
  }

  if (!options.token) {
    return false;
  }

  const body = new URLSearchParams({
    secret,
    response: options.token
  });

  if (options.remoteIp) {
    body.set("remoteip", options.remoteIp);
  }

  const response = await retryFetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Turnstile verification failed: ${String(response.status)}`);
  }

  const result = (await response.json()) as TurnstileResponse;
  return result.success === true;
}
