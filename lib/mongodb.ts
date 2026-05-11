import mongoose from "mongoose";

/** Default local DB name matches production database: kamarenmujikke */
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/kamarenmujikke";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cache;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }
  if (cache.conn) {
    return cache.conn;
  }
  if (!cache.promise) {
    const opts = { bufferCommands: false };
    cache.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m);
  }
  try {
    cache.conn = await cache.promise;
  } catch (e) {
    cache.promise = null;
    throw e;
  }
  return cache.conn;
}
