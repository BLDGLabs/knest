#!/usr/bin/env node

// Add source field to all existing tasks
require('dotenv').config();

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

async function getAllTasks() {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk',
    ExpressionAttributeValues: {
      ':prefix': 'TASK#',
      ':sk': 'METADATA',
    },
  }));
  return result.Items || [];
}

async function updateTaskSource(taskId, source = 'manual') {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      PK: `TASK#${taskId}`,
      SK: 'METADATA',
    },
    UpdateExpression: 'SET #source = :source, updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#source': 'source',
    },
    ExpressionAttributeValues: {
      ':source': source,
      ':updatedAt': new Date().toISOString(),
    },
  };

  await docClient.send(new UpdateCommand(params));
}

async function main() {
  console.log('🔍 Fetching all tasks...\n');
  const tasks = await getAllTasks();
  
  console.log(`Found ${tasks.length} tasks\n`);
  
  let updated = 0;
  let skipped = 0;
  
  for (const task of tasks) {
    if (task.source) {
      console.log(`⏭️  Skipping "${task.title}" - already has source: ${task.source}`);
      skipped++;
      continue;
    }
    
    // Determine source based on task characteristics
    let source = 'manual';
    
    // If task ID starts with SM-, it's from Jira
    if (typeof task.id === 'string' && task.id.startsWith('SM-')) {
      source = 'jira';
    }
    // If it has epic-heartbeat or mentions slack, it's from slack monitoring
    else if (task.epicId === 'epic-heartbeat' || task.title.toLowerCase().includes('slack')) {
      source = 'slack';
    }
    
    await updateTaskSource(task.id, source);
    console.log(`✅ Updated "${task.title}" - set source to: ${source}`);
    updated++;
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${tasks.length}`);
}

main().catch(console.error);
