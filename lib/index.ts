import { loadMergedEnv } from '../src/merge-env'

import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'

import { program } from './app'
import './commands/prune/index'
import './commands/build-process/index'
import { getMonoConfig } from './commands/loadFromRoot'
import { executeCommandsIfWorkspaceAction } from './commands/build-process/test'

loadMergedEnv()

const homeBin = path.join(os.homedir(), 'bin')
const PATH = [homeBin, process.env.PATH].filter(Boolean).join(path.delimiter)

const { config } = getMonoConfig() as any

const workspacemap = config.workspace?.packageMaps || {}
const preactions = config.workspace?.preactions || []
const envMapList: string[] = config.envMap ?? ['FAILURE']

program.on('command:*', (operands: string[]) => {
  const [cmd] = operands
  const raw = process.argv.slice(2)
  const i = raw.indexOf(cmd)
  const tokens = i >= 0 ? raw.slice(i) : operands

  const workspace = workspacemap[tokens[0]] || tokens[0]
  const rest = tokens.slice(1)

  const envKeys = Object.keys(process.env).filter((k) => k.startsWith('MONO_'))
  const envObj: Record<string, string | undefined> = {}

  envKeys.forEach((k) => {
    envMapList.forEach((item) => {
      envObj[k.replace('MONO', item)] = process.env[k]
    })
  })

  const args = ['workspace', workspace, ...rest]

  console.error(`Unknown command. Falling back2 to: yarn ${args.join(' ')}`)
  executeCommandsIfWorkspaceAction(args, preactions, envObj)

  const child = spawn('yarn', args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...envObj, PATH },
  })

  child.on('exit', (code) => {
    console.log('Child process exited with code:', code)
    process.exitCode = code ?? 1
  })
})

program.parse()
