import express from "express";
import { db } from "../config/db.js"
import { ensureAuthenticated } from "../middlewares/auth.js"

const router = express.Router();

// GET /api/liked/:id — check if current user liked a tweet
router.get("/liked/:id", ensureAuthenticated, async (req, res) => {
  const userId = req.user.id;
  const tweetId = parseInt(req.params.id);
  try {
    const result = await db.query(
      "SELECT 1 FROM likes WHERE user_id = $1 AND tweet_id = $2",
      [userId, tweetId]
    );
    res.status(200).json({ liked: result.rowCount > 0 });
  } catch (err) {
    console.error("Error checking like status:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST /api/like/:id — like a tweet
router.post("/like/:id", ensureAuthenticated, async (req, res) => {
  const userId = req.user.id;
  const tweetId = parseInt(req.params.id);
  try {
    await db.query(
      "INSERT INTO likes (user_id, tweet_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, tweetId]
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error liking post:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// DELETE /api/unlike/:id — unlike a tweet
router.delete("/unlike/:id", ensureAuthenticated, async (req, res) => {
  const userId = req.user.id;
  const tweetId = parseInt(req.params.id);
  try {
    await db.query("DELETE FROM likes WHERE user_id = $1 AND tweet_id = $2", [
      userId,
      tweetId,
    ]);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error unliking post:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;