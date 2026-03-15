import { useEffect, useState } from "react";

export default function EditCategoryModal({
  open,
  category,
  loading,
  onClose,
  onSave,
}) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (!category) return;
    setName(category.name || "");
  }, [category]);

  if (!open || !category) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) return;

    await onSave(category.id, { name: trimmedName });
  }

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal admin-modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2>Edytuj kategorię</h2>
          <button type="button" className="admin-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
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
