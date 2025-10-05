"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export default function Play() {
  const [entry, setEntry] = useState(100); // cents: 100, 500, 10000

  async function go() {
    // For MVP you can skip Stripe and jump to queue; uncomment to use checkout
    // const { url } = await api('/checkout', { method:'POST', body: JSON.stringify({ entryFee: entry }) });
    // window.location.href = url;

    // Direct to queue (demo / test)
    window.location.href = `/play/queue?entry=${entry}`;
  }

  return (
    <div className="card">
      <h2>Choose Entry Level</h2>
      <div className="row">
        <button className={`btn ${entry===100?'primary':''}`} onClick={()=>setEntry(100)}>$1</button>
        <button className={`btn ${entry===500?'primary':''}`} onClick={()=>setEntry(500)}>$5</button>
        <button className={`btn ${entry===10000?'primary':''}`} onClick={()=>setEntry(10000)}>$100</button>
      </div>
      <br />
      <button className="btn primary" onClick={go}>Continue</button>
    </div>
  );
}
