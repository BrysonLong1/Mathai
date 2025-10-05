// apps/frontend/app/api/grade/route.ts
export async function POST(req: Request) {
  const payload = await req.json();
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/grade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    // do not cache
  });
  const data = await r.json();
  return new Response(JSON.stringify(data), { status: r.status, headers: { 'Content-Type': 'application/json' } });
}
