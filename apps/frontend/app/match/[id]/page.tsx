
import Timer from '../../../components/Timer';
import Editor from '../../../components/Editor';
import { getMatch } from '../../../lib/api';
import React from 'react';

export default async function MatchPage({ params }: { params: { id: string } }) {
  const match = await getMatch(params.id);

  return (
    <div style={{display:'grid', gap:16}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1 style={{margin:0}}>Match #{short(match.id)}</h1>
        <Timer seconds={40 * 60} />
      </header>

      <section style={{border:'1px solid #222', borderRadius:12, padding:12}}>
        <div style={{opacity:.7, fontSize:12}}>Type: {match.problem.type}</div>
        <div style={{marginTop:6, fontSize:16}}>{match.problem.prompt}</div>
      </section>

      <ClientSubmit matchId={match.id} />
      <PollMatch id={match.id} />
    </div>
  );
}

function short(id: string) { return id.slice(0, 8); }

function SubmitStatus({ label }: { label: string }) {
  return <div style={{opacity:.8, fontSize:13}}>{label}</div>;
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span style={{border:'1px solid #333', borderRadius:999, padding:'4px 10px', fontSize:12}}>{children}</span>;
}

// ---------- Client bits
'use client';

import { useEffect, useState } from 'react';
import { submitCode } from '../../../lib/api';

function ClientSubmit({ matchId }: { matchId: string }) {
  const [code, setCode] = useState<string>('');
  const [state, setState] = useState<'idle'|'submitting'|'done'|'error'>('idle');

  const onSubmit = async () => {
  setState('submitting');
  try {
    await submitCode(matchId, code); // ✅ positional args
    setState('done');
  } catch (err) {
    console.error('submit failed', err);
    setState('error');
  }
};


  return (
    <div style={{display:'grid', gap:10}}>
      <Editor value={code} onChange={setCode} />
      <div style={{display:'flex', gap:8, alignItems:'center'}}>
        <button onClick={onSubmit} disabled={state==='submitting'} style={{padding:'8px 12px', borderRadius:10, border:'1px solid #333'}}>
          {state==='submitting' ? 'Submitting…' : 'Submit'}
        </button>
        {state==='done' && <Pill>Submitted</Pill>}
        {state==='error' && <Pill>Submission failed</Pill>}
      </div>
    </div>
  );
}

function PollMatch({ id }: { id: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${id}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (alive) setData(json);
      } catch {}
    };
    tick();
    const h = setInterval(tick, 2000);
    return () => { alive = false; clearInterval(h); };
  }, [id]);

  if (!data) return null;

  const winner = data.winnerSubmissionId
    ? data.submissions.find((s: any) => s.id === data.winnerSubmissionId)
    : null;

  return (
    <div style={{border:'1px solid #222', borderRadius:12, padding:12}}>
      <div style={{marginBottom:8}}>Submissions: {data.submissions?.length ?? 0}</div>
      {winner ? (
        <SubmitStatus label={`Winner picked! Submission ${winner.id.slice(0,8)}`} />
      ) : (
        <SubmitStatus label="Waiting for winner..." />
      )}
    </div>
  );
}
