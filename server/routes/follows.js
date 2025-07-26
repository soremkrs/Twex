import express from "express";
import { db } from "../config/db.js";
import { ensureAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// GET /following/:id
// Check if the authenticated user is following the user with the given ID
router.get("/following/:id", ensureAuthenticated, async (req, res) => {
  const followerId = req.user.id; // The current logged-in user
  const followingId = parseInt(req.params.id); // The user to check if followed

  try {
    // Query to check if a follow relationship exists between the two users
    const result = await db.query(
      "SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2",
      [followerId, followingId]
    );

    // Respond with true if following exists, otherwise false
    res.json({ isFollowing: result.rowCount > 0 });
  } catch (err) {
    console.error("Error checking following status:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST /follow/:id
// Make the authenticated user follow the user with the given ID
router.post("/follow/:id", ensureAuthenticated, async (req, res) => {
  const followerId = req.user.id; // Current user who wants to follow
  const followingId = parseInt(req.params.id); // User to be followed

  // Prevent users from following themselves
  if (followerId === followingId) {
    return res.status(400).json({ error: "You can't follow yourself" });
  }

  try {
    // Insert follow record if not already existing (ON CONFLICT DO NOTHING)
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

// DELETE /unfollow/:id
// Make the authenticated user unfollow the user with the given ID
router.delete("/unfollow/:id", ensureAuthenticated, async (req, res) => {
  const followerId = req.user.id; // Current user who wants to unfollow
  const followingId = parseInt(req.params.id); // User to be unfollowed

  try {
    // Delete the follow record from the database
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

export default router;
