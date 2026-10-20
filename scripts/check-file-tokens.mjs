#!/usr/bin/env node
/**
 * Pre-commit guard: block committing files over MAX_TOKENS estimated tokens.
 *
 * Tokens are estimated as bytes / 4, so the limit is MAX_TOKENS * 4 bytes
 * (5,000 tokens = 20,000 bytes). Only STAGED files are checked, and the size
 * measured is the staged blob in the index (its size via `git cat-file`), not
 * the working-tree file.
 *
 * Dependency-free: runs under Node or Bun with only child_process.
 *
 * Usage:
 *   bun run scripts/check-file-tokens.mjs            # check staged files (hook)
 *   bun run scripts/check-file-tokens.mjs --all      # report every tracked file over the limit
 *   bun run scripts/check-file-tokens.mjs --list-ignored  # print the active ignore rules
 *
 * Wired as a pre-commit hook via simple-git-hooks (see package.json).
 * Emergency bypass: git commit --no-verify
 */

import { execFileSync } from 'node:child_process'

const MAX_TOKENS = 5_000
const BYTES_PER_TOKEN = 4
const MAX_BYTES = MAX_TOKENS * BYTES_PER_TOKEN

// ---------------------------------------------------------------------------
// IGNORE LIST — edit here.
// Files that are not authored by humans or agents and therefore should not be
// held to the token limit. Patterns are matched against the repo-relative path
// (forward slashes). Supported syntax:
//   - exact file name (matches at any depth):            'bun.lock'
//   - directory prefix with trailing '/**':               'convex/_generated/**'
//   - directory name at any depth with '**/' prefix:      '**/generated/**'
//   - extension glob:                                     '*.png'
//   - infix glob on the base name:                        '*.min.*', '*.gen.*'
// ---------------------------------------------------------------------------
const IGNORE_PATTERNS = [
  // --- Lockfiles ---
  'bun.lock',
  'bun.lockb',
  'package-lock.json',
  'npm-shrinkwrap.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'Cargo.lock',
  'poetry.lock',
  'uv.lock',
  'Pipfile.lock',
  'Gemfile.lock',
  'go.sum',
  'composer.lock',
  'flake.lock',

  // --- Generated / codegen ---
  'convex/_generated/**',
  '**/_generated/**',
  '**/generated/**',
  '**/__generated__/**',
  '*.gen.*',
  'routeTree.gen.ts',
  'worker-configuration.d.ts',
  'dist/**',
  'build/**',
  '.output/**',
  '.vinxi/**',
  '.tanstack/**',
  '.nitro/**',

  // --- Repo-specific: downloaded / derived datasets (GeoNames, see scripts/prepare-cities.ts) ---
  'data/**',

  // --- Minified bundles & source maps ---
  '*.min.*',
  '*.map',

  // --- Test snapshots ---
  '**/__snapshots__/**',
  '*.snap',

  // --- Images ---
  '*.png',
  '*.jpg',
  '*.jpeg',
  '*.gif',
  '*.webp',
  '*.avif',
  '*.bmp',
  '*.ico',
  '*.icns',
  '*.svg',
  '*.psd',
  '*.tif',
  '*.tiff',
  '*.heic',

  // --- Fonts ---
  '*.woff',
  '*.woff2',
  '*.ttf',
  '*.otf',
  '*.eot',

  // --- Archives ---
  '*.zip',
  '*.gz',
  '*.tgz',
  '*.bz2',
  '*.xz',
  '*.zst',
  '*.7z',
  '*.rar',
  '*.tar',
  '*.jar',

  // --- Documents / databases / binaries ---
  '*.pdf',
  '*.doc',
  '*.docx',
  '*.xls',
  '*.xlsx',
  '*.ppt',
  '*.pptx',
  '*.db',
  '*.sqlite',
  '*.sqlite3',
  '*.wasm',
  '*.bin',
  '*.dat',
  '*.exe',
  '*.dll',
  '*.so',
  '*.dylib',
  '*.node',
  '*.pyc',

  // --- Video / audio ---
  '*.mp4',
  '*.mov',
  '*.avi',
  '*.mkv',
  '*.webm',
  '*.mp3',
  '*.wav',
  '*.ogg',
  '*.flac',
  '*.m4a',
  '*.aac',
]

// ---------------------------------------------------------------------------

// Git's well-known empty tree object, used to diff HEAD against nothing for --all.
const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'

/**
 * Run git and decode stdout as latin1, which maps each byte to one char. Paths
 * therefore survive byte-for-byte even when they are not valid UTF-8; they are
 * only decoded as UTF-8 for matching and display (see displayPath).
 */
function git(args, input) {
  return execFileSync('git', args, {
    input,
    stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
    maxBuffer: 256 * 1024 * 1024,
  }).toString('latin1')
}

function displayPath(rawPath) {
  return Buffer.from(rawPath, 'latin1').toString('utf8')
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Compile one ignore pattern into a predicate over repo-relative paths. */
function compilePattern(pattern) {
  if (pattern.startsWith('**/') && pattern.endsWith('/**')) {
    const dir = pattern.slice(3, -3)
    return (p) => p.split('/').slice(0, -1).includes(dir)
  }
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3) + '/'
    return (p) => p.startsWith(prefix)
  }
  if (pattern.includes('*')) {
    const re = new RegExp('^' + pattern.split('*').map(escapeRegExp).join('.*') + '$')
    return (p) => re.test(basename(p))
  }
  return (p) => basename(p) === pattern || p === pattern
}

function basename(p) {
  const i = p.lastIndexOf('/')
  return i === -1 ? p : p.slice(i + 1)
}

const matchers = IGNORE_PATTERNS.map(compilePattern)

function isIgnoredByPattern(path) {
  return matchers.some((m) => m(path))
}

/**
 * Blobs to check, as { rawPath, oid }. Staged mode lists added/copied/modified/
 * renamed paths in the index (`git diff --cached --diff-filter=ACMR`, with
 * --raw so we get the staged blob id directly). --all mode lists HEAD's tree.
 * Submodules (gitlinks) are skipped: they have no blob.
 */
function listBlobs(mode) {
  const blobs = []
  if (mode === 'staged') {
    // --raw -z records: ":<srcmode> <dstmode> <srcoid> <dstoid> <status>\0<path>\0"
    const fields = git([
      'diff',
      '--cached',
      '--raw',
      '-z',
      '--no-abbrev',
      '--no-renames',
      '--diff-filter=ACMR',
    ]).split('\0')
    for (let i = 0; i + 1 < fields.length; i += 2) {
      const [, dstMode, , dstOid] = fields[i].split(' ')
      if (dstMode === '160000') continue
      blobs.push({ rawPath: fields[i + 1], oid: dstOid })
    }
  } else {
    // ls-tree -z records: "<mode> <type> <oid>\t<path>\0"
    for (const record of git(['ls-tree', '-r', '-z', '--full-tree', 'HEAD']).split('\0')) {
      const tab = record.indexOf('\t')
      if (tab === -1) continue
      const [, type, oid] = record.slice(0, tab).split(' ')
      if (type !== 'blob') continue
      blobs.push({ rawPath: record.slice(tab + 1), oid })
    }
  }
  return blobs
}

/** Blob sizes in bytes, via one `git cat-file --batch-check` call (no content is read). */
function blobSizes(oids) {
  const sizes = new Map()
  if (oids.length === 0) return sizes
  for (const line of git(['cat-file', '--batch-check'], oids.join('\n') + '\n').split('\n')) {
    const [oid, type, size] = line.split(' ')
    if (type === 'blob') sizes.set(oid, Number.parseInt(size, 10))
  }
  return sizes
}

/**
 * Paths git itself treats as binary (numstat prints "-\t-" for them). This
 * honours .gitattributes (`binary`, `-diff`) and git's NUL-byte heuristic
 * without loading blobs into this process.
 */
function binaryPaths(mode) {
  const args =
    mode === 'staged'
      ? ['diff', '--cached', '--numstat', '-z', '--no-renames', '--diff-filter=ACMR']
      : ['diff', '--numstat', '-z', '--no-renames', EMPTY_TREE, 'HEAD']
  const binary = new Set()
  for (const record of git(args).split('\0')) {
    if (record.startsWith('-\t-\t')) binary.add(record.slice(4))
  }
  return binary
}

function estimateTokens(bytes) {
  return Math.ceil(bytes / BYTES_PER_TOKEN)
}

function findOffenders(mode) {
  const candidates = listBlobs(mode).filter((b) => !isIgnoredByPattern(displayPath(b.rawPath)))
  const sizes = blobSizes([...new Set(candidates.map((b) => b.oid))])
  const oversized = candidates.filter((b) => (sizes.get(b.oid) ?? 0) > MAX_BYTES)
  if (oversized.length === 0) return []
  const binary = binaryPaths(mode)
  return oversized
    .filter((b) => !binary.has(b.rawPath))
    .map((b) => {
      const bytes = sizes.get(b.oid)
      return { path: displayPath(b.rawPath), bytes, tokens: estimateTokens(bytes) }
    })
    .sort((a, b) => b.bytes - a.bytes)
}

function formatOffenders(offenders) {
  const width = Math.max(...offenders.map((o) => String(o.tokens).length))
  return offenders
    .map(
      (o) =>
        `  ${String(o.tokens).padStart(width)} tokens  (${o.bytes.toLocaleString()} bytes)  ${o.path}`,
    )
    .join('\n')
}

function printBlockedMessage(offenders) {
  const n = offenders.length
  process.stderr.write(
    `
✖ Commit blocked: ${n} staged file${n === 1 ? '' : 's'} exceed${n === 1 ? 's' : ''} the ${MAX_TOKENS.toLocaleString()}-token limit
  (tokens ≈ bytes / ${BYTES_PER_TOKEN}; limit = ${MAX_BYTES.toLocaleString()} bytes per file)

${formatOffenders(offenders)}

Large files are hard for humans and coding agents to read, review and edit safely.
Split each file above so every resulting file stays under ${MAX_TOKENS.toLocaleString()} tokens (${MAX_BYTES.toLocaleString()} bytes):

  1. Split by responsibility: move each distinct concern into its own module
     (e.g. parsing vs. validation vs. rendering; one route/feature per file).
  2. Move types, interfaces, constants and enums into their own files
     (e.g. types.ts, constants.ts) and import them where needed.
  3. Pull out shared helpers/utilities into a helpers.ts or utils/ directory.
  4. Extract React components into separate files, and long functions into
     smaller sub-functions, each in a module that owns that behaviour.
  5. Re-export from an index.ts if callers should keep a single import path.
  6. Re-run \`git add\` on the new files and commit again.

Emergency bypass (use sparingly, and say why in the commit message):
  git commit --no-verify

Is this file genuinely generated (codegen, lockfile, vendored asset)?
  Add its path or glob to IGNORE_PATTERNS in scripts/check-file-tokens.mjs
  and commit that change alongside the file.

`,
  )
}

function main() {
  const args = new Set(process.argv.slice(2))

  if (args.has('--list-ignored')) {
    process.stdout.write(IGNORE_PATTERNS.join('\n') + '\n')
    return 0
  }

  if (args.has('--all')) {
    const offenders = findOffenders('all')
    if (offenders.length === 0) {
      process.stdout.write(`All tracked files are under ${MAX_TOKENS.toLocaleString()} tokens.\n`)
      return 0
    }
    process.stdout.write(
      `${offenders.length} tracked file${offenders.length === 1 ? '' : 's'} over ${MAX_TOKENS.toLocaleString()} tokens:\n${formatOffenders(offenders)}\n`,
    )
    return 1
  }

  const offenders = findOffenders('staged')
  if (offenders.length === 0) return 0
  printBlockedMessage(offenders)
  return 1
}

process.exitCode = main()
