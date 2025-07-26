import express from "express";
import { db } from "../config/db.js"
import { ensureAuthenticated } from "../middlewares/auth.js"

const router = express.Router();

router.get("/bookmarks", ensureAuthenticated, async (req, res) => {
  const currentUserId = req.user?.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  try {
    const query = `
      SELECT
          tweets.id,
          tweets.content,
          TO_CHAR(tweets.date, 'DD-MM-YYYY') AS date,
          tweets.image_url,
          tweets.user_id,
          users.username,
          users.real_name,
          users.avatar_url,
          COUNT(DISTINCT likes.user_id) AS total_likes,
          COUNT(DISTINCT replies.id) AS total_replies,
          EXISTS (
            SELECT 1 FROM likes
            WHERE likes.user_id = $1 AND likes.tweet_id = tweets.id
          ) AS liked_by_current_user,
          TRUE AS bookmarked_by_current_user
        FROM tweets
        JOIN users ON tweets.user_id = users.id
        LEFT JOIN likes ON likes.tweet_id = tweets.id
        LEFT JOIN replies ON replies.tweet_id = tweets.id
        JOIN bookmarks ON bookmarks.tweet_id = tweets.id AND bookmarks.user_id = $1
        GROUP BY tweets.id, users.id
        ORDER BY tweets.id DESC
        LIMIT $2 OFFSET $3
    `;
    const values = [currentUserId, limit, offset];
    const result = await db.query(query, values);
    res.status(200).json({ bookmarks: result.rows });
  } catch (err) {
    console.error("Error fetching bookmarks:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/bookmark/:id", ensureAuthenticated, async (req, res) => {
  const userId = req.user.id;
  const tweetId = parseInt(req.params.id);
  try {
    await db.query(
      "INSERT INTO bookmarks (user_id, tweet_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, tweetId]
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error bookmarking post:", err);
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/unbookmark/:id", ensureAuthenticated, async (req, res) => {
  const userId = req.user.id;
  const tweetId = parseInt(req.params.id);
  try {
    await db.query(
      "DELETE FROM bookmarks WHERE user_id = $1 AND tweet_id = $2",
      [userId, tweetId]
    );
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error removing bookmark:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;