import express from "express";
import { db } from "../config/db.js";
import { ensureAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// GET /liked/:id
// Check if the current authenticated user has liked the tweet with the given ID
router.get("/liked/:id", ensureAuthenticated, async (req, res) => {
  const userId = req.user.id;              // Logged-in user ID
  const tweetId = parseInt(req.params.id); // Tweet ID from URL

  try {
    // Query to check if a like exists for this user and tweet
    const result = await db.query(
      "SELECT 1 FROM likes WHERE user_id = $1 AND tweet_id = $2",
      [userId, tweetId]
    );

    // Respond with true if liked, false otherwise
    res.status(200).json({ liked: result.rowCount > 0 });
  } catch (err) {
    console.error("Error checking like status:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST /like/:id
// Let the authenticated user like the tweet with the given ID
router.post("/like/:id", ensureAuthenticated, async (req, res) => {
  const userId = req.user.id;             // Logged-in user ID
  const tweetId = parseInt(req.params.id); // Tweet ID from URL

  try {
    // Insert a like record, avoid duplicates using ON CONFLICT DO NOTHING
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

// DELETE /unlike/:id
// Let the authenticated user remove their like from the tweet with the given ID
router.delete("/unlike/:id", ensureAuthenticated, async (req, res) => {
  const userId = req.user.id;              // Logged-in user ID
  const tweetId = parseInt(req.params.id); // Tweet ID from URL

  try {
    // Delete the like record for this user and tweet
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
