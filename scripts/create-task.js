import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const client = new DynamoDBClient({ region: process.env.AWS_REGION });

async function createTask(title, description, assignedTo = 'Jason', column = 'Backlog', priority = 'Medium', source = 'manual') {
  const taskId = 'task-' + Date.now();
  const params = {
    TableName: process.env.DYNAMODB_TABLE_NAME,
    Item: {
      PK: { S: `TASK#${taskId}` },
      SK: { S: 'METADATA' },
      title: { S: title },
      description: { S: description },
      column: { S: column },
      assignedTo: { S: assignedTo },
      priority: { S: priority },
      source: { S: source },
      createdAt: { S: new Date().toISOString() },
      updatedAt: { S: new Date().toISOString() }
    }
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log(`Task created with ID: ${taskId}`);
    return taskId;
  } catch (err) {
    console.error('Error creating task:', err);
    throw err;
  }
}

// Run the function
createTask(
  'Read this Twitter post',
  'https://x.com/us_oga/status/2024612896248893503?s=46&t=iJH8IO7DfblXXwVWLCbxwg',
  'Jason',
  'Backlog',
  'Medium',
  'slack'
);
