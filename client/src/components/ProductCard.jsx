import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product }) {

  const { addToCart } = useCart();

  const firstImage =
    product.images && product.images.length > 0
      ? product.images[0].filename
      : null;

  return (

    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        overflow: "hidden",
        background: "#fff",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.03)";
        e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.14)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.06)";
      }}
    >

      <Link
        to={`/product/${product.id}`}
        style={{
          textDecoration: "none",
          color: "black",
          display: "block",
        }}
      >

        <div
          style={{
            width: "100%",
            height: "220px",
            background: "#f3f3f3",
          }}
        >

          {firstImage ? (

            <img
              src={`http://localhost:3000/uploads/${firstImage}`}
              alt={product.name}
              style={{
                width: "100%",
                height: "220px",
                objectFit: "cover",
              }}
            />

          ) : (

            <div
              style={{
                width: "100%",
                height: "220px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
              }}
            >
              Brak zdjęcia
            </div>

          )}

        </div>

        <div style={{ padding: "12px" }}>

          <h3 style={{ margin: "0 0 8px 0" }}>
            {product.name}
          </h3>

          <p style={{ margin: 0, fontWeight: "bold" }}>
            {product.price} zł
          </p>

        </div>

      </Link>

      <div style={{ padding: "0 12px 12px 12px" }}>

        <button
          onClick={() => addToCart(product)}
          style={{
            width: "100%",
            padding: "12px",
            background: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#222";
            e.target.style.boxShadow = "0 6px 14px rgba(0,0,0,0.25)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "#000";
            e.target.style.boxShadow = "none";
          }}
          onMouseDown={(e) => {
            e.target.style.transform = "scale(0.96)";
          }}
          onMouseUp={(e) => {
            e.target.style.transform = "scale(1)";
          }}
        >
          Dodaj do koszyka
        </button>

      </div>

    </div>
  );
}