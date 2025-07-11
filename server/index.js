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
    folder: "twex", // Cloudinary folder
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
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

app.post("/api/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out" });
    });
  });
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
