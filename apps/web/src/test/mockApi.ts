import { vi } from 'vitest';

interface MockResponse {
  status?: number;
  body: unknown;
}

type Handler = (url: string, init: RequestInit) => MockResponse | Promise<MockResponse>;

/** Replaces fetch with a handler that answers in the API's { data, error } envelope. */
export function mockApi(handler: Handler) {
  const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
    const { status = 200, body } = await handler(url, init);
    return new Response(JSON.stringify(body), { status });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export const ok = (data: unknown): MockResponse => ({ body: { data, error: null } });

export const fail = (status: number, message: string): MockResponse => ({
  status,
  body: { data: null, error: { message } },
});

export function jsonBody(init: RequestInit | undefined): unknown {
  return JSON.parse(String(init?.body));
}
