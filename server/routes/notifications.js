import express from "express";
import { db } from "../config/db.js"
import { ensureAuthenticated } from "../middlewares/auth.js"

const router = express.Router();

router.get("/notifications/check", ensureAuthenticated, async (req, res) => {
  const currentUserId = req.user.id;
  const lastSeen = req.query.lastSeen;
  if (!lastSeen) {
    return res.status(400).json({ message: "Missing lastSeen parameter" });
  }
  try {
    const query = `
      SELECT COUNT(*) AS new_post_count
      FROM tweets
      WHERE user_id IN (
        SELECT following_id FROM follows WHERE follower_id = $1
      )
      AND date > $2
    `;
    const result = await db.query(query, [currentUserId, lastSeen]);
    const newPostCount = parseInt(result.rows[0].new_post_count, 10);
    res.json({ hasNew: newPostCount > 0 });
  } catch (err) {
    console.error("Notification check error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;