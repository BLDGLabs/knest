#!/usr/bin/env node

// Update task sources based on actual origins
require('dotenv').config();

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

async function updateTaskSource(taskId, source) {
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

// Source mapping based on actual task origins
const SOURCE_MAP = {
  // From Slack #product-dev / #aws-partnership-learning-resources
  'slack': [
    1770189406756, // Use ranges instead of exact values for ARR/employees
    1770189406862, // Add password visibility toggle (eye icon)
    1770191901507, // High propensity account reports from Tackle
    1770191901265, // Train Skematic on AWS partner programs
    1770189407069, // Reduce AI verbosity in responses
    1770189406966, // Add AWS Marketplace to service integrations dropdown
    1770189406517, // Add sticky board for coach feedback/ideas voting
    1770189407382, // Fix AI context when navigating between pages
    1770191901611, // Explore Partner Matching Engine (PME) API integration
    1770189407177, // Calculate DRAG for built-on/integrated services
    1770189407281, // Explore Kimi.com AI tool
    1770176805480, // Create Slack App in Skematic workspace
    1770176805481, // Configure OpenClaw Slack channel
    1770176805485, // Test end-to-end Slack integration
    1770192140524, // Scan Slack for new ideas
    1770192140639, // Review open tasks for Jason & Miti
  ],
  
  // From Jira (Skematic project)
  'jira': [
    'SM-332', // Build Stories for new marketplace api access
    'SM-350', // Auto-deploy for workers
    'SM-307', // Marketplace API
    'SM-320', // Automated Sync via HubSpot
  ],
  
  // Manual (created directly by Jason or Miti in Mission Control)
  'manual': [
    6, // Deploy Miti Status to Amplify
    3, // Build Lambda + API Gateway
    2, // Create DynamoDB table for worker status
    1, // Get Lambda creation permissions
    4, // Update Miti Status UI to read from DynamoDB
    5, // Build OpenClaw pusher hook
    1770176805477, // Embed Miti Status widget in Mission Control
    1770176805482, // Join and index target channels
    1770176805484, // Define monitoring rules and triggers
    1770176805483, // Build channel summarization workflow
    1770218413000, // Install and configure jira-cli
    1770218413001, // Provide Jira API token for Miti
    1770218413002, // Import Jira stories to Mission Control
    1770219045000, // Authenticate gog CLI with Google account
    1770219045001, // Define email monitoring filters and rules
    1770219045002, // Build email scan workflow
    1771096604523, // Jim Roberts: Create documentation on resource planning
    1771269308946, // Remove detailed comparison table from Competitive Analysis
    1771269308999, // Fix company names not populating in Competitive Analysis table
  ],
};

async function main() {
  console.log('🔍 Updating task sources based on actual origins...\n');
  
  let updated = 0;
  
  for (const [source, taskIds] of Object.entries(SOURCE_MAP)) {
    console.log(`\n📝 Setting source to "${source}" for ${taskIds.length} tasks:`);
    
    for (const taskId of taskIds) {
      try {
        await updateTaskSource(taskId, source);
        console.log(`   ✅ Updated task ${taskId}`);
        updated++;
      } catch (err) {
        console.error(`   ❌ Failed to update task ${taskId}:`, err.message);
      }
    }
  }
  
  console.log(`\n📊 Updated ${updated} tasks with corrected sources`);
}

main().catch(console.error);
