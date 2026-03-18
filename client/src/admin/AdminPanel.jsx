import { useEffect, useState } from "react";
import {
  apiFetch,
  getInitialSection,
  getToken,
  normalizeCategories,
  normalizeDiscounts,
  normalizeOrders,
  normalizeProducts,
  removeToken,
  getTrendingSettings,
  updateTrendingSettings,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from "./adminApi";
import LoginForm from "./components/LoginForm";
import Sidebar from "./components/Sidebar";
import EditProductModal from "./components/EditProductModal";
import EditCategoryModal from "./components/EditCategoryModal";
import EditDiscountModal from "./components/EditDiscountModal";
import ProductsPage from "./pages/ProductsPage";
import AddProductPage from "./pages/AddProductPage";
import AddCategoryPage from "./pages/AddCategoryPage";
import OrdersPage from "./pages/OrdersPage";
import DiscountsPage from "./pages/DiscountsPage";
import "./admin.css";

export default function AdminPanel() {
  const [loggedIn, setLoggedIn] = useState(Boolean(getToken()));
  const [currentSection, setCurrentSection] = useState(getInitialSection());

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [discounts, setDiscounts] = useState([]);

  const [pageLoading, setPageLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [trendingSaving, setTrendingSaving] = useState(false);
  const [discountLoading, setDiscountLoading] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingDiscount, setEditingDiscount] = useState(null);

  const [ordersError, setOrdersError] = useState("");
  const [discountError, setDiscountError] = useState("");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [trendingError, setTrendingError] = useState("");

  const [trendingForm, setTrendingForm] = useState({
    mode: "manual",
    limit: 5,
    bestSellerDays: 7,
  });

  function changeSection(section) {
    setCurrentSection(section);
    window.location.hash = section;
  }

  async function loadBaseData() {
    setPageLoading(true);
    setError("");

    try {
      const [categoriesResponse, productsResponse] = await Promise.all([
        apiFetch("/categories"),
        apiFetch("/products"),
      ]);

      setCategories(normalizeCategories(categoriesResponse));
      setProducts(normalizeProducts(productsResponse));
    } catch (err) {
      setError(err.message || "Nie udało się pobrać danych.");
    } finally {
      setPageLoading(false);
    }
  }

  async function loadOrders() {
    setOrdersLoading(true);
    setOrdersError("");

    try {
      const ordersResponse = await apiFetch("/orders");
      setOrders(normalizeOrders(ordersResponse));
    } catch (err) {
      setOrders([]);
      setOrdersError(
        err.message ||
          "Nie udało się pobrać zamówień. Upewnij się, że masz endpoint GET /orders."
      );
    } finally {
      setOrdersLoading(false);
    }
  }

  async function loadDiscounts() {
    setDiscountLoading(true);
    setDiscountError("");

    try {
      const discountsResponse = await apiFetch("/discounts");
      setDiscounts(normalizeDiscounts(discountsResponse));
    } catch (err) {
      setDiscounts([]);
      setDiscountError(err.message || "Nie udało się pobrać rabatów.");
    } finally {
      setDiscountLoading(false);
    }
  }

  async function loadTrendingSettings() {
    setTrendingLoading(true);
    setTrendingError("");

    try {
      const settings = await getTrendingSettings();

      setTrendingForm({
        mode: settings?.mode || "manual",
        limit: Number(settings?.limit || 8),
        bestSellerDays: Number(settings?.days || settings?.bestSellerDays || 7),
      });
    } catch (err) {
      setTrendingError(err.message || "Nie udało się pobrać ustawień trendingu.");
    } finally {
      setTrendingLoading(false);
    }
  }

  useEffect(() => {
    if (!loggedIn) return;
    loadBaseData();
    loadTrendingSettings();
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;

    if (currentSection === "orders") {
      loadOrders();
    }

    if (currentSection === "discounts") {
      loadDiscounts();
    }
  }, [currentSection, loggedIn]);

  async function handleCreateProduct(productData) {
    setProductLoading(true);
    setSuccess("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", productData.name);
      formData.append("categoryId", productData.categoryId);
      formData.append("description", productData.description);
      formData.append("price", productData.price);
      formData.append("isTrending", String(Boolean(productData.isTrending)));

      productData.images.forEach((file) => {
        formData.append("images", file);
      });

      await apiFetch("/products", {
        method: "POST",
        body: formData,
      });

      setSuccess("Produkt został dodany.");
      await loadBaseData();
      changeSection("products");
    } catch (err) {
      setError(err.message || "Nie udało się dodać produktu.");
    } finally {
      setProductLoading(false);
    }
  }

  async function handleCreateCategory(categoryData) {
    setCategoryLoading(true);
    setSuccess("");
    setError("");

    try {
      await apiFetch("/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      });

      setSuccess("Kategoria została dodana.");
      await loadBaseData();
    } catch (err) {
      setError(err.message || "Nie udało się dodać kategorii.");
    } finally {
      setCategoryLoading(false);
    }
  }

  async function handleUpdateCategory(categoryId, categoryData) {
    setCategoryLoading(true);
    setSuccess("");
    setError("");

    try {
      await apiFetch(`/categories/${categoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      });

      setSuccess("Kategoria została zaktualizowana.");
      setEditingCategory(null);
      await loadBaseData();
    } catch (err) {
      setError(err.message || "Nie udało się zaktualizować kategorii.");
    } finally {
      setCategoryLoading(false);
    }
  }

  async function handleUpdateProduct(productId, productData) {
    setProductLoading(true);
    setSuccess("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", productData.name);
      formData.append("categoryId", productData.categoryId);
      formData.append("description", productData.description);
      formData.append("price", productData.price);
      formData.append("isTrending", String(Boolean(productData.isTrending)));
      formData.append("replaceImages", String(Boolean(productData.replaceImages)));

      productData.images.forEach((file) => {
        formData.append("images", file);
      });

      await apiFetch(`/products/${productId}`, {
        method: "PUT",
        body: formData,
      });

      setSuccess("Produkt został zaktualizowany.");
      setEditingProduct(null);
      await loadBaseData();
    } catch (err) {
      setError(err.message || "Nie udało się zaktualizować produktu.");
    } finally {
      setProductLoading(false);
    }
  }

  async function handleCreateDiscount(discountData) {
    setDiscountLoading(true);
    setSuccess("");
    setDiscountError("");
    setError("");

    try {
      await createDiscount(discountData);
      setSuccess("Rabat został dodany.");
      setEditingDiscount(null);
      await loadDiscounts();
      changeSection("discounts");
    } catch (err) {
      setDiscountError(err.message || "Nie udało się dodać rabatu.");
    } finally {
      setDiscountLoading(false);
    }
  }

  async function handleUpdateDiscount(discountId, discountData) {
    setDiscountLoading(true);
    setSuccess("");
    setDiscountError("");
    setError("");

    try {
      await updateDiscount(discountId, discountData);
      setSuccess("Rabat został zaktualizowany.");
      setEditingDiscount(null);
      await loadDiscounts();
    } catch (err) {
      setDiscountError(err.message || "Nie udało się zaktualizować rabatu.");
    } finally {
      setDiscountLoading(false);
    }
  }

  async function handleDeleteDiscount(discountId) {
    const confirmed = window.confirm("Na pewno usunąć ten rabat?");
    if (!confirmed) return;

    setDiscountLoading(true);
    setSuccess("");
    setDiscountError("");
    setError("");

    try {
      await deleteDiscount(discountId);
      setSuccess("Rabat został usunięty.");
      await loadDiscounts();
    } catch (err) {
      setDiscountError(err.message || "Nie udało się usunąć rabatu.");
    } finally {
      setDiscountLoading(false);
    }
  }

  async function handleSaveTrendingSettings(event) {
    event.preventDefault();

    setTrendingSaving(true);
    setTrendingError("");
    setSuccess("");
    setError("");

    try {
      const payload = {
        mode: trendingForm.mode,
        limit: Number(trendingForm.limit),
        days: Number(trendingForm.bestSellerDays),
      };

      await updateTrendingSettings(payload);
      setSuccess("Ustawienia trendingu zostały zapisane.");
      await loadTrendingSettings();
    } catch (err) {
      setTrendingError(err.message || "Nie udało się zapisać ustawień trendingu.");
    } finally {
      setTrendingSaving(false);
    }
  }

  function handleLogout() {
    removeToken();
    setLoggedIn(false);
    setCategories([]);
    setProducts([]);
    setOrders([]);
    setDiscounts([]);
    setEditingProduct(null);
    setEditingCategory(null);
    setEditingDiscount(null);
    setSuccess("");
    setError("");
    setOrdersError("");
    setTrendingError("");
    setDiscountError("");
  }

  if (!loggedIn) {
    return <LoginForm onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div className="admin-shell">
      <Sidebar
        currentSection={currentSection}
        onChangeSection={changeSection}
        onLogout={handleLogout}
      />

      <main className="admin-main">
        {success ? <div className="admin-success">{success}</div> : null}
        {error ? <div className="admin-error">{error}</div> : null}
        {pageLoading ? <div className="admin-loading">Ładowanie danych...</div> : null}

        {currentSection === "products" ? (
          <>
            <section
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: "16px" }}>
                Ustawienia trendingu
              </h2>

              {trendingError ? (
                <div
                  style={{
                    marginBottom: "12px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "#fee2e2",
                    color: "#991b1b",
                  }}
                >
                  {trendingError}
                </div>
              ) : null}

              {trendingLoading ? (
                <div>Ładowanie ustawień trendingu...</div>
              ) : (
                <form onSubmit={handleSaveTrendingSettings}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span>Tryb trendingu</span>
                      <select
                        value={trendingForm.mode}
                        onChange={(e) =>
                          setTrendingForm((prev) => ({
                            ...prev,
                            mode: e.target.value,
                          }))
                        }
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                        }}
                      >
                        <option value="manual">Manual</option>
                        <option value="best_sellers">Best sellers</option>
                        <option value="newest">Newest</option>
                      </select>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span>Limit produktów</span>
                      <input
                        type="number"
                        min="1"
                        value={trendingForm.limit}
                        onChange={(e) =>
                          setTrendingForm((prev) => ({
                            ...prev,
                            limit: e.target.value,
                          }))
                        }
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                        }}
                      />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span>Liczba dni dla best sellers</span>
                      <input
                        type="number"
                        min="1"
                        value={trendingForm.bestSellerDays}
                        onChange={(e) =>
                          setTrendingForm((prev) => ({
                            ...prev,
                            bestSellerDays: e.target.value,
                          }))
                        }
                        disabled={trendingForm.mode !== "best_sellers"}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                          background:
                            trendingForm.mode !== "best_sellers" ? "#f3f4f6" : "#fff",
                        }}
                      />
                    </label>
                  </div>

                  <div
                    style={{
                      marginTop: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="submit"
                      disabled={trendingSaving}
                      style={{
                        padding: "10px 16px",
                        border: "none",
                        borderRadius: "8px",
                        background: "#4f46e5",
                        color: "#fff",
                        cursor: trendingSaving ? "not-allowed" : "pointer",
                        opacity: trendingSaving ? 0.7 : 1,
                      }}
                    >
                      {trendingSaving ? "Zapisywanie..." : "Zapisz ustawienia trendingu"}
                    </button>

                    <div style={{ color: "#6b7280", fontSize: "14px" }}>
                      Tryb <strong>manual</strong> używa checkboxa trending w produktach.
                      Tryb <strong>best sellers</strong> bierze najlepiej sprzedające się
                      produkty z ostatnich dni, a gdy nie ma sprzedaży, automatycznie
                      przełącza wynik na <strong>newest</strong>.
                    </div>
                  </div>
                </form>
              )}
            </section>

            <ProductsPage
              products={products}
              categories={categories}
              onOpenEdit={setEditingProduct}
            />
          </>
        ) : null}

        {currentSection === "add-product" ? (
          <AddProductPage
            categories={categories}
            onCreate={handleCreateProduct}
            loading={productLoading}
          />
        ) : null}

        {currentSection === "add-category" ? (
          <AddCategoryPage
            categories={categories}
            onCreate={handleCreateCategory}
            onStartEdit={setEditingCategory}
            loading={categoryLoading}
          />
        ) : null}

        {currentSection === "orders" ? (
          <OrdersPage
            orders={orders}
            loading={ordersLoading}
            endpointError={ordersError}
          />
        ) : null}

        {currentSection === "discounts" ? (
          <DiscountsPage
            discounts={discounts}
            products={products}
            categories={categories}
            loading={discountLoading}
            error={discountError}
            onOpenCreate={() => setEditingDiscount({})}
            onOpenEdit={setEditingDiscount}
            onDelete={handleDeleteDiscount}
          />
        ) : null}
      </main>

      <EditProductModal
        open={Boolean(editingProduct)}
        product={editingProduct}
        categories={categories}
        loading={productLoading}
        onClose={() => setEditingProduct(null)}
        onSave={handleUpdateProduct}
      />

      <EditCategoryModal
        open={Boolean(editingCategory)}
        category={editingCategory}
        loading={categoryLoading}
        onClose={() => setEditingCategory(null)}
        onSave={handleUpdateCategory}
      />

      <EditDiscountModal
        open={Boolean(editingDiscount)}
        discount={editingDiscount}
        products={products}
        categories={categories}
        loading={discountLoading}
        onClose={() => setEditingDiscount(null)}
        onSave={editingDiscount?.id ? handleUpdateDiscount : handleCreateDiscount}
      />
    </div>
  );
}