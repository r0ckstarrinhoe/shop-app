import { useState } from "react";

export default function AddCategoryPage({
  categories,
  onCreate,
  onStartEdit,
  loading,
}) {
  const [name, setName] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) return;

    await onCreate({
      name: trimmedName,
    });

    setName("");
  }

  return (
    <div className="admin-content-card">
      <div className="admin-page-header">
        <div>
          <h1>Kategorie</h1>
          <p>Dodawaj nowe kategorie i edytuj istniejące w okienku.</p>
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

        <div className="admin-inline-actions">
          <button className="admin-btn primary" type="submit" disabled={loading}>
            {loading ? "Dodawanie..." : "Dodaj kategorię"}
          </button>
        </div>
      </form>

      <div className="admin-subsection">
        <h2>Obecne kategorie</h2>

        {!categories.length ? (
          <div className="admin-empty-state">Brak kategorii.</div>
        ) : (
          <div className="admin-category-list">
            {categories.map((category) => (
              <div key={category.id} className="admin-category-item">
                <div className="admin-category-main">
                  <strong>{category.name}</strong>
                  <span>ID: {category.id}</span>
                </div>

                <button
                  type="button"
                  className="admin-btn small"
                  onClick={() => onStartEdit(category)}
                >
                  Edytuj
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
