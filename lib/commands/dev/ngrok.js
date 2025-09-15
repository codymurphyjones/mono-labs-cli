import fs from 'fs'
import http from 'http'
import https from 'https'

// Define the path to your .env file
const envFilePath = '../.env'

// Fetch the ngrok public URL from localhost:4040 (ngrok web interface)
export function getNgrokUrl() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4040,
      path: '/api/tunnels',
      method: 'GET',
    }

    const req = (options.port === 443 ? https : http).request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(data)
          const publicUrl = jsonResponse.tunnels && jsonResponse.tunnels[0]?.public_url
          if (publicUrl) {
            resolve(publicUrl)
          } else {
            reject('Could not find public URL in the response')
          }
        } catch (err) {
          reject('Error parsing JSON response')
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.end()
  })
}

// Update the .env file with the new NGROK_URL value
function updateEnvFile(ngrokUrl) {
  console.log('Updating .env file with ngrok URL:', ngrokUrl)
  console.log('Env file path:', envFilePath)
  fs.readFile(envFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading .env file:', err)
      return
    }

    console.log('data', data)

    let newData
    if (data.includes('EXPO_PRIVATE_API_URL=')) {
      // If NGROK_URL exists, replace it
      newData = data.replace(/EXPO_PRIVATE_API_URL=.*/, `EXPO_PRIVATE_API_URL=${ngrokUrl}/`)
    } else {
      // If NGROK_URL doesn't exist, add it to the file
      newData = `${data}\nEXPO_PRIVATE_API_URL=${ngrokUrl}/`
    }

    console.log('newData', newData)

    // Write the updated data back to the .env file
    fs.writeFile(envFilePath, newData, 'utf8', (writeErr) => {
      if (writeErr) {
        console.error('Error writing to .env file:', writeErr)
      } else {
        console.log(`NGROK_URL has been updated to: ${ngrokUrl}`)
      }
    })
  })
}
// Main function to get the ngrok URL and update the .env file
export async function updateNgrokUrl() {
  try {
    const ngrokUrl = await getNgrokUrl()
    updateEnvFile(ngrokUrl)
  } catch (error) {
    console.error('Error:', error)
  }
}
