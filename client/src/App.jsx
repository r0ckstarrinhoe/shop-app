import { useEffect, useState } from "react";
import TrendingProducts from "./components/TrendingProducts";
import ProductCard from "./components/ProductCard";
import { normalizeProductList } from "./utils/productUtils";

const API_URL = "http://localhost:3000";

export default function App() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoadingProducts(true);
        setProductsError("");

        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Nie udało się pobrać produktów.");
        }

        setProducts(normalizeProductList(data));
      } catch (err) {
        setProductsError(err.message || "Nie udało się pobrać produktów.");
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <div className="shop-page">
      <TrendingProducts />

      <section className="all-products-section">
        <div className="section-header">
          <h2>Wszystkie produkty</h2>
        </div>

        {loadingProducts ? <p>Ładowanie produktów...</p> : null}
        {productsError ? <p>{productsError}</p> : null}

        {!loadingProducts && !productsError ? (
          products.length ? (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p>Brak produktów.</p>
          )
        ) : null}
      </section>
    </div>
  );
}
