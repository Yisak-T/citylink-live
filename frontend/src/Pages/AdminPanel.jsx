import React, { useEffect, useState } from "react";
import api from "../api.js";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);

  const baseButtonStyle = {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.85rem",
    minWidth: "72px",        // <-- same width
    textAlign: "center",     // <-- center label
    display: "inline-block",
  };

  const primaryButtonStyle = {
    ...baseButtonStyle,
    background: "#0f172a",
    color: "#f9fafb",
  };

  const deleteButtonStyle = {
    ...baseButtonStyle,
    background: "#dc2626",
    color: "#ffffff",
  };

  const loadUsers = async () => {
    setError("");
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load users (are you admin?)");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChangeField = (id, field, value) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, [field]: value } : u))
    );
  };

  const handleSave = async (user) => {
    setSavingId(user.id);
    setError("");

    try {
      await api.put(`/users/${user.id}`, {
        username: user.username,
        favorite_city: user.favorite_city,
        is_admin: user.is_admin,
      });
      await loadUsers();
    } catch (err) {
      console.error(err);
      setError("Failed to save user");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    setError("");

    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete user");
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        background: "#fff7e6",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          width: "100%",
          background: "#fff",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h2>Admin Panel – Users</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}

        {users.length === 0 ? (
          <p>No users loaded.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "10px",
            }}
          >
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>
                  ID
                </th>
                <th style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>
                  Email
                </th>
                <th style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>
                  Username
                </th>
                <th style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>
                  Favorite City
                </th>
                <th style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>
                  Admin
                </th>
                <th style={{ borderBottom: "1px solid #ddd", padding: "8px" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                    {u.id}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                    {u.email}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                    <input
                      value={u.username}
                      onChange={(e) =>
                        handleChangeField(u.id, "username", e.target.value)
                      }
                    />
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                    <input
                      value={u.favorite_city || ""}
                      onChange={(e) =>
                        handleChangeField(u.id, "favorite_city", e.target.value)
                      }
                    />
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                    <input
                      type="checkbox"
                      checked={!!u.is_admin}
                      onChange={(e) =>
                        handleChangeField(
                          u.id,
                          "is_admin",
                          e.target.checked ? 1 : 0
                        )
                      }
                    />
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                    <button
                      onClick={() => handleSave(u)}
                      disabled={savingId === u.id}
                      style={{ ...primaryButtonStyle, marginRight: "6px" }}
                    >
                      {savingId === u.id ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      style={deleteButtonStyle}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;