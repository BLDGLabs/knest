#!/usr/bin/env node

// Load env vars
require('dotenv').config();

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

async function getAllEpics() {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk',
    ExpressionAttributeValues: {
      ':prefix': 'EPIC#',
      ':sk': 'METADATA',
    },
  }));
  return result.Items || [];
}

async function createTask(task) {
  const taskId = task.id || Date.now();
  
  const item = {
    PK: `TASK#${taskId}`,
    SK: 'METADATA',
    type: 'task',
    id: taskId,
    title: task.title,
    description: task.description || '',
    column: task.column || 'Backlog',
    epicId: task.epicId || null,
    assignedTo: task.assignedTo || 'Unassigned',
    tags: task.tags || [],
    priority: task.priority || 'Medium',
    dueDate: task.dueDate || null,
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  }));

  console.log(`✅ Created task: ${task.title} (ID: ${taskId})`);
  return taskId;
}

async function main() {
  // Get all epics to find the right one
  const epics = await getAllEpics();
  console.log('\n📋 Available Epics:');
  epics.forEach(epic => {
    console.log(`  - ${epic.name} (${epic.id})`);
  });

  // Use epic-sprint5 or create a product-specific epic
  const epicId = 'epic-sprint5'; // Adjust as needed

  // Task 1: Remove detailed comparison table
  await createTask({
    title: 'Remove detailed comparison table from Competitive Analysis',
    description: 'The comparison table in the Competitive Analysis document is too much - simplify or remove it.',
    column: 'Backlog',
    epicId: epicId,
    assignedTo: 'Jason',
    tags: ['improvement', 'documentation'],
    priority: 'High',
  });

  // Task 2: Fix company names not populating
  await createTask({
    title: 'Fix company names not populating in Competitive Analysis table',
    description: 'The company names aren\'t populating in the table - investigate and fix the data population issue.',
    column: 'Backlog',
    epicId: epicId,
    assignedTo: 'Jason',
    tags: ['bug', 'urgent'],
    priority: 'High',
  });

  console.log('\n✨ Tasks created successfully!');
}

main().catch(console.error);
