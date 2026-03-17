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

export function normalizeDiscounts(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.discounts)) return data.discounts;
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
  if (hash === "discounts") return "discounts";
  if (hash === "add-discount") return "add-discount";
  if (hash === "trending-settings") return "trending-settings";

  return "products";
}

/* =========================
   AUTH
========================= */

export async function loginAdmin(email, password) {
  const data = await apiFetch("/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (data?.token) {
    setToken(data.token);
  }

  return data;
}

export async function registerAdmin(email, password) {
  return apiFetch("/admin/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
}

/* =========================
   CATEGORIES
========================= */

export async function getCategories() {
  return apiFetch("/categories");
}

export async function createCategory(name) {
  return apiFetch("/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
}

/* =========================
   PRODUCTS
========================= */

export async function getProducts() {
  return apiFetch("/products");
}

export async function getProduct(id) {
  return apiFetch(`/products/${id}`);
}

export async function deleteProduct(id) {
  return apiFetch(`/products/${id}`, {
    method: "DELETE",
  });
}

/* 
  KLUCZOWY FIX:
  wysyłamy isTrending jako "true"/"false" w FormData
*/
export async function createProduct(product) {
  const formData = new FormData();

  formData.append("name", product?.name ?? "");
  formData.append("description", product?.description ?? "");
  formData.append("price", String(product?.price ?? ""));
  formData.append("categoryId", String(product?.categoryId ?? ""));
  formData.append("isTrending", String(Boolean(product?.isTrending)));

  if (Array.isArray(product?.images)) {
    product.images.forEach((file) => {
      if (file instanceof File) {
        formData.append("images", file);
      }
    });
  }

  return apiFetch("/products", {
    method: "POST",
    body: formData,
  });
}

/* 
  KLUCZOWY FIX:
  wysyłamy isTrending jako "true"/"false" w FormData
*/
export async function updateProduct(id, product) {
  const formData = new FormData();

  if (product?.name !== undefined) {
    formData.append("name", product.name ?? "");
  }

  if (product?.description !== undefined) {
    formData.append("description", product.description ?? "");
  }

  if (product?.price !== undefined) {
    formData.append("price", String(product.price ?? ""));
  }

  if (product?.categoryId !== undefined) {
    formData.append("categoryId", String(product.categoryId ?? ""));
  }

  if (product?.isTrending !== undefined) {
    formData.append("isTrending", String(Boolean(product.isTrending)));
  }

  if (product?.replaceImages !== undefined) {
    formData.append("replaceImages", String(Boolean(product.replaceImages)));
  }

  if (Array.isArray(product?.images)) {
    product.images.forEach((file) => {
      if (file instanceof File) {
        formData.append("images", file);
      }
    });
  }

  return apiFetch(`/products/${id}`, {
    method: "PUT",
    body: formData,
  });
}

export async function getTrendingProducts() {
  return apiFetch("/products/trending");
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

/* =========================
   DISCOUNTS
========================= */

export async function getDiscounts() {
  return apiFetch("/discounts");
}

export async function getDiscount(id) {
  return apiFetch(`/discounts/${id}`);
}

export async function createDiscount(data) {
  return apiFetch("/discounts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function updateDiscount(id, data) {
  return apiFetch(`/discounts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function deleteDiscount(id) {
  return apiFetch(`/discounts/${id}`, {
    method: "DELETE",
  });
}

export async function validateDiscount(code, items) {
  return apiFetch("/discounts/validate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, items }),
  });
}