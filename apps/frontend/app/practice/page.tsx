// apps/frontend/app/practice/page.tsx
import PracticeClient from './PracticeClient';
import { getProblem } from '../../lib/api';

export default async function PracticePage() {
  const problem = await getProblem();
  if (!problem) return <div style={{ padding: 24 }}>No problems found.</div>;
  return (
    <div style={{ display:'grid', gap:16, padding:24 }}>
      <PracticeClient problem={problem} />
    </div>
  );
}

