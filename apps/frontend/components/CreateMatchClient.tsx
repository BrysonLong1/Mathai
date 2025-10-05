'use client';

import { useEffect, useRef, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

type LobbyQueued = { queueId: string; etaSeconds?: number };
type LobbyReady  = { matchId: string; clientSecret?: string };
type LobbyWait   = { waiting: true };
type LobbyTimeout = { timeout: true; practiceUrl?: string };
type PaymentRequired = { clientSecret: string };

async function postJSON<T>(
  url: string,
  body: unknown,
  init: RequestInit = {}
): Promise<{ ok: true; data: T } | { ok: false; status: number; data?: any }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json', ...(init.headers || {}) },
      body: JSON.stringify(body),
      ...init,
    });
    const data = await res.json().catch(() => undefined);
    if (res.ok) return { ok: true, data } as any;
    return { ok: false, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0 };
  }
}

// Minimal “one-click” confirm that hits your backend.
// Your backend should confirm a PaymentIntent/SetupIntent given clientSecret.
async function confirmEntry(clientSecret: string) {
  const res = await postJSON<{ ok: true }>(`${API}/payments/confirm`, { clientSecret });
  if (!res.ok) {
    throw new Error('Payment confirmation failed.');
  }
}

export default function CreateMatchClient() {
  const [fee, setFee] = useState<1 | 5 | 100>(1);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function fallbackCreateDirect() {
    // Old behavior: directly create a match (no lobby/pay), then go.
    const res = await postJSON<LobbyReady>(`${API}/matches`, { entryFee: fee });
    if (!res.ok) throw new Error('Direct create failed');
    window.location.href = `/match/${(res as any).data.id ?? res.data.matchId}`;
  }

  async function create() {
    if (!API) {
      alert('Missing NEXT_PUBLIC_API_URL'); 
      return;
    }
    if (!window.confirm('Enter a paid competition?')) return;
    if (!window.confirm(`Confirm entry fee of $${fee}?`)) return;

    setBusy(true);
    setStatus('Creating lobby…');

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    const START = Date.now();
    const MAX_MS = 5 * 60 * 1000; // 5 minutes
    const POLL_MS = 2000;

    try {
      // Try the new lobby flow
      const created = await postJSON<LobbyReady | LobbyQueued | PaymentRequired>(
        `${API}/matches/lobby`,
        { entryFee: fee },
        { signal }
      );

      // If the endpoint doesn't exist (404) or method not allowed, fallback to direct
      if (!created.ok && (created.status === 404 || created.status === 405)) {
        await fallbackCreateDirect();
        return;
      }

      if (!created.ok) {
        // If payment required at creation
        if (created.status === 402 && created.data?.clientSecret) {
          setStatus('Confirming payment…');
          await confirmEntry((created.data as PaymentRequired).clientSecret);
          // try again after confirm
          await create(); // safe small recursion on success path
          return;
        }
        throw new Error('Could not create lobby.');
      }

      // Immediate ready (matched instantly)
      if ('matchId' in created.data) {
        const ready = created.data as LobbyReady;
        if (ready.clientSecret) {
          setStatus('Confirming payment…');
          await confirmEntry(ready.clientSecret);
        }
        window.location.href = `/match/${ready.matchId}`;
        return;
      }

      // Queued
      const queued = created.data as LobbyQueued;
      setStatus(`Waiting for players… ETA ~${queued.etaSeconds ?? 30}s`);

      // Poll function
      async function pollOnce(): Promise<'continue' | 'done'> {
        const res = await fetch(`${API}/matches/lobby/${queued.queueId}`, {
          credentials: 'include',
          signal,
        });
        const data: LobbyReady | LobbyWait | LobbyTimeout | PaymentRequired = await res
          .json()
          .catch(() => ({ waiting: true } as LobbyWait));

        if ('matchId' in data) {
          if ('clientSecret' in data && data.clientSecret) {
            setStatus('Confirming payment…');
            await confirmEntry((data as LobbyReady).clientSecret!);
          }
          window.location.href = `/match/${(data as LobbyReady).matchId}`;
          return 'done';
        }

        if ('timeout' in data && data.timeout) {
          const p = (data as LobbyTimeout).practiceUrl ?? '/practice';
          alert('Could not find enough players in time. Sending you to practice.');
          window.location.href = p;
          return 'done';
        }

        if ('clientSecret' in data) {
          setStatus('Confirming payment…');
          await confirmEntry((data as PaymentRequired).clientSecret);
          return 'continue';
        }

        // still waiting
        return 'continue';
      }

      // Poll loop with 5-minute cap
      while (Date.now() - START < MAX_MS) {
        if (signal.aborted) throw new Error('Aborted');
        const r = await pollOnce();
        if (r === 'done') return;
        setStatus('Still matching…');
        await new Promise((r) => setTimeout(r, POLL_MS));
      }

      // Hard timeout – send to practice
      alert('Waited 5 minutes. Sending you to practice.');
      window.location.href = '/practice';
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? 'Could not create/join a match.');
    } finally {
      setBusy(false);
      setStatus('');
    }
  }

  return (
    <div className="row" style={{ marginTop: 14, alignItems: 'center', gap: 10 }}>
      <label style={{ opacity: 0.9 }}>Entry:</label>
      <select
        value={fee}
        onChange={(e) => setFee(Number(e.target.value) as 1 | 5 | 100)}
        disabled={busy}
        style={{
          padding: '8px 10px',
          borderRadius: 10,
          background: '#161925',
          color: 'var(--text)',
          border: '1px solid var(--border)',
        }}
      >
        <option value={1}>$1</option>
        <option value={5}>$5</option>
        <option value={100}>$100</option>
      </select>
      <button className="btn primary" onClick={create} disabled={busy}>
        {busy ? (status || 'Working…') : 'Create Match'}
      </button>
    </div>
  );
}
