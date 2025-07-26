import express from "express";
import { db } from "../config/db.js";
import { ensureAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// GET /notifications/check
// Checks if there are new posts by users the current user follows since their last check
router.get("/notifications/check", ensureAuthenticated, async (req, res) => {
  const currentUserId = req.user.id;          // ID of the logged-in user
  const lastSeen = req.query.lastSeen;        // Timestamp of the last notification check (expected as a query param)

  // Validate that lastSeen parameter is provided
  if (!lastSeen) {
    return res.status(400).json({ message: "Missing lastSeen parameter" });
  }

  try {
    // Query to count tweets posted after 'lastSeen' by users the current user follows
    const query = `
      SELECT COUNT(*) AS new_post_count
      FROM tweets
      WHERE user_id IN (
        SELECT following_id FROM follows WHERE follower_id = $1
      )
      AND date > $2
    `;

    // Execute the query with current user ID and lastSeen timestamp
    const result = await db.query(query, [currentUserId, lastSeen]);

    // Parse the count of new posts
    const newPostCount = parseInt(result.rows[0].new_post_count, 10);

    // Return true if there are new posts, false otherwise
    res.json({ hasNew: newPostCount > 0 });
  } catch (err) {
    console.error("Notification check error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;