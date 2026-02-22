import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'

const repoRoot = process.cwd()
const repoTopLevel = new Set(readdirSync(repoRoot))

const SKIP_DIRECTORIES = new Set([
  '.git',
  '.output',
  '.tanstack',
  '.vercel',
  'node_modules',
])

function collectMarkdownFiles(rootDir: string): Array<string> {
  const markdownFiles: Array<string> = []
  const directoryQueue: Array<string> = [rootDir]

  while (directoryQueue.length > 0) {
    const currentDir = directoryQueue.pop()
    if (!currentDir) continue

    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const absolutePath = resolve(currentDir, entry.name)
      if (entry.isDirectory()) {
        if (SKIP_DIRECTORIES.has(entry.name)) continue
        directoryQueue.push(absolutePath)
        continue
      }

      if (!entry.isFile()) continue
      if (!entry.name.endsWith('.md')) continue
      markdownFiles.push(relative(repoRoot, absolutePath))
    }
  }

  return markdownFiles
}

const markdownFiles = collectMarkdownFiles(repoRoot)

interface MissingRef {
  file: string
  reference: string
}

const missing: Array<MissingRef> = []
const seenChecks = new Set<string>()

const markdownLinkRegex = /\[[^\]]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
const inlineCodeRegex = /`([^`\n]+)`/g

function stripFragmentAndQuery(raw: string): string {
  return raw.replace(/[?#].*$/, '')
}

function isExternalReference(ref: string): boolean {
  return (
    ref.startsWith('http://') ||
    ref.startsWith('https://') ||
    ref.startsWith('mailto:') ||
    ref.startsWith('#')
  )
}

function hasFileLikeExtension(ref: string): boolean {
  return /\.(md|ts|tsx|js|jsx|json|css|toml|yml|yaml|txt|lock)$/i.test(ref)
}

function looksLikeFilePath(ref: string, fromCodeSpan: boolean): boolean {
  if (ref.length === 0 || ref.includes(' ')) return false
  if (isExternalReference(ref)) return false
  if (ref.includes('*')) return false

  if (ref.startsWith('./') || ref.startsWith('../')) return true

  if (ref.startsWith('/')) {
    const first = ref.slice(1).split('/')[0]
    if (first === 'Users') return true
    return repoTopLevel.has(first)
  }

  if (hasFileLikeExtension(ref)) return true

  if (ref.includes('/')) {
    const first = ref.split('/')[0]
    return repoTopLevel.has(first)
  }

  return fromCodeSpan && hasFileLikeExtension(ref)
}

function resolvePath(docFile: string, ref: string): string | null {
  const cleaned = stripFragmentAndQuery(ref)
  if (!cleaned) return null

  if (cleaned.startsWith('/Users/')) {
    return cleaned
  }

  if (cleaned.startsWith('/')) {
    return resolve(repoRoot, cleaned.slice(1))
  }

  if (cleaned.startsWith('./') || cleaned.startsWith('../')) {
    return resolve(dirname(resolve(repoRoot, docFile)), cleaned)
  }

  const fromDoc = resolve(dirname(resolve(repoRoot, docFile)), cleaned)
  if (existsSync(fromDoc)) return fromDoc

  return resolve(repoRoot, cleaned)
}

for (const markdownFile of markdownFiles) {
  const fullPath = resolve(repoRoot, markdownFile)
  const content = readFileSync(fullPath, 'utf8')

  const references: Array<{ value: string; fromCodeSpan: boolean }> = []

  for (const match of content.matchAll(markdownLinkRegex)) {
    references.push({ value: match[1], fromCodeSpan: false })
  }

  for (const match of content.matchAll(inlineCodeRegex)) {
    references.push({ value: match[1], fromCodeSpan: true })
  }

  for (const ref of references) {
    if (!looksLikeFilePath(ref.value, ref.fromCodeSpan)) continue

    const resolvedPath = resolvePath(markdownFile, ref.value)
    if (!resolvedPath) continue

    const dedupeKey = `${markdownFile}::${ref.value}`
    if (seenChecks.has(dedupeKey)) continue
    seenChecks.add(dedupeKey)

    if (!existsSync(resolvedPath)) {
      missing.push({ file: markdownFile, reference: ref.value })
      continue
    }

    // Ensure path points to a file or directory inside the repo for repo-relative refs.
    if (!ref.value.startsWith('/Users/')) {
      const stats = statSync(resolvedPath)
      if (!stats.isFile() && !stats.isDirectory()) {
        missing.push({ file: markdownFile, reference: ref.value })
      }
    }
  }
}

if (missing.length > 0) {
  console.error('Missing markdown path references found:')
  for (const item of missing) {
    console.error(`- ${item.file}: ${item.reference}`)
  }
  process.exit(1)
}

console.log(`Checked ${markdownFiles.length} markdown files: no missing file-path references found.`)
