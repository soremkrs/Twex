import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import env from "dotenv";
import cors from "cors";

const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

app.use(
  cors({
    origin: process.env.ORIGIN_URL, // or 3000 if you're using CRA
    credentials: true,               // optional, only needed if you're using cookies/sessions
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

db.connect();

// Start OAuth with Google
app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/api/auth/google/twex",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res) => {
    // Mock token — replace with real JWT later
    const mockToken = "mock-jwt-token";
    res.redirect(`${process.env.FRONTEND_URL}/?token=${mockToken}`);
  }
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
      return res.status(400).json({ message: "Email or username already in use" });
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

app.post("/api/auth/signin", async (req, res) => {
  console.log(req.body);
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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/auth/google/twex",
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("Google profile:", profile);

      // OPTIONAL: Save to DB here if needed
      // const existingUser = await db.query("SELECT * FROM users WHERE email = $1", [profile.email]);

      // if (!existingUser.rows.length) {
      //   await db.query("INSERT INTO users (email, name) VALUES ($1, $2)", [profile.email, profile.displayName]);
      // }

      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
