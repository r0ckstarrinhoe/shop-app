import { useEffect, useState } from "react";
import {
  apiFetch,
  getInitialSection,
  getToken,
  normalizeCategories,
  normalizeOrders,
  normalizeProducts,
  removeToken,
} from "./adminApi";
import LoginForm from "./components/LoginForm";
import Sidebar from "./components/Sidebar";
import EditProductModal from "./components/EditProductModal";
import EditCategoryModal from "./components/EditCategoryModal";
import ProductsPage from "./pages/ProductsPage";
import AddProductPage from "./pages/AddProductPage";
import AddCategoryPage from "./pages/AddCategoryPage";
import OrdersPage from "./pages/OrdersPage";

export default function AdminPanel() {
  const [loggedIn, setLoggedIn] = useState(Boolean(getToken()));
  const [currentSection, setCurrentSection] = useState(getInitialSection());

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [pageLoading, setPageLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [ordersError, setOrdersError] = useState("");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

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

  useEffect(() => {
    if (!loggedIn) return;
    loadBaseData();
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;
    if (currentSection === "orders") {
      loadOrders();
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

  function handleLogout() {
    removeToken();
    setLoggedIn(false);
    setCategories([]);
    setProducts([]);
    setOrders([]);
    setEditingProduct(null);
    setEditingCategory(null);
    setSuccess("");
    setError("");
    setOrdersError("");
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
          <ProductsPage
            products={products}
            categories={categories}
            onOpenEdit={setEditingProduct}
          />
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
    </div>
  );
}
