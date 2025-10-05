// apps/backend/src/lib/judge.ts
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

/* --------------------------------
   Shared types
--------------------------------- */
export type Problem = {
  id: string;
  type: 'numeric' | 'string';
  answer: string;          // canonical
  tolerance: number | null;
  aliases: string[];       // acceptable alternatives (strings only)
};

export type JudgeResult = {
  correct: boolean;
  output: string;
  durationMs: number;
  error?: string;
};

/* --------------------------------
   Simple text/number judge (no Python)
--------------------------------- */
export type ProblemSpec = {
  type: 'numeric' | 'string';
  answer: string;
  tolerance?: number;
  aliases?: string[];
};

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseNum(s: string): number | null {
  const t = s.trim();
  const m = t.match(/^\s*([+-]?\d+)\s*\/\s*([+-]?\d+)\s*$/);
  if (m) {
    const a = Number(m[1]), b = Number(m[2]);
    if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function judgeAnswer(userRaw: string, spec: ProblemSpec): boolean {
  if (!userRaw) return false;

  if (spec.type === 'numeric') {
    const gold = parseNum(spec.answer);
    const got = parseNum(userRaw);
    if (gold === null || got === null) return false;
    const eps = spec.tolerance ?? 1e-6;
    return Math.abs(got - gold) <= eps;
  }

  const gold = norm(spec.answer);
  const mine = norm(userRaw);
  if (mine === gold) return true;
  if (spec.aliases?.map(norm).includes(mine)) return true;
  return false;
}

/* --------------------------------
   Python grader (optional)
--------------------------------- */

// Try common Python launchers cross-platform
const PY_CANDIDATES = ['py', 'python3', 'python'];

async function findPython(): Promise<string | null> {
  const tryOne = (bin: string) =>
    new Promise<boolean>((resolve) => {
      const p = execFile(bin, ['--version'], { timeout: 2000 }, (err) => {
        resolve(!err);
      });
      p.on('error', () => resolve(false));
    });

  for (const bin of PY_CANDIDATES) {
    if (await tryOne(bin)) return bin;
  }
  return null;
}

function normalizeString(s: string) {
  return s.trim().toLowerCase();
}

function parseNumeric(stdout: string): number | null {
  // take the LAST number found in stdout
  const matches = stdout.match(/-?\d+(\.\d+)?([eE][+-]?\d+)?/g);
  if (!matches || matches.length === 0) return null;
  const v = Number(matches[matches.length - 1]);
  return Number.isFinite(v) ? v : null;
}

export async function judgePython(problem: Problem, code: string, timeLimitMs = 3000): Promise<JudgeResult> {
  const py = await findPython();
  const start = performance.now();

  // If Python missing, fallback: treat code text as "output" and grade it.
  if (!py) {
    const stdout = code;
    const res = grade(problem, stdout, performance.now() - start);
    return { ...res, error: 'Python interpreter not found. Used fallback grading.' };
  }

  // run code in a temp folder
  const tmp = await mkdtemp(join(tmpdir(), 'matharena-'));
  const file = join(tmp, 'main.py');
  await writeFile(file, code, 'utf8');

  const stdout = await new Promise<string>((resolve) => {
    const child = execFile(
      py,
      ['-X', 'utf8', file],
      { timeout: timeLimitMs, windowsHide: true, env: { PYTHONIOENCODING: 'utf-8' } },
      (_err, _out, _errOut) => {
        resolve((_out ?? '').toString());
      }
    );
    child.on('error', () => resolve(''));
  }).finally(async () => {
    try { await rm(tmp, { recursive: true, force: true }); } catch {}
  });

  const durationMs = performance.now() - start;
  return grade(problem, stdout, durationMs);
}

function grade(problem: Problem, stdout: string, durationMs: number): JudgeResult {
  let correct = false;

  if (problem.type === 'string') {
    const out = normalizeString(stdout);
    const ans = normalizeString(problem.answer);
    const aliases = (problem.aliases || []).map(normalizeString);
    correct = out.includes(ans) || aliases.some(a => out.includes(a));
  } else if (problem.type === 'numeric') {
    const val = parseNumeric(stdout);
    if (val !== null) {
      const target = Number(problem.answer);
      const tol = problem.tolerance ?? 0;
      correct = Math.abs(val - target) <= tol;
    }
  }

  return { correct, output: stdout.slice(0, 2000), durationMs };
}
