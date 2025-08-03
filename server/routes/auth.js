import express from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import { db } from "../config/db.js";

const router = express.Router();
const saltRounds = 10; // Number of rounds for bcrypt password hashing

// Route: User signup - create a new user account
router.post("/signup", async (req, res, next) => {
  const { username, email, password } = req.body;

  // Basic validation: check for missing fields
  if (!username || !email || !password)
    return res.status(400).json({ message: "Missing fields" });

  try {
    // Check if email or username is already taken
    const existing = await db.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );
    if (existing.rows.length > 0)
      return res
        .status(400)
        .json({ message: "Email or username already in use" });

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user into database
    const result = await db.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, hashedPassword]
    );

    const newUser = result.rows[0];

    // Automatically log in the user after signup
    req.login(newUser, (err) => {
      if (err) return next(err);
      res.status(201).json({ user: newUser }); // Return new user info (without password)
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" }); // Generic error message for unexpected failures
  }
});

// Route: User signin - authenticate with local strategy (username/email + password)
router.post(
  "/signin",
  passport.authenticate("local"), // Use Passport local strategy to authenticate
  (req, res) => {
    // Exclude password from returned user data for security
    const { password, ...safeUser } = req.user;
    res.status(200).json({ user: safeUser }); // Send back sanitized user info
  }
);

// Route: User logout - destroy session and clear cookie
router.post("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid"); // Clear session cookie
      res.status(200).json({ message: "Logged out" });
    });
  });
});

// Route: Initiate Google OAuth login flow
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }) // Request Google profile and email scopes
);

// Route: Google OAuth callback URL after authentication
router.get(
  "/google/twex",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    // Redirect to a frontend route that handles the session check and redirection
    res.redirect(`${process.env.FRONTEND_URL}/google-redirect`);
  }
);


// Route: Check if user is logged in - returns user info or null
router.get("/check", (req, res) => {
  res.status(200).json({ user: req.user || null });
});

export default router;
