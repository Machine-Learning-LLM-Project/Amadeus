#!/usr/bin/env node
// Fails if a secret is about to be committed. Runs in CI and via `npm run check`.
// Scans every file git would commit (tracked + untracked, minus .gitignore'd files).
// To allow a deliberate false positive, put "check-secrets-ignore" on the same line.
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  encoding: 'utf8',
})
  .split('\0')
  .filter(Boolean);

const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.ttf', '.otf', '.woff', '.woff2', '.mp4', '.mov', '.pdf']);
const SKIP_FILES = new Set(['package-lock.json']);

const rules = [
  { name: 'OpenAI API key', re: /\bsk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}/ },
  { name: 'Supabase secret key', re: /\bsb_secret_[A-Za-z0-9_-]{10,}/ },
  {
    name: 'secret in an EXPO_PUBLIC_ variable (these are bundled into the app and readable by anyone)',
    re: /\bEXPO_PUBLIC_[A-Z0-9_]*(?:OPENAI|SECRET|SERVICE_ROLE|PRIVATE)[A-Z0-9_]*/,
  },
];

const problems = [];

for (const file of files) {
  const base = path.basename(file);
  if (/^\.env(\..+)?$/.test(base) && base !== '.env.example') {
    problems.push(`${file}: env files must never be committed (only .env.example)`);
    continue;
  }
  if (SKIP_FILES.has(base) || BINARY_EXT.has(path.extname(file).toLowerCase())) continue;

  let text;
  try {
    if (statSync(file).size > 2_000_000) continue;
    text = readFileSync(file, 'utf8');
  } catch {
    continue; // deleted or unreadable
  }

  text.split(/\r?\n/).forEach((line, i) => {
    if (line.includes('check-secrets-ignore')) return;
    for (const { name, re } of rules) {
      if (re.test(line)) problems.push(`${file}:${i + 1}: possible ${name}`);
    }
  });
}

if (problems.length) {
  console.error('check-secrets: found problems:\n  ' + problems.join('\n  '));
  console.error('\nIf a real key was ever committed or pushed, tell the team and the instructor so it can be revoked.');
  process.exit(1);
}
console.log(`check-secrets: OK (${files.length} files scanned)`);
