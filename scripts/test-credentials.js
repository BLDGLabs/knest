import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';

dotenv.config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

console.log('Testing AWS credentials...');
console.log('Region:', process.env.AWS_REGION);
console.log('Access Key:', process.env.AWS_ACCESS_KEY_ID);
console.log('Secret Key length:', process.env.AWS_SECRET_ACCESS_KEY?.length);

try {
  const result = await client.send(new ListTablesCommand({}));
  console.log('✅ Connection successful!');
  console.log('Tables:', result.TableNames);
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.error(error);
}
