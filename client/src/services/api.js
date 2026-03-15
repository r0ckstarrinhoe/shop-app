const API_URL = "http://localhost:3000";

function toAbsoluteImageUrl(value) {
  if (!value) return "";

  if (typeof value !== "string") return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/uploads/")) {
    return `${API_URL}${value}`;
  }

  if (value.startsWith("uploads/")) {
    return `${API_URL}/${value}`;
  }

  if (value.startsWith("/")) {
    return `${API_URL}${value}`;
  }

  return `${API_URL}/uploads/${value}`;
}

function extractImages(product) {
  const results = [];

  if (product?.image) {
    results.push(product.image);
  }

  if (product?.thumbnail) {
    results.push(product.thumbnail);
  }

  if (Array.isArray(product?.images)) {
    for (const item of product.images) {
      if (typeof item === "string") {
        results.push(item);
      } else if (item && typeof item === "object") {
        results.push(
          item.url ||
            item.path ||
            item.imageUrl ||
            item.src ||
            (item.filename ? `/uploads/${item.filename}` : "")
        );
      }
    }
  }

  if (Array.isArray(product?.gallery)) {
    for (const item of product.gallery) {
      if (typeof item === "string") {
        results.push(item);
      } else if (item && typeof item === "object") {
        results.push(
          item.url ||
            item.path ||
            item.imageUrl ||
            item.src ||
            (item.filename ? `/uploads/${item.filename}` : "")
        );
      }
    }
  }

  const normalized = results
    .map((item) => toAbsoluteImageUrl(item))
    .filter(Boolean);

  return [...new Set(normalized)];
}

function normalizeProduct(product) {
  const images = extractImages(product);
  const firstImage = images[0] || "";

  return {
    ...product,
    price: Number(product?.price || 0),
    trending: Boolean(product?.trending || product?.isTrending),
    isTrending: Boolean(product?.trending || product?.isTrending),
    images,
    image: firstImage,
    thumbnail: firstImage,
  };
}

function normalizeProductList(data) {
  if (Array.isArray(data)) {
    return data.map(normalizeProduct);
  }

  if (Array.isArray(data?.products)) {
    return data.products.map(normalizeProduct);
  }

  return [];
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Błąd pobierania danych.");
  }

  return data;
}

export async function getProducts() {
  const data = await fetchJson(`${API_URL}/products`);
  return normalizeProductList(data);
}

export async function getTrendingProducts() {
  const data = await fetchJson(`${API_URL}/products/trending`);
  return normalizeProductList(data);
}

export async function getProduct(id) {
  const data = await fetchJson(`${API_URL}/products/${id}`);
  return normalizeProduct(data);
}

export async function getCategories() {
  return await fetchJson(`${API_URL}/categories`);
}

export async function getProductsByCategory(id) {
  const data = await fetchJson(`${API_URL}/products/category/${id}`);
  return normalizeProductList(data);
}

export async function searchProducts(text) {
  const data = await fetchJson(`${API_URL}/products/search/${text}`);
  return normalizeProductList(data);
}