import "dotenv/config";
import express from "express";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import cors from "cors";
import { auth } from "./auth.js";
import ideasRouter from "./routes/ideas.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());

app.use("/api/ideas", ideasRouter);

app.get("/", (_req, res) => {
  res.send("Server is running!");
});

app.get("/api/me", async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    return res.json(session);
  } catch (err) {
    console.error("Session error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
