import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function verifyTable() {
  try {
    const result = await client.send(
      new DescribeTableCommand({ TableName: process.env.DYNAMODB_TABLE_NAME })
    );

    console.log('✅ Table Status:', result.Table.TableStatus);
    console.log('✅ Table Name:', result.Table.TableName);
    console.log('✅ Item Count:', result.Table.ItemCount);
    console.log('✅ Table Size:', result.Table.TableSizeBytes, 'bytes');
    console.log('\n📊 Key Schema:');
    result.Table.KeySchema.forEach(key => {
      console.log(`  - ${key.AttributeName} (${key.KeyType})`);
    });
    console.log('\n🔍 Global Secondary Indexes:');
    result.Table.GlobalSecondaryIndexes?.forEach(gsi => {
      console.log(`  - ${gsi.IndexName}:`);
      gsi.KeySchema.forEach(key => {
        console.log(`    ${key.AttributeName} (${key.KeyType})`);
      });
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyTable();
