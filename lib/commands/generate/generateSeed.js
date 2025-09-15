import fs from 'fs'
// Initialize the DynamoDB client

import { readFileSync } from 'fs'
import path from 'path'

import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

import { join } from 'node:path';
const packageJSON = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));

console.log('Deploy command loaded')

const awsObject = packageJSON['aws'] || {}
const projectName = packageJSON['name'] || 'project'

const awsProfile = awsObject['profile'] || 'default'

// TODO: Fix Copy Issues
const dirPath = './docker/seed' // Folder path to delete files from

// Function to delete all files in the specified directory (ignores directories)
function deleteFilesInDir(dir) {
	// Read all files and directories inside the directory
	const files = fs.readdirSync(dir)

	// Loop through each file and directory
	files.forEach((file) => {
		const filePath = path.join(dir, file) // Get full path of the file or directory

		// Check if it's a file (not a directory)
		const stats = fs.statSync(filePath)

		if (stats.isFile()) {
			// If it's a file, delete it
			fs.unlinkSync(filePath)
			console.log(`Deleted file: ${filePath}`)
		}
	})
}

// Function to scan the DynamoDB table and generate the desired JSON format
async function generateTableExport(tablename, client, profilesOnly = false) {
	let params = {
		TableName: tablename,
	}

	// This will hold all the data retrieved from DynamoDB
	let allItems = []
	let lastEvaluatedKey = null

	// If there are more items (pagination in case of large tables)
	do {
		if (lastEvaluatedKey) {
			params.ExclusiveStartKey = lastEvaluatedKey
		}

		try {
			// Perform the scan operation
			console.log('params', params)
			const data = await client.send(new ScanCommand(params))
			allItems = allItems.concat(data.Items)
			lastEvaluatedKey = data.LastEvaluatedKey // Set the last evaluated key for pagination
		} catch (error) {
			console.error('Error scanning DynamoDB table:', error)
			return
		}
	} while (lastEvaluatedKey) // Continue scanning if there are more pages of results

	// Format the data into the desired JSON structure
	//console.log(JSON.stringify)
	const formattedData = {
		[tablename]: allItems
			.filter(
				(item) =>
					!profilesOnly ||
					!tablename.includes('Database') ||
					unmarshall(item)['SK'].includes('PROFILE'),
			)
			.map((item) => {
				const formattedItem = unmarshall(item) // Unmarshall DynamoDB format to JS object
				// Ensure the correct format: PutRequest -> Item
				//if (tablename.includes('Database') && !formattedItem['SK'].includes('USER')) return undefined;
				return {
					PutRequest: {
						Item: marshall(formattedItem), // Marshall JS object back to DynamoDB format
					},
				}
			}),
	}
	return formattedData
}
async function exportDynamoTable(
	tables,
	client,
	dbRewrites,
	profilesOnly = false,
	strOut = './docker/seed',
) {
	deleteFilesInDir(dirPath)
	let output = await Promise.all(
		tables.map(async (tableName) => await generateTableExport(tableName, client, profilesOnly)),
	)
	const fileName = `${strOut}/dynamodb-seed`

	const outputRes = {}
	output.map((item) => {
		const keys = Object.keys(item)
		console.log(keys)

		return keys.map((key) => {
			const value = item[key].filter((item) => item !== undefined)
			outputRes[key] = value
			return { value }
		})
	})

	output = outputRes

	const fileObject = {}
	const dbObject = {}
	Object.keys(output).forEach((key) => {
		console.log('key', key)
		const value = output[key]
		console.log('value', value.length)
		if (value.length > 0) {
			console.log('dbRewrites', dbRewrites)
			console.log('key', key)
			const dbKey = dbRewrites[key] || key
			console.log('dbKey', dbKey)
			dbObject[dbKey] = value
		}
	})
	console.log('dbObject', dbObject)

	let countTotal = 0

	Object.keys(dbObject).forEach((key) => {
		console.log(key)
		let currentPosition = 0
		const numOfItems = 20
		const putItems = dbObject[key]
		while (currentPosition < putItems.length) {
			if (dbObject[key].length > numOfItems) {
				const result = putItems.slice(currentPosition, currentPosition + numOfItems)
				fileObject[`${fileName}-${countTotal}`] = { [key]: result }
				currentPosition += numOfItems
				countTotal += 1
			} else {
				const result = putItems.slice(currentPosition, putItems.length)
				fileObject[`${fileName}-${countTotal}`] = { [key]: result }
				currentPosition += numOfItems
				countTotal += 1
			}
		}
	})

	Object.keys(fileObject).forEach((key) => {
		console.log('Writing to file: ', key)
		fs.writeFileSync(`${key}.json`, JSON.stringify(fileObject[key], null, 2))
	})

	console.log(`Export complete. Data written to ${fileName}`)
}
export function createDirIfNotExists(dirname) {
	if (!fs.existsSync(dirname)) {
		fs.mkdirSync(dirname)
	}
}

// Run the function

export function exportTable(
	newTables,
	owner,
	altOwner = 'dev',
	rewriteDb,
	live = false,
	region = 'us-east-2',
	profilesOnly = false,
) {
	createDirIfNotExists(dirPath)
	const tables = live ? ['MainDatabase'] : ['MainDB']
	const dbRewrites = {}
	const dbOg = {}
	tables.map((table, index) => (dbOg[table] = newTables[index] || ''))
	tables.map((table, index) => {
		const rewriteDbIndex = rewriteDb[index]
		if (rewriteDbIndex === 'MainDB') {
			dbRewrites[`${projectName}-infra-${table}-${owner}`] = `${rewriteDbIndex || table}`
		} else {
			const newTable = tables[index].replace(tables[index], newTables[index] || tables[index])
			dbRewrites[`${projectName}-infra-${table}-${owner}`] =
				`${projectName}-infra-${newTable || table}-${altOwner || owner}`
		}
	})

	let dbTables = ['MainDB']

	if (live) {
		dbTables = tables.map((table) => {
			return `${projectName}-infra-${table}-${owner}`
		})
	}

	let client = undefined
	if (live) {
		client = new DynamoDBClient({
			region: region, // Replace with your AWS region
		})
	} else {
		console.log('LOCAL')
		client = new DynamoDBClient({
			region: region, // Replace with your AWS region
			endpoint: 'http://localhost:8000', // The default local DynamoDB endpoint
			credentials: {
				accessKeyId: 'fakeAccessKeyId', // Use fake credentials for local DynamoDB
				secretAccessKey: 'fakeSecretAccessKey',
			},
		})
	}
	exportDynamoTable(dbTables, client, dbRewrites, profilesOnly)
}
