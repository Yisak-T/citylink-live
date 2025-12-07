# CityLink Live 

CityLink Live is a full-stack web app that lets users register, log in, pick a city, and see:

- Live weather data
- Recent news headlines
- A real-time city chat room

It integrates external APIs, real-time WebSocket communication, and a SQLite database.

## Stack

- **Frontend:** React + Vite, Axios, React Router
- **Backend:** Node.js, Express, Socket.io
- **Database:** SQLite (stored as `citylink.db` in backend)
- **External APIs:** OpenWeatherMap (weather), NewsAPI (news)
- **Auth:** JWT (JSON Web Tokens) + bcrypt password hashing

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/username/citylink-live.git
cd citylink-live