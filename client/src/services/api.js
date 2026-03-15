const API_URL = "http://localhost:3000"

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, options)

  const contentType = response.headers.get("content-type") || ""
  const isJson = contentType.includes("application/json")
  const data = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      data && typeof data === "object" && data.error
        ? data.error
        : "Wystąpił błąd podczas komunikacji z API"

    throw new Error(message)
  }

  return data
}

const getProducts = async () => {
  return request("/products")
}

const getAllProducts = async () => {
  return request("/products")
}

const getProduct = async (id) => {
  return request(`/products/${id}`)
}

const getProductById = async (id) => {
  return request(`/products/${id}`)
}

const getTrendingProducts = async () => {
  return request("/products/trending")
}

const getProductsByCategory = async (categoryId) => {
  return request(`/products/category/${categoryId}`)
}

const searchProducts = async (text) => {
  return request(`/products/search/${encodeURIComponent(text)}`)
}

const getCategories = async () => {
  return request("/categories")
}

const createProduct = async (formData, token) => {
  return request("/products", {
    method: "POST",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
    body: formData,
  })
}

const updateProduct = async (id, formData, token) => {
  return request(`/products/${id}`, {
    method: "PUT",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
    body: formData,
  })
}

const deleteProduct = async (id, token) => {
  return request(`/products/${id}`, {
    method: "DELETE",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  })
}

export {
  getProducts,
  getAllProducts,
  getProduct,
  getProductById,
  getTrendingProducts,
  getProductsByCategory,
  searchProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
}

export default {
  getProducts,
  getAllProducts,
  getProduct,
  getProductById,
  getTrendingProducts,
  getProductsByCategory,
  searchProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
}