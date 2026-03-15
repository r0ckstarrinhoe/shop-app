import { createContext, useContext, useEffect, useMemo, useState } from "react";

const defaultCartContext = {
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  decreaseQuantity: () => {},
  clearCart: () => {},
  getCartCount: () => 0,
  getCartTotal: () => 0,
};

const CartContext = createContext(defaultCartContext);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Błąd odczytu koszyka z localStorage:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Błąd zapisu koszyka do localStorage:", error);
    }
  }, [cart]);

  function addToCart(product) {
    if (!product || !product.id) return;

    setCart((prevCart) => {
      const existingProduct = prevCart.find((item) => item.id === product.id);

      if (existingProduct) {
        return prevCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: (item.quantity || 1) + 1,
              }
            : item
        );
      }

      return [
        ...prevCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });
  }

  function removeFromCart(productId) {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  }

  function decreaseQuantity(productId) {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id !== productId) return item;

          return {
            ...item,
            quantity: (item.quantity || 1) - 1,
          };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function clearCart() {
    setCart([]);
  }

  function getCartCount() {
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  function getCartTotal() {
    return cart.reduce(
      (sum, item) => sum + Number(item.price || 0) * (item.quantity || 1),
      0
    );
  }

  const value = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      decreaseQuantity,
      clearCart,
      getCartCount,
      getCartTotal,
    }),
    [cart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext) || defaultCartContext;
}
