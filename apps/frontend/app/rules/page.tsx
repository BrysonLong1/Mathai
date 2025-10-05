export default function Rules() {
  return (
    <div className="card">
      <h2>Rules</h2>
      <ul>
        <li>First correct submission wins.</li>
        <li>Tie → earlier server timestamp wins.</li>
        <li>Time limit: 60 seconds (server enforced).</li>
      </ul>
    </div>
  );
}
