import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';

const startServer = async (): Promise<void> => {
  await connectDatabase(env.mongoUri);

  console.log('Starting backend server...');
  const app = createApp(env);
  app.listen(env.port, () => {
    console.log(`Backend server is running on port ${env.port}.`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start application.', error);
  process.exit(1);
});
