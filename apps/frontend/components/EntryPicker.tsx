'use client';

import React from 'react';

export default function EntryPicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        padding: '8px 10px',
        borderRadius: 10,
        background: '#161925',
        color: 'var(--text)',
        border: '1px solid var(--border)',
      }}
    >
      <option value={1}>$1</option>
      <option value={5}>$5</option>
      <option value={100}>$100</option>
    </select>
  );
}
