import dotenv from 'dotenv';
dotenv.config();

import * as db from '../src/services/dynamodb.js';

const SAMPLE_EPICS = [
  {
    id: 'epic-1',
    name: 'Q1 Platform Improvements',
    description: 'Major platform enhancements for Q1 2026',
    color: '#3b82f6',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'epic-2',
    name: 'Mobile App Launch',
    description: 'iOS and Android app development',
    color: '#8b5cf6',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'epic-3',
    name: 'Security Hardening',
    description: 'Security improvements and compliance',
    color: '#ef4444',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const SAMPLE_TASKS = [
  {
    id: 1,
    title: 'Daily standup meeting',
    description: 'Team sync at 10 AM',
    column: 'Recurring',
    tags: ['feature'],
    epicId: null,
    assignedTo: null,
    dependsOn: [],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    title: 'Review pull requests',
    description: 'Check team PRs and provide feedback',
    column: 'Recurring',
    tags: ['improvement'],
    epicId: null,
    assignedTo: 'Miti',
    dependsOn: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 3,
    title: 'Fix authentication bug',
    description: 'Users reporting login issues on mobile',
    column: 'In Progress',
    tags: ['bug', 'urgent'],
    epicId: 'epic-3',
    assignedTo: 'Miti',
    dependsOn: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 4,
    title: 'Design new dashboard layout',
    description: 'Create mockups for the analytics dashboard',
    column: 'Backlog',
    tags: ['feature'],
    epicId: 'epic-1',
    assignedTo: 'Jason',
    dependsOn: [],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 5,
    title: 'Update API documentation',
    description: 'Add examples for new endpoints',
    column: 'Review',
    tags: ['documentation'],
    epicId: 'epic-1',
    assignedTo: 'Jason',
    dependsOn: [6],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 6,
    title: 'Optimize database queries',
    description: 'Improve performance on user dashboard',
    column: 'Backlog',
    tags: ['improvement'],
    epicId: 'epic-1',
    assignedTo: 'Miti',
    dependsOn: [],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 7,
    title: 'Implement dark mode toggle',
    description: 'Add user preference for theme switching',
    column: 'In Progress',
    tags: ['feature'],
    epicId: 'epic-2',
    assignedTo: 'Jason',
    dependsOn: [4],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 900000).toISOString(),
  },
];

console.log('🚀 Loading sample data into DynamoDB...\n');

try {
  // Clear existing data
  console.log('1️⃣ Clearing existing data...');
  await db.clearAllData();
  
  // Load sample data
  console.log('2️⃣ Migrating sample data...');
  await db.migrateData(SAMPLE_EPICS, SAMPLE_TASKS);
  
  // Verify
  console.log('\n3️⃣ Verifying data...');
  const epics = await db.getAllEpics();
  const tasks = await db.getAllTasks();
  
  console.log(`   ✅ Loaded ${epics.length} epics`);
  console.log(`   ✅ Loaded ${tasks.length} tasks`);
  
  console.log('\n✅ Sample data loaded successfully! 🎉');
  console.log('\nYou can now start the app with: npm run dev\n');
  
} catch (error) {
  console.error('❌ Error loading sample data:', error);
  process.exit(1);
}
