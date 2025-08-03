// Import core packages and third-party middleware
import express from "express"; // Main framework for building the server
import session from "express-session"; // Handles user session storage
import cors from "cors"; // Enables Cross-Origin Resource Sharing (for frontend-backend communication)
import passport from "passport"; // Authentication middleware
import env from "dotenv"; // Loads environment variables from .env file
import connectPgSimple from "connect-pg-simple"; // PostgreSQL session store for express-session

// Import database connection and passport configuration
import { db } from "./config/db.js"; // PostgreSQL connection pool
import configurePassport from "./config/passport.js"; // Custom configuration for passport strategies

// Import route modules
import authRoutes from "./routes/auth.js";
import postsRoutes from "./routes/posts.js";
import profileRoutes from "./routes/profile.js";
import likesRoutes from "./routes/likes.js";
import followsRoutes from "./routes/follows.js";
import bookmarksRoutes from "./routes/bookmarks.js";
import notificationsRoutes from "./routes/notifications.js";
import searchRoutes from "./routes/search.js";
import usersRoutes from "./routes/users.js";

// Load environment variables
env.config();

const app = express();
const port = process.env.PORT;
const pgSession = connectPgSimple(session); // Initialize session store with PostgreSQL

// Enable CORS with credentials for frontend-backend communication
app.use(cors({ origin: process.env.ORIGIN_URL, credentials: true }));

// Middleware to parse incoming JSON and URL-encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const isProduction = process.env.NODE_ENV === "production";

// Configure session management with PostgreSQL as the storage
app.use(
  session({
    store: new pgSession({
      pool: db, // PostgreSQL connection pool
      tableName: "user_sessions", // Session table name
      createTableIfMissing: true, // Auto-create table if it doesn't exist
      pruneSessionInterval: 3600, // Clean up expired sessions every hour
    }),
    secret: process.env.SESSION_SECRET, // Secret for signing session cookies
    resave: false, // Do not save session if unmodified
    saveUninitialized: false, // Don't save empty sessions
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // Cookie lifespan (24 hours)
      secure: isProduction, // Should be true in production (with HTTPS)
      httpOnly: true, // Prevents client-side JS from accessing cookies
      sameSite: isProduction ? "none" : "lax", // Helps with CSRF protection while still allowing top-level navigation
    },
  })
);

// Initialize and configure Passport for authentication
app.use(passport.initialize());
app.use(passport.session());
configurePassport(passport); // Apply custom strategies and serialization

// Mount route handlers with respective API prefixes
app.use("/api/auth", authRoutes); // Authentication routes
app.use("/api", postsRoutes); // Posts CRUD and interactions
app.use("/api", profileRoutes); // Profile information and updates
app.use("/api", likesRoutes); // Like and unlike functionality
app.use("/api", followsRoutes); // Follow/unfollow logic
app.use("/api", bookmarksRoutes); // Bookmarking posts
app.use("/api", notificationsRoutes); // Notification system
app.use("/api", searchRoutes); // Search users or posts
app.use("/api", usersRoutes); // General user-related actions

// Start the Express server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
