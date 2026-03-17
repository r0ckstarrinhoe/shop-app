import { useEffect, useState } from "react";
import {
  updateProduct,
  getProductImages,
  getImageUrl,
  getProductCategoryId,
} from "../adminApi";

export default function EditProductModal({
  product,
  categories = [],
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    isTrending: false,
    images: [],
    replaceImages: false,
  });

  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!product) return;

    setForm({
      name: product.name || "",
      description: product.description || "",
      price:
        product.price !== undefined && product.price !== null
          ? String(product.price)
          : "",
      categoryId: getProductCategoryId(product),
      isTrending: Boolean(product.isTrending),
      images: [],
      replaceImages: false,
    });

    setExistingImages(getProductImages(product));
    setError("");
  }, [product]);

  function handleChange(e) {
    const { name, value, type, checked, files } = e.target;

    if (type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: checked,
      }));
      return;
    }

    if (type === "file") {
      setForm((prev) => ({
        ...prev,
        images: Array.from(files || []),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!product?.id) return;

    setLoading(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: form.price,
        categoryId: form.categoryId,
        isTrending: Boolean(form.isTrending),
        images: form.images,
        replaceImages: Boolean(form.replaceImages),
      };

      const updated = await updateProduct(product.id, payload);

      if (onSaved) {
        await onSaved(updated);
      } else if (onClose) {
        onClose();
      }
    } catch (err) {
      setError(err.message || "Nie udało się zapisać produktu.");
    } finally {
      setLoading(false);
    }
  }

  if (!product) return null;

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal">
        <div className="admin-modal-header">
          <div>
            <h2>Edytuj produkt</h2>
            <p>Zmień dane produktu i zapisz zmiany.</p>
          </div>

          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        {error ? <div className="admin-error-box">{error}</div> : null}

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <label className="admin-form-field">
              <span>Nazwa produktu</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>

            <label className="admin-form-field">
              <span>Cena</span>
              <input
                type="number"
                name="price"
                step="0.01"
                min="0"
                value={form.price}
                onChange={handleChange}
                required
              />
            </label>

            <label className="admin-form-field">
              <span>Kategoria</span>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                required
              >
                <option value="">Wybierz kategorię</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-form-field admin-form-field-checkbox">
              <input
                type="checkbox"
                name="isTrending"
                checked={Boolean(form.isTrending)}
                onChange={handleChange}
              />
              <span>Produkt trendujący (manual)</span>
            </label>
          </div>

          <label className="admin-form-field">
            <span>Opis</span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              required
            />
          </label>

          {existingImages.length > 0 ? (
            <div className="admin-form-field">
              <span>Obecne zdjęcia</span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: "12px",
                  marginTop: "10px",
                }}
              >
                {existingImages.map((image, index) => (
                  <div
                    key={`${index}-${typeof image === "string" ? image : image?.filename || "img"}`}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      overflow: "hidden",
                      background: "#fff",
                    }}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`Zdjęcie ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "120px",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <label className="admin-form-field">
            <span>Nowe zdjęcia</span>
            <input
              type="file"
              name="images"
              multiple
              accept="image/*"
              onChange={handleChange}
            />
          </label>

          <label className="admin-form-field admin-form-field-checkbox">
            <input
              type="checkbox"
              name="replaceImages"
              checked={Boolean(form.replaceImages)}
              onChange={handleChange}
            />
            <span>Zastąp obecne zdjęcia nowymi</span>
          </label>

          {form.images.length > 0 ? (
            <div className="admin-form-field">
              <span>Wybrane pliki</span>
              <div className="admin-file-list">
                {form.images.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="admin-file-item">
                    {file.name}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="admin-form-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Zapisywanie..." : "Zapisz zmiany"}
            </button>

            <button
              type="button"
              className="admin-button-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}