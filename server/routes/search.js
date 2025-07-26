import express from "express";
import { db } from "../config/db.js"
import { ensureAuthenticated } from "../middlewares/auth.js"

const router = express.Router();

router.get("/search/users", ensureAuthenticated, async (req, res) => {
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

export default router;