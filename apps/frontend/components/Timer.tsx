'use client';

import React, { useEffect, useMemo, useState } from 'react';

export default function Timer({
  seconds,
  onEnd,
}: {
  seconds: number;
  onEnd?: () => void;
}) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    setLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (left <= 0) {
      onEnd?.();
      return;
    }
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [left, onEnd]);

  const text = useMemo(() => {
    const m = Math.floor(left / 60)
      .toString()
      .padStart(2, '0');
    const s = (left % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, [left]);

  return (
    <span
      className="chip"
      style={{
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 600,
      }}
      aria-label={`Time left ${text}`}
    >
      ⏱ {text}
    </span>
  );
}

