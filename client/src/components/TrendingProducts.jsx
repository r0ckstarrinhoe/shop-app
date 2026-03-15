import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { normalizeProductList } from "../utils/productUtils";

const API_URL = "http://localhost:3000";

export default function TrendingProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTrendingProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/products/trending`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Nie udało się pobrać trendujących produktów.");
        }

        setProducts(normalizeProductList(data));
      } catch (err) {
        setError(err.message || "Nie udało się pobrać trendujących produktów.");
      } finally {
        setLoading(false);
      }
    }

    loadTrendingProducts();
  }, []);

  return (
    <section className="trending-products-section">
      <div className="section-header">
        <h2>Trendujące produkty</h2>
      </div>

      {loading ? <p>Ładowanie...</p> : null}
      {error ? <p>{error}</p> : null}

      {!loading && !error ? (
        products.length ? (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p>Brak trendujących produktów.</p>
        )
      ) : null}
    </section>
  );
}
