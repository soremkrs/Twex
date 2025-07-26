import express from "express";
import { db } from "../config/db.js"
import { ensureAuthenticated } from "../middlewares/auth.js"

const router = express.Router();

router.post("/profile/:id", ensureAuthenticated, async (req, res) => {
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

router.put("/edit/profile/:id", ensureAuthenticated, async (req, res) => {
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

export default router;