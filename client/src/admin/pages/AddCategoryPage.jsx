import { useState } from "react";

export default function AddCategoryPage({ categories, onCreate, loading }) {
  const [name, setName] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    await onCreate({
      name: name.trim(),
    });

    setName("");
  }

  return (
    <div className="admin-content-card">
      <div className="admin-page-header">
        <div>
          <h1>Dodawanie kategorii</h1>
          <p>Dodaj nową kategorię do sklepu.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="admin-form admin-form-narrow">
        <div className="admin-field">
          <label>Nazwa kategorii</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Np. Buty"
            required
          />
        </div>

        <button className="admin-btn primary" type="submit" disabled={loading}>
          {loading ? "Dodawanie..." : "Dodaj kategorię"}
        </button>
      </form>

      <div className="admin-subsection">
        <h2>Obecne kategorie</h2>

        {!categories.length ? (
          <div className="admin-empty-state">Brak kategorii.</div>
        ) : (
          <div className="admin-category-list">
            {categories.map((category) => (
              <div key={category.id} className="admin-category-item">
                <strong>{category.name}</strong>
                <span>ID: {category.id}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
