import fs from 'node:fs'
import path from 'node:path'

export function getRootDirectory(): string {
  return path.join(process.cwd())
}

export function getRootJson(): any {
  const jsonPath = path.join(process.cwd(), 'package.json') // cwd + file
  const raw = fs.readFileSync(jsonPath, 'utf-8')
  const data = JSON.parse(raw)
  return data
}

export function getMonoFiles(): string[] {
  const dir = path.join(process.cwd(), '.mono')
  if (!fs.existsSync(dir)) {
    return []
  }
  const files = fs.readdirSync(dir) // names only
  return files.map((f) => path.join(dir, f))
}

const disallowedFiles = ['tools']

export function getMonoConfig(): { files: Record<string, any>; config: any } {
  const objMono = getMonoFiles()
  const monoFileConfig: Record<string, any> = {}
  let configObject: any = {}

  for (const file of objMono) {
    const fileName = path.basename(file).replace('.json', '')
    if (disallowedFiles.includes(fileName)) {
      throw new Error(`Disallowed file name in .mono directory: ${fileName}`)
    }

    const raw = fs.readFileSync(file, 'utf-8')
    const data = JSON.parse(raw)

    if (fileName === 'config') {
      if (data) configObject = data
    } else {
      monoFileConfig[fileName] = data
    }
  }

  return {
    files: monoFileConfig,
    config: configObject,
  }
}
