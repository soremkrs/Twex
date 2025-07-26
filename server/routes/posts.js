import express from "express";
import { db } from "../config/db.js"
import { ensureAuthenticated } from "../middlewares/auth.js"
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.get("/posts", ensureAuthenticated, async (req, res) => {
  const currentUserId = req.user?.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const filter = req.query.type || "all"; // "all" or "following"

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
            SELECT 1 FROM likes
            WHERE likes.user_id = $1 AND likes.tweet_id = tweets.id
          ) AS liked_by_current_user,
          EXISTS (
            SELECT 1 FROM bookmarks
            WHERE bookmarks.user_id = $1 AND bookmarks.tweet_id = tweets.id
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
            SELECT 1 FROM likes
            WHERE likes.user_id = $1 AND likes.tweet_id = tweets.id
          ) AS liked_by_current_user,
          EXISTS (
            SELECT 1 FROM bookmarks
            WHERE bookmarks.user_id = $1 AND bookmarks.tweet_id = tweets.id
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

router.post("/create/post", ensureAuthenticated, upload.single("image"), async (req, res) => {
  const { content } = req.body;
  const imageUrl = req.file?.path || null;
  const date = new Date().toISOString().split("T")[0];
  try {
    await db.query(
      `INSERT INTO tweets (user_id, content, date, image_url) VALUES ($1, $2, $3, $4)`,
      [req.user.id, content, date, imageUrl]
    );

    res.status(201).json({ message: "Post created", imageUrl });
  } catch (err) {
    console.error("Post creation failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/edit/post/:id", ensureAuthenticated, upload.single("image"), async (req, res) => {
  const postId = req.params.id;
  const userId = req.user?.id;
  const { content, removeImage } = req.body;
  try {
    // Check post exists and belongs to the user
    const result = await db.query("SELECT * FROM tweets WHERE id = $1", [
      postId,
    ]);
    const post = result.rows[0];
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.user_id !== userId)
      return res.status(403).json({ error: "Unauthorized" });

    let imageUrl = post.image_url;
    // If a new image is uploaded, replace the old one
    if (req.file) {
      // Optionally delete old image from Cloudinary here
      imageUrl = req.file.path; // Cloudinary URL
    } else if (removeImage === "true") {
      // Remove the image if instructed
      imageUrl = null;
      // Optionally delete from Cloudinary if you store the public_id
    }
    await db.query(
      "UPDATE tweets SET content = $1, image_url = $2 WHERE id = $3",
      [content, imageUrl, postId]
    );
    res.json({ message: "Post updated" });
  } catch (err) {
    console.error("Failed to update post", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/delete/post/:id", ensureAuthenticated, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  try {
    // First, check if the post exists and belongs to the current user
    const result = await db.query(
      "SELECT * FROM tweets WHERE id = $1 AND user_id = $2",
      [postId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ message: "You can't delete this post" });
    } else {
      // Delete the post
      await db.query("DELETE FROM tweets WHERE id = $1", [postId]);
    }
    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    console.error("Post deletion error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

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

router.post("/replies", ensureAuthenticated, upload.single("image"), async (req, res) => {
  const { content, replyTo } = req.body;
  const imageUrl = req.file?.path || null;
  const date = new Date().toISOString().split("T")[0];
  try {
    await db.query(
      `INSERT INTO replies (tweet_id, user_id, content, date, image_url) VALUES ($1, $2, $3, $4, $5)`,
      [replyTo, req.user.id, content, date, imageUrl]
    );
    res.status(201).json({ message: "Post created", imageUrl });
  } catch (err) {
    console.error("Post creation failed:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/reply/:id", ensureAuthenticated, async (req, res) => {
  const replyId = req.params.id;
  const userId = req.user.id;
  try {
    // Ensure the reply exists and belongs to the user
    const result = await db.query(`SELECT * FROM replies WHERE id = $1`, [
      replyId,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Reply not found" });
    }
    const reply = result.rows[0];
    if (reply.user_id !== userId) {
      return res.status(403).json({ message: "Forbidden: Not your reply" });
    }
    // Delete the reply
    await db.query(`DELETE FROM replies WHERE id = $1`, [replyId]);
    res.status(200).json({ message: "Reply deleted successfully" });
  } catch (err) {
    console.error("Error deleting reply:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;