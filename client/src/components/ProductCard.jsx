import { Link } from "react-router-dom"
import { useCart } from "../context/CartContext"

const API_URL = "http://localhost:3000"

function normalizeImageUrl(value) {
  if (!value) return null

  let imageUrl = null

  if (typeof value === "string") {
    imageUrl = value
  } else if (typeof value === "object") {
    imageUrl = value.url || value.image || value.src || value.path || null
  }

  if (!imageUrl || typeof imageUrl !== "string") {
    return null
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl
  }

  if (imageUrl.startsWith("/")) {
    return `${API_URL}${imageUrl}`
  }

  return `${API_URL}/${imageUrl}`
}

function getProductImage(product) {
  return (
    normalizeImageUrl(product?.image) ||
    normalizeImageUrl(product?.thumbnail) ||
    normalizeImageUrl(product?.images?.[0]) ||
    normalizeImageUrl(product?.gallery?.[0]) ||
    null
  )
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart()

  const image = getProductImage(product)

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "10px",
        overflow: "hidden",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Link
        to={`/product/${product.id}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <div
          style={{
            width: "100%",
            height: "260px",
            background: "#f3f3f3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px",
          }}
        >
          {image ? (
            <img
              src={image}
              alt={product.name}
              style={{
                height: "100%",
                width: "auto",
                maxWidth: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <div style={{ color: "#777" }}>Brak zdjęcia</div>
          )}
        </div>
      </Link>

      <div
        style={{
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flexGrow: 1,
        }}
      >
        <Link
          to={`/product/${product.id}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <h3
            style={{
              margin: "0",
              fontSize: "18px",
            }}
          >
            {product.name}
          </h3>
        </Link>

        <p
          style={{
            margin: 0,
            fontWeight: "bold",
          }}
        >
          {Number(product.price || 0).toFixed(2)} zł
        </p>

        <button
          onClick={() => addToCart(product)}
          style={{
            marginTop: "auto",
            padding: "10px",
            border: "none",
            borderRadius: "8px",
            background: "#000",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Dodaj do koszyka
        </button>
      </div>
    </div>
  )
}