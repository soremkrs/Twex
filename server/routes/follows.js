import express from "express";
import { db } from "../config/db.js"
import { ensureAuthenticated } from "../middlewares/auth.js"

const router = express.Router();

router.get("/following/:id", ensureAuthenticated, async (req, res) => {
  const followerId = req.user.id;
  const followingId = parseInt(req.params.id);
  try {
    const result = await db.query(
      "SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2",
      [followerId, followingId]
    );
    res.json({ isFollowing: result.rowCount > 0 });
  } catch (err) {
    console.error("Error checking following status:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/follow/:id", ensureAuthenticated, async (req, res) => {
  const followerId = req.user.id;
  const followingId = parseInt(req.params.id);
  if (followerId === followingId) {
    return res.status(400).json({ error: "You can't follow yourself" });
  }
  try {
    await db.query(
      "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [followerId, followingId]
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error following user:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/unfollow/:id", ensureAuthenticated, async (req, res) => {
  const followerId = req.user.id;
  const followingId = parseInt(req.params.id);
  try {
    await db.query(
      "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
      [followerId, followingId]
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error unfollowing user:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;