import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { normalizeProduct } from "../utils/productUtils";

const API_URL = "http://localhost:3000";

export default function ProductPage() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/products/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Nie udało się pobrać produktu.");
        }

        const normalized = normalizeProduct(data);
        setProduct(normalized);
        setActiveImage(normalized.image || "");
      } catch (err) {
        setError(err.message || "Nie udało się pobrać produktu.");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  if (loading) {
    return <div>Ładowanie produktu...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!product) {
    return <div>Nie znaleziono produktu.</div>;
  }

  return (
    <div className="product-page">
      <div className="product-page-gallery">
        <div className="product-page-main-image">
          {activeImage ? (
            <img src={activeImage} alt={product.name} />
          ) : (
            <div className="product-page-no-image">Brak zdjęcia</div>
          )}
        </div>

        {product.images.length > 1 ? (
          <div className="product-page-thumbnails">
            {product.images.map((image, index) => (
              <button
                key={index}
                type="button"
                className={`product-page-thumb-button ${
                  activeImage === image ? "active" : ""
                }`}
                onClick={() => setActiveImage(image)}
              >
                <img src={image} alt={`${product.name}-${index}`} />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="product-page-info">
        <h1>{product.name}</h1>
        <p>{product.price.toFixed(2)} zł</p>
        <p>{product.description}</p>
      </div>
    </div>
  );
}
