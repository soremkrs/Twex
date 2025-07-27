import { Strategy as LocalStrategy } from "passport-local"; // Local username/password strategy
import { Strategy as GoogleStrategy } from "passport-google-oauth20"; // Google OAuth 2.0 strategy
import bcrypt from "bcrypt"; // Password hashing and verification
import { db } from "./db.js"; // Database client connection

export default function configurePassport(passport) {
  // LocalStrategy for username/email and password login
  passport.use(
    new LocalStrategy(
      { usernameField: "username", passwordField: "password" }, // Fields from login form
      async (username, password, done) => {
        try {
          // Look up user by username or email in the database
          const res = await db.query("SELECT * FROM users WHERE username = $1 OR email = $1", [username]);
          const user = res.rows[0];

          // If user not found, fail authentication
          if (!user) return done(null, false, { message: "User not found" });

          // Verify password hash against provided password
          const valid = await bcrypt.compare(password, user.password);
          if (!valid) return done(null, false, { message: "Invalid password" });

          // Successful authentication
          return done(null, user);
        } catch (err) {
          // Handle unexpected errors
          return done(err);
        }
      }
    )
  );

  // Google OAuth2 strategy for logging in with Google account
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID, // Google OAuth client ID
        clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Google OAuth client secret
        callbackURL: process.env.GOOGLE_CALLBACK_URL, // OAuth callback URL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user info from Google profile
          const email = profile.emails[0].value;
          const username = profile.displayName;

          // Check if user already exists in database by email
          const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
          let user = result.rows[0];

          // If user does not exist, create a new record
          if (!user) {
            const insert = await db.query(
              "INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *",
              [username, email]
            );
            user = insert.rows[0];
          }

          // Complete authentication with user object
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Serialize user ID into session cookie
  passport.serializeUser((user, done) => done(null, user.id));

  // Deserialize user by ID from session cookie, fetching full user data from DB
  passport.deserializeUser(async (id, done) => {
    const res = await db.query(
      "SELECT *, TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS date_of_birth FROM users WHERE id = $1",
      [id]
    );
    done(null, res.rows[0]);
  });
}
