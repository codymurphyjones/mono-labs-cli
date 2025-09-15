
import { spawn } from 'child_process'
import 'dotenv/config'
import inquirer from 'inquirer'
import treeKill from 'tree-kill'

import { generateEnvValues } from '../../app.js'
import { STAGING_URL } from '../../config.js'
import { getNgrokUrl } from './ngrok.js'

// EXPO_FORCE_PROD = true;
// EXPO_UNSTABLE_ATLAS = false;

// Import the runDevCommand function
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  white: '\x1b[37m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
}

function getContinuedServices() {
  const continuedServices = Object.keys(devServices).filter((key) => devServices[key].continue)
  return continuedServices
}

function getPrepServices() {
  const continuedServices = Object.keys(devServices).filter((key) => !devServices[key].continue)
  return continuedServices
}

const devServicesRoot = {
  docker: {
    command: 'docker compose up -d',
    key: '?',
    icon: '🐳',
    stdio: 'ignore',
  },
  backend: {
    command: 'yarn backend server',
    key: 'b',
    color: colors.yellow,
    continue: true,
    icon: '🦾',
  },
  // app: {
  // 	command: 'yarn workspace app expo start -c --tunnel --dev-client',
  // 	key: 'a',
  // 	color: colors.white,
  // 	continue: true,
  // 	icon: '📱',
  // 	stdio: ['inherit', 'inherit', 'inherit'],
  // },
  dynamo: {
    command: 'yarn backend dynamodb-admin -p 8082 --dynamo-endpoint=http://localhost:8000',
    key: 'd',
    continue: true,
    icon: '📦',
  },
}

const devServices = {}
Object.keys(devServicesRoot).forEach((key) => {
  const service = devServicesRoot[key]
  devServices[key] = {
    ...service,
    name: key,
  }
})
const childProcesses = {}
let allowRestart = true

const totalRetries = 5

function startService(key, forceProd, ngrokUrl, stage, envObj) {
  const { command, stdio } = devServices[key]
  const isContinued = devServices[key].continue

  const child = spawn(command, {
    stdio: stdio ? stdio : ['ignore', 'pipe', 'pipe'],
    shell: true,
    env: {
      ...envObj,
    },
  })

  childProcesses[key] = child
  childManager(child, devServices[key], false, () => {
    if (isContinued && allowRestart && key !== 'backend') {
      setTimeout(() => startService(key, forceProd, ngrokUrl, stage, envObj), 2000)
    }
  })
}

const write = (color, message) => {
  process.stdout.write(`${color}${message}${colors.reset}\n`)
}

const serviceSigInt = {}

function childManager(child, service, nowrite = false, restartCallback = undefined) {
  const color = service.color || undefined
  const writeToBox = (data) => {
    if (color) write(color, data.toString())
  }

  if (!nowrite) {
    child.stdout?.on('data', writeToBox)
    child.stderr?.on('data', writeToBox)
  }

  child.on('sigint', (code) => {
    console.log('sigint')
    console.log(`\n${service.icon || '🔚'} ${service.name || 'Service'} exited with code ${code}`)
    if (restartCallback) restartCallback()
  })

  child.on('exit', (code) => {
    if (!serviceSigInt[service.name] && restartCallback) {
      console.log(
        `\n${service.icon || '🔚'} ${service.name || 'Service'} exited with code ${code}\n`
      )
      restartCallback()
    }
  })
}

export async function dev(_forceProd, useAtlas, argServices, stage) {
  const forceProd = stage === true ? true : _forceProd
  let acceptedServices = argServices || undefined
  if (acceptedServices === undefined && !stage) {
    const { acceptedServices: services } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'acceptedServices',
        message: 'Select services to run:',
        choices: Object.keys(devServices).map((key) => ({
          name: key,
          value: key,
        })),
        default: Object.keys(devServices).map((key) => key),
      },
    ])

    acceptedServices = services
  }

  let ngrokUrl = ''
  if (!forceProd && !stage) {
    let envObj = generateEnvValues(forceProd)
    getPrepServices().forEach((key) => {
      const { command, stdio } = devServices[key]
      if (acceptedServices.includes(key)) {
        console.log(`Running command for service ${key}: ${command}`)
        const child = spawn(command, {
          stdio: ['pipe', 'inherit', 'pipe'], // Read from terminal, but capture output
          shell: true,
          env: {
            ...envObj,
          },
        })
        if (key === 'app') {
          child.on('sigint', () => {
            console.log('SIGINT received for app service')
          })
          child.on('exit', () => {
            console.log('exit received for app service')
          })
        }

        childProcesses[key] = child
        childManager(child, devServices[key], true)
      }
    })

    while (!ngrokUrl) {
      try {
        ngrokUrl = (await getNgrokUrl()) + '/'
      } catch (e) {
        console.log('Ngrok failed to start. Retrying in 2 seconds...')
        console.log(e)
        await new Promise((res) => setTimeout(res, 2000)) // Delay before retry
      }
    }
  }

  let envObj = generateEnvValues(forceProd, ngrokUrl, useAtlas)
  if (stage) {
    envObj.EXPO_PUBLIC_API_URL = `${STAGING_URL}`
    envObj.ApiUrl = `${STAGING_URL}`
    envObj.EXPO_FORCE_PROD = 'true'
  } else {
    const publicUrl = process.env.EXPO_PUBLIC_API_URL || `${STAGING_URL}`
    envObj.EXPO_PUBLIC_API_URL = publicUrl
    envObj.ApiUrl = `${STAGING_URL}`
  }

  setTimeout(
    () => {
      console.log('ngrokUrl', ngrokUrl)
      console.log('envObj', envObj)
      getContinuedServices().forEach((key) => {
        if (stage && key === 'app') {
          startService(key, forceProd, ngrokUrl, stage, envObj)
        } else {
          if (!stage && acceptedServices.includes(key)) {
            startService(key, forceProd, ngrokUrl, stage, envObj)
          }
        }
      })
    },
    !forceProd ? 5000 : 100
  )

  async function shutdown() {
    console.log('\n🛑 Shutting down all services...')
    for (const [key, child] of Object.entries(childProcesses)) {
      if (
        child &&
        child.pid &&
        !child.killed &&
        devServices[key].continue &&
        !['docker'].includes(key)
      ) {
        console.log(`→ Killing service: ${key}`)
        await new Promise((resolve) => {
          treeKill(child.pid, 'SIGTERM', (err) => {
            if (!err) {
              console.log(`✅ ${key} has been tree-killed.`)
            }
            resolve()
          })
        })
      }
      if (key === ' docker') {
        spawn(command, {
          stdio: 'docker-compose down', // Read from terminal, but capture output
          shell: true,
          env: {
            ...envObj,
          },
        })
      }
    }
  }

  process.on('SIGINT', () => {
    shutdown().then(() => process.exit(0))
  })

  process.on('SIGTERM', () => {
    shutdown().then(() => process.exit(0))
  })

  // Exit signal
  process.on('exit', () => {
    console.log('👋 Process exiting...')
  })
}
