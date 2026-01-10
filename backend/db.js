const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");

// Create or open the database file
const dbPath = path.join(__dirname, "citylink.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database at", dbPath);
  }
});

// Create tables if they don't exist and seed default admin if needed
db.serialize(() => {
  // Users table (now includes api_token)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      username TEXT NOT NULL,
      favorite_city TEXT,
      is_admin INTEGER DEFAULT 0,
      api_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      city TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // add api_token column in case the table existed from an older version
  db.run(`ALTER TABLE users ADD COLUMN api_token TEXT`, (err) => {
    if (err) {
      // If it's a duplicate column error,  ignore it
      if (err.message && err.message.includes("duplicate column name")) {
        console.log("Column api_token already exists on users table, skipping ALTER.");
      } else {
        console.error("Error adding api_token column:", err.message);
      }
    } else {
      console.log("api_token column added to users table.");
    }
  });

  // ---- Seed default admin if none exists ----
  db.get(
    "SELECT id FROM users WHERE is_admin = 1 LIMIT 1",
    [],
    (err, row) => {
      if (err) {
        console.error("Error checking for admin user:", err.message);
        return;
      }

      if (row) {
        // At least one admin already exists, nothing to do
        console.log("Admin user already exists (id =", row.id + ")");
        return;
      }

      // No admin found -> create default admin
      const email = "admin@citylink.local";
      const username = "Admin";
      const password = "Admin123!"; // Default admin password

      const saltRounds = 10;
      bcrypt.hash(password, saltRounds, (hashErr, hash) => {
        if (hashErr) {
          console.error("Error hashing default admin password:", hashErr);
          return;
        }

        db.run(
          "INSERT INTO users (email, password_hash, username, favorite_city, is_admin, api_token) VALUES (?, ?, ?, ?, 1, NULL)",
          [email, hash, username, null],
          function (insertErr) {
            if (insertErr) {
              console.error(
                "Error inserting default admin user:",
                insertErr.message
              );
            } else {
              console.log(
                "Default admin user created:",
                email,
                "(id =",
                this.lastID + ")"
              );
            }
          }
        );
      });
    }
  );
});

module.exports = db;
