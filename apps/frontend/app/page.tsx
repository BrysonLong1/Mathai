import Link from 'next/link';
import CreateMatchClient from '../components/CreateMatchClient';


const API = process.env.NEXT_PUBLIC_API_URL!;

async function getProblem() {
  try {
    // If your backend returns ALL problems at /problems,
    // you can hit /problems/sample instead, or take the first.
    const r = await fetch(`${API}/problems/sample`, { cache: 'no-store' });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export default async function Home() {
  const problem = await getProblem();

  return (
    <div className="card hero">
      {/* left side */}
      <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
        <div className="kicker">compete • solve • win</div>
        <h1 className="title">Hi, welcome to MathArena</h1>
        <p className="sub">
          Head-to-head math matches. Write Python to solve the problem, fastest correct code wins.
          This is our demo MVP — payments later, competition now.
        </p>

        <div className="row" style={{ marginTop: 6 }}>
          <span className="chip">4-player matches</span>
          <span className="chip">Timed</span>
          <span className="chip">Autograde</span>
          <span className="chip">Leaderboard</span>
        </div>

        {/* Client button lives in its own client component */}
        <CreateMatchClient />

        <div className="row" style={{ marginTop: 6 }}>
          <Link className="btn" href="/practice">Practice</Link>
          <a className="btn" href="https://stripe.com" target="_blank">Stripe (coming soon)</a>
        </div>
      </div>

      {/* right side */}
      <div style={{ display: 'grid', gap: 10 }}>
        <div className="preview">
          <div className="meta">Sample problem</div>
          {problem ? (
            <>
              <div className="meta">Type: {problem.type}</div>
              <div className="prompt">{problem.prompt}</div>
            </>
          ) : (
            <div className="prompt" style={{ opacity: .7 }}>No problems seeded yet.</div>
          )}
        </div>

        <div className="preview" style={{ display: 'grid', gap: 6 }}>
          <div className="meta">How it works</div>
          <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
            <span className="chip">1. Join</span>
            <span className="chip">2. Code</span>
            <span className="chip">3. Submit</span>
            <span className="chip">4. Win</span>
          </div>
        </div>
      </div>
    </div>
  );
}
