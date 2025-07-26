import express from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import { db } from "../config/db.js";

const router = express.Router();
const saltRounds = 10;

router.post("/signup", async (req, res, next) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ message: "Missing fields" });

  try {
    const existing = await db.query("SELECT * FROM users WHERE email = $1 OR username = $2", [email, username]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: "Email or username already in use" });

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const result = await db.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, hashedPassword]
    );

    const newUser = result.rows[0];
    req.login(newUser, (err) => {
      if (err) return next(err);
      res.status(201).json({ user: newUser });
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/signin", passport.authenticate("local"), (req, res) => {
  const { password, ...safeUser } = req.user;
  res.status(200).json({ user: safeUser });
});

router.post("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out" });
    });
  });
});

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/twex", passport.authenticate("google", {
  failureRedirect: "/",
  successRedirect: `${process.env.FRONTEND_URL}/home`,
  session: true,
}));

router.get("/check", (req, res) => {
  res.status(200).json({ user: req.user || null });
});

export default router;
