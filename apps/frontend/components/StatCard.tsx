'use client';

import React from 'react';

export default function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div
      className="preview"
      style={{ display: 'grid', gap: 6, minWidth: 180, padding: 12 }}
    >
      <div className="meta" title={hint}>
        {label}
      </div>
      <div className="title" style={{ margin: 0, fontSize: 22 }}>
        {value}
      </div>
      {hint && <div style={{ opacity: 0.7, fontSize: 12 }}>{hint}</div>}
    </div>
  );
}
