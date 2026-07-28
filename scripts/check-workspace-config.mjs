#!/usr/bin/env node
/**
 * Regression guard for `pnpm-workspace.yaml`.
 *
 * What this guards against
 * ------------------------
 * pnpm >= 10.26 records build-script approvals in `pnpm-workspace.yaml` under
 * `allowBuilds`. For any build-script dependency it has no entry for, pnpm 11
 * writes a literal placeholder value -- `set this to true or false` -- and it
 * does so even under `--lockfile-only` / `--ignore-scripts` / `--ignore-pnpmfile`
 * (pnpm/pnpm#11574). That placeholder file was once swept into a checkpoint
 * commit because nothing flagged it, which is the bug this check exists to stop
 * from recurring.
 *
 * Deleting the file is NOT a valid fix: pnpm 11 recreates it with placeholders.
 * Committed, explicitly-resolved booleans are the durable form.
 *
 * Known ways the file can go bad again:
 *   - a pnpm upgrade / new build-script dependency reintroduces placeholders
 *   - `pnpm install --ignore-workspace` or `--prefix` rewrites resolved booleans
 *     back to placeholders, even with `--frozen-lockfile`
 *     (pnpm/pnpm#12469, pnpm/pnpm#11535)
 *   - someone "fixes" a dirty tree by deleting the file
 *
 * Checks
 * ------
 *   1. The file exists.
 *   2. The literal substring `set this to` appears nowhere in it.
 *   3. An `allowBuilds` block exists and every value in it is a real YAML
 *      boolean -- asserted by TYPE, not by matching pnpm's placeholder wording,
 *      so a future rewording is still caught. Quoted `"false"` also fails.
 *
 * Usage: node scripts/check-workspace-config.mjs
 * Exits 0 when clean, 1 with a diagnostic listing every problem found.
 *
 * Deliberately dependency-free: `js-yaml` is only a transitive dep here and does
 * not resolve from the repo root, so this parses the (trivial) file shape itself
 * and runs on a bare checkout with no `pnpm install`.
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const configPath = join(root, "pnpm-workspace.yaml");
const relPath = "pnpm-workspace.yaml";

const PLACEHOLDER_MARKER = "set this to";

/** Strip a trailing `# comment`, but only when the `#` follows whitespace. */
function stripComment(line) {
  return line.replace(/(^|\s)#.*$/, "$1");
}

/**
 * Pull the entries out of the top-level `allowBuilds:` block.
 * Returns { found: boolean, entries: [{ key, raw, lineNo }] }.
 */
function parseAllowBuilds(text) {
  const lines = text.split(/\r?\n/);
  const startIdx = lines.findIndex(
    (line) => /^allowBuilds\s*:/.test(line) && stripComment(line).trim() !== "",
  );
  if (startIdx === -1) return { found: false, entries: [] };

  const entries = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    const bare = stripComment(line);
    if (bare.trim() === "") continue;
    // A non-indented line ends the block (next top-level key).
    if (!/^\s/.test(bare)) break;

    const match = bare.match(/^\s+(.+?)\s*:\s*(.*?)\s*$/);
    if (!match) {
      entries.push({ key: bare.trim(), raw: bare.trim(), lineNo: i + 1 });
      continue;
    }
    const [, rawKey, rawValue] = match;
    entries.push({
      key: rawKey.replace(/^["']|["']$/g, ""),
      raw: rawValue,
      lineNo: i + 1,
    });
  }
  return { found: true, entries };
}

/** Describe what a raw YAML scalar would deserialize to. */
function describeValue(raw) {
  if (raw === "") return "empty (null)";
  if (/^["']/.test(raw)) return `quoted string ${raw}`;
  return `string "${raw}"`;
}

const problems = [];

if (!existsSync(configPath)) {
  problems.push(
    `${relPath} is missing.\n` +
      `    Deleting it is not a valid fix: pnpm 11 recreates it with\n` +
      `    "set this to true or false" placeholders (pnpm/pnpm#11574).\n` +
      `    Restore the file with explicit true/false values for every\n` +
      `    build-script dependency.`,
  );
} else {
  const text = readFileSync(configPath, "utf8");

  if (text.toLowerCase().includes(PLACEHOLDER_MARKER)) {
    const hits = text
      .split(/\r?\n/)
      .map((line, i) => ({ line, lineNo: i + 1 }))
      .filter(({ line }) => line.toLowerCase().includes(PLACEHOLDER_MARKER));
    problems.push(
      `${relPath} contains pnpm's unresolved placeholder text ` +
        `"${PLACEHOLDER_MARKER} ...":\n` +
        hits.map(({ line, lineNo }) => `      line ${lineNo}: ${line.trim()}`).join("\n"),
    );
  }

  const { found, entries } = parseAllowBuilds(text);

  if (!found) {
    problems.push(
      `${relPath} has no top-level \`allowBuilds:\` block.\n` +
        `    Every build-script dependency must be explicitly approved or denied,\n` +
        `    otherwise pnpm 11 will write placeholders back into this file.`,
    );
  } else if (entries.length === 0) {
    problems.push(
      `${relPath} has an empty \`allowBuilds:\` block.\n` +
        `    Expected one explicit true/false entry per build-script dependency.`,
    );
  } else {
    for (const { key, raw, lineNo } of entries) {
      if (raw === "true" || raw === "false") continue;
      problems.push(
        `${relPath}:${lineNo} — allowBuilds."${key}" is not a boolean.\n` +
          `      found:    ${describeValue(raw)}\n` +
          `      expected: true or false (unquoted)`,
      );
    }
  }
}

if (problems.length > 0) {
  console.error(`✗ ${relPath} check failed (${problems.length} problem(s)):\n`);
  for (const problem of problems) console.error(`  - ${problem}\n`);
  console.error(
    "  Fix: set each allowBuilds entry to an explicit true or false and commit the file.",
  );
  process.exit(1);
}

console.log(`✓ ${relPath}: allowBuilds fully resolved, no placeholders`);
