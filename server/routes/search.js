import express from "express";
import { db } from "../config/db.js";
import { ensureAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// GET /search/users — search users by username or real name (case-insensitive)
router.get("/search/users", ensureAuthenticated, async (req, res) => {
  const q = req.query.q; // search query string

  // If no query provided, return empty array immediately
  if (!q) return res.json([]);

  try {
    // Search users where username or real_name contains the query (case-insensitive)
    const users = await db.query(
      `SELECT id, username, real_name, bio, avatar_url
       FROM users
       WHERE username ILIKE $1 OR real_name ILIKE $1
       LIMIT 20`,
      [`%${q}%`] // parameterized query with wildcard for partial matching
    );

    // Respond with the matched user rows
    res.json(users.rows);
  } catch (err) {
    // Log error and send generic error response
    console.error(err);
    res.status(500).send("Search error");
  }
});

export default router;
