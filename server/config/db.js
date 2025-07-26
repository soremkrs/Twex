import pg from "pg"; // PostgreSQL client for Node.js
import env from "dotenv";
env.config(); // Load environment variables from .env file

// Create and export a PostgreSQL client instance using environment variables
export const db = new pg.Client({
  user: process.env.PG_USER,       // Database username
  host: process.env.PG_HOST,       // Database host (e.g., localhost or a remote server)
  database: process.env.PG_DATABASE, // Name of the database
  password: process.env.PG_PASSWORD, // User password
  port: process.env.PG_PORT,         // Port number (default PostgreSQL is 5432)
});

// Connect to the PostgreSQL database
db.connect(); // Establish the connection immediately when this module is imported
