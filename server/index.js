import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import env from "dotenv";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

env.config();

const app = express();
const port = 3000;
const saltRounds = 10;
const pgSession = connectPgSimple(session);

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

db.connect();

app.use(
  cors({
    origin: process.env.ORIGIN_URL,
    credentials: true,
  })
);

// Session storage in PostgreSQL
app.use(
  session({
    store: new pgSession({
      pool: db, // or use `conObject` instead
      tableName: "user_sessions",
      createTableIfMissing: true, // create the table automatically
      pruneSessionInterval: 3600, // run cleanup every 60 seconds
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: false, // true in production with HTTPS
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "twex",
    transformation: [
      { width: 1080, height: 1080, crop: "limit" },
      { quality: "auto", fetch_format: "auto" },
    ],
  },
});

const upload = multer({ storage });

app.use(passport.initialize());
app.use(passport.session());

app.get("/api/auth/check", (req, res) => {
  if (req.isAuthenticated()) {
    res.status(201).json({ user: req.user });
  } else {
    res.status(200).json({ user: null });
  }
});

app.post("/api/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out" });
    });
  });
});

app.get("/api/posts", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

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

app.get("/api/posts/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

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

app.put("/api/posts/:id", upload.single("image"), async (req, res) => {
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

// POST /api/follow/:id — follow a user
app.post("/api/follow/:id", async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

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

// DELETE /api/unfollow/:id — unfollow a user
app.delete("/api/unfollow/:id", async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

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

// GET /api/following/:id — check if current user follows the given user
app.get("/api/following/:id", async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

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

// POST /api/like/:id — like a tweet
app.post("/api/like/:id", async (req, res) => {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

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
app.delete("/api/unlike/:id", async (req, res) => {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

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

// GET /api/liked/:id — check if current user liked a tweet
app.get("/api/liked/:id", async (req, res) => {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

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

// Start OAuth with Google
app.get(
  "/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/api/auth/google/twex",
  passport.authenticate("google", {
    failureRedirect: "/",
    successRedirect: `${process.env.FRONTEND_URL}/home`,
    session: true, // Session will be created here
  })
);

app.delete("/api/delete/posts/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

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

app.post("/api/auth/signup", async (req, res) => {
  // console.log(req.body);
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    // Check if user already exists
    const existing = await db.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (existing.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Email or username already in use" });
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert user into database
      const result = await db.query(
        "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email",
        [username, email, hashedPassword]
      );

      const newUser = result.rows[0];
      req.login(newUser, (err) => {
        if (err) return next(err);
        return res.status(201).json({ user: newUser });
      });
    }
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/signin", (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      console.error("Auth error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (!user) {
      return res.status(401).json({ message: info?.message || "Login failed" });
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        console.error("Login session error:", loginErr);
        return res.status(500).json({ message: "Login failed" });
      }

      const { password, ...safeUser } = user;
      res.status(200).json({ user: safeUser });
    });
  })(req, res, next);
});

app.post("/api/profile/:id", async (req, res) => {
  const { id } = req.params;
  const { real_name, avatar_url, date_of_birth, bio } = req.body;

  try {
    await db.query(
      `UPDATE users
       SET real_name = $1,
           avatar_url = $2,
           date_of_birth = $3,
           bio = $4
       WHERE id = $5`,
      [real_name, avatar_url, date_of_birth, bio, id]
    );

    res.status(200).json({ message: "Profile updated" });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/edit/profile/:id", async (req, res) => {
  const { id } = req.params;
  const { real_name, avatar_url, date_of_birth, bio } = req.body;

  try {
    const result = await db.query(
      `UPDATE users
       SET real_name = $1,
           avatar_url = $2,
           date_of_birth = $3,
           bio = $4
       WHERE id = $5
       RETURNING *, TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS date_of_birth`,
      [real_name, avatar_url, date_of_birth, bio, id]
    );

    res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/create/post", upload.single("image"), async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

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

app.post("/api/replies", upload.single("image"), async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

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

app.get("/api/posts/:id/replies", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

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

app.delete("/api/reply/:id", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

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

// Bookmarks

app.post("/api/bookmark/:id", async (req, res) => {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

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

app.delete("/api/unbookmark/:id", async (req, res) => {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

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

app.get("/api/bookmarks", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
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

app.get("/api/:username/profile", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

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

app.get("/api/users/:id/posts", async (req, res) => {
  if (!req.isAuthenticated())
    return res.status(401).json({ message: "Unauthorized" });

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

app.get("/api/users/:id/replies", async (req, res) => {
  if (!req.isAuthenticated())
    return res.status(401).json({ message: "Unauthorized" });

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

app.get("/api/users/:id/likes", async (req, res) => {
  if (!req.isAuthenticated())
    return res.status(401).json({ message: "Unauthorized" });

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

app.get("/api/users/:id/following", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

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

app.get("/api/users/:id/followers", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

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

// Example using a timestamp sent by frontend as query param ?lastSeen=...
app.get("/api/notifications/check", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

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

app.get("/api/search/users", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const q = req.query.q;
  if (!q) return res.json([]);

  try {
    const users = await db.query(
      `SELECT id, username, real_name, bio, avatar_url
       FROM users
       WHERE username ILIKE $1 OR real_name ILIKE $1
       LIMIT 20`,
      [`%${q}%`]
    );
    res.json(users.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Search error");
  }
});

// GET /api/users/suggestions?limit=5
app.get("/api/users/suggestions", async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

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

passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "username", // or "email" if logging in via email
      passwordField: "password",
    },
    async (username, password, done) => {
      try {
        const result = await db.query("SELECT * FROM users WHERE username = $1", [
          username,
        ]);

        if (result.rows.length === 0) {
          return done(null, false, { message: "User not found" });
        }

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user);
      } catch (err) {
        console.error("Error in local strategy:", err);
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser(async (user, done) => {
  try {
    const result = await db.query(
      "SELECT *, TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS date_of_birth FROM users WHERE id = $1",
      [user.id]
    );
    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
