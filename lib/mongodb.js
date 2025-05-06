import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) throw new Error("⚠️ MONGODB_URI fehlt in .env.local");

let cached = global.mongoose || { conn: null, promise: null };

async function connectToDatabase() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { dbName: "kalender" });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;
