import { useEffect, useMemo, useState } from "react";
import EditProductModal from "../components/EditProductModal";
import {
  getProducts,
  normalizeProducts,
  formatPrice,
  getImageUrl,
  getProductImages,
  getProductCategoryName,
  deleteProduct,
} from "../adminApi";

export default function ProductsPage({ categories = [], onProductsChange }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const categoryMap = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[String(category.id)] = category.name;
      return acc;
    }, {});
  }, [categories]);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const data = await getProducts();
      const normalized = normalizeProducts(data);

      setProducts(Array.isArray(normalized) ? normalized : []);
    } catch (err) {
      console.error("LOAD PRODUCTS ERROR:", err);
      setError(err.message || "Nie udało się pobrać produktów.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleDelete(product) {
    const confirmed = window.confirm(`Usunąć produkt "${product.name}"?`);
    if (!confirmed) return;

    try {
      setDeletingId(product.id);
      await deleteProduct(product.id);
      await loadProducts();

      if (onProductsChange) {
        onProductsChange();
      }
    } catch (err) {
      alert(err.message || "Nie udało się usunąć produktu.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleOpenEdit(product) {
    setEditingProduct(product);
  }

  function handleCloseEdit() {
    setEditingProduct(null);
  }

  async function handleSaved() {
    setEditingProduct(null);
    await loadProducts();

    if (onProductsChange) {
      onProductsChange();
    }
  }

  return (
    <>
      <div className="admin-content-card">
        <div className="admin-page-header">
          <div>
            <h1>Lista produktów</h1>
            <p>Tutaj możesz przeglądać i edytować produkty.</p>
          </div>

          <button type="button" onClick={loadProducts} disabled={loading}>
            {loading ? "Odświeżanie..." : "Odśwież"}
          </button>
        </div>

        {loading ? (
          <div className="admin-empty-state">Ładowanie produktów...</div>
        ) : error ? (
          <div className="admin-error-box">{error}</div>
        ) : !products.length ? (
          <div className="admin-empty-state">Brak produktów.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Zdjęcie</th>
                  <th>Nazwa</th>
                  <th>Kategoria</th>
                  <th>Cena</th>
                  <th>Trending</th>
                  <th>Akcje</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const images = getProductImages(product);
                  const firstImage = images.length ? getImageUrl(images[0]) : "";
                  const categoryName =
                    getProductCategoryName(product) ||
                    categoryMap[String(product.categoryId)] ||
                    "-";

                  return (
                    <tr key={product.id}>
                      <td>
                        {firstImage ? (
                          <img
                            src={firstImage}
                            alt={product.name}
                            style={{
                              width: "64px",
                              height: "64px",
                              objectFit: "cover",
                              borderRadius: "10px",
                              border: "1px solid #ddd",
                              background: "#fff",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "64px",
                              height: "64px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid #ddd",
                              borderRadius: "10px",
                              fontSize: "12px",
                              color: "#777",
                              background: "#fafafa",
                              textAlign: "center",
                              padding: "4px",
                            }}
                          >
                            Brak zdjęcia
                          </div>
                        )}
                      </td>

                      <td>{product.name}</td>
                      <td>{categoryName}</td>
                      <td>{formatPrice(product.price)}</td>
                      <td>{product.isTrending ? "Tak" : "Nie"}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(product)}
                          >
                            Edytuj
                          </button>

                          <button
                            type="button"
                            className="admin-button-danger"
                            onClick={() => handleDelete(product)}
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
        )}
      </div>

      {editingProduct ? (
        <EditProductModal
          product={editingProduct}
          categories={categories}
          onClose={handleCloseEdit}
          onSaved={handleSaved}
        />
      ) : null}
    </>
  );
}