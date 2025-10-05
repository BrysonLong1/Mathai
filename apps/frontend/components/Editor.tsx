'use client';

import React from 'react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
};

export default function Editor({
  value,
  onChange,
  placeholder = '# write your Python solution here',
  rows = 12,
  readOnly = false,
}: Props) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      readOnly={readOnly}
      spellCheck={false}
      style={{
        width: '100%',
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 13.5,
        lineHeight: 1.45,
        padding: '12px 14px',
        borderRadius: 12,
        background: '#0f1220',
        color: 'var(--text, #e6e8ee)',
        border: '1px solid var(--border, #23263a)',
        outline: 'none',
        resize: 'vertical',
      }}
    />
  );
}
