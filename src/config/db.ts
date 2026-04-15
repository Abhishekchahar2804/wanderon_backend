import mongoose from 'mongoose';

export const connectDatabase = async (mongoUri: string): Promise<void> => {
  console.log('Connecting to MongoDB...');

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection failed.', error);
    throw error;
  }
};
