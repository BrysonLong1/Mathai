// apps/backend/src/services/pythonRunner.ts
import { spawn } from 'node:child_process';

// allow only light math libs
const ALLOWED_IMPORTS = new Set(['math', 'random', 'statistics', 'numpy']);

export async function runPython(
  problem: { id: string; codeTemplate: string | null; prompt: string },
  userCode: string
): Promise<{ correct: boolean; message: string; stdout?: string }> {
  if (!problem.codeTemplate) {
    throw new Error('This problem does not accept code submissions.');
  }

  const code = userCode ?? '';

  // block dangerous stuff
  const banned =
    /\b(import\s+(os|sys|subprocess|pathlib|socket|shutil|pickle|ctypes|multiprocessing|tempfile|inspect|builtins|importlib))\b|__\w+__/g;
  if (banned.test(code)) {
    throw new Error('Disallowed imports or dunder usage detected.');
  }

  // enforce whitelist
  const importRe = /^\s*import\s+([a-zA-Z0-9_]+)(\s+as\s+\w+)?/gm;
  const fromRe = /^\s*from\s+([a-zA-Z0-9_]+)\s+import\s+/gm;
  const mods = new Set<string>();
  for (const m of code.matchAll(importRe)) mods.add(m[1]);
  for (const m of code.matchAll(fromRe)) mods.add(m[1]);
  for (const m of mods) {
    if (!ALLOWED_IMPORTS.has(m)) throw new Error(`Import "${m}" is not allowed.`);
  }

  // Students must print at least one line starting with "ANSWER:"
  const harness = `
# ==== BEGIN USER CODE ====
${code}
# ==== END USER CODE ====
`;

  const py = await execPython(harness, 8_000);
  const ok = /^ANSWER:\s*/m.test(py.stdout);
  return {
    correct: ok,
    message: ok ? 'Output received' : 'No ANSWER: line found',
    stdout: py.stdout,
  };
}

function execPython(code: string, timeoutMs: number): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn('python', ['-S', '-'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Execution timed out'));
    }, timeoutMs);

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', reject);
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || `Python exited with code ${code}`));
    });

    child.stdin.write(code);
    child.stdin.end();
  });
}
