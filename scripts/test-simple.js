import dotenv from 'dotenv';
dotenv.config();

import * as db from '../src/services/dynamodb.js';

console.log('Testing single operation...\n');

try {
  // Just try to scan
  const result = await db.getAllTasks();
  console.log('✅ Success! Got', result.length, 'tasks');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
}
