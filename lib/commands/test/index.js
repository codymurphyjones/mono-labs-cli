import { spawn } from 'child_process'
import fs from 'fs'
import { program } from '../../app.js'
import { generateEnvValues } from '../../app.js'
import { STAGING_URL } from '../../config.js'
import {
  getHasteConfig,
  getHasteFiles,
  getRootDirectory,
  getRootHasteJson,
  getRootJson,
} from '../loadFromRoot.js'

console.log('getRootDirectory', getRootDirectory())
console.log('rootJson', getRootJson())
const objHaste = getRootHasteJson()
const files = getHasteConfig()

console.log('Haste files', files)

const fileKeys = Object.keys(files)

fileKeys.forEach((key) => {
  const commandName = key

  console.log('Haste file key', commandName, files[key])
  program
    .command(commandName)
    .description('Execute eas build command')
    .option('--android', 'Build to target preview profile')
    .option('--ios', 'Build to target production profile')
    .option('--stage', 'Set environment to staging')
    .action(async (options) => {
      const configObject = files[commandName] || {}
      await runHasteCommand(configObject, options)

      //   const devConfig = configObject.environments ? configObject.environments.dev : {}
      //   const productionConfig = configObject.environments ? configObject.environments.production : {}
      //   let envObj = {}
      //   if (options.stage) {
      //     envObj = { ...devConfig }
      //   } else {
      //     envObj = { ...productionConfig }
      //   }

      //   // You can decide what happens when each flag is passed.
      //   // Example: run `eas build` with different profiles.
      //   if (options.android) {
      //     console.log('→ Building Android (preview profile)…')
      //     //run('eas', ['build', '--platform', 'android', '--profile', 'preview'])
      //   } else if (options.ios) {
      //     console.log('→ Building iOS (production profile)…')
      //     //run('eas', ['build', '--platform', 'ios', '--profile', 'production'])
      //   } else {
      //     // console.log('No target specified. Use --android or --ios.')
      //     // program.help()
      //     console.log('objHaste.actions', configObject)
      //     const preactions = configObject['preactions'] || []
      //     const actions = configObject.actions || []
      //     console.log('preactions', preactions)
      //     for (const item of preactions) {
      //       console.log(`→ Running pre-action: ${item}`)
      //       await run(item, [], envObj)
      //     }
      //     for (const item of actions) {
      //       console.log(`→ Running action: ${item}`)
      //       run(item, [], envObj)
      //     }
      //   }
      // })
    })
})

// const commandName = 'test'
// program
//   .command(commandName)
//   .description('Execute eas build command')
//   .option('--android', 'Build to target preview profile')
//   .option('--ios', 'Build to target production profile')
//   .option('--stage', 'Set environment to staging')
//   .action((options) => {
//     const configObject = objHaste[commandName] || {}

//     const devConfig = configObject.environments ? configObject.environments.dev : {}
//     const productionConfig = configObject.environments ? configObject.environments.production : {}
//     let envObj = {}
//     if (options.stage) {
//       envObj = { ...devConfig }
//     } else {
//       envObj = { ...productionConfig }
//     }

//     // You can decide what happens when each flag is passed.
//     // Example: run `eas build` with different profiles.
//     if (options.android) {
//       console.log('→ Building Android (preview profile)…')
//       //run('eas', ['build', '--platform', 'android', '--profile', 'preview'])
//     } else if (options.ios) {
//       console.log('→ Building iOS (production profile)…')
//       //run('eas', ['build', '--platform', 'ios', '--profile', 'production'])
//     } else {
//       // console.log('No target specified. Use --android or --ios.')
//       // program.help()
//       console.log('objHaste.actions', objHaste)
//       for (const item of configObject.actions) {
//         console.log(`→ Running action: ${item}`)
//         run(item, [], envObj)
//       }
//     }
//   })

const totalClosedActions = 0
// Utility to spawn and pipe child output
async function run(cmd, args, envObj = {}, count = 1) {
  const child = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      ...envObj,
    },
  })
  const isLast = count === totalClosedActions + 1

  const exitAction = () => {
    totalClosedActions++
    process.exit(code)
  }
  if (!isLast) {
    child.on('exit', (code) => {
      exitAction()
    })
    child.on('sigint', () => {
      exitAction()
    })
  }
  if (isLast) {
    child.on('exit', (code) => {
      if (count < totalClosedActions) exitAction()
    })
    child.on('sigint', () => {
      if (count < totalClosedActions) {
        exitAction()
        process.exit(code)
      }
    })
  }
}

// Track background processes so we can kill them on exit
const bgChildren = new Set()

/** Run a command and resolve when it exits (attach stdio so you can see output). */
function runForeground(cmd, envObj = {}) {
  return new Promise((resolve, reject) => {
    // run the whole string via the shell so quotes/pipes work
    const child = spawn(cmd, {
      shell: true,
      stdio: 'inherit',
      env: { ...process.env, ...envObj },
    })
    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (signal) return reject(new Error(`${cmd} exited via signal ${signal}`))
      if (code === 0) return resolve()
      reject(new Error(`${cmd} exited with code ${code}`))
    })
  })
}

/** Start a command fully detached (no stdio). */
function runBackground(cmd, envObj = {}) {
  const isWin = process.platform === 'win32'

  const child = spawn(cmd, {
    shell: true,
    stdio: 'ignore', // no output in this terminal
    env: { ...process.env, ...envObj },
    // On POSIX, detach so we can signal the whole group; on Windows, DON'T.
    detached: !isWin,
    windowsHide: isWin, // prevent new console window on Windows
  })

  // Only unref on POSIX when detached; on Windows keep it referenced.
  if (!isWin) child.unref()

  bgChildren.add(child)
  child.on('exit', () => bgChildren.delete(child))
  child.on('error', () => bgChildren.delete(child))
}

/** Kill all background children (called on SIGINT/SIGTERM or when foreground ends). */
function killAllBackground() {
  for (const child of Array.from(bgChildren)) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { shell: true, stdio: 'ignore' })
      } else {
        process.kill(-child.pid, 'SIGTERM') // whole group
      }
    } catch {}
  }
  bgChildren.clear()
}

process.on('SIGINT', () => {
  console.log('\nSIGINT')
  killAllBackground()
  process.exit(130)
})
process.on('SIGTERM', () => {
  killAllBackground()
  process.exit(143)
})

/** In your commander .action handler */
async function runHasteCommand(configObject, options) {
  const devConfig = configObject.environments?.dev ?? {}
  const productionConfig = configObject.environments?.production ?? {}
  const envObj = options.stage ? devConfig : productionConfig

  const preactions = configObject.preactions ?? []
  const actions = configObject.actions ?? []

  // 1) Run preactions SEQUENTIALLY (each waits for previous to finish)
  for (const cmd of preactions) {
    console.log(`→ preaction: ${cmd}`)
    await runForeground(cmd, envObj)
  }

  // 2) Run actions: background all but the last; attach to the last
  if (actions.length === 0) return

  const bg = actions.slice(0, -1)
  const fg = actions[actions.length - 1]

  for (const cmd of bg) {
    console.log(`→ background action: ${cmd}`)
    runBackground(cmd, envObj)
  }

  console.log(`→ foreground action (attached): ${fg}`)
  console.log('envObj', envObj)
  try {
    console.log('envObj', envObj)
    await runForeground(fg, envObj)
  } finally {
    // When the foreground ends, clean up background processes too (optional)
    killAllBackground()
  }
}
