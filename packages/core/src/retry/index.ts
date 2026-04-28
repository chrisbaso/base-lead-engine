type RetryFetchOptions = RequestInit & {
  retries?: number;
  baseDelayMs?: number;
};

function isRetryableStatus(status: number) {
  return status === 429 || status >= 500;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function retryFetch(input: string | URL, options: RetryFetchOptions = {}): Promise<Response> {
  const retries = options.retries ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 250;
  const init = { ...options };
  delete init.retries;
  delete init.baseDelayMs;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(input, init);

    if (!isRetryableStatus(response.status) || attempt === retries) {
      return response;
    }

    await delay(baseDelayMs * 2 ** attempt);
  }

  return fetch(input, init);
}
