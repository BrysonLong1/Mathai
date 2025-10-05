export default function About(){
  return (
    <div className='card' style={{display:'grid',gap:10}}>
      <div className='kicker'>About</div>
      <h1 className='title'>MathArena AI (MVP)</h1>
      <p>Head-to-head math matches with cash pots. First correct Python submission wins. Stripe & leaderboard ready (camera verification later).</p>
      <ul>
        <li>Buy-ins:  /  / </li>
        <li>Pot: 80% to winner, 20% platform</li>
        <li>Auto-grading: string/numeric problems (tolerance)</li>
      </ul>
    </div>
  );
}
