import express from "express";
import { db } from "../config/db.js";
import { ensureAuthenticated } from "../middlewares/auth.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

/**
 * GET /posts
 * Fetch posts with optional filter:
 * - type=all: all posts
 * - type=following: posts only from users the current user follows
 * Supports pagination with page query param.
 */
router.get("/posts", ensureAuthenticated, async (req, res) => {
  const currentUserId = req.user?.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const filter = req.query.type || "all"; // default to "all"

  try {
    let query;
    let values;

    if (filter === "following") {
      query = `
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
            SELECT 1 FROM likes WHERE likes.user_id = $1 AND likes.tweet_id = tweets.id
          ) AS liked_by_current_user,
          EXISTS (
            SELECT 1 FROM bookmarks WHERE bookmarks.user_id = $1 AND bookmarks.tweet_id = tweets.id
          ) AS bookmarked_by_current_user
        FROM tweets
        JOIN users ON tweets.user_id = users.id
        LEFT JOIN likes ON likes.tweet_id = tweets.id
        LEFT JOIN replies ON replies.tweet_id = tweets.id
        WHERE tweets.user_id IN (
          SELECT following_id FROM follows WHERE follower_id = $1
        )
        GROUP BY tweets.id, users.id
        ORDER BY tweets.id DESC
        LIMIT $2 OFFSET $3
      `;
      values = [currentUserId, limit, offset];
    } else {
      query = `
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
            SELECT 1 FROM likes WHERE likes.user_id = $1 AND likes.tweet_id = tweets.id
          ) AS liked_by_current_user,
          EXISTS (
            SELECT 1 FROM bookmarks WHERE bookmarks.user_id = $1 AND bookmarks.tweet_id = tweets.id
          ) AS bookmarked_by_current_user
        FROM tweets
        JOIN users ON tweets.user_id = users.id
        LEFT JOIN likes ON likes.tweet_id = tweets.id
        LEFT JOIN replies ON replies.tweet_id = tweets.id
        GROUP BY tweets.id, users.id
        ORDER BY tweets.id DESC
        LIMIT $2 OFFSET $3
      `;
      values = [currentUserId, limit, offset];
    }

    const result = await db.query(query, values);
    res.status(200).json({ posts: result.rows });
  } catch (err) {
    console.error("Fetch posts error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /post/:id
 * Fetch a single post by id
 */
router.get("/post/:id", ensureAuthenticated, async (req, res) => {
  const postId = req.params.id;
  try {
    const result = await db.query(
      `
      SELECT
        tweets.id,
        tweets.content,
        tweets.image_url,
        tweets.user_id,
        users.username,
        users.real_name,
        users.avatar_url
      FROM tweets
      JOIN users ON tweets.user_id = users.id
      WHERE tweets.id = $1
      `,
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    } else {
      res.status(200).json({ post: result.rows[0] });
    }
  } catch (err) {
    console.error("Fetch single post error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /create/post
 * Create a new post with optional image upload
 */
router.post("/create/post", ensureAuthenticated, upload.single("image"), async (req, res) => {
  const { content } = req.body;
  const imageUrl = req.file?.path || null;

  try {
    await db.query(
      `INSERT INTO tweets (user_id, content, image_url) VALUES ($1, $2, $3)`,
      [req.user.id, content, imageUrl]
    );

    res.status(201).json({ message: "Post created", imageUrl });
  } catch (err) {
    console.error("Post creation failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PUT /edit/post/:id
 * Edit an existing post if owned by the user.
 * Supports updating content, replacing or removing the image.
 */
router.put("/edit/post/:id", ensureAuthenticated, upload.single("image"), async (req, res) => {
  const postId = req.params.id;
  const userId = req.user?.id;
  const { content, removeImage } = req.body;

  try {
    // Check post ownership
    const result = await db.query("SELECT * FROM tweets WHERE id = $1", [postId]);
    const post = result.rows[0];
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.user_id !== userId) return res.status(403).json({ error: "Unauthorized" });

    let imageUrl = post.image_url;

    if (req.file) {
      // Replace with new image URL from Cloudinary upload
      imageUrl = req.file.path;
      // Optionally: delete old image from Cloudinary here if you track public_id
    } else if (removeImage === "true") {
      // Remove the image
      imageUrl = null;
      // Optionally: delete old image from Cloudinary here
    }

    await db.query("UPDATE tweets SET content = $1, image_url = $2 WHERE id = $3", [
      content,
      imageUrl,
      postId,
    ]);

    res.json({ message: "Post updated" });
  } catch (err) {
    console.error("Failed to update post", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

/**
 * DELETE /delete/post/:id
 * Delete a post if owned by the current user
 */
router.delete("/delete/post/:id", ensureAuthenticated, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  try {
    const result = await db.query("SELECT * FROM tweets WHERE id = $1 AND user_id = $2", [
      postId,
      userId,
    ]);
    if (result.rows.length === 0) {
      return res.status(403).json({ message: "You can't delete this post" });
    }

    await db.query("DELETE FROM tweets WHERE id = $1", [postId]);
    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    console.error("Post deletion error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /posts/:id/replies
 * Get all replies to a specific post
 */
router.get("/posts/:id/replies", ensureAuthenticated, async (req, res) => {
  const postId = parseInt(req.params.id);

  try {
    const result = await db.query(
      `
      SELECT
        replies.id,
        replies.content,
        replies.image_url,
        TO_CHAR(replies.date, 'DD-MM-YYYY') AS date,
        replies.user_id,
        users.username,
        users.real_name,
        users.avatar_url
      FROM replies
      JOIN users ON replies.user_id = users.id
      WHERE replies.tweet_id = $1
      ORDER BY replies.id ASC
      `,
      [postId]
    );

    res.status(200).json({ replies: result.rows });
  } catch (err) {
    console.error("Error fetching replies:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /replies
 * Create a new reply to a tweet, with optional image upload
 */
router.post("/replies", ensureAuthenticated, upload.single("image"), async (req, res) => {
  const { content, replyTo } = req.body;
  const imageUrl = req.file?.path || null;

  try {
    await db.query(
      `INSERT INTO replies (tweet_id, user_id, content, image_url) VALUES ($1, $2, $3, $4)`,
      [replyTo, req.user.id, content, imageUrl]
    );
    res.status(201).json({ message: "Post created", imageUrl });
  } catch (err) {
    console.error("Post creation failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE /reply/:id
 * Delete a reply if owned by the user
 */
router.delete("/reply/:id", ensureAuthenticated, async (req, res) => {
  const replyId = req.params.id;
  const userId = req.user.id;

  try {
    const result = await db.query(`SELECT * FROM replies WHERE id = $1`, [replyId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Reply not found" });
    }
    const reply = result.rows[0];
    if (reply.user_id !== userId) {
      return res.status(403).json({ message: "Forbidden: Not your reply" });
    }

    await db.query(`DELETE FROM replies WHERE id = $1`, [replyId]);
    res.status(200).json({ message: "Reply deleted successfully" });
  } catch (err) {
    console.error("Error deleting reply:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;