const API_URL = "http://localhost:3000";

export function toAbsoluteImageUrl(value) {
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

export function extractImageList(product) {
  const candidates = [];

  if (product?.image) {
    candidates.push(product.image);
  }

  if (product?.thumbnail) {
    candidates.push(product.thumbnail);
  }

  if (Array.isArray(product?.images)) {
    for (const item of product.images) {
      if (typeof item === "string") {
        candidates.push(item);
      } else if (item && typeof item === "object") {
        candidates.push(
          item.url ||
            item.path ||
            item.imageUrl ||
            item.src ||
            item.filename ||
            ""
        );
      }
    }
  }

  if (Array.isArray(product?.imageObjects)) {
    for (const item of product.imageObjects) {
      if (typeof item === "string") {
        candidates.push(item);
      } else if (item && typeof item === "object") {
        candidates.push(
          item.url ||
            item.path ||
            item.imageUrl ||
            item.src ||
            item.filename ||
            ""
        );
      }
    }
  }

  if (Array.isArray(product?.gallery)) {
    for (const item of product.gallery) {
      if (typeof item === "string") {
        candidates.push(item);
      } else if (item && typeof item === "object") {
        candidates.push(
          item.url ||
            item.path ||
            item.imageUrl ||
            item.src ||
            item.filename ||
            ""
        );
      }
    }
  }

  const normalized = candidates
    .map((item) => toAbsoluteImageUrl(item))
    .filter(Boolean);

  return [...new Set(normalized)];
}

export function normalizeProduct(product) {
  const imageList = extractImageList(product);
  const firstImage = imageList[0] || "";

  return {
    ...product,
    id: product?.id ?? "",
    name: product?.name || product?.title || "",
    description: product?.description || "",
    price: Number(product?.price || 0),
    categoryId:
      product?.categoryId ||
      product?.category_id ||
      product?.category?.id ||
      "",
    categoryName:
      product?.categoryName ||
      product?.category_name ||
      product?.category?.name ||
      "",
    trending: Boolean(product?.trending || product?.isTrending),
    isTrending: Boolean(product?.trending || product?.isTrending),
    image: firstImage,
    thumbnail: firstImage,
    images: imageList,
    gallery: imageList,
  };
}

export function normalizeProductList(data) {
  if (Array.isArray(data)) {
    return data.map(normalizeProduct);
  }

  if (Array.isArray(data?.products)) {
    return data.products.map(normalizeProduct);
  }

  return [];
}
