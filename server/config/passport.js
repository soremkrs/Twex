import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import { db } from "./db.js";

export default function configurePassport(passport) {
  passport.use(
    new LocalStrategy({ usernameField: "username", passwordField: "password" }, async (username, password, done) => {
      try {
        const res = await db.query("SELECT * FROM users WHERE username = $1 OR email = $1", [username]);
        const user = res.rows[0];
        if (!user) return done(null, false, { message: "User not found" });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return done(null, false, { message: "Invalid password" });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/api/auth/google/twex",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const username = profile.displayName;

          const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
          let user = result.rows[0];

          if (!user) {
            const insert = await db.query(
              "INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *",
              [username, email]
            );
            user = insert.rows[0];
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const res = await db.query("SELECT *, TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS date_of_birth FROM users WHERE id = $1", [id]);
    done(null, res.rows[0]);
  });
}
