import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    base: './', // Use relative paths for assets
    define: {
      'import.meta.env.VITE_AWS_ACCESS_KEY_ID': JSON.stringify(env.AWS_ACCESS_KEY_ID),
      'import.meta.env.VITE_AWS_SECRET_ACCESS_KEY': JSON.stringify(env.AWS_SECRET_ACCESS_KEY),
      'import.meta.env.VITE_AWS_REGION': JSON.stringify(env.AWS_REGION),
      'import.meta.env.VITE_DYNAMODB_TABLE_NAME': JSON.stringify(env.DYNAMODB_TABLE_NAME),
    },
  }
})
