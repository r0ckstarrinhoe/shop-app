const API_URL = "http://localhost:3000";

export function getToken() {
  return localStorage.getItem("admin_token") || "";
}

export function setToken(token) {
  localStorage.setItem("admin_token", token);
}

export function removeToken() {
  localStorage.removeItem("admin_token");
}

export async function apiFetch(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  let data;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      (typeof data === "object" &&
        (data?.message || data?.error || JSON.stringify(data))) ||
      (typeof data === "string" && data) ||
      `Błąd ${response.status}`;

    throw new Error(message);
  }

  return data;
}

export function normalizeCategories(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.categories)) return data.categories;
  return [];
}

export function normalizeProducts(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  return [];
}

export function normalizeOrders(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.orders)) return data.orders;
  return [];
}

export function getProductCategoryId(product) {
  return String(
    product?.categoryId ||
      product?.category_id ||
      product?.category?.id ||
      ""
  );
}

export function getProductCategoryName(product) {
  return (
    product?.category?.name ||
    product?.categoryName ||
    product?.category_name ||
    "-"
  );
}

export function getProductImages(product) {
  if (Array.isArray(product?.imageObjects)) return product.imageObjects;
  if (Array.isArray(product?.images)) return product.images;
  if (Array.isArray(product?.productImages)) return product.productImages;
  if (Array.isArray(product?.gallery)) return product.gallery;
  return [];
}

export function getImageUrl(image) {
  if (!image) return "";

  if (typeof image === "string") {
    if (image.startsWith("http")) return image;
    if (image.startsWith("/")) return `${API_URL}${image}`;
    if (image.startsWith("uploads/")) return `${API_URL}/${image}`;
    return `${API_URL}/uploads/${image}`;
  }

  const value =
    image.url ||
    image.path ||
    image.imageUrl ||
    image.filename ||
    image.src ||
    "";

  if (!value) return "";
  if (value.startsWith("http")) return value;
  if (value.startsWith("/")) return `${API_URL}${value}`;
  if (value.startsWith("uploads/")) return `${API_URL}/${value}`;
  return `${API_URL}/uploads/${value}`;
}

export function formatPrice(price) {
  return `${Number(price || 0).toFixed(2)} zł`;
}

export function getInitialSection() {
  const hash = window.location.hash.replace("#", "");

  if (hash === "products") return "products";
  if (hash === "add-product") return "add-product";
  if (hash === "add-category") return "add-category";
  if (hash === "orders") return "orders";

  return "products";
}

/* =========================
   TRENDING SETTINGS
========================= */

export async function getTrendingSettings() {
  return apiFetch("/trending-settings");
}

export async function updateTrendingSettings(data) {
  return apiFetch("/trending-settings", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}