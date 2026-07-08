import { Router } from "express";
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

export default router;
