'use client';

import React from 'react';

export default function QueueSlots({
  joined,
  total = 4,
}: {
  joined: number;
  total?: number;
}) {
  const left = Math.max(0, total - joined);
  return (
    <div className="row" style={{ gap: 6 }}>
      <span className="chip">Players: {joined}/{total}</span>
      {left > 0 ? (
        <span className="chip" style={{ opacity: 0.9 }}>
          Waiting for {left}…
        </span>
      ) : (
        <span className="chip" style={{ opacity: 0.9 }}>
          Full
        </span>
      )}
    </div>
  );
}
