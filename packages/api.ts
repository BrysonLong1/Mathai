// packages/SHARED/api.ts

export type Api = <T = unknown>(path: string, init?: RequestInit) => Promise<T>;

export function makeApi(base: string): Api {
  return async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      cache: 'no-store',
      headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
      ...init,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
    }

    const ct = res.headers.get('content-type') ?? '';
    return (ct.includes('application/json') ? res.json() : (res.text() as any)) as Promise<T>;
  };
}

export function makeEndpoints(api: Api) {
  return {
    problems: () => api('/problems'),
    problemsSample: () => api('/problems/sample'),
    leaderboard: () => api('/leaderboard'),
    createMatch: (entryFee: number) =>
      api<{ id: string }>('/matches', {
        method: 'POST',
        body: JSON.stringify({ entryFee }),
      }),
    getMatch: (id: string) => api(`/matches/${id}`),
    submit: (data: { matchId: string; code?: string; answerText?: string }) =>
      api('/submissions', { method: 'POST', body: JSON.stringify(data) }),
  };
}

