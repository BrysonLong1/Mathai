// apps/frontend/lib/api.ts
const BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || 'http://127.0.0.1:8080';

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Request failed ${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

export type Problem = {
  id: string;
  prompt: string;
  type: 'NUMERIC'|'STRING'|'CODE';
  codeTemplate: string | null;
};

export async function getProblem(): Promise<Problem | null> {
  // ask specifically for problems that have code templates
  const items = await getJSON<Problem[]>(`${BASE}/problems?kind=code`);
  return items?.[0] ?? null;
}

export default { getProblem };


