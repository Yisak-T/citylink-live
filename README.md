# CityLink Live – Semester Project (Web Communication Technologies)

CityLink Live is a web application that lets users:

- Register, log in, and manage their profile
- Join a **city-based real-time chat**
- See **current weather** and **latest news** for a chosen city
- Manage users and roles from an **admin panel**
- Generate a **personal API key** to integrate CityLink Live with external tools

The project demonstrates modern web communication:
- REST APIs (Express)
- Real-time communication (Socket.io)
- External APIs (Weatherstack, Newsdata.io)
- Secure user management and admin control

---

## 1. Features

### Core Features

- **User Management**
  - Registration, login, logout
  - Profile editing (username, favorite city)
  - Account deletion (by user or admin)
- **Real-Time City Chat**
  - Live chat rooms per city using Socket.io
  - Recent message history loaded from the database
- **External APIs**
  - Weather from **Weatherstack**
  - News from **Newsdata.io**
  - Backend handles API errors and timeouts
- **Admin Panel**
  - List all users
  - Edit username, favorite city, admin flag
  - Delete users (also deletes their messages)
- **Personal API Keys (External Integration)**
  - Users can generate a **personal API token** on the Profile page
  - Token is stored in the database (`api_token` column on `users`)
  - External tools can use this token via `x-api-key` header to call limited endpoints:
    - `GET /api/external/me`
    - `GET /api/external/cities/:city/weather`
    - `GET /api/external/cities/:city/news`

---

## 2. Technology Stack

### Backend

- Node.js, Express
- SQLite (via `sqlite3` driver)
- Socket.io (WebSocket real-time chat)
- JWT (JSON Web Tokens) for authentication
- bcrypt for password hashing
- axios for external HTTP calls
- dotenv for environment variables

### Frontend

- React + Vite
- React Router
- socket.io-client
- Simple custom styling (cream background, dark buttons)

---

## 3. Project Structure

```text
citylink-live/
├─ backend/
│  ├─ index.js        # Express app, REST API, Socket.io, external API integration
│  ├─ db.js           # SQLite connection, schema, default admin seeding
│  ├─ .env.example    # Example environment variables
│  └─ package.json
└─ frontend/
   ├─ src/
   │  ├─ api.js             # Axios instance with base URL + JWT
   │  ├─ App.jsx            # Routes + navbar
   │  ├─ pages/
   │  │  ├─ LoginPage.jsx
   │  │  ├─ RegisterPage.jsx
   │  │  ├─ Dashboard.jsx   # Weather, news, city chat
   │  │  ├─ ProfilePage.jsx # Profile + personal API key + delete account
   │  │  └─ AdminPage.jsx   # Admin user management
   └─ package.json

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/username/citylink-live.git
cd citylink-live
