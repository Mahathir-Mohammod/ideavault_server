import "dotenv/config";
import { MongoClient } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ideavault";
const ADMIN_EMAIL = "mahathirmohammod88@gmail.com";

async function seedAdmin() {
  console.log("Connecting to MongoDB...");
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();
    const users = db.collection("user");

    const user = await users.findOne({ email: ADMIN_EMAIL });

    if (!user) {
      console.log(`\n   User "${ADMIN_EMAIL}" not found in the database.\n`);
      console.log("  Please follow these steps:");
      console.log("  1. Go to the app and sign up at /register");
      console.log(`     Email: ${ADMIN_EMAIL}`);
      console.log("     Password: (your chosen password)");
      console.log("  2. After signing up, run this script again.\n");
      process.exit(1);
    }

    if (user.role === "admin") {
      console.log(`\n   "${ADMIN_EMAIL}" is already an admin.\n`);
    } else {
      await users.updateOne(
        { email: ADMIN_EMAIL },
        { $set: { role: "admin" } },
      );
      console.log(`\n   Admin role assigned to "${ADMIN_EMAIL}"!\n`);
      console.log("  Log out and log back in for the changes to take effect.\n");
    }
  } catch (err) {
    console.error("Seed script error:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedAdmin();
