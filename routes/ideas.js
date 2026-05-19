const express = require("express");
const { fromNodeHeaders } = require("better-auth/node");
const { auth, db } = require("../auth");
const { ObjectId } = require("mongodb");

const router = express.Router();
const ideasCollection = () => db.collection("ideas");

async function requireAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.userId = session.user.id;
    req.session = session;
    next();
  } catch (err) {
    console.error("Session verification error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 100);
}

router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      title,
      shortDesc,
      detailedDesc,
      category,
      tags,
      imageUrl,
      budget,
      targetAudience,
      problemStatement,
      proposedSolution,
    } = req.body;

    const errors = [];
    if (!title || typeof title !== "string" || title.trim().length < 3) {
      errors.push("Title is required (min 3 characters)");
    }
    if (
      !shortDesc ||
      typeof shortDesc !== "string" ||
      shortDesc.trim().length < 10
    ) {
      errors.push("Short description is required (min 10 characters)");
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join("; ") });
    }

    const sanitisedTags = Array.isArray(tags)
      ? tags
          .map((t) => (typeof t === "string" ? t.trim().slice(0, 25) : ""))
          .filter(Boolean)
          .slice(0, 8)
      : [];

    const now = new Date();
    const idea = {
      userId: req.userId,
      title: title.trim(),
      slug: createSlug(title),
      shortDesc: (shortDesc || "").trim(),
      detailedDesc: (detailedDesc || "").trim(),
      category: category || "",
      tags: sanitisedTags,
      imageUrl: (imageUrl || "").trim() || null,
      budget: budget !== undefined && budget !== "" ? Number(budget) : null,
      targetAudience: (targetAudience || "").trim(),
      problemStatement: (problemStatement || "").trim(),
      proposedSolution: (proposedSolution || "").trim(),
      createdAt: now,
      updatedAt: now,
    };

    const result = await ideasCollection().insertOne(idea);
    const inserted = { _id: result.insertedId, ...idea };

    return res.status(201).json({ success: true, idea: inserted });
  } catch (err) {
    console.error("POST /api/ideas error:", err);
    return res.status(500).json({ error: "Failed to save idea" });
  }
});

router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);
    const filter = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const [ideas, total] = await Promise.all([
      ideasCollection()
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      ideasCollection().countDocuments(filter),
    ]);

    return res.json({ success: true, ideas, total, limit, skip });
  } catch (err) {
    console.error("GET /api/ideas error:", err);
    return res.status(500).json({ error: "Failed to fetch ideas" });
  }
});

router.get("/my", requireAuth, async (req, res) => {
  try {
    const filter = { userId: req.userId };

    const [ideas, total] = await Promise.all([
      ideasCollection()
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray(),
      ideasCollection().countDocuments(filter),
    ]);

    return res.json({ success: true, ideas, total });
  } catch (err) {
    console.error("GET /api/ideas/my error:", err);
    return res.status(500).json({ error: "Failed to fetch your ideas" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const idea = await ideasCollection().findOne({
      _id: new ObjectId(id),
    });

    if (!idea || idea.userId !== userId) {
      return res.status(404).json({ error: "Idea not found" });
    }

    const {
      title,
      shortDesc,
      detailedDesc,
      category,
      tags,
      imageUrl,
      budget,
      targetAudience,
      problemStatement,
      proposedSolution,
    } = req.body;

    const updates = { updatedAt: new Date() };

    if (title !== undefined) updates.title = title;
    if (shortDesc !== undefined) updates.shortDesc = shortDesc;
    if (detailedDesc !== undefined) updates.detailedDesc = detailedDesc;
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = tags;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (budget !== undefined) updates.budget = budget;
    if (targetAudience !== undefined) updates.targetAudience = targetAudience;
    if (problemStatement !== undefined) updates.problemStatement = problemStatement;
    if (proposedSolution !== undefined) updates.proposedSolution = proposedSolution;

    const updatedIdea = await ideasCollection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" }
    );

    return res.json({ success: true, idea: updatedIdea });
  } catch (err) {
    console.error("PUT /api/ideas/:id error:", err);
    return res.status(500).json({ error: "Failed to update idea" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const idea = await ideasCollection().findOne({
      _id: new ObjectId(id),
    });

    if (!idea || idea.userId !== userId) {
      return res.status(404).json({ error: "Idea not found" });
    }

    await ideasCollection().deleteOne({ _id: new ObjectId(id) });

    return res.json({ success: true, message: "Idea deleted" });
  } catch (err) {
    console.error("DELETE /api/ideas/:id error:", err);
    return res.status(500).json({ error: "Failed to delete idea" });
  }
});

module.exports = router;