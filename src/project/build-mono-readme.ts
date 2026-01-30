// scripts/generate-readme.mjs
// Node >= 18 recommended
import { promises as fs } from 'node:fs'
import { Dirent } from 'node:fs'
import path from 'node:path'
import { generateDocsIndex } from './generate-docs'

const REPO_ROOT = path.resolve(process.cwd())
const MONO_DIR = path.join(REPO_ROOT, '.mono')
const ROOT_PKG_JSON = path.join(REPO_ROOT, 'package.json')
const OUTPUT_PATH = path.join(REPO_ROOT, 'docs')
const OUTPUT_README = path.join(OUTPUT_PATH, 'command-line.md')

async function ensureParentDir(filePath: string): Promise<void> {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
}

// ---------- utils ----------
async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    // Log existence check

    return true
  } catch {
    return false
  }
}
function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}
function toPosix(p: string): string {
  return p.split(path.sep).join('/')
}
async function readJson<T = any>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8')
  try {
    const parsed = JSON.parse(raw)

    return parsed
  } catch (err) {
    throw err
  }
}
async function listDir(dir: string): Promise<Dirent[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })

  return entries
}
function normalizeWorkspacePatterns(workspacesField: unknown): string[] {
  if (Array.isArray(workspacesField)) return workspacesField as string[]
  if (isObject(workspacesField) && Array.isArray((workspacesField as any).packages))
    return (workspacesField as any).packages
  return []
}
function mdEscapeInline(s: string): string {
  return String(s ?? '').replaceAll('`', '\`')
}
function indentLines(s: string, spaces = 2): string {
  const pad = ' '.repeat(spaces)
  return String(s ?? '')
    .split('\n')
    .map((l) => pad + l)
    .join('\n')
}

// ---------- workspace glob matching (supports *, **, and plain segments) ----------
function matchSegment(patternSeg: string, name: string): boolean {
  if (patternSeg === '*') return true
  if (!patternSeg.includes('*')) return patternSeg === name
  const escaped = patternSeg.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp('^' + escaped.replaceAll('*', '.*') + '$')
  return regex.test(name)
}

async function expandWorkspacePattern(root: string, pattern: string): Promise<string[]> {
  const segs = toPosix(pattern).split('/').filter(Boolean)

  async function expandFrom(dir: string, segIndex: number): Promise<string[]> {
    if (segIndex >= segs.length) return [dir]
    const seg = segs[segIndex]

    if (seg === '**') {
      const results: string[] = []
      results.push(...(await expandFrom(dir, segIndex + 1)))
      const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])

      for (const e of entries) {
        if (!e.isDirectory()) continue

        results.push(...(await expandFrom(path.join(dir, e.name), segIndex)))
      }
      return results
    }

    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])

    const results: string[] = []
    for (const e of entries) {
      if (!e.isDirectory()) continue
      if (!matchSegment(seg, e.name)) continue

      results.push(...(await expandFrom(path.join(dir, e.name), segIndex + 1)))
    }
    return results
  }

  const dirs = await expandFrom(root, 0)

  const pkgDirs: string[] = []
  for (const d of dirs) {
    const pkgPath = path.join(d, 'package.json')
    if (await exists(pkgPath)) {
      pkgDirs.push(d)
    }
  }

  return [...new Set(pkgDirs)]
}

async function findWorkspacePackageDirs(
  repoRoot: string,
  workspacePatterns: string[]
): Promise<string[]> {
  const dirs: string[] = []
  for (const pat of workspacePatterns) {
    const expanded = await expandWorkspacePattern(repoRoot, pat)
    dirs.push(...expanded)
    dirs.push(...expanded)
  }
  const uniqueDirs = [...new Set(dirs)]
  return uniqueDirs
}

// ---------- .mono parsing ----------
async function readMonoConfig(): Promise<MonoConfig | null> {
  const configPath = path.join(MONO_DIR, 'config.json')
  console.log(`[readMonoConfig] Looking for mono config at:`, configPath)
  if (!(await exists(configPath))) {
    console.log(`[readMonoConfig] No mono config found.`)
    return null
  }
  try {
    const config = await readJson<any>(configPath)
    return { path: configPath, config }
  } catch (err) {
    return null
  }
}

function commandNameFromFile(filePath: string): string {
  return path.basename(filePath).replace(/\.json$/i, '')
}

async function readMonoCommands(): Promise<MonoCommand[]> {
  if (!(await exists(MONO_DIR))) {
    return []
  }
  const entries = await listDir(MONO_DIR)

  const jsonFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.json'))
    .map((e) => path.join(MONO_DIR, e.name))
    .filter((p) => path.basename(p).toLowerCase() !== 'config.json')

  const commands: MonoCommand[] = []
  for (const file of jsonFiles) {
    try {
      const j = await readJson<any>(file)
      commands.push({
        name: commandNameFromFile(file),
        file,
        json: j,
      })
    } catch (err) {
      console.error(`[readMonoCommands] Failed to load command file:`, file, err)
      // skip invalid json
    }
  }

  commands.sort((a, b) => a.name.localeCompare(b.name))

  return commands
}

// ---------- mono docs formatting ----------
type OptionSchema = {
  key: string
  kind: 'boolean' | 'value'
  type: string
  description: string
  shortcut: string
  default: any
  allowed: string[] | null
  allowAll: boolean
}

type MonoConfig = {
  path: string
  config: any
}

function parseOptionsSchema(optionsObj: unknown): OptionSchema[] {
  // New structure supports:
  // - optionKey: { type: "string", default, options: [], allowAll, shortcut, description }
  // - boolean toggle: { shortcut, description } (no type)
  if (!isObject(optionsObj)) return []

  const entries: OptionSchema[] = Object.entries(optionsObj).map(([key, raw]) => {
    const o = isObject(raw) ? raw : {}
    const hasType = typeof o.type === 'string' && o.type.trim().length > 0
    const isBoolToggle = !hasType // in your examples, booleans omit `type`
    return {
      key,
      kind: isBoolToggle ? 'boolean' : 'value',
      type: hasType ? String(o.type) : 'boolean',
      description: typeof o.description === 'string' ? o.description : '',
      shortcut: typeof o.shortcut === 'string' ? o.shortcut : '',
      default: o.default,
      allowed: Array.isArray(o.options) ? o.options : null,
      allowAll: o.allowAll === true,
    }
  })

  entries.sort((a, b) => a.key.localeCompare(b.key))
  return entries
}

function buildUsageExample(commandName: string, cmdJson: any, options: OptionSchema[]): string {
  const arg = cmdJson?.argument
  const hasArg = isObject(arg)
  const argToken = hasArg ? `<${commandName}-arg>` : ''

  // choose a representative value option to show
  const valueOpts = options.filter((o) => o.kind === 'value')
  const boolOpts = options.filter((o) => o.kind === 'boolean')

  const exampleParts = [`yarn mono ${commandName}`]
  if (argToken) exampleParts.push(argToken)

  // include at most 2 value options and 1 boolean in the example for readability
  for (const o of valueOpts.slice(0, 2)) {
    const flag = `--${o.key}`
    const val = o.default !== undefined ? o.default : (o.allowed?.[0] ?? '<value>')
    exampleParts.push(`${flag} ${val}`)
  }
  if (boolOpts.length) {
    exampleParts.push(`--${boolOpts[0].key}`)
  }

  return exampleParts.join(' ')
}

function formatMonoConfigSection(monoConfig: MonoConfig | null): string {
  const lines: string[] = []
  lines.push('## Mono configuration')
  lines.push('')

  if (!monoConfig) {
    lines.push('_No `.mono/config.json` found._')
    return lines.join('\n')
  }

  const c = monoConfig.config
  lines.push(`Source: \`${toPosix(path.relative(REPO_ROOT, monoConfig.path))}\``)
  lines.push('')

  if (Array.isArray(c.envMap) && c.envMap.length) {
    lines.push('### envMap')
    lines.push('')
    lines.push('- ' + c.envMap.map((x: string) => `\`${mdEscapeInline(x)}\``).join(', '))
    lines.push('')
  }

  const pkgMaps = c?.workspace?.packageMaps
  if (pkgMaps && isObject(pkgMaps) && Object.keys(pkgMaps).length) {
    lines.push('### Workspace aliases (packageMaps)')
    lines.push('')
    const entries = Object.entries(pkgMaps).sort(([a], [b]) => a.localeCompare(b))
    for (const [alias, target] of entries) {
      lines.push(`- \`${mdEscapeInline(alias)}\` → \`${mdEscapeInline(String(target))}\``)
    }
    lines.push('')
  }

  const pre = c?.workspace?.preactions
  if (Array.isArray(pre) && pre.length) {
    lines.push('### Global preactions')
    lines.push('')
    lines.push('```bash')
    for (const p of pre) lines.push(String(p))
    lines.push('```')
    lines.push('')
  }

  if (typeof c.prodFlag === 'string' && c.prodFlag.trim()) {
    lines.push('### prodFlag')
    lines.push('')
    lines.push(`Production flag keyword: \`${mdEscapeInline(c.prodFlag.trim())}\``)
    lines.push('')
  }

  return lines.join('\n')
}

type MonoCommand = {
  name: string
  file: string
  json: any
}

function formatMonoCommandsSection(commands: MonoCommand[]): string {
  const lines: string[] = []
  lines.push('## Mono commands')
  lines.push('')
  lines.push(
    'Generated from `.mono/*.json` (excluding `config.json`). Each filename becomes a command:'
  )
  lines.push('')
  lines.push('```bash')
  lines.push('yarn mono <command> [argument] [--options]')
  lines.push('```')
  lines.push('')

  if (!commands.length) {
    lines.push('_No mono command JSON files found._')
    return lines.join('\n')
  }

  // Index
  lines.push('### Command index')
  lines.push('')
  for (const c of commands) {
    const desc = typeof c.json?.description === 'string' ? c.json.description.trim() : ''
    const suffix = desc ? ` — ${desc}` : ''
    lines.push(
      `- [\`${mdEscapeInline(c.name)}\`](#mono-command-${mdEscapeInline(c.name).toLowerCase()})${suffix}`
    )
  }
  lines.push('')

  for (const c of commands) {
    const j = c.json || {}
    const rel = toPosix(path.relative(REPO_ROOT, c.file))
    const anchor = `mono-command-${c.name.toLowerCase()}`

    const desc = typeof j.description === 'string' ? j.description.trim() : ''
    const arg = j.argument
    const options = parseOptionsSchema(j.options)

    lines.push('---')
    lines.push(`### Mono command: ${c.name}`)
    lines.push(`<a id="${anchor}"></a>`)
    lines.push('')
    lines.push(`Source: \`${rel}\``)
    lines.push('')

    if (desc) {
      lines.push(`**Description:** ${mdEscapeInline(desc)}`)
      lines.push('')
    }

    // Usage
    lines.push('**Usage**')
    lines.push('')
    lines.push('```bash')
    lines.push(`yarn mono ${c.name}${isObject(arg) ? ` <${c.name}-arg>` : ''} [--options]`)
    lines.push('```')
    lines.push('')
    lines.push('Example:')
    lines.push('')
    lines.push('```bash')
    lines.push(buildUsageExample(c.name, j, options))
    lines.push('```')
    lines.push('')

    // Argument
    if (isObject(arg)) {
      lines.push('**Argument**')
      lines.push('')
      const bits: string[] = []
      if (typeof arg.type === 'string') bits.push(`type: \`${mdEscapeInline(arg.type)}\``)
      if (arg.default !== undefined)
        bits.push(`default: \`${mdEscapeInline(String(arg.default))}\``)
      if (typeof arg.description === 'string') bits.push(mdEscapeInline(arg.description))
      lines.push(`- ${bits.join(' • ') || '_(no details)_'} `)
      lines.push('')
    }

    // Options
    if (options.length) {
      lines.push('**Options**')
      lines.push('')
      lines.push('| Option | Type | Shortcut | Default | Allowed | Notes |')
      lines.push('|---|---:|:---:|---:|---|---|')
      for (const o of options) {
        const optCol =
          o.kind === 'boolean'
            ? `\`--${mdEscapeInline(o.key)}\``
            : `\`--${mdEscapeInline(o.key)} <${mdEscapeInline(o.key)}>\``
        const typeCol = `\`${mdEscapeInline(o.type)}\``
        const shortCol = o.shortcut ? `\`-${mdEscapeInline(o.shortcut)}\`` : ''
        const defCol = o.default !== undefined ? `\`${mdEscapeInline(o.default)}\`` : ''
        const allowedCol = o.allowed
          ? o.allowed.map((x) => `\`${mdEscapeInline(x)}\``).join(', ')
          : ''
        const notes = [
          o.allowAll ? 'allowAll' : '',
          o.description ? mdEscapeInline(o.description) : '',
        ]
          .filter(Boolean)
          .join(' • ')
        lines.push(
          `| ${optCol} | ${typeCol} | ${shortCol} | ${defCol} | ${allowedCol} | ${notes} |`
        )
      }
      lines.push('')
    }

    // Environments
    if (j.environments && isObject(j.environments) && Object.keys(j.environments).length) {
      lines.push('**Environment Variables**')
      lines.push('')
      const envs = Object.entries(j.environments).sort(([a], [b]) => a.localeCompare(b))
      for (const [envName, envObj] of envs) {
        lines.push(`- \`${mdEscapeInline(envName)}\``)
        if (isObject(envObj) && Object.keys(envObj).length) {
          const kv = Object.entries(envObj).sort(([a], [b]) => a.localeCompare(b))
          lines.push(
            indentLines(
              kv
                .map(([k, v]) => `- \`${mdEscapeInline(k)}\` = \`${mdEscapeInline(String(v))}\``)
                .join('\n'),
              2
            )
          )
        }
      }
      lines.push('')
    }

    // preactions/actions
    if (Array.isArray(j.preactions) && j.preactions.length) {
      lines.push('**Preactions**')
      lines.push('')
      lines.push('```bash')
      for (const p of j.preactions) lines.push(String(p))
      lines.push('```')
      lines.push('')
    }

    if (Array.isArray(j.actions) && j.actions.length) {
      lines.push('**Actions**')
      lines.push('')
      lines.push('```bash')
      for (const a of j.actions) lines.push(String(a))
      lines.push('```')
      lines.push('')
    }
  }

  return lines.join('\n')
}

// ---------- workspace scripts summary ----------

// Define PackageInfo type
type PackageInfo = {
  name: string
  dir: string
  scripts: Record<string, string>
}

function collectScripts(packages: PackageInfo[]): Map<string, string[]> {
  const scriptToPackages = new Map<string, string[]>()
  for (const p of packages) {
    for (const scriptName of Object.keys(p.scripts || {})) {
      if (!scriptToPackages.has(scriptName)) scriptToPackages.set(scriptName, [])
      scriptToPackages.get(scriptName)!.push(p.name)
    }
  }
  return scriptToPackages
}

// ---------- main ----------
async function main(): Promise<void> {
  if (!(await exists(ROOT_PKG_JSON))) throw new Error(`Missing: ${ROOT_PKG_JSON}`)
  await ensureParentDir(OUTPUT_PATH)

  const rootPkg = await readJson<any>(ROOT_PKG_JSON)
  const workspacePatterns = normalizeWorkspacePatterns(rootPkg.workspaces)

  const monoConfig = await readMonoConfig()
  const monoCommands = await readMonoCommands()

  const pkgDirs = await findWorkspacePackageDirs(REPO_ROOT, workspacePatterns)
  const packages: PackageInfo[] = []
  for (const dir of pkgDirs) {
    try {
      const pkgPath = path.join(dir, 'package.json')
      const pj = await readJson<any>(pkgPath)
      packages.push({
        name: pj.name || toPosix(path.relative(REPO_ROOT, dir)) || path.basename(dir),
        dir,
        scripts: pj.scripts || {},
      })
    } catch (err) {
      console.error(`[main] Failed to load package.json for:`, dir, err)
      // skip
    }
  }

  const parts: string[] = []
  parts.push(`# ⚙️ Command Line Reference

> Generated by \`scripts/generate-readme.mjs\`.
> Update \`.mono/config.json\`, \`.mono/*.json\`, and workspace package scripts to change this output.

`)
  parts.push(formatMonoConfigSection(monoConfig))
  parts.push('')
  parts.push(formatMonoCommandsSection(monoCommands))
  parts.push('')

  const val = await generateDocsIndex({
    docsDir: path.join(REPO_ROOT, 'docs'),
    excludeFile: 'command-line.md',
  })

  val.split('\n').forEach((line) => parts.push(line))

  await ensureParentDir(OUTPUT_README)
  await fs.writeFile(OUTPUT_README, parts.join('\n'), 'utf8')

  console.log(`[main] Generated: ${OUTPUT_README}`)
  console.log(`[main] mono config: ${monoConfig ? 'yes' : 'no'}`)
  console.log(`[main] mono commands: ${monoCommands.length}`)
  console.log(`[main] workspace packages: ${packages.length}`)
}

main().catch((err) => {
  console.error(err?.stack || String(err))
  process.exitCode = 1
})
