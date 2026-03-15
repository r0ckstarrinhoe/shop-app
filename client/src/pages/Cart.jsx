import { useCart } from "../context/CartContext";

export default function Cart() {
  const {
    cart,
    addToCart,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
  } = useCart();

  function getCartImage(product) {
    if (product?.image) return product.image;

    if (Array.isArray(product?.images) && product.images.length > 0) {
      const firstImage = product.images[0];

      if (typeof firstImage === "string") {
        return firstImage;
      }

      if (firstImage && typeof firstImage === "object") {
        return (
          firstImage.url ||
          firstImage.path ||
          firstImage.imageUrl ||
          firstImage.src ||
          (firstImage.filename
            ? `http://localhost:3000/uploads/${firstImage.filename}`
            : "")
        );
      }
    }

    if (Array.isArray(product?.gallery) && product.gallery.length > 0) {
      const firstImage = product.gallery[0];

      if (typeof firstImage === "string") {
        return firstImage;
      }

      if (firstImage && typeof firstImage === "object") {
        return (
          firstImage.url ||
          firstImage.path ||
          firstImage.imageUrl ||
          firstImage.src ||
          (firstImage.filename
            ? `http://localhost:3000/uploads/${firstImage.filename}`
            : "")
        );
      }
    }

    return "";
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ marginBottom: "20px" }}>Koszyk</h1>

      {!cart.length ? (
        <p>Koszyk jest pusty.</p>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {cart.map((product) => {
              const image = getCartImage(product);

              return (
                <div
                  key={product.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr auto",
                    gap: "20px",
                    alignItems: "center",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    padding: "16px",
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      width: "120px",
                      height: "120px",
                      background: "#f3f3f3",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      padding: "8px",
                    }}
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <div style={{ color: "#777", fontSize: "14px" }}>
                        Brak zdjęcia
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 style={{ margin: "0 0 10px 0" }}>{product.name}</h3>
                    <p style={{ margin: "0 0 8px 0" }}>
                      Cena: {Number(product.price || 0).toFixed(2)} zł
                    </p>
                    <p style={{ margin: 0 }}>Ilość: {product.quantity || 1}</p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      minWidth: "140px",
                    }}
                  >
                    <button
                      onClick={() => addToCart(product)}
                      style={{
                        padding: "10px",
                        border: "none",
                        borderRadius: "8px",
                        background: "#000",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>

                    <button
                      onClick={() => decreaseQuantity(product.id)}
                      style={{
                        padding: "10px",
                        border: "none",
                        borderRadius: "8px",
                        background: "#666",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      -
                    </button>

                    <button
                      onClick={() => removeFromCart(product.id)}
                      style={{
                        padding: "10px",
                        border: "none",
                        borderRadius: "8px",
                        background: "#c62828",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: "30px",
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "12px",
              background: "#fff",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              Razem: {Number(getCartTotal()).toFixed(2)} zł
            </h2>

            <button
              onClick={clearCart}
              style={{
                padding: "12px 18px",
                border: "none",
                borderRadius: "8px",
                background: "#c62828",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Wyczyść koszyk
            </button>
          </div>
        </>
      )}
    </div>
  );
}