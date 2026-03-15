import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000";

function getToken() {
  return localStorage.getItem("admin_token") || "";
}

function setToken(token) {
  localStorage.setItem("admin_token", token);
}

function removeToken() {
  localStorage.removeItem("admin_token");
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      (typeof data === "object" && (data?.message || data?.error)) ||
      (typeof data === "string" && data) ||
      `Błąd ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const token = data?.token || data?.accessToken || data?.jwt;

      if (!token) {
        throw new Error("Backend nie zwrócił tokena JWT.");
      }

      setToken(token);
      onLogin();
    } catch (err) {
      setError(err.message || "Nie udało się zalogować.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-card">
        <h1>Admin Panel</h1>
        <p>Zaloguj się do panelu administratora</p>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="admin-field">
            <label>Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error ? <div className="admin-error">{error}</div> : null}

          <button className="admin-btn primary" type="submit" disabled={loading}>
            {loading ? "Logowanie..." : "Zaloguj"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [loggedIn, setLoggedIn] = useState(Boolean(getToken()));
  const [loading, setLoading] = useState(false);
  const [productsRaw, setProductsRaw] = useState(null);
  const [categoriesRaw, setCategoriesRaw] = useState(null);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [products, categories] = await Promise.all([
        apiFetch("/products"),
        apiFetch("/categories"),
      ]);

      setProductsRaw(products);
      setCategoriesRaw(categories);
    } catch (err) {
      setError(err.message || "Nie udało się pobrać danych.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loggedIn) {
      loadData();
    }
  }, [loggedIn]);

  function handleLogout() {
    removeToken();
    setLoggedIn(false);
    setProductsRaw(null);
    setCategoriesRaw(null);
    setError("");
  }

  if (!loggedIn) {
    return <LoginForm onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <div>
          <h1>Shop App — Admin Panel</h1>
          <p>Panel testowy administratora</p>
        </div>

        <div className="admin-topbar-actions">
          <a href="/" className="admin-btn ghost">
            Przejdź do sklepu
          </a>
          <button type="button" className="admin-btn danger" onClick={handleLogout}>
            Wyloguj
          </button>
        </div>
      </header>

      {error ? <div className="admin-error">{error}</div> : null}

      <div className="admin-layout">
        <div className="admin-left">
          <div className="admin-card">
            <h2>Status</h2>
            <p>Frontend admina działa.</p>
            <p>JWT zapisany: {getToken() ? "Tak" : "Nie"}</p>
            <button
              type="button"
              className="admin-btn primary"
              onClick={loadData}
              disabled={loading}
            >
              {loading ? "Ładowanie..." : "Odśwież dane"}
            </button>
          </div>

          <div className="admin-card">
            <h2>Kategorie — surowa odpowiedź API</h2>
            <pre className="admin-pre">
              {JSON.stringify(categoriesRaw, null, 2)}
            </pre>
          </div>
        </div>

        <div className="admin-right">
          <div className="admin-card">
            <h2>Produkty — surowa odpowiedź API</h2>
            <pre className="admin-pre">
              {JSON.stringify(productsRaw, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
