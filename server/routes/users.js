import express from "express";
import { db } from "../config/db.js"
import { ensureAuthenticated } from "../middlewares/auth.js"

const router = express.Router();

router.get("/:username/profile", ensureAuthenticated, async (req, res) => {
  const { username } = req.params;
  try {
    const userRes = await db.query(`SELECT * FROM users WHERE username = $1`, [
      username,
    ]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = userRes.rows[0];
    const [tweetCountRes, followerCountRes, followingCountRes] =
      await Promise.all([
        db.query(`SELECT COUNT(*) FROM tweets WHERE user_id = $1`, [user.id]),
        db.query(`SELECT COUNT(*) FROM follows WHERE following_id = $1`, [
          user.id,
        ]),
        db.query(`SELECT COUNT(*) FROM follows WHERE follower_id = $1`, [
          user.id,
        ]),
      ]);
    const tweet_count = parseInt(tweetCountRes.rows[0].count, 10);
    const follower_count = parseInt(followerCountRes.rows[0].count, 10);
    const following_count = parseInt(followingCountRes.rows[0].count, 10);
    res.json({
      ...user,
      tweet_count,
      follower_count,
      following_count,
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/users/:id/posts", ensureAuthenticated, async (req, res) => {
  const currentUserId = req.user.id; // logged-in user
  const profileUserId = req.params.id; // profile being viewed
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
          SELECT 1 FROM likes WHERE user_id = $1 AND tweet_id = tweets.id
        ) AS liked_by_current_user,
        EXISTS (
          SELECT 1 FROM bookmarks
          WHERE bookmarks.user_id = $1 AND bookmarks.tweet_id = tweets.id
        ) AS bookmarked_by_current_user
      FROM tweets
      JOIN users ON tweets.user_id = users.id
      LEFT JOIN likes ON likes.tweet_id = tweets.id
      LEFT JOIN replies ON replies.tweet_id = tweets.id
      WHERE tweets.user_id = $2
      GROUP BY tweets.id, users.id
      ORDER BY tweets.id DESC
      LIMIT $3 OFFSET $4
    `;
    const values = [currentUserId, profileUserId, limit, offset];
    const result = await db.query(query, values);
    res.status(200).json({ posts: result.rows });
  } catch (err) {
    console.error("Error fetching user's posts:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/users/:id/replies", ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  try {
    const result = await db.query(
      `
      SELECT
        r.id AS reply_id,
        r.content AS reply_content,
        TO_CHAR(r.date, 'DD-MM-YYYY') AS reply_date,
        r.image_url AS reply_image_url,
        r.user_id AS reply_user_id,
        ru.username AS reply_username,
        ru.real_name AS reply_real_name,
        ru.avatar_url AS reply_avatar_url,
        r.tweet_id,

        t.id AS tweet_id,
        t.content AS tweet_content,
        TO_CHAR(t.date, 'DD-MM-YYYY') AS tweet_date,
        t.image_url AS tweet_image_url,
        t.user_id AS tweet_user_id,
        tu.username AS tweet_username,
        tu.real_name AS tweet_real_name,
        tu.avatar_url AS tweet_avatar_url

      FROM replies r
      JOIN users ru ON r.user_id = ru.id
      JOIN tweets t ON r.tweet_id = t.id
      JOIN users tu ON t.user_id = tu.id
      WHERE r.user_id = $1
      ORDER BY r.id DESC
      LIMIT $2 OFFSET $3
      `,
      [id, limit, offset]
    );
    res.status(200).json({ replies: result.rows });
  } catch (err) {
    console.error("Error fetching replies:", err.message);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.get("/users/:id/likes", ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  try {
    const result = await db.query(
      `
      SELECT
        t.id,
        t.content,
        TO_CHAR(t.date, 'DD-MM-YYYY') AS date,
        t.image_url,
        t.user_id,
        u.username,
        u.real_name,
        u.avatar_url,
        COUNT(DISTINCT l2.user_id) AS total_likes,
        COUNT(DISTINCT r.id) AS total_replies,
        EXISTS (
          SELECT 1 FROM likes WHERE user_id = $1 AND tweet_id = t.id
        ) AS liked_by_current_user,
        EXISTS (
          SELECT 1 FROM bookmarks WHERE user_id = $1 AND tweet_id = t.id
        ) AS bookmarked_by_current_user
      FROM likes l
      JOIN tweets t ON l.tweet_id = t.id
      JOIN users u ON t.user_id = u.id
      LEFT JOIN likes l2 ON l2.tweet_id = t.id
      LEFT JOIN replies r ON r.tweet_id = t.id
      WHERE l.user_id = $1
      GROUP BY t.id, u.id
      ORDER BY t.date DESC
      LIMIT $2 OFFSET $3
    `,
      [id, limit, offset]
    );
    res.status(200).json({ likes: result.rows });
  } catch (err) {
    console.error("Error fetching liked posts:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/users/:id/following", ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  try {
    const result = await db.query(
      `
      SELECT
        u.id,
        u.username,
        u.real_name,
        u.avatar_url,
        u.bio
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = $1
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [id, limit, offset]
    );
    res.status(200).json({ following: result.rows });
  } catch (err) {
    console.error("Error fetching following users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/users/:id/followers", ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  try {
    const result = await db.query(
      `
      SELECT
        u.id,
        u.username,
        u.real_name,
        u.avatar_url,
        u.bio
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = $1
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [id, limit, offset]
    );
    res.status(200).json({ followers: result.rows });
  } catch (err) {
    console.error("Error fetching followers:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/users/suggestions", ensureAuthenticated, async (req, res) => {
  const currentUserId = req.user.id;
  const limit = parseInt(req.query.limit, 10) || 5;
  try {
    // Fetch random users excluding current user and those already followed
    const query = `
      SELECT id, username, real_name, avatar_url, bio
      FROM users
      WHERE id <> $1
      AND id NOT IN (
        SELECT following_id FROM follows WHERE follower_id = $1
      )
      ORDER BY RANDOM()
      LIMIT $2
    `;
    const values = [currentUserId, limit];
    const result = await db.query(query, values);
    res.status(200).json({ users: result.rows });
  } catch (err) {
    console.error("Error fetching suggestions:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;