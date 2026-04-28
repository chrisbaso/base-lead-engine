import { retryFetch } from "../retry";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowSeconds: number;
  tenantId: string;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function inMemoryRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucketKey = `${options.tenantId}:${options.key}`;
  const current = memoryBuckets.get(bucketKey);
  const resetAt = current && current.resetAt > now ? current.resetAt : now + options.windowSeconds * 1000;
  const count = current && current.resetAt > now ? current.count + 1 : 1;

  memoryBuckets.set(bucketKey, { count, resetAt });

  return {
    allowed: count <= options.limit,
    remaining: Math.max(options.limit - count, 0),
    resetAt: new Date(resetAt)
  };
}

async function upstashRateLimit(options: RateLimitOptions): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  const bucketKey = `rate:${options.tenantId}:${options.key}`;
  const incrementResponse = await retryFetch(`${url}/incr/${encodeURIComponent(bucketKey)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  if (!incrementResponse.ok) {
    throw new Error(`Upstash rate limit increment failed: ${String(incrementResponse.status)}`);
  }

  const incrementBody = (await incrementResponse.json()) as { result?: number };
  const count = incrementBody.result ?? options.limit + 1;

  if (count === 1) {
    await retryFetch(`${url}/expire/${encodeURIComponent(bucketKey)}/${String(options.windowSeconds)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
  }

  return {
    allowed: count <= options.limit,
    remaining: Math.max(options.limit - count, 0),
    resetAt: new Date(Date.now() + options.windowSeconds * 1000)
  };
}

export async function enforceRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  return (await upstashRateLimit(options)) ?? inMemoryRateLimit(options);
}
