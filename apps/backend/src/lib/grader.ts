// apps/backend/src/lib/grader.ts
import type { Problem } from '@prisma/client';

export type GradeInput = {
  problem: Problem;
  responseText: string; // what the user typed (from the editor)
};

export type GradeResult = {
  correct: boolean;
  expected: string;
  received: string;
  parsedNumeric?: number;
  type: Problem['type'];
  reason?: string;
};

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function grade({ problem, responseText }: GradeInput): GradeResult {
  const received = responseText ?? '';
  const type = problem.type;

  // STRING grading
  if (type === 'STRING') {
    const got = normalize(received);
    const ans = normalize(problem.answer);
    const aliases = (problem.aliases ?? []) as string[];

    const ok =
      got === ans ||
      aliases.some(a => normalize(a) === got);

    return {
      correct: ok,
      expected: problem.answer,
      received,
      type,
      reason: ok ? undefined : 'Answer did not match expected text or aliases.',
    };
  }

  // NUMERIC grading
  if (type === 'NUMERIC') {
    // Pick the FIRST number in the user text (common for “enter a number on first line”)
    const m = received.match(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/);
    if (!m) {
      return {
        correct: false,
        expected: problem.answer,
        received,
        type,
        reason: 'No numeric value found in the submission.',
      };
    }

    const parsed = Number(m[0]);
    const expected = Number(problem.answer);
    const tol = typeof problem.tolerance === 'number' ? problem.tolerance : 0;

    const ok = Number.isFinite(parsed) &&
               Number.isFinite(expected) &&
               Math.abs(parsed - expected) <= tol;

    return {
      correct: ok,
      expected: problem.answer,
      received,
      parsedNumeric: parsed,
      type,
      reason: ok ? undefined : `Expected ${expected} ± ${tol}, got ${parsed}.`,
    };
  }

  // Default fallback: strict text match
  const ok = normalize(received) === normalize(problem.answer);
  return {
    correct: ok,
    expected: problem.answer,
    received,
    type,
    reason: ok ? undefined : 'Answer did not match.',
  };
}
