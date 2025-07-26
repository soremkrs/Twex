import express from "express";
import session from "express-session";
import cors from "cors";
import passport from "passport";
import env from "dotenv";
import connectPgSimple from "connect-pg-simple";
import { db } from "./config/db.js";
import configurePassport from "./config/passport.js";

import authRoutes from "./routes/auth.js";
import postsRoutes from "./routes/posts.js";
import profileRoutes from "./routes/profile.js";
import likesRoutes from "./routes/likes.js";
import followsRoutes from "./routes/follows.js";
import bookmarksRoutes from "./routes/bookmarks.js";
import notificationsRoutes from "./routes/notifications.js";
import searchRoutes from "./routes/search.js";
import usersRoutes from "./routes/users.js";

env.config();

const app = express();
const port = process.env.PORT;
const pgSession = connectPgSimple(session);

app.use(cors({ origin: process.env.ORIGIN_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use(passport.initialize());
app.use(passport.session());
configurePassport(passport);

app.use("/api/auth", authRoutes);
app.use("/api", postsRoutes);
app.use("/api", profileRoutes);
app.use("/api", likesRoutes);
app.use("/api", followsRoutes);
app.use("/api", bookmarksRoutes);
app.use("/api", notificationsRoutes);
app.use("/api", searchRoutes);
app.use("/api", usersRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
