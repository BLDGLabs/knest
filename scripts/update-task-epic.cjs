#!/usr/bin/env node

// Load env vars
require('dotenv').config();

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

async function updateTaskEpic(taskId, epicId) {
  await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `TASK#${taskId}`,
      SK: 'METADATA',
    },
    UpdateExpression: 'SET epicId = :epicId, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':epicId': epicId,
      ':updatedAt': new Date().toISOString(),
    },
  }));

  // Also get the task title to confirm
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `TASK#${taskId}`,
      SK: 'METADATA',
    },
  }));

  console.log(`✅ Updated: ${result.Item.title}`);
}

async function main() {
  const taskIds = [1771269308946, 1771269308999];
  const skematicEpicId = 'epic-sprint5'; // This is the Skematic Jira Sprint 5 epic
  
  for (const taskId of taskIds) {
    await updateTaskEpic(taskId, skematicEpicId);
  }

  console.log('\n✨ Tasks updated to Skematic epic!');
}

main().catch(console.error);
