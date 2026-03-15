import { Link } from "react-router-dom";
import { normalizeProduct } from "../utils/productUtils";

export default function ProductCard({ product }) {
  const normalizedProduct = normalizeProduct(product);

  return (
    <div className="product-card">
      <Link to={`/product/${normalizedProduct.id}`} className="product-card-link">
        <div className="product-card-image-wrap">
          {normalizedProduct.image ? (
            <img
              src={normalizedProduct.image}
              alt={normalizedProduct.name}
              className="product-card-image"
            />
          ) : (
            <div className="product-card-image product-card-image-empty">
              Brak zdjęcia
            </div>
          )}
        </div>

        <div className="product-card-content">
          <h3>{normalizedProduct.name}</h3>
          <p>{normalizedProduct.price.toFixed(2)} zł</p>
        </div>
      </Link>
    </div>
  );
}
