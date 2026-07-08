import { Router } from "express";
import { ObjectId } from "mongodb";
import { requireAdmin } from "../middleware/admin.js";
import { db } from "../auth.js";

const router = Router();

// All admin routes require authentication + admin role
router.use(requireAdmin);

// ──────────────────────────────────────────────
// GET /api/admin/stats — Dashboard statistics
// ──────────────────────────────────────────────
router.get("/stats", async (_req, res) => {
  try {
    const [totalUsers, totalIdeas] = await Promise.all([
      db.collection("user").countDocuments(),
      db.collection("ideas").countDocuments(),
    ]);

    // Count all comments across all ideas
    const commentAgg = await db
      .collection("ideas")
      .aggregate([
        { $project: { commentCount: { $size: { $ifNull: ["$comments", []] } } } },
        { $group: { _id: null, totalComments: { $sum: "$commentCount" } } },
      ])
      .toArray();

    const totalComments = commentAgg[0]?.totalComments || 0;

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalIdeas,
        totalComments,
      },
    });
  } catch (err) {
    console.error("GET /api/admin/stats error:", err);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ──────────────────────────────────────────────
// GET /api/admin/users — Paginated user list
// ──────────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);
    const search = req.query.search?.trim();

    const filter = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      db
        .collection("user")
        .find(filter)
        .project({ name: 1, email: 1, role: 1, emailVerified: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("user").countDocuments(filter),
    ]);

    return res.json({ success: true, users, total, limit, skip });
  } catch (err) {
    console.error("GET /api/admin/users error:", err);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ──────────────────────────────────────────────
// PATCH /api/admin/users/:id/role — Change user role
// ──────────────────────────────────────────────
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'user' or 'admin'" });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Prevent self-demotion
    if (id === req.userId && role !== "admin") {
      return res.status(400).json({ error: "You cannot change your own role" });
    }

    const result = await db.collection("user").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { role } },
      { returnDocument: "after", projection: { name: 1, email: 1, role: 1 } },
    );

    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ success: true, user: result });
  } catch (err) {
    console.error("PATCH /api/admin/users/:id/role error:", err);
    return res.status(500).json({ error: "Failed to update user role" });
  }
});

// ──────────────────────────────────────────────
// DELETE /api/admin/users/:id — Delete a user
// ──────────────────────────────────────────────
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Prevent self-deletion
    if (id === req.userId) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    const user = await db.collection("user").findOneAndDelete({
      _id: new ObjectId(id),
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Also delete all ideas by this user
    await db.collection("ideas").deleteMany({ userId: id });

    return res.json({ success: true, message: "User and their ideas deleted" });
  } catch (err) {
    console.error("DELETE /api/admin/users/:id error:", err);
    return res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
