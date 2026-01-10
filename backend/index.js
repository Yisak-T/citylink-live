const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto"); // <-- for personal API tokens
require("dotenv").config();

const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";
const WEATHERSTACK_API_KEY = process.env.WEATHERSTACK_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Middlewares
app.use(cors());
app.use(express.json());

// Simple root route
app.get("/", (req, res) => {
  console.log("GET / was called");
  res.send("CityLink Live backend is running");
});

// Health check route
app.get("/api/health", (req, res) => {
  console.log("GET /api/health was called");
  res.json({ status: "ok", message: "CityLink Live backend is running" });
});

// ---------- Auth Middleware (to protect routes) ----------
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header" });
  }

  const token = authHeader.split(" ")[1]; // "Bearer <token>"
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("JWT verify error:", err);
      return res.status(403).json({ error: "Invalid token" });
    }
    // user: { id, email, username, is_admin }
    req.user = user;
    next();
  });
}

// ---------- Admin Middleware ----------
function adminMiddleware(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

// ---------- API KEY Middleware (personal API for external integrations) ----------
function apiKeyAuth(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res
      .status(401)
      .json({ error: "No API key provided in x-api-key header" });
  }

  db.get(
    "SELECT id, email, username, favorite_city, is_admin FROM users WHERE api_token = ?",
    [apiKey],
    (err, user) => {
      if (err) {
        console.error("DB apiKeyAuth error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (!user) {
        return res.status(401).json({ error: "Invalid API key" });
      }
      req.user = user;
      next();
    }
  );
}

// ---------- Auth Routes ----------

// Register
app.post("/api/register", async (req, res) => {
  const { email, password, username, favorite_city } = req.body;

  // Basic validation
  if (!email || !password || !username) {
    return res
      .status(400)
      .json({ error: "Email, password, and username are required" });
  }

  try {
    // Check if user already exists
    db.get("SELECT id FROM users WHERE email = ?", [email], async (err, row) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (row) {
        return res
          .status(409)
          .json({ error: "User with this email already exists" });
      }

      // Hash password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Insert user (default is_admin = 0, api_token = NULL)
      db.run(
        "INSERT INTO users (email, password_hash, username, favorite_city, is_admin, api_token) VALUES (?, ?, ?, ?, ?, ?)",
        [email, password_hash, username, favorite_city || null, 0, null],
        function (err) {
          if (err) {
            console.error("DB insert error:", err);
            return res.status(500).json({ error: "Failed to create user" });
          }

          const newUser = {
            id: this.lastID,
            email,
            username,
            favorite_city: favorite_city || null,
            is_admin: 0,
          };

          res
            .status(201)
            .json({ message: "User registered successfully", user: newUser });
        }
      );
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Email and password are required" });
  }

  // Find user
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    try {
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Create token
      const tokenPayload = {
        id: user.id,
        email: user.email,
        username: user.username,
        is_admin: user.is_admin,
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "2h" });

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          favorite_city: user.favorite_city,
          is_admin: user.is_admin,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
});

// Get current user (protected) - refetch from DB so profile updates are reflected
app.get("/api/me", authMiddleware, (req, res) => {
  const userId = req.user.id;
  db.get(
    "SELECT id, email, username, favorite_city, is_admin FROM users WHERE id = ?",
    [userId],
    (err, row) => {
      if (err) {
        console.error("DB /me error:", err);
        return res.status(500).json({ error: "Failed to load user" });
      }
      if (!row) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ user: row });
    }
  );
});

// ---------- Profile Routes ----------

// Update own profile (username, favorite_city)
app.put("/api/profile", authMiddleware, (req, res) => {
  const { username, favorite_city } = req.body;
  const userId = req.user.id;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  db.run(
    "UPDATE users SET username = ?, favorite_city = ? WHERE id = ?",
    [username, favorite_city || null, userId],
    function (err) {
      if (err) {
        console.error("DB update profile error:", err);
        return res.status(500).json({ error: "Failed to update profile" });
      }

      res.json({
        message: "Profile updated",
        user: {
          id: userId,
          email: req.user.email,
          username,
          favorite_city: favorite_city || null,
          is_admin: req.user.is_admin,
        },
      });
    }
  );
});

// Delete own profile (and their messages)
app.delete("/api/profile", authMiddleware, (req, res) => {
  const userId = req.user.id;

  // delete messages first to keep DB clean
  db.run("DELETE FROM messages WHERE user_id = ?", [userId], function (err) {
    if (err) {
      console.error("DB delete messages error:", err);
      return res
        .status(500)
        .json({ error: "Failed to delete user messages" });
    }

    db.run("DELETE FROM users WHERE id = ?", [userId], function (err2) {
      if (err2) {
        console.error("DB delete user error:", err2);
        return res.status(500).json({ error: "Failed to delete user" });
      }

      res.json({ message: "Account deleted" });
    });
  });
});

// ---------- Personal API Token Routes (for user external integration) ----------

// Generate or regenerate personal API key
app.post("/api/personal-api-token", authMiddleware, (req, res) => {
  const userId = req.user.id;

  // generate a random 32-byte hex token
  const newToken = crypto.randomBytes(32).toString("hex");

  db.run(
    "UPDATE users SET api_token = ? WHERE id = ?",
    [newToken, userId],
    function (err) {
      if (err) {
        console.error("DB update api_token error:", err);
        return res.status(500).json({ error: "Failed to generate API token" });
      }

      res.json({
        message: "Personal API token generated",
        api_token: newToken, // show full token only here
      });
    }
  );
});

// Get info about existing API token (masked)
app.get("/api/personal-api-token", authMiddleware, (req, res) => {
  const userId = req.user.id;

  db.get(
    "SELECT api_token FROM users WHERE id = ?",
    [userId],
    (err, row) => {
      if (err) {
        console.error("DB read api_token error:", err);
        return res.status(500).json({ error: "Failed to read API token" });
      }

      if (!row || !row.api_token) {
        return res.json({ has_token: false });
      }

      const token = row.api_token;
      const masked =
        token.length > 8
          ? token.slice(0, 4) + "..." + token.slice(-4)
          : "********";

      res.json({
        has_token: true,
        masked_token: masked,
      });
    }
  );
});

// ---------- Admin Routes ----------

// Admin: list all users
app.get("/api/users", authMiddleware, adminMiddleware, (req, res) => {
  db.all(
    "SELECT id, email, username, favorite_city, is_admin, created_at FROM users ORDER BY id",
    [],
    (err, rows) => {
      if (err) {
        console.error("DB users error:", err);
        return res.status(500).json({ error: "Failed to load users" });
      }
      res.json(rows);
    }
  );
});

// Admin: update a user (username, favorite_city, is_admin)
app.put("/api/users/:id", authMiddleware, adminMiddleware, (req, res) => {
  const { username, favorite_city, is_admin } = req.body;
  const userId = req.params.id;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  db.run(
    "UPDATE users SET username = ?, favorite_city = ?, is_admin = ? WHERE id = ?",
    [username, favorite_city || null, is_admin ? 1 : 0, userId],
    function (err) {
      if (err) {
        console.error("DB update user error:", err);
        return res.status(500).json({ error: "Failed to update user" });
      }

      res.json({ message: "User updated" });
    }
  );
});

// Admin: delete a user (and their messages)
app.delete("/api/users/:id", authMiddleware, adminMiddleware, (req, res) => {
  const userId = req.params.id;

  db.run("DELETE FROM messages WHERE user_id = ?", [userId], function (err) {
    if (err) {
      console.error("DB delete messages error:", err);
      return res
        .status(500)
        .json({ error: "Failed to delete user messages" });
    }

    db.run("DELETE FROM users WHERE id = ?", [userId], function (err2) {
      if (err2) {
        console.error("DB delete user error:", err2);
        return res.status(500).json({ error: "Failed to delete user" });
      }

      res.json({ message: "User deleted" });
    });
  });
});

// ---------- External API: Weather (Weatherstack) ----------
app.get("/api/cities/:city/weather", async (req, res) => {
  const city = req.params.city;

  if (!WEATHERSTACK_API_KEY || WEATHERSTACK_API_KEY === "demo") {
    return res.status(500).json({ error: "Weather API key not configured" });
  }

  try {
    const url = `http://api.weatherstack.com/current?access_key=${WEATHERSTACK_API_KEY}&query=${encodeURIComponent(
      city
    )}&units=m`;

    const response = await axios.get(url, { timeout: 5000 });
    const data = response.data;

    // Weatherstack puts errors inside the JSON
    if (data.error) {
      console.error("Weatherstack API error:", data.error);
      const message = data.error.info || "Weather API error";
      const code = data.error.code === 615 ? 404 : 500; // 615 = location not found
      return res.status(code).json({ error: message });
    }

    const result = {
      city: data.location?.name,
      country: data.location?.country,
      temperature: data.current?.temperature,
      feels_like: data.current?.feelslike,
      description: data.current?.weather_descriptions?.[0],
      humidity: data.current?.humidity,
      wind_speed: data.current?.wind_speed,
    };

    res.json(result);
  } catch (error) {
    console.error("Weather API error:", error.message);
    if (error.response) {
      console.error("Weather API response data:", error.response.data);
    }
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

// ---------- External API: News (Newsdata.io) ----------
app.get("/api/cities/:city/news", async (req, res) => {
  const city = req.params.city;

  if (!NEWS_API_KEY || NEWS_API_KEY === "demo") {
    return res.status(500).json({ error: "News API key not configured" });
  }

  try {
    // Newsdata.io "everything" style search
    const url = `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&q=${encodeURIComponent(
      city
    )}&language=en`;

    const response = await axios.get(url, { timeout: 5000 });
    const data = response.data;

    if (data.status !== "success") {
      console.error("Newsdata API error:", data);
      return res.status(500).json({ error: "Failed to fetch news" });
    }

    const articles = data.results || [];

    const result = articles.slice(0, 5).map((a) => ({
      title: a.title,
      description: a.description,
      url: a.link,
      source: a.source_id || a.source || "Unknown",
      publishedAt: a.pubDate || a.pub_date,
    }));

    res.json(result);
  } catch (error) {
    console.error("News API error:", error.message);
    if (error.response) {
      console.error("News API response data:", error.response.data);
    }
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// ---------- Messages (history) ----------
app.get("/api/rooms/:city/messages", authMiddleware, (req, res) => {
  const city = req.params.city;

  db.all(
    `
    SELECT m.id, m.city, m.content, m.created_at, u.username
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.city = ?
    ORDER BY m.created_at ASC
    LIMIT 50
    `,
    [city],
    (err, rows) => {
      if (err) {
        console.error("DB messages error:", err);
        return res.status(500).json({ error: "Failed to load messages" });
      }
      res.json(rows);
    }
  );
});

// ---------- Socket.io Chat ----------
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("joinRoom", ({ city, username }) => {
    if (!city) return;
    socket.join(city);
    console.log(`${username || "Someone"} joined room ${city}`);
  });

  socket.on("chatMessage", (data) => {
    const { city, content, userId, username } = data;
    if (!city || !content || !userId) return;

    db.run(
      "INSERT INTO messages (user_id, city, content) VALUES (?, ?, ?)",
      [userId, city, content],
      function (err) {
        if (err) {
          console.error("DB insert message error:", err);
          return;
        }

        const messagePayload = {
          id: this.lastID,
          city,
          content,
          userId,
          username,
          created_at: new Date().toISOString(),
        };

        io.to(city).emit("chatMessage", messagePayload);
      }
    );
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ---------- External-style endpoints using API key auth ----------

// External: get own user info via x-api-key (no JWT)
app.get("/api/external/me", apiKeyAuth, (req, res) => {
  res.json({ user: req.user });
});

// External: get weather via x-api-key
app.get("/api/external/cities/:city/weather", apiKeyAuth, async (req, res) => {
  const city = req.params.city;

  if (!WEATHERSTACK_API_KEY || WEATHERSTACK_API_KEY === "demo") {
    return res.status(500).json({ error: "Weather API key not configured" });
  }

  try {
    const url = `http://api.weatherstack.com/current?access_key=${WEATHERSTACK_API_KEY}&query=${encodeURIComponent(
      city
    )}&units=m`;

    const response = await axios.get(url, { timeout: 5000 });
    const data = response.data;

    if (data.error) {
      console.error("Weatherstack API error:", data.error);
      const message = data.error.info || "Weather API error";
      const code = data.error.code === 615 ? 404 : 500;
      return res.status(code).json({ error: message });
    }

    const result = {
      city: data.location?.name,
      country: data.location?.country,
      temperature: data.current?.temperature,
      feels_like: data.current?.feelslike,
      description: data.current?.weather_descriptions?.[0],
      humidity: data.current?.humidity,
      wind_speed: data.current?.wind_speed,
    };

    res.json(result);
  } catch (error) {
    console.error("External Weather API error:", error.message);
    if (error.response) {
      console.error("Weather API response data:", error.response.data);
    }
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

// External: get news via x-api-key
app.get("/api/external/cities/:city/news", apiKeyAuth, async (req, res) => {
  const city = req.params.city;

  if (!NEWS_API_KEY || NEWS_API_KEY === "demo") {
    return res.status(500).json({ error: "News API key not configured" });
  }

  try {
    const url = `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&q=${encodeURIComponent(
      city
    )}&language=en`;

    const response = await axios.get(url, { timeout: 5000 });
    const data = response.data;

    if (data.status !== "success") {
      console.error("Newsdata API error:", data);
      return res.status(500).json({ error: "Failed to fetch news" });
    }

    const articles = data.results || [];

    const result = articles.slice(0, 5).map((a) => ({
      title: a.title,
      description: a.description,
      url: a.link,
      source: a.source_id || a.source || "Unknown",
      publishedAt: a.pubDate || a.pub_date,
    }));

    res.json(result);
  } catch (error) {
    console.error("External News API error:", error.message);
    if (error.response) {
      console.error("News API response data:", error.response.data);
    }
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});
