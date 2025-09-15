import { spawn } from 'child_process'

import { program } from '../../app.js'
import { generateEnvValues } from '../../app.js'
import { STAGING_URL } from '../../config.js'

const allowedPlatforms = ['ios', 'android']
function selectPlatform(platform) {
  if (!allowedPlatforms.includes(platform))
    throw new Error(`Invalid platform selected, must be one of ${allowedPlatforms.join(', ')}`)
  return platform
}

function selectProfile(dev, preview, prod, profile) {
  if (profile && (dev || preview || prod)) {
    throw new Error('Conflict between profile and dev/preview/prod')
  }
  if (dev) return 'development'
  if (preview) return 'preview'
  if (prod) return 'production'
  if (profile) return profile
  return 'development'
}

program
  .command('build')
  .description('Execute eas build command')
  .option('-d', 'Build to target development profile')
  .option('-p', 'Build to target preview profile')
  .option('--live', 'Build to target production profile')
  .option('--profile <string>', 'Build profile to use')
  .option('--os, --platform <string>', 'Platform to build', 'ios')
  .option('-f, --force', 'Force build to target production server')
  .action((str, options) => {
    console.log('its me')
    const platform = selectPlatform(str.platform)
    const profile = selectProfile(str.d, str.p, str.live, str.profile)
    const isDev = profile === 'development'
    //console.log(options);
    console.log(`Building ${platform} with profile ${'`'}${profile}${'`'}`)
    console.log('\n\n\n')

    const EXPO_FORCE_PRODUCTION = str.force || isDev ? 'false' : 'true'
    console.log('EXPO_FORCE_PRODUCTION', EXPO_FORCE_PRODUCTION)

    let envObj = generateEnvValues(EXPO_FORCE_PRODUCTION, '', false)
    if (!isDev) {
      envObj.EXPO_PUBLIC_API_URL = `${STAGING_URL}`
      envObj.EXPO_FORCE_PROD = 'true'
    } else {
      const publicUrl = process.env.EXPO_PUBLIC_API_URL || `${STAGING_URL}`
      envObj.EXPO_PUBLIC_API_URL = publicUrl
    }
    console.log('envObj', envObj)
    envObj.EAS_BUILD_PROFILE = profile // your custom variable

    const command = `w expo-app eas build --profile ${profile} --platform ${platform}`
    console.log('Running command:', command)
    const child = spawn('yarn', [command], {
      stdio: 'inherit',
      shell: true, // required if using shell-style commands or cross-platform support
      env: {
        ...envObj,
      },
    })

    child.on('exit', (code) => {
      console.log(`Process exited with code ${code}`)
      process.exit(code ?? 0)
    })
  })
