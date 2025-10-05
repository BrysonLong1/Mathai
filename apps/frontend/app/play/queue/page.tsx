"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSearchParams } from "next/navigation";

export default function QueuePage() {
  const params = useSearchParams();
  const entry = Number(params.get('entry') || 100);
  const [status, setStatus] = useState<string>('joining...');

  useEffect(() => {
    let mounted = true;
    async function joinAndPoll() {
      await api('/queue', { method:'POST', body: JSON.stringify({ entryFee: entry }) });
      setStatus('Waiting for players...');
      const iv = setInterval(async () => {
        const res = await api(`/queue/next?entryFee=${entry}`);
        if (!mounted) return;
        if (res.redirect) {
          clearInterval(iv);
          window.location.href = res.redirect;
        }
      }, 1500);
    }
    joinAndPoll();
    return () => { mounted = false; };
  }, [entry]);

  return (
    <div className="card">
      <h2>Queue</h2>
      <p>{status}</p>
      <p>Entry: {entry===100?'$1':entry===500?'$5':'$100'}</p>
    </div>
  );
}
