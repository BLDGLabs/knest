import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
  ScanCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';

// Detect environment
const isBrowser = typeof window !== 'undefined';

// Load environment variables in Node.js
if (!isBrowser) {
  try {
    const dotenv = await import('dotenv');
    dotenv.config();
  } catch (e) {
    // dotenv not available in browser, that's ok
  }
}

// Configuration
const config = isBrowser ? {
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
} : {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

// Debug logging (remove after fixing)
console.log('DynamoDB Config:', {
  isBrowser,
  region: config.region,
  hasAccessKey: !!config.credentials?.accessKeyId,
  hasSecretKey: !!config.credentials?.secretAccessKey,
  accessKeyPreview: config.credentials?.accessKeyId?.substring(0, 8) + '...',
});

const client = new DynamoDBClient(config);
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = isBrowser ? import.meta.env.VITE_DYNAMODB_TABLE_NAME : process.env.DYNAMODB_TABLE_NAME;

// ==================== EPICS ====================

export async function createEpic(epic) {
  const item = {
    PK: `EPIC#${epic.id}`,
    SK: 'METADATA',
    type: 'epic',
    id: epic.id,
    name: epic.name,
    description: epic.description,
    color: epic.color,
    createdAt: epic.createdAt,
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  }));

  return epic;
}

export async function getEpic(epicId) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `EPIC#${epicId}`,
      SK: 'METADATA',
    },
  }));

  return result.Item;
}

export async function getAllEpics() {
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

export async function updateEpic(epicId, updates) {
  const epic = await getEpic(epicId);
  if (!epic) throw new Error('Epic not found');

  const updatedEpic = {
    ...epic,
    ...updates,
    id: epicId, // Ensure ID doesn't change
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: updatedEpic,
  }));

  return updatedEpic;
}

export async function deleteEpic(epicId) {
  // Delete the epic metadata
  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `EPIC#${epicId}`,
      SK: 'METADATA',
    },
  }));

  // Update all tasks that reference this epic
  const tasks = await getAllTasks();
  const tasksToUpdate = tasks.filter(task => task.epicId === epicId);

  for (const task of tasksToUpdate) {
    await updateTask(task.id, { epicId: null });
  }
}

// ==================== TASKS ====================

export async function createTask(task) {
  const item = {
    PK: `TASK#${task.id}`,
    SK: 'METADATA',
    type: 'task',
    id: task.id,
    title: task.title,
    description: task.description,
    column: task.column,
    tags: task.tags,
    epicId: task.epicId || 'NONE', // Use 'NONE' for GSI queries
    taskId: task.id.toString(), // For GSI1
    assignedTo: task.assignedTo || 'UNASSIGNED', // Use 'UNASSIGNED' for GSI queries
    dependsOn: task.dependsOn || [],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt || null,
    dueDate: task.dueDate || null,
    priority: task.priority || 'none',
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: item,
  }));

  // Create dependency records
  if (task.dependsOn && task.dependsOn.length > 0) {
    await setTaskDependencies(task.id, task.dependsOn);
  }

  return task;
}

export async function getTask(taskId) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `TASK#${taskId}`,
      SK: 'METADATA',
    },
  }));

  return result.Item;
}

export async function getAllTasks() {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk AND (attribute_not_exists(deleted) OR deleted = :false)',
    ExpressionAttributeValues: {
      ':prefix': 'TASK#',
      ':sk': 'METADATA',
      ':false': false,
    },
  }));

  // Convert back to frontend format
  return (result.Items || []).map(item => ({
    ...item,
    epicId: item.epicId === 'NONE' ? null : item.epicId,
    assignedTo: item.assignedTo === 'UNASSIGNED' ? null : item.assignedTo,
  }));
}

export async function getTasksByEpic(epicId) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'GSI1',
    KeyConditionExpression: 'epicId = :epicId',
    ExpressionAttributeValues: {
      ':epicId': epicId,
    },
  }));

  return (result.Items || []).map(item => ({
    ...item,
    epicId: item.epicId === 'NONE' ? null : item.epicId,
    assignedTo: item.assignedTo === 'UNASSIGNED' ? null : item.assignedTo,
  }));
}

export async function getTasksByAssignee(assignee) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'GSI2',
    KeyConditionExpression: 'assignedTo = :assignedTo',
    ExpressionAttributeValues: {
      ':assignedTo': assignee || 'UNASSIGNED',
    },
  }));

  return (result.Items || []).map(item => ({
    ...item,
    epicId: item.epicId === 'NONE' ? null : item.epicId,
    assignedTo: item.assignedTo === 'UNASSIGNED' ? null : item.assignedTo,
  }));
}

export async function updateTask(taskId, updates) {
  const task = await getTask(taskId);
  if (!task) throw new Error('Task not found');

  const updatedTask = {
    ...task,
    ...updates,
    id: taskId, // Ensure ID doesn't change
    taskId: taskId.toString(),
    epicId: updates.epicId !== undefined ? (updates.epicId || 'NONE') : task.epicId,
    assignedTo: updates.assignedTo !== undefined ? (updates.assignedTo || 'UNASSIGNED') : task.assignedTo,
    updatedAt: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: updatedTask,
  }));

  // Update dependencies if changed
  if (updates.dependsOn !== undefined) {
    await setTaskDependencies(taskId, updates.dependsOn);
  }

  return {
    ...updatedTask,
    epicId: updatedTask.epicId === 'NONE' ? null : updatedTask.epicId,
    assignedTo: updatedTask.assignedTo === 'UNASSIGNED' ? null : updatedTask.assignedTo,
  };
}

export async function deleteTask(taskId) {
  // Soft delete: mark as deleted with timestamp (keep existing data)
  const task = await getTask(taskId);
  if (!task) return;
  
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      ...task,
      deleted: true,
      deletedAt: new Date().toISOString(),
    },
  }));
}

export async function getDeletedTasks() {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk AND deleted = :true',
    ExpressionAttributeValues: {
      ':prefix': 'TASK#',
      ':sk': 'METADATA',
      ':true': true,
    },
  }));

  // Convert back to frontend format
  return (result.Items || []).map(item => ({
    ...item,
    epicId: item.epicId === 'NONE' ? null : item.epicId,
    assignedTo: item.assignedTo === 'UNASSIGNED' ? null : item.assignedTo,
  }));
}

export async function undeleteTask(taskId) {
  // Restore task by removing deleted flag
  const task = await getTask(taskId);
  if (!task) return;
  
  const { deleted, deletedAt, ...taskWithoutDeleteFlags } = task;
  
  await docClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: taskWithoutDeleteFlags,
  }));
}

export async function hardDeleteTask(taskId) {
  // Permanent delete: remove the task and dependencies
  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `TASK#${taskId}`,
      SK: 'METADATA',
    },
  }));

  // Delete all dependency records
  await clearTaskDependencies(taskId);
}

export async function cleanupOldDeletedTasks(daysOld = 7) {
  const deletedTasks = await getDeletedTasks();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const tasksToHardDelete = deletedTasks.filter(task => {
    if (!task.deletedAt) return false;
    return new Date(task.deletedAt) < cutoffDate;
  });

  for (const task of tasksToHardDelete) {
    await hardDeleteTask(task.id);
  }

  return tasksToHardDelete.length;
}

// ==================== DEPENDENCIES ====================

export async function setTaskDependencies(taskId, dependsOnIds) {
  // First, clear existing dependencies
  await clearTaskDependencies(taskId);

  if (!dependsOnIds || dependsOnIds.length === 0) return;

  // Create new dependency records
  const items = [];
  
  for (const depId of dependsOnIds) {
    // DEPENDS_ON record (taskId depends on depId)
    items.push({
      PutRequest: {
        Item: {
          PK: `TASK#${taskId}`,
          SK: `DEPENDS_ON#${depId}`,
          type: 'dependency',
          taskId: taskId.toString(),
          dependentTaskId: depId.toString(),
        },
      },
    });

    // BLOCKS record (depId blocks taskId)
    items.push({
      PutRequest: {
        Item: {
          PK: `TASK#${depId}`,
          SK: `BLOCKS#${taskId}`,
          type: 'blocker',
          taskId: depId.toString(),
          blockedTaskId: taskId.toString(),
        },
      },
    });
  }

  // Batch write (max 25 items per request)
  for (let i = 0; i < items.length; i += 25) {
    const batch = items.slice(i, i + 25);
    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: batch,
      },
    }));
  }
}

export async function clearTaskDependencies(taskId) {
  // Get all DEPENDS_ON records
  const dependsOnResult = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `TASK#${taskId}`,
      ':sk': 'DEPENDS_ON#',
    },
  }));

  // Get all BLOCKS records
  const blocksResult = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `TASK#${taskId}`,
      ':sk': 'BLOCKS#',
    },
  }));

  const allRecords = [...(dependsOnResult.Items || []), ...(blocksResult.Items || [])];

  if (allRecords.length === 0) return;

  // Delete all dependency records
  const deleteItems = allRecords.map(item => ({
    DeleteRequest: {
      Key: {
        PK: item.PK,
        SK: item.SK,
      },
    },
  }));

  // Batch delete (max 25 items per request)
  for (let i = 0; i < deleteItems.length; i += 25) {
    const batch = deleteItems.slice(i, i + 25);
    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: batch,
      },
    }));
  }
}

export async function getTaskDependencies(taskId) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `TASK#${taskId}`,
      ':sk': 'DEPENDS_ON#',
    },
  }));

  return (result.Items || []).map(item => parseInt(item.dependentTaskId));
}

export async function getBlockedTasks(taskId) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `TASK#${taskId}`,
      ':sk': 'BLOCKS#',
    },
  }));

  return (result.Items || []).map(item => parseInt(item.blockedTaskId));
}

// ==================== MIGRATION & UTILITIES ====================

export async function migrateData(epics, tasks) {
  console.log('Starting migration...');
  
  // Migrate epics
  for (const epic of epics) {
    await createEpic(epic);
  }
  console.log(`Migrated ${epics.length} epics`);

  // Migrate tasks
  for (const task of tasks) {
    await createTask(task);
  }
  console.log(`Migrated ${tasks.length} tasks`);

  console.log('✅ Migration complete!');
}

export async function clearAllData() {
  // Get all items
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
  }));

  if (!result.Items || result.Items.length === 0) {
    console.log('No data to clear');
    return;
  }

  // Delete all items
  const deleteItems = result.Items.map(item => ({
    DeleteRequest: {
      Key: {
        PK: item.PK,
        SK: item.SK,
      },
    },
  }));

  // Batch delete (max 25 items per request)
  for (let i = 0; i < deleteItems.length; i += 25) {
    const batch = deleteItems.slice(i, i + 25);
    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: batch,
      },
    }));
  }

  console.log(`✅ Cleared ${deleteItems.length} items`);
}
