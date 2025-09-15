import { spawn } from 'child_process'
import fs from 'fs'
import { program } from '../../app.js'
import { generateEnvValues } from '../../app.js'
import { STAGING_URL } from '../../config.js'
import { getHasteConfig, getHasteFiles, getRootDirectory, getRootJson } from '../loadFromRoot.js'

console.log('getRootDirectory', getRootDirectory())
console.log('rootJson', getRootJson())
const {files, config} = getHasteConfig()

console.log('Haste files', files)

const fileKeys = Object.keys(files)
let dataLayer = {}

fileKeys.forEach((key) => {
  const commandName = key

  console.log('Haste file key', commandName, files[key])
  const configObject = files[commandName] || {}
  const optionsData = configObject.options || {}
  const optionsList = Object.keys(optionsData)

  console.log('optionsList', optionsList, optionsData)

  let currentCommand = program.command(commandName).description('Execute eas build command')

  if (configObject.argument) {
    console.log('has argument', configObject.argument)
    // .argument('<input>', 'path to input file') // required
    // .argument('[output]', 'optional output file') // optional
    const argumentRequired = configObject.argument.required || false
    const argCommand = argumentRequired
      ? `<${configObject.argument.type || 'string'}>`
      : `[${configObject.argument.type || 'string'}]`
    currentCommand = currentCommand.argument(argCommand, configObject.argument.description || '')
  }

  optionsList.forEach((optionKey) => {
    const type = optionsData[optionKey].type || 'boolean'

    if (type === 'string') {
      if (optionsData[optionKey].shortcut) {
        currentCommand = currentCommand.option(
          `-${optionsData[optionKey].shortcut}, --${optionKey} <${optionKey}>`,
          optionsData[optionKey].description || ''
        )
        console.log('optionKey', optionKey, optionsData[optionKey])
        dataLayer[optionKey] = optionsData[optionKey].default || ''
      } else {
        currentCommand = currentCommand.option(
          `--${optionKey} <${optionKey}>`,
          optionsData[optionKey].description || ''
        )
        dataLayer[optionKey] = optionsData[optionKey].default || ''
      }
    } else {
      if (optionsData[optionKey].shortcut) {
        currentCommand = currentCommand.option(
          `-${optionsData[optionKey].shortcut}, --${optionKey}`,
          optionsData[optionKey].description || ''
        )
        console.log('optionKey', optionKey, optionsData[optionKey])
        dataLayer[optionKey] = optionsData[optionKey].default || false
      } else {
        currentCommand = currentCommand.option(
          `--${optionKey}`,
          optionsData[optionKey].description || ''
        )
        dataLayer[optionKey] = optionsData[optionKey].default || false
      }
    }
  })

  function verifyOptionValues(optionKey, value) {
    const optionInfo = optionsData[optionKey]
    if (optionInfo && optionInfo.options) {
      if (!optionInfo.options.includes(value)) {
        throw new Error(
          `Invalid value for --${optionKey}: ${value}. Valid options are: ${optionInfo.options.join(
            ', '
          )}`
        )
      }
    }
    return value
  }

  currentCommand.action(async (arg, cmd) => {
    console.log('test:')
    console.log('cmd', cmd)
    console.log('arg', arg)
    const optionVals = cmd.opts ? cmd.opts() : cmd
    console.log('arg', arg)
    console.log('optionVals')

    const opts = optionVals
    Object.keys(opts).forEach((k) => {
      opts[k] = verifyOptionValues(k, opts[k])
    })
    const argVal = arg ? arg : configObject.argument.default
    console.log('argVal', argVal)
    dataLayer = { ...dataLayer, ...opts, arg: argVal }
    console.log('opts', opts)
    console.log('firstDataLayer', dataLayer)
    await runHasteCommand(configObject, opts)

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
function runForeground(cmd, envObj = {}, options = {}) {
  return new Promise((resolve, reject) => {
    let lastLine = ''
    let myTextData = ''
    const child = spawn(cmd, {
      shell: true,
      env: { ...process.env, ...envObj },
      stdio: ['inherit', 'pipe', 'pipe'], // stdin pass-through, capture out/err
    })

    const handleData = (chunk, isErr = false) => {
      const text = chunk.toString()
      console.log(text.toString().trim())
      console.log('text', text)
      myTextData = myTextData.concat(text)
      console.log('myTextData', myTextData)

      // Track last line
      const lines = text.trim().split(/\r?\n/)
      if (lines.length) {
        lastLine = lines[lines.length - 1]
      }
    }

    child.stdout.on('data', (chunk) => handleData(chunk, false))
    child.stderr.on('data', (chunk) => handleData(chunk, true))

    child.on('error', reject)
    child.on('exit', (code, signal) => {
      myTextData.concat('\n<<< CHILD PROCESS EXITED >>>\n')
      console.log('myTextData', myTextData)
      //const rx = /\{out\s*:\s*(.+?)\}/gs
      // ^\{out:field-name \$\{([^}]+)\}\}$
      const rx = /\{out:([^\s]+) (.*)\}\n/g
      //const rx = /Project ([^\r\n]*)/
      console.log('myTextData', myTextData)
      const match = rx.exec(myTextData)

      const rx3 = /\{out:(?<field>[^\s}]+)\s+(?<value>[^\s}]+)\}/g
      const results = [...myTextData.matchAll(rx3)].map((m) => {
        const layerIndex = m.groups.field
        const matchValue = m.groups.value
        console.log('matchValue', matchValue)
        dataLayer[layerIndex] = matchValue

        return {
          field: m.groups.field,
          value: m.groups.value,
        }
      })
      console.log(results)

      console.log('match', match)

      if (signal) return reject(new Error(`${cmd} exited via signal ${signal}`))
      if (code === 0) return resolve(lastLine) // resolve with last line
      reject(new Error(`${cmd} exited with code ${code}. Last line: ${lastLine}`))
    })
  })
}

function runBackground(cmd, envObj = {}, options = {}, attached = false) {
  const isWin = process.platform === 'win32'
  // Expand ${0}, ${1}, ... from dataLayer into env strings
  const newEnv = {}
  const commandClone = cmd
  for (const key of Object.keys(envObj)) {
    let value = envObj[key]
    if (typeof value === 'string') {
      console.log('dataLayer', dataLayer)
      Object.keys(dataLayer).map((k) => {
        value = value.replace(new RegExp(`\\$\\{${k}\\}`, 'g'), dataLayer[k])
      })
    }
    newEnv[key] = value
  }

  console.log('newEnv', newEnv)

  const out = commandClone.replace(/\$\{([^}]+)\}/g, (match, key) => {
    // keep 0/false, only treat null/undefined as missing
    const v = dataLayer[key]
    return v == null ? match : String(v)
  })

  return new Promise((resolve, reject) => {
    const child = spawn(out, {
      shell: true,
      stdio: attached ? 'inherit' : 'ignore', // no output in this terminal
      env: { ...process.env, ...newEnv },
      // On POSIX, detach so we can signal the whole group; on Windows, DON'T.
      detached: !attached && !isWin,
      windowsHide: !attached && !isWin, // prevent new console window on Windows
    })

    // Only unref on POSIX when detached; on Windows keep it referenced.
    if (!attached && !isWin) child.unref()

    child.once('error', (err) => {
      bgChildren.delete(child)
      reject(err)
    })

    child.once('exit', (code, signal) => {
      bgChildren.delete(child)
      if (signal) return reject(new Error(`${cmd} exited via signal ${signal}`))
      if (code === 0) return resolve()
      reject(new Error(`${cmd} exited with code ${code}`))
    })
  })
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
async function runHasteCommand(configObject, options = {}) {
  const environments = configObject.environments
  const devConfig = configObject.environments?.dev ?? {}
  const productionConfig = configObject.environments?.stage ?? {}
  console.log('options', options)
  const awsProfile = process.env.CDK_DEPLOY_PROFILE || 'default'
  console.log('prof', awsProfile)
  const envObj = options.stage ? productionConfig : devConfig
  envObj['AWS_PROFILE'] = awsProfile

  const preactions = configObject.preactions ?? []
  const actions = configObject.actions ?? []

  console.log('environments', environments)

  console.log('preactions', preactions)

  // 1) Run preactions SEQUENTIALLY (each waits for previous to finish)
  let num = 0
  console.log('envObj', envObj)
  for (const cmd of preactions) {
    console.log(`→ preaction: ${cmd}`)
    await runForeground(cmd, envObj, options)
    num++
  }

  // 2) Run actions: background all but the last; attach to the last
  if (actions.length === 0) return

  const bg = actions.slice(0, -1)
  const fg = actions[actions.length - 1]

  for (const cmd of bg) {
    console.log(`→ background action: ${cmd}`)
    runBackground(cmd, envObj, options)
  }

  console.log(`→ foreground action (attached): ${fg}`)
  try {
    console.log('envObj', envObj)
    await runBackground(fg, envObj, options, true)
  } finally {
    // When the foreground ends, clean up background processes too (optional)
    killAllBackground()
  }
}

//ACTION TYPES: preaction, action
//COMMAND TYPES: sequence, parallel
