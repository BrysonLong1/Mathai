// apps/frontend/app/practice/PracticeClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import type { Problem } from '../../lib/api';

export default function PracticeClient({ problem }: { problem: Problem }) {
  const [secondsLeft, setSecondsLeft] = useState(60 * 60); // 60 minutes
  const [code, setCode] = useState<string>('# Write code here\n');

  // Load starter code once the problem arrives
  useEffect(() => {
    if (problem?.codeTemplate) setCode(problem.codeTemplate);
  }, [problem]);

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const mmss = useMemo(() => {
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }, [secondsLeft]);

  return (
    <div style={{ display: 'grid', gap: 16, padding: 24 }}>
      <h1>Practice</h1>
      <div style={{ opacity: .8 }}>Time left: {mmss}</div>

      <div style={{ border: '1px solid #222', borderRadius: 12, padding: 12 }}>
        <div style={{ opacity:.7, fontSize:12 }}>AI Coding Prompt</div>
        <div style={{ marginTop:6, fontSize:16, whiteSpace:'pre-wrap' }}>
          {problem?.prompt ?? '—'}
        </div>
      </div>

      <Editor
        height="60vh"
        defaultLanguage="python"
        value={code}
        onChange={(v) => setCode(v ?? '')}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          tabSize: 2,
        }}
      />

      <div style={{ display:'flex', gap:12 }}>
        <button
          className="btn"
          onClick={async () => {
            const res = await fetch('/api/grade', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                problemId: problem.id,
                kind: 'CODE',
                submission: code,
              }),
            });
            const data = await res.json();
            alert(data?.message ?? JSON.stringify(data));
          }}
          disabled={secondsLeft === 0}
        >
          Submit
        </button>
        <button onClick={() => setSecondsLeft(60 * 60)}>Reset timer</button>
      </div>
    </div>
  );
}



