import * as db from '../src/services/dynamodb.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing DynamoDB Integration...\n');

async function runTests() {
  try {
    // Clear existing data
    console.log('1️⃣ Clearing existing data...');
    await db.clearAllData();
    console.log('   ✅ Data cleared\n');

    // Test 1: Create Epics
    console.log('2️⃣ Testing Epic Creation...');
    const epic1 = {
      id: 'epic-test-1',
      name: 'Test Epic 1',
      description: 'Testing epic functionality',
      color: '#3b82f6',
      createdAt: new Date().toISOString(),
    };
    await db.createEpic(epic1);
    console.log('   ✅ Epic created:', epic1.name);

    const epic2 = {
      id: 'epic-test-2',
      name: 'Test Epic 2',
      description: 'Another test epic',
      color: '#8b5cf6',
      createdAt: new Date().toISOString(),
    };
    await db.createEpic(epic2);
    console.log('   ✅ Epic created:', epic2.name);

    // Test 2: Get All Epics
    console.log('\n3️⃣ Testing Get All Epics...');
    const epics = await db.getAllEpics();
    console.log('   ✅ Retrieved', epics.length, 'epics');

    // Test 3: Create Tasks
    console.log('\n4️⃣ Testing Task Creation...');
    const task1 = {
      id: 1,
      title: 'Test Task 1',
      description: 'First test task',
      column: 'Backlog',
      tags: ['test', 'feature'],
      epicId: 'epic-test-1',
      assignedTo: 'Miti',
      dependsOn: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.createTask(task1);
    console.log('   ✅ Task created:', task1.title);

    const task2 = {
      id: 2,
      title: 'Test Task 2',
      description: 'Second test task',
      column: 'In Progress',
      tags: ['test'],
      epicId: 'epic-test-1',
      assignedTo: 'Jason',
      dependsOn: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.createTask(task2);
    console.log('   ✅ Task created:', task2.title);

    const task3 = {
      id: 3,
      title: 'Test Task 3 (depends on Task 2)',
      description: 'Third test task with dependency',
      column: 'Backlog',
      tags: ['test'],
      epicId: 'epic-test-2',
      assignedTo: 'Miti',
      dependsOn: [2],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.createTask(task3);
    console.log('   ✅ Task created:', task3.title);

    // Test 4: Get All Tasks
    console.log('\n5️⃣ Testing Get All Tasks...');
    const tasks = await db.getAllTasks();
    console.log('   ✅ Retrieved', tasks.length, 'tasks');

    // Test 5: Query Tasks by Epic (GSI1)
    console.log('\n6️⃣ Testing GSI1: Query Tasks by Epic...');
    const epic1Tasks = await db.getTasksByEpic('epic-test-1');
    console.log('   ✅ Retrieved', epic1Tasks.length, 'tasks for Epic 1');
    epic1Tasks.forEach(t => console.log('     -', t.title));

    // Test 6: Query Tasks by Assignee (GSI2)
    console.log('\n7️⃣ Testing GSI2: Query Tasks by Assignee...');
    const mitiTasks = await db.getTasksByAssignee('Miti');
    console.log('   ✅ Retrieved', mitiTasks.length, 'tasks for Miti');
    mitiTasks.forEach(t => console.log('     -', t.title));

    // Test 7: Get Task Dependencies
    console.log('\n8️⃣ Testing Task Dependencies...');
    const deps = await db.getTaskDependencies(3);
    console.log('   ✅ Task 3 depends on:', deps);

    const blocked = await db.getBlockedTasks(2);
    console.log('   ✅ Task 2 blocks:', blocked);

    // Test 8: Update Task
    console.log('\n9️⃣ Testing Task Update...');
    await db.updateTask(1, { column: 'In Progress', assignedTo: 'Jason' });
    const updatedTask = await db.getTask(1);
    console.log('   ✅ Task updated:', updatedTask.title);
    console.log('     - Column:', updatedTask.column);
    console.log('     - Assigned to:', updatedTask.assignedTo);

    // Test 9: Update Epic
    console.log('\n🔟 Testing Epic Update...');
    await db.updateEpic('epic-test-1', { name: 'Updated Epic Name' });
    const updatedEpic = await db.getEpic('epic-test-1');
    console.log('   ✅ Epic updated:', updatedEpic.name);

    // Test 10: Delete Task
    console.log('\n1️⃣1️⃣ Testing Task Deletion...');
    await db.deleteTask(2);
    const remainingTasks = await db.getAllTasks();
    console.log('   ✅ Task deleted, remaining tasks:', remainingTasks.length);

    // Test 11: Delete Epic
    console.log('\n1️⃣2️⃣ Testing Epic Deletion...');
    await db.deleteEpic('epic-test-2');
    const remainingEpics = await db.getAllEpics();
    console.log('   ✅ Epic deleted, remaining epics:', remainingEpics.length);

    // Final verification
    console.log('\n📊 Final State:');
    const finalTasks = await db.getAllTasks();
    const finalEpics = await db.getAllEpics();
    console.log('   - Total Tasks:', finalTasks.length);
    console.log('   - Total Epics:', finalEpics.length);

    console.log('\n✅ All tests passed! 🎉\n');
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await db.clearAllData();
    console.log('   ✅ Cleanup complete\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
