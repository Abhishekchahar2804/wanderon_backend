import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';

const startServer = async (): Promise<void> => {
  await connectDatabase(env.mongoUri);

  const app = createApp(env);
  app.listen(env.port, () => {
    console.log(`Backend server running on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});

