# CityLink Live

CityLink Live is a full-stack web application that lets users:

- Register, log in, and edit their profile (including favorite city)
- See live **weather** for a chosen city
- See recent **news headlines** related to that city
- Join a **real-time chat room** for that city

It integrates external APIs, real-time WebSocket communication, and a SQLite database.  
This project was built as a semester project for **“Integration with External API”**.

---

## Tech Stack

**Frontend**

- React + Vite
- React Router
- Axios

**Backend**

- Node.js + Express
- Socket.io (real-time chat)
- JWT (JSON Web Tokens) for auth
- bcrypt for password hashing
- SQLite for persistent storage

**External APIs**

- [Weatherstack](https://weatherstack.com/) – current weather data  
- [Newsdata.io](https://newsdata.io/) – latest news articles

---

## Features

- **User management**
  - Registration, login, logout
  - JWT-based authentication
  - Profile editing (username, favorite city)
  - Users can delete their own account

- **Real-time communication**
  - City-based chat rooms using Socket.io
  - Messages persisted in SQLite
  - When a user selects a city, they join that city’s room and see recent history

- **External API integration**
  - Weatherstack used to fetch current weather for a city
  - Newsdata.io used to fetch the latest news articles about that city
  - Errors from external APIs are handled and surfaced to the UI

- **Admin panel**
  - Admin can view all users
  - Edit users (username, favorite city, admin flag)
  - Delete user accounts
  - Default admin account is created automatically in the database

- **Security**
  - Passwords hashed with bcrypt
  - JWT tokens used for protected routes
  - API keys stored in `.env` (never committed to Git)
  - Basic validation on backend + minimal validation on frontend

---

## Project Structure

```text
citylink-live/
  backend/
    index.js        # Express app + REST API + Socket.io
    db.js           # SQLite connection and schema
    package.json
    .env.example    # Sample environment file (no real secrets)
    citylink.db     # SQLite DB (created at runtime, ignored by Git)
  frontend/
    src/
      App.jsx
      api.js
      Pages/
        LoginPage.jsx
        RegisterPage.jsx
        Dashboard.jsx
        ProfilePage.jsx
        AdminPanel.jsx
    package.json
  .gitignore
  README.md

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/username/citylink-live.git
cd citylink-live
