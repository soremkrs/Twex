import express from "express";
import { db } from "../config/db.js";              // Import database connection pool
import { ensureAuthenticated } from "../middlewares/auth.js"; // Middleware to check if user is logged in

const router = express.Router();

// GET /notifications/check
// Checks if the current user has new tweets/posts from the users they follow since their last notification check
router.get("/notifications/check", ensureAuthenticated, async (req, res) => {
  const userId = req.user.id;  // Get current logged-in user ID from request (set by auth middleware)

  try {
    // Fetch the timestamp of the last time this user checked notifications
    const { rows } = await db.query(
      "SELECT last_checked FROM notification_checks WHERE user_id = $1",
      [userId]
    );

    // If no previous record, set lastChecked to epoch start (means never checked)
    const lastChecked = rows.length > 0 ? rows[0].last_checked : new Date(0);

    // Count how many new tweets have been made by users the current user follows, after lastChecked time
    const { rows: newPosts } = await db.query(
      `SELECT COUNT(*) AS new_post_count
       FROM tweets
       WHERE user_id IN (
         SELECT following_id FROM follows WHERE follower_id = $1
       )
       AND date > $2`,
      [userId, lastChecked]
    );

    // If count > 0, user has new notifications
    const hasNew = parseInt(newPosts[0].new_post_count, 10) > 0;

    // Return JSON with boolean flag indicating presence of new notifications
    res.json({ hasNew });
  } catch (err) {
    // Log error and send 500 response on failure
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /notifications/mark-seen
// Marks the notifications as seen by updating the last_checked timestamp to current time
router.post(
  "/notifications/mark-seen",
  ensureAuthenticated,
  async (req, res) => {
    const userId = req.user.id; // Get logged-in user ID

    try {
      // Insert or update the last_checked timestamp for this user to NOW()
      // If user already has a row in notification_checks, update last_checked to current time
      await db.query(
        `INSERT INTO notification_checks (user_id, last_checked)
         VALUES ($1, NOW())
         ON CONFLICT (user_id) DO UPDATE SET last_checked = NOW()`,
        [userId]
      );

      // Respond with success flag
      res.json({ success: true });
    } catch (err) {
      // Handle errors by logging and sending 500 status
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
