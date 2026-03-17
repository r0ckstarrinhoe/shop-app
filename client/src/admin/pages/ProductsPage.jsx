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
          <p>
            Tutaj możesz przeglądać i edytować produkty. Produkty oznaczone jako
            trending są używane w trybie manual.
          </p>
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
                <th>Trending</th>
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

                const isTrending =
                  product?.isTrending === true ||
                  product?.trending === true ||
                  product?.isTrending === 1 ||
                  product?.trending === 1 ||
                  product?.isTrending === "true" ||
                  product?.trending === "true";

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

                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span>{product.name || "Bez nazwy"}</span>

                        {isTrending ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "4px 8px",
                              borderRadius: "999px",
                              background: "#fef3c7",
                              color: "#92400e",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            Trending
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td>{categoryName}</td>
                    <td>{formatPrice(product.price)}</td>

                    <td>
                      {isTrending ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "4px 8px",
                            borderRadius: "999px",
                            background: "#dcfce7",
                            color: "#166534",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          Tak
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "4px 8px",
                            borderRadius: "999px",
                            background: "#f3f4f6",
                            color: "#4b5563",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          Nie
                        </span>
                      )}
                    </td>

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