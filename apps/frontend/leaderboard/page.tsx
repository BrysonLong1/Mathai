import { useEffect, useState } from 'react';
import api from '@/lib/api'; // ✅ make sure tsconfig.json has paths set up

type Row = {
  matchId: string;
  entryFee: number;       // 1 | 5 | 100
  timeMs: number | null;
  endedAt: string | null; // ISO string from backend
};

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    api<Row[]>('/leaderboard')
      .then(setRows)
      .catch(console.error);
  }, []);

  const fmtTier = (fee: number) =>
    fee === 100 ? '$100' : fee === 5 ? '$5' : '$1';

  return (
    <div className="card">
      <h2>Recent Winners</h2>
      <table style={{ width: '100%', marginTop: 8 }}>
        <thead>
          <tr>
            <th align="left">Match</th>
            <th align="left">Prize Tier</th>
            <th align="right">Time (ms)</th>
            <th align="left">Ended</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.matchId}>
              <td>{r.matchId.slice(0, 8)}…</td>
              <td>{fmtTier(r.entryFee)}</td>
              <td align="right">{r.timeMs ?? '-'}</td>
              <td>{r.endedAt ? new Date(r.endedAt).toLocaleString() : '-'}</td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={4} style={{ opacity: 0.7, paddingTop: 6 }}>
                No winners yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
