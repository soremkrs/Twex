import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
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
      // Get posts only from users the current user is following
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
          ) AS liked_by_current_user
        FROM tweets
        JOIN users ON tweets.user_id = users.id
        LEFT JOIN likes ON likes.tweet_id = tweets.id
        LEFT JOIN replies ON replies.id = tweets.id
        WHERE tweets.user_id IN (
          SELECT following_id FROM follows WHERE follower_id = $1
        )
        GROUP BY tweets.id, users.id
        ORDER BY tweets.id DESC
        LIMIT $2 OFFSET $3
      `;
      values = [currentUserId, limit, offset];
    } else {
      // Default: get all posts
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
          ) AS liked_by_current_user
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
      res.status(201).json({ user: newUser });
    }
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/signin", passport.authenticate("local"), (req, res) => {
  res.status(201).json({ user: req.user });
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



passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query(
        "SELECT * FROM users WHERE username = $1 ",
        [username]
      );
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found!");
      }
    } catch (err) {
      console.log(err);
    }
  })
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/auth/google/twex",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const username = profile.displayName;

        // Check if user already exists
        const existingUser = await db.query(
          "SELECT * FROM users WHERE email = $1",
          [email]
        );

        let user;
        if (existingUser.rows.length > 0) {
          user = existingUser.rows[0];
        } else {
          // Insert new user into DB
          const insertResult = await db.query(
            "INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *",
            [username, email]
          );
          user = insertResult.rows[0];
        }

        return done(null, user); // Store user in session
      } catch (err) {
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
