import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    favorite_city: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const primaryButtonStyle = {
    background: "#0f172a",
    color: "#f9fafb",
    padding: "8px 14px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.95rem",
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/register", form);
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Failed to register. Try another email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#fff7e6",
      }}
    >
      <div
        style={{
          maxWidth: "400px",
          width: "100%",
          background: "#ffffff",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ marginBottom: "10px" }}>Register</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "10px" }}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>Favorite City (optional)</label>
            <input
              type="text"
              name="favorite_city"
              value={form.favorite_city}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </div>
          <button type="submit" disabled={loading} style={primaryButtonStyle}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;