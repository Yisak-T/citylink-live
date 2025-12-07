import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

function ProfilePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    username: "",
    favorite_city: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const primaryButtonStyle = {
    background: "#0f172a",
    color: "#f9fafb",
    padding: "8px 14px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.95rem",
  };

  const deleteButtonStyle = {
    color: "#fff",
    background: "#dc2626",
    padding: "6px 12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    marginTop: "10px",
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/me");
        const user = res.data.user;
        setForm({
          email: user.email,
          username: user.username,
          favorite_city: user.favorite_city || "",
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await api.put("/profile", {
        username: form.username,
        favorite_city: form.favorite_city,
      });

      setSuccess("Profile updated");

      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        u.username = res.data.user.username;
        u.favorite_city = res.data.user.favorite_city;
        localStorage.setItem("user", JSON.stringify(u));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const ok = window.confirm(
      "Are you sure you want to delete your account? This cannot be undone."
    );
    if (!ok) return;

    setError("");
    setSuccess("");

    try {
      await api.delete("/profile");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError("Failed to delete account");
    }
  };

  if (loading) {
    return <p style={{ padding: "20px" }}>Loading profile...</p>;
  }

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
          background: "#fff",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h2>My Profile</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "10px" }}>
            <label>Email (read-only)</label>
            <input
              type="email"
              name="email"
              value={form.email}
              readOnly
              style={{
                width: "100%",
                padding: "8px",
                background: "#eee",
                marginTop: "4px",
              }}
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
            <label>Favorite City</label>
            <input
              type="text"
              name="favorite_city"
              value={form.favorite_city}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </div>
          <button type="submit" disabled={saving} style={primaryButtonStyle}>
            {saving ? "Saving..." : "Save"}
          </button>
        </form>

        <div style={{ marginTop: "15px" }}>
          <button
            onClick={handleDeleteAccount}
            style={deleteButtonStyle}
          >
            Delete my account
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;