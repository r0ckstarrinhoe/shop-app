import { useState } from "react";

export default function AddProductPage({ categories, onCreate, loading }) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState([]);
  const [trending, setTrending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    await onCreate({
      name: name.trim(),
      categoryId,
      description: description.trim(),
      price,
      images,
      trending,
    });

    setName("");
    setCategoryId("");
    setDescription("");
    setPrice("");
    setImages([]);
    setTrending(false);
    e.target.reset();
  }

  return (
    <div className="admin-content-card">
      <div className="admin-page-header">
        <div>
          <h1>Dodawanie produktów</h1>
          <p>Dodaj nowy produkt do sklepu.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="admin-form admin-form-narrow">
        <div className="admin-field">
          <label>Nazwa produktu</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Np. Nike Air Max"
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
            placeholder="Opis produktu"
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
            placeholder="Np. 299.99"
            required
          />
        </div>

        <div className="admin-field">
          <label>Zdjęcia</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setImages(Array.from(e.target.files || []))}
            required
          />
          <small>Możesz wybrać wiele zdjęć naraz.</small>
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

        <button className="admin-btn primary" type="submit" disabled={loading}>
          {loading ? "Dodawanie..." : "Dodaj produkt"}
        </button>
      </form>
    </div>
  );
}