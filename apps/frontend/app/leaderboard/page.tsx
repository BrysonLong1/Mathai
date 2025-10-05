export default function Leaderboard(){
  const rows = [{name:'Alice',score:3},{name:'Bob',score:2},{name:'Carol',score:1}];
  return (
    <div className='card'>
      <div className='kicker'>Leaderboard</div>
      <h1 className='title'>Top Players</h1>
      <table style={{width:'100%', marginTop:12}}>
        <thead><tr><th align='left'>Player</th><th align='right'>Wins</th></tr></thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i}><td>{r.name}</td><td align='right'>{r.score}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}