const API_URL = "http://localhost:3000";

export async function getProducts() {
  const response = await fetch(`${API_URL}/products`);
  if (!response.ok) {
    throw new Error("Nie udało się pobrać produktów");
  }
  return response.json();
}

export async function getProduct(id) {
  const response = await fetch(`${API_URL}/products/${id}`);
  if (!response.ok) {
    throw new Error("Nie udało się pobrać produktu");
  }
  return response.json();
}

export async function getCategories() {
  const response = await fetch(`${API_URL}/categories`);
  if (!response.ok) {
    throw new Error("Nie udało się pobrać kategorii");
  }
  return response.json();
}

export async function getProductsByCategory(categoryId) {
  const response = await fetch(`${API_URL}/products/category/${categoryId}`);
  if (!response.ok) {
    throw new Error("Nie udało się pobrać produktów z kategorii");
  }
  return response.json();
}

export async function getTrendingProducts() {
  const response = await fetch(`${API_URL}/products/trending`);
  if (!response.ok) {
    throw new Error("Nie udało się pobrać trendujących produktów");
  }
  return response.json();
}