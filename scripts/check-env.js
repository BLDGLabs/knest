import dotenv from 'dotenv';
dotenv.config();

console.log('Environment check:');
console.log('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
console.log('- AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
console.log('- AWS_REGION:', process.env.AWS_REGION || '❌ Missing');
console.log('- DYNAMODB_TABLE_NAME:', process.env.DYNAMODB_TABLE_NAME || '❌ Missing');
console.log('\nValues:');
console.log('- typeof window:', typeof window);
console.log('- isBrowser:', typeof window !== 'undefined');
