import { clearAllData, migrateData } from './src/services/dynamodb.js';

const REAL_EPICS = [
  {
    id: 'epic-miti-status',
    name: 'Miti Status Dashboard',
    description: 'Push-based worker status monitoring system',
    color: '#8b5cf6',
    createdAt: new Date().toISOString(),
  },
];

const REAL_TASKS = [
  {
    id: 1,
    title: 'Get Lambda creation permissions',
    description: 'Need IAM policy update for jasons-bot-miti to create Lambda functions and API Gateway',
    column: 'In Progress',
    tags: ['infrastructure'],
    epicId: 'epic-miti-status',
    assignedTo: 'Jason',
    dependsOn: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Create DynamoDB table for worker status',
    description: 'Table: miti-worker-status with sessionKey (PK), timestamp (SK), TTL after 24h',
    column: 'Backlog',
    tags: ['infrastructure'],
    epicId: 'epic-miti-status',
    assignedTo: 'Miti',
    dependsOn: [1],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'Build Lambda + API Gateway',
    description: 'POST endpoint to receive worker status updates, write to DynamoDB',
    column: 'Backlog',
    tags: ['backend'],
    epicId: 'epic-miti-status',
    assignedTo: 'Miti',
    dependsOn: [1],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    title: 'Update Miti Status UI to read from DynamoDB',
    description: 'Switch from localhost polling to DynamoDB queries, poll every 5-10s',
    column: 'Backlog',
    tags: ['frontend'],
    epicId: 'epic-miti-status',
    assignedTo: 'Miti',
    dependsOn: [2],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 5,
    title: 'Build OpenClaw pusher hook',
    description: 'Hook that pushes worker status updates on spawn/complete/progress events',
    column: 'Backlog',
    tags: ['backend'],
    epicId: 'epic-miti-status',
    assignedTo: 'Miti',
    dependsOn: [3],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 6,
    title: 'Deploy Miti Status to Amplify',
    description: 'Deploy UI to Amplify, configure env vars, test end-to-end',
    column: 'Backlog',
    tags: ['deployment'],
    epicId: 'epic-miti-status',
    assignedTo: 'Miti',
    dependsOn: [4, 5],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function resetData() {
  console.log('🗑️  Deleting all seed data...');
  await clearAllData();
  
  console.log('✨ Loading real project data...');
  await migrateData(REAL_EPICS, REAL_TASKS);
  
  console.log('✅ Done! Mission Control now has real data.');
  console.log(`   - ${REAL_EPICS.length} epic(s)`);
  console.log(`   - ${REAL_TASKS.length} task(s)`);
}

resetData().catch(console.error);
