import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:3000";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  trending: false,
  stock: "",
};

function getToken() {
  return localStorage.getItem("admin_token") || "";
}

function setToken(token) {
  localStorage.setItem("admin_token", token);
}

function removeToken() {
  localStorage.removeItem("admin_token");
}

function normalizeProduct(product) {
  const images =
    product.images ||
    product.productImages ||
    product.gallery ||
    product.photos ||
    [];

  return {
    id: product.id,
    name: product.name || product.title || "",
    description: product.description || "",
    price: product.price ?? "",
    categoryId:
      product.categoryId ||
      product.category?.id ||
      product.category_id ||
      "",
    categoryName: product.category?.name || product.categoryName || "",
    trending: Boolean(product.trending),
    stock: product.stock ?? "",
    images: Array.isArray(images) ? images : [],
  };
}

function imageToUrl(img) {
  if (!img) return "";
  if (typeof img === "string") {
    if (img.startsWith("http")) return img;
    return `${API_URL}/${img.replace(/^\/+/, "")}`;
  }

  const path = img.url || img.path || img.imageUrl || img.filename || "";
  if (!path) return "";

  if (path.startsWith("http")) return path;

  if (path.startsWith("uploads/")) {
    return `${API_URL}/${path}`;
  }

  if (path.startsWith("/uploads/")) {
    return `${API_URL}${path}`;
  }

  return `${API_URL}/uploads/${path}`;
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (typeof data === "object" && (data.message || data.error)) ||
      (typeof data === "string" && data) ||
      "Wystąpił błąd";
    throw new Error(message);
  }

  return data;
}

function LoginView({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch("/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const token = data.token || data.accessToken || data.jwt;
      if (!token) {
        throw new Error("Backend nie zwrócił tokena JWT.");
      }

      setToken(token);
      onLoggedIn();
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
        <p>Zaloguj się jako administrator.</p>

        <form onSubmit={handleLogin} className="admin-form">
          <div className="admin-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="admin-field">
            <label>Hasło</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? <div className="admin-error">{error}</div> : null}

          <button type="submit" className="admin-btn primary" disabled={loading}>
            {loading ? "Logowanie..." : "Zaloguj"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ProductForm({
  categories,
  onSubmit,
  editingProduct,
  onCancelEdit,
  saving,
}) {
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name || "",
        description: editingProduct.description || "",
        price: editingProduct.price ?? "",
        categoryId: editingProduct.categoryId ?? "",
        trending: Boolean(editingProduct.trending),
        stock: editingProduct.stock ?? "",
      });
      setFiles([]);
    } else {
      setForm(emptyForm);
      setFiles([]);
    }
  }, [editingProduct]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await onSubmit(form, files);
    if (!editingProduct) {
      setForm(emptyForm);
      setFiles([]);
    }
  }

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h2>{editingProduct ? "Edytuj produkt" : "Dodaj produkt"}</h2>
        {editingProduct ? (
          <button className="admin-btn ghost" onClick={onCancelEdit}>
            Anuluj edycję
          </button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="admin-form-grid">
        <div className="admin-field">
          <label>Nazwa</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
          />
        </div>

        <div className="admin-field">
          <label>Cena</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => updateField("price", e.target.value)}
            required
          />
        </div>

        <div className="admin-field">
          <label>Kategoria</label>
          <select
            value={form.categoryId}
            onChange={(e) => updateField("categoryId", e.target.value)}
            required
          >
            <option value="">Wybierz kategorię</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-field">
          <label>Stan magazynowy</label>
          <input
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={(e) => updateField("stock", e.target.value)}
          />
        </div>

        <div className="admin-field full">
          <label>Opis</label>
          <textarea
            rows="5"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            required
          />
        </div>

        <div className="admin-field full">
          <label>Zdjęcia produktu</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
          <small>
            Możesz wrzucić wiele zdjęć jednocześnie. Przy edycji możesz dodać nowe.
          </small>
        </div>

        <div className="admin-checkbox full">
          <input
            id="trending"
            type="checkbox"
            checked={form.trending}
            onChange={(e) => updateField("trending", e.target.checked)}
          />
          <label htmlFor="trending">Produkt trendujący</label>
        </div>

        <div className="full">
          <button type="submit" className="admin-btn primary" disabled={saving}>
            {saving
              ? "Zapisywanie..."
              : editingProduct
              ? "Zapisz zmiany"
              : "Dodaj produkt"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CategoryForm({ onCreate, saving }) {
  const [name, setName] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreate(name.trim());
    setName("");
  }

  return (
    <div className="admin-card">
      <h2>Dodaj kategorię</h2>

      <form onSubmit={handleSubmit} className="admin-inline-form">
        <input
          type="text"
          placeholder="Np. Buty, Bluzy, Akcesoria"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button type="submit" className="admin-btn primary" disabled={saving}>
          {saving ? "Dodawanie..." : "Dodaj"}
        </button>
      </form>
    </div>
  );
}

function ProductsTable({
  products,
  categories,
  onEdit,
  onDelete,
  deletingId,
}) {
  const categoryMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {});
  }, [categories]);

  if (!products.length) {
    return (
      <div className="admin-card">
        <h2>Produkty</h2>
        <p>Brak produktów.</p>
      </div>
    );
  }

  return (
    <div className="admin-card">
      <h2>Produkty</h2>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Zdjęcie</th>
              <th>Nazwa</th>
              <th>Kategoria</th>
              <th>Cena</th>
              <th>Stan</th>
              <th>Trending</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const firstImage = imageToUrl(product.images?.[0]);

              return (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={product.name}
                        className="admin-thumb"
                      />
                    ) : (
                      <div className="admin-thumb admin-thumb-empty">Brak</div>
                    )}
                  </td>
                  <td>{product.name}</td>
                  <td>
                    {product.categoryName ||
                      categoryMap[product.categoryId] ||
                      "-"}
                  </td>
                  <td>{Number(product.price || 0).toFixed(2)} zł</td>
                  <td>{product.stock !== "" ? product.stock : "-"}</td>
                  <td>{product.trending ? "Tak" : "Nie"}</td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="admin-btn small"
                        onClick={() => onEdit(product)}
                      >
                        Edytuj
                      </button>
                      <button
                        className="admin-btn danger small"
                        onClick={() => onDelete(product.id)}
                        disabled={deletingId === product.id}
                      >
                        {deletingId === product.id ? "Usuwanie..." : "Usuń"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [authorized, setAuthorized] = useState(Boolean(getToken()));
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [productsData, categoriesData] = await Promise.all([
        apiFetch("/products"),
        apiFetch("/categories"),
      ]);

      const normalizedProducts = Array.isArray(productsData)
        ? productsData.map(normalizeProduct)
        : Array.isArray(productsData.products)
        ? productsData.products.map(normalizeProduct)
        : [];

      const normalizedCategories = Array.isArray(categoriesData)
        ? categoriesData
        : Array.isArray(categoriesData.categories)
        ? categoriesData.categories
        : [];

      setProducts(normalizedProducts);
      setCategories(normalizedCategories);
    } catch (err) {
      setError(err.message || "Nie udało się pobrać danych.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authorized) {
      loadData();
    }
  }, [authorized]);

  async function handleCreateCategory(name) {
    setSavingCategory(true);
    setMessage("");
    setError("");

    try {
      await apiFetch("/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      setMessage("Kategoria została dodana.");
      await loadData();
    } catch (err) {
      setError(err.message || "Nie udało się dodać kategorii.");
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleSaveProduct(form, files) {
    setSavingProduct(true);
    setMessage("");
    setError("");

    try {
      const body = new FormData();
      body.append("name", form.name);
      body.append("description", form.description);
      body.append("price", String(form.price));
      body.append("categoryId", String(form.categoryId));
      body.append("trending", String(form.trending));
      body.append("stock", String(form.stock || 0));

      files.forEach((file) => {
        body.append("images", file);
      });

      if (editingProduct) {
        await apiFetch(`/products/${editingProduct.id}`, {
          method: "PUT",
          body,
        });
        setMessage("Produkt został zaktualizowany.");
      } else {
        await apiFetch("/products", {
          method: "POST",
          body,
        });
        setMessage("Produkt został dodany.");
      }

      setEditingProduct(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Nie udało się zapisać produktu.");
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleDeleteProduct(id) {
    const confirmed = window.confirm("Na pewno usunąć ten produkt?");
    if (!confirmed) return;

    setDeletingId(id);
    setMessage("");
    setError("");

    try {
      await apiFetch(`/products/${id}`, {
        method: "DELETE",
      });
      setMessage("Produkt został usunięty.");
      if (editingProduct?.id === id) {
        setEditingProduct(null);
      }
      await loadData();
    } catch (err) {
      setError(err.message || "Nie udało się usunąć produktu.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleLogout() {
    removeToken();
    setAuthorized(false);
    setProducts([]);
    setCategories([]);
    setEditingProduct(null);
  }

  if (!authorized) {
    return <LoginView onLoggedIn={() => setAuthorized(true)} />;
  }

  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <div>
          <h1>Shop App — Admin Panel</h1>
          <p>Zarządzanie produktami, kategoriami i zdjęciami.</p>
        </div>

        <div className="admin-topbar-actions">
          <a className="admin-btn ghost" href="/">
            Przejdź do sklepu
          </a>
          <button className="admin-btn danger" onClick={handleLogout}>
            Wyloguj
          </button>
        </div>
      </header>

      {message ? <div className="admin-success">{message}</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}

      {loading ? (
        <div className="admin-loading">Ładowanie danych...</div>
      ) : (
        <div className="admin-layout">
          <div className="admin-left">
            <ProductForm
              categories={categories}
              onSubmit={handleSaveProduct}
              editingProduct={editingProduct}
              onCancelEdit={() => setEditingProduct(null)}
              saving={savingProduct}
            />

            <CategoryForm
              onCreate={handleCreateCategory}
              saving={savingCategory}
            />
          </div>

          <div className="admin-right">
            <ProductsTable
              products={products}
              categories={categories}
              onEdit={setEditingProduct}
              onDelete={handleDeleteProduct}
              deletingId={deletingId}
            />
          </div>
        </div>
      )}
    </div>
  );
}
