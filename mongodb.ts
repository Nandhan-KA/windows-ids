import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnecting = false;
let connectionAttempts = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // 3 seconds

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'windows_ids';

export async function connectToDatabase(): Promise<{ client: MongoClient, db: Db }> {
  if (db && client) {
    return { client, db };
  }

  if (isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return connectToDatabase();
  }

  try {
    isConnecting = true;
    connectionAttempts++;
    
    if (!client) {
      client = new MongoClient(MONGODB_URI);
    }
    
    await client.connect();
    db = client.db(DB_NAME);
    
    isConnecting = false;
    connectionAttempts = 0;
    console.log('Successfully connected to MongoDB');
    
    return { client, db };
  } catch (error) {
    isConnecting = false;
    console.error('Error connecting to MongoDB:', error);
    
    if (connectionAttempts < MAX_RETRIES) {
      console.log(`Retrying connection (${connectionAttempts}/${MAX_RETRIES}) in ${RETRY_DELAY/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectToDatabase();
    }
    
    throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
  }
}

export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export async function getCollection(collectionName: string) {
  const { db } = await connectToDatabase();
  return db.collection(collectionName);
}

export async function pingMongoDB(): Promise<{ success: boolean, timestamp: number }> {
  try {
    const { client } = await connectToDatabase();
    await client.db().command({ ping: 1 });
    return { success: true, timestamp: Date.now() };
  } catch (error) {
    console.error('MongoDB ping failed:', error);
    return { success: false, timestamp: Date.now() };
  }
}

export async function getDbStatus(): Promise<{
  connected: boolean,
  dbName: string | null,
  collections: string[] | null,
  connectionAttempts: number,
  error: string | null
}> {
  try {
    const { db } = await connectToDatabase();
    const collections = await db.listCollections().toArray();
    return {
      connected: true,
      dbName: db.databaseName,
      collections: collections.map(c => c.name),
      connectionAttempts,
      error: null
    };
  } catch (error) {
    return {
      connected: false,
      dbName: null,
      collections: null,
      connectionAttempts,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 