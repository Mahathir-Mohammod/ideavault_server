import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ideavault";

let client;
let db;

try {
  client = new MongoClient(MONGODB_URI);
  db = client.db();
} catch (err) {
  console.error("Failed to initialize MongoDB client:", err.message);
  process.exit(1);
}

const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3000"],
  database: mongodbAdapter(db, {
    client,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: false,
    minPasswordLength: 6,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
});

process.on("SIGINT", async () => {
  try {
    await client.close();
    console.log("MongoDB connection closed.");
  } catch (_) {}
  process.exit(0);
});

process.on("SIGTERM", async () => {
  try {
    await client.close();
    console.log("MongoDB connection closed.");
  } catch (_) {}
  process.exit(0);
});

export { auth, client, db };
