import { useMemo } from "react";
import {
  formatPrice,
  getImageUrl,
  getProductCategoryId,
  getProductCategoryName,
  getProductImages,
  normalizeProducts,
  normalizeCategories,
} from "../adminApi";

export default function ProductsPage({
  products = [],
  categories = [],
  onOpenEdit,
}) {
  const normalizedProducts = normalizeProducts(products);
  const normalizedCategories = normalizeCategories(categories);

  const categoryMap = useMemo(() => {
    return normalizedCategories.reduce((acc, category) => {
      acc[String(category.id)] = category.name;
      return acc;
    }, {});
  }, [normalizedCategories]);

  return (
    <div className="admin-content-card">
      <div className="admin-page-header">
        <div>
          <h1>Lista produktów</h1>
          <p>Tutaj możesz przeglądać i edytować produkty.</p>
        </div>
      </div>

      {!normalizedProducts.length ? (
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
              {normalizedProducts.map((product) => {
                const firstImage = getImageUrl(getProductImages(product)[0]);
                const categoryName =
                  getProductCategoryName(product) ||
                  categoryMap[getProductCategoryId(product)] ||
                  "-";

                return (
                  <tr key={product.id}>
                    <td>
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={product.name}
                          className="admin-product-thumb"
                        />
                      ) : (
                        <div className="admin-product-thumb admin-product-thumb-empty">
                          Brak
                        </div>
                      )}
                    </td>

                    <td>{product.name || "Bez nazwy"}</td>
                    <td>{categoryName}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>
                      {product.isTrending ? (
                        <span className="admin-badge-success">Tak</span>
                      ) : (
                        <span className="admin-badge-muted">Nie</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-btn small"
                        onClick={() => onOpenEdit?.(product)}
                      >
                        Edytuj
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}