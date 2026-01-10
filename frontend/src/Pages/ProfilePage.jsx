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

  // Personal API key state
  const [apiInfo, setApiInfo] = useState({
    has_token: false,
    masked_token: "",
  });
  const [apiTokenFull, setApiTokenFull] = useState("");
  const [apiLoading, setApiLoading] = useState(false);

  const primaryButtonStyle = {
    background: "#0f172a",
    color: "#f9fafb",
    padding: "8px 14px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.95rem",
    minWidth: "120px",
  };

  const deleteButtonStyle = {
    color: "#fff",
    background: "#dc2626",
    padding: "6px 12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    marginTop: "10px",
    minWidth: "140px",
  };

  useEffect(() => {
    const loadProfile = async () => {
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

    const loadApiInfo = async () => {
      try {
        const res = await api.get("/personal-api-token");
        setApiInfo(res.data);
      } catch (err) {
        // optional, don't scare the user
        console.error("Failed to load API token info:", err);
      }
    };

    loadProfile();
    loadApiInfo();
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

  const handleGenerateApiToken = async () => {
    setApiLoading(true);
    setError("");
    setSuccess("");
    setApiTokenFull("");

    try {
      const res = await api.post("/personal-api-token");
      const token = res.data.api_token;
      setApiTokenFull(token);

      const masked =
        token.length > 8
          ? token.slice(0, 4) + "..." + token.slice(-4)
          : "********";

      setApiInfo({
        has_token: true,
        masked_token: masked,
      });

      setSuccess(
        "New personal API token generated. Copy it now – it will not be shown again in full."
      );
    } catch (err) {
      console.error(err);
      setError("Failed to generate personal API token");
    } finally {
      setApiLoading(false);
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
        background: "#fff7e6", // cream
      }}
    >
      <div
        style={{
          maxWidth: "450px",
          width: "100%",
          background: "#fff",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>My Profile</h2>

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

        {/* Personal API Key section */}
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            borderRadius: "10px",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "8px", fontSize: "1.05rem" }}>
            Personal API Key
          </h3>
          <p style={{ fontSize: "0.9rem", marginBottom: "8px" }}>
            Use a personal API key to integrate CityLink Live with external
            tools. Send it in the{" "}
            <code style={{ background: "#eee", padding: "1px 4px" }}>
              x-api-key
            </code>{" "}
            header instead of logging in.
          </p>

          {apiInfo.has_token ? (
            <p style={{ fontSize: "0.9rem", marginBottom: "6px" }}>
              Current key:{" "}
              <code
                style={{
                  background: "#eee",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                {apiInfo.masked_token}
              </code>{" "}
              (masked)
            </p>
          ) : (
            <p style={{ fontSize: "0.9rem", marginBottom: "6px" }}>
              You do not have a personal API key yet.
            </p>
          )}

          {apiTokenFull && (
            <div
              style={{
                marginBottom: "8px",
                padding: "8px",
                borderRadius: "6px",
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                fontSize: "0.85rem",
              }}
            >
              <strong>Your new API key:</strong>
              <br />
              <code
                style={{
                  wordBreak: "break-all",
                  background: "#f3f4f6",
                  padding: "4px 6px",
                  borderRadius: "4px",
                  display: "inline-block",
                  marginTop: "4px",
                }}
              >
                {apiTokenFull}
              </code>
              <br />
              <span>
                Copy and store this somewhere safe. It will not be shown again
                in full.
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerateApiToken}
            disabled={apiLoading}
            style={{
              ...primaryButtonStyle,
              marginTop: "4px",
              minWidth: "180px",
            }}
          >
            {apiLoading
              ? "Generating..."
              : apiInfo.has_token
              ? "Regenerate API Key"
              : "Generate API Key"}
          </button>
        </div>

        <div style={{ marginTop: "20px" }}>
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
