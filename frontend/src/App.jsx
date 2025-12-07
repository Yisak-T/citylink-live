import React from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import LoginPage from "./Pages/LoginPage.jsx";
import RegisterPage from "./Pages/RegisterPage.jsx";
import Dashboard from "./Pages/Dashboard.jsx";
import ProfilePage from "./Pages/ProfilePage.jsx";
import AdminPanel from "./Pages/AdminPanel.jsx";

function App() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const user = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navButtonStyle = {
    display: "inline-block",
    padding: "6px 14px",
    marginRight: "10px",
    borderRadius: "999px",
    background: "#0f172a", // blue-black
    color: "#f9fafb",
    textDecoration: "none",
    border: "1px solid #020617",
    fontSize: "0.9rem",
  };

  const navButtonAsButtonStyle = {
    ...navButtonStyle,
    border: "none",
    cursor: "pointer",
    marginRight: 0,
  };

  return (
    <div>
      {/* Top navbar */}
      <nav
        style={{
          padding: "10px 20px",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#fff3d6", // lighter cream strip
        }}
      >
        <div>
          <Link to="/" style={navButtonStyle}>
            Home
          </Link>

          {!token && (
            <>
              <Link to="/login" style={navButtonStyle}>
                Login
              </Link>
              <Link to="/register" style={navButtonStyle}>
                Register
              </Link>
            </>
          )}

          {token && (
            <>
              <Link to="/profile" style={navButtonStyle}>
                Profile
              </Link>
              {user?.is_admin ? (
                <Link to="/admin" style={navButtonStyle}>
                  Admin
                </Link>
              ) : null}
            </>
          )}
        </div>

        <div>
          {user && (
            <span style={{ marginRight: "10px" }}>
              Hi, {user.username}
            </span>
          )}
          {token && (
            <button
              onClick={handleLogout}
              style={navButtonAsButtonStyle}
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </div>
  );
}

export default App;