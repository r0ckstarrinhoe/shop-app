import { useMemo } from "react";
import {
  formatPrice,
  getImageUrl,
  getProductCategoryId,
  getProductCategoryName,
  getProductImages,
} from "../adminApi";

export default function ProductsPage({ products, categories, onOpenEdit }) {
  const categoryMap = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[String(category.id)] = category.name;
      return acc;
    }, {});
  }, [categories]);

  return (
    <div className="admin-content-card">
      <div className="admin-page-header">
        <div>
          <h1>Lista produktów</h1>
          <p>Tutaj możesz przeglądać i edytować produkty.</p>
        </div>
      </div>

      {!products.length ? (
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
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
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
                      <button
                        type="button"
                        className="admin-btn small"
                        onClick={() => onOpenEdit(product)}
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
