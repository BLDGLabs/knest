#!/usr/bin/env node
/**
 * Knest Task Checker
 * Queries DynamoDB for tasks assigned to Jason or Miti that aren't Done
 */

const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const client = new DynamoDBClient({ 
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function checkTasks() {
  try {
    const command = new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME || 'mission-control-tasks',
    });
    
    const response = await client.send(command);
    const tasks = response.Items.map(item => unmarshall(item));
    
    // Filter for actual task records only (not dependencies)
    const actualTasks = tasks.filter(t => t.type === 'task');
    
    // Filter for tasks assigned to Jason or Miti that aren't Done
    const relevantTasks = actualTasks.filter(t => 
      (t.assignedTo === 'Jason' || t.assignedTo === 'Miti') && 
      t.column !== 'Done'
    );
    
    return {
      total: actualTasks.length,
      relevant: relevantTasks.length,
      tasks: relevantTasks.map(t => ({
        assignedTo: t.assignedTo,
        column: t.column,
        title: t.title,
        epicId: t.epicId,
        id: t.id
      }))
    };
  } catch (error) {
    console.error('Error checking tasks:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  checkTasks()
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(err => {
      console.error('Failed:', err.message);
      process.exit(1);
    });
}

module.exports = { checkTasks };
