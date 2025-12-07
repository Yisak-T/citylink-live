import React, { useEffect, useState } from "react";
import api from "../api.js";
import { io } from "socket.io-client";

function Dashboard() {
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const [city, setCity] = useState("Warsaw");

  const [weather, setWeather] = useState(null);
  const [news, setNews] = useState([]);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [apiError, setApiError] = useState("");

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [socket, setSocket] = useState(null);

  const primaryButtonStyle = {
    background: "#0f172a",
    color: "#f9fafb",
    padding: "8px 14px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.9rem",
  };

  // load current user
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get("/me");
        setMe(res.data.user);
      } catch (err) {
        console.error(err);
        setError("You are not logged in");
      }
    };
    fetchMe();
  }, []);

  // Socket connect
  useEffect(() => {
    const s = io("http://127.0.0.1:5001");
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("chatMessage", handleChatMessage);

    return () => {
      socket.off("chatMessage", handleChatMessage);
    };
  }, [socket]);

  // Join room + load history
  useEffect(() => {
    const joinAndLoad = async () => {
      if (!socket || !me || !city) return;

      socket.emit("joinRoom", {
        city,
        username: me.username,
      });

      try {
        const res = await api.get(`/rooms/${encodeURIComponent(city)}/messages`);
        setMessages(res.data || []);
      } catch (err) {
        console.error("Load messages error:", err);
      }
    };

    joinAndLoad();
  }, [socket, me, city]);

  const fetchWeather = async (chosenCity) => {
    setLoadingWeather(true);
    setApiError("");
    setWeather(null);

    try {
      const res = await api.get(
        `/cities/${encodeURIComponent(chosenCity)}/weather`
      );
      setWeather(res.data);
    } catch (err) {
      console.error(err);
      setApiError("Failed to load weather.");
    } finally {
      setLoadingWeather(false);
    }
  };

  const fetchNews = async (chosenCity) => {
    setLoadingNews(true);
    setApiError("");
    setNews([]);

    try {
      const res = await api.get(
        `/cities/${encodeURIComponent(chosenCity)}/news`
      );
      setNews(res.data);
    } catch (err) {
      console.error(err);
      setApiError("Failed to load news.");
    } finally {
      setLoadingNews(false);
    }
  };

  // initial load
  useEffect(() => {
    if (me && me.favorite_city) {
      setCity(me.favorite_city);
      fetchWeather(me.favorite_city);
      fetchNews(me.favorite_city);
    } else {
      fetchWeather(city);
      fetchNews(city);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const handleCityChange = (e) => {
    setCity(e.target.value);
  };

  const handleLoadData = () => {
    if (!city.trim()) return;
    fetchWeather(city.trim());
    fetchNews(city.trim());
  };

  const handleChatInputChange = (e) => {
    setChatInput(e.target.value);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !me) return;

    socket.emit("chatMessage", {
      city,
      content: chatInput.trim(),
      userId: me.id,
      username: me.username,
    });

    setChatInput("");
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 60px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "20px",
        background: "#fff7e6",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          width: "100%",
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <h2 style={{ marginBottom: "10px" }}>CityLink Live Dashboard</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {me && (
          <p style={{ marginBottom: "15px" }}>
            Welcome back, <strong>{me.username}</strong>!
            {me.favorite_city && (
              <> Your favorite city is <strong>{me.favorite_city}</strong>.</>
            )}
          </p>
        )}

        {/* City selector */}
        <div
          style={{
            margin: "20px 0",
            padding: "15px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            background: "#fffaf1",
          }}
        >
          <label style={{ display: "block", marginBottom: "8px" }}>
            Choose city
          </label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              value={city}
              onChange={handleCityChange}
              style={{ flex: 1, padding: "8px" }}
              placeholder="Enter city name (e.g., Warsaw)"
            />
            <button onClick={handleLoadData} style={primaryButtonStyle}>
              Load
            </button>
          </div>
        </div>

        {apiError && <p style={{ color: "red" }}>{apiError}</p>}

        {/* Content grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr",
            gap: "20px",
          }}
        >
          {/* Weather card */}
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "15px",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <h3>Weather</h3>
            {loadingWeather && <p>Loading weather...</p>}
            {!loadingWeather && weather && (
              <div>
                <p>
                  <strong>
                    {weather.city}, {weather.country}
                  </strong>
                </p>
                <p>
                  Temperature: {weather.temperature}°C (feels like{" "}
                  {weather.feels_like}°C)
                </p>
                <p>Description: {weather.description}</p>
                <p>Humidity: {weather.humidity}%</p>
                <p>Wind speed: {weather.wind_speed} m/s</p>
              </div>
            )}
          </div>

          {/* News card */}
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "15px",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <h3>Latest News</h3>
            {loadingNews && <p>Loading news...</p>}
            {!loadingNews && news && news.length === 0 && (
              <p>No news found for this city.</p>
            )}
            {!loadingNews && news && news.length > 0 && (
              <ul style={{ paddingLeft: "18px" }}>
                {news.map((article, index) => (
                  <li key={index} style={{ marginBottom: "10px" }}>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontWeight: "bold" }}
                    >
                      {article.title}
                    </a>
                    <div style={{ fontSize: "0.9em", color: "#555" }}>
                      {article.source} –{" "}
                      {new Date(article.publishedAt).toLocaleString()}
                    </div>
                    {article.description && (
                      <p style={{ marginTop: "4px" }}>{article.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Chat section */}
        <div
          style={{
            marginTop: "30px",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "20px",
          }}
        >
          <h3>City Chat – {city}</h3>
          {!me && <p style={{ color: "red" }}>You must be logged in to chat.</p>}

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "10px",
              maxHeight: "250px",
              overflowY: "auto",
              background: "#fffaf1",
              marginBottom: "10px",
            }}
          >
            {messages.length === 0 && (
              <p>No messages yet. Be the first to say hi!</p>
            )}
            {messages.map((m) => (
              <div key={m.id || m.created_at} style={{ marginBottom: "8px" }}>
                <strong>{m.username || "User"}:</strong>{" "}
                <span>{m.content}</span>
                <div style={{ fontSize: "0.75em", color: "#555" }}>
                  {m.created_at
                    ? new Date(m.created_at).toLocaleTimeString()
                    : ""}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSendMessage}
            style={{ display: "flex", gap: "8px" }}
          >
            <input
              type="text"
              value={chatInput}
              onChange={handleChatInputChange}
              placeholder="Type a message..."
              style={{ flex: 1, padding: "8px" }}
              disabled={!me}
            />
            <button
              type="submit"
              disabled={!me || !chatInput.trim()}
              style={primaryButtonStyle}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;