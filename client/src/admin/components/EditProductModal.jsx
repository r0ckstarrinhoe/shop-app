import { useEffect, useState } from "react";
import {
  getImageUrl,
  getProductCategoryId,
  getProductImages,
} from "../adminApi";

export default function EditProductModal({
  open,
  product,
  categories,
  loading,
  onClose,
  onSave,
}) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState([]);
  const [trending, setTrending] = useState(false);

  useEffect(() => {
    if (!product) return;

    setName(product.name || "");
    setCategoryId(getProductCategoryId(product));
    setDescription(product.description || "");
    setPrice(product.price != null ? String(product.price) : "");
    setImages([]);
    setTrending(Boolean(product.trending || product.isTrending));
  }, [product]);

  if (!open || !product) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    await onSave(product.id, {
      name: name.trim(),
      categoryId,
      description: description.trim(),
      price,
      images,
      trending,
    });
  }

  const productImages = getProductImages(product);

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2>Edytuj produkt</h2>
          <button type="button" className="admin-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-field">
            <label>Nazwa produktu</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="admin-field">
            <label>Kategoria</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="">Wybierz kategorię</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <label>Opis</label>
            <textarea
              rows="5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="admin-field">
            <label>Cena</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="admin-field">
            <label>Dodaj nowe zdjęcia</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImages(Array.from(e.target.files || []))}
            />
            <small>
              Możesz zostawić puste, jeśli nie chcesz dodawać nowych zdjęć.
            </small>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={trending}
              onChange={(e) => setTrending(e.target.checked)}
            />
            Produkt trendujący
          </label>

          {productImages.length > 0 ? (
            <div className="admin-field">
              <label>Obecne zdjęcia</label>
              <div className="admin-image-grid">
                {productImages.map((image, index) => {
                  const src = getImageUrl(image);

                  return (
                    <div className="admin-image-item" key={index}>
                      {src ? <img src={src} alt={`product-${index}`} /> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="admin-modal-actions">
            <button type="button" className="admin-btn ghost" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className="admin-btn primary" disabled={loading}>
              {loading ? "Zapisywanie..." : "Zapisz zmiany"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}