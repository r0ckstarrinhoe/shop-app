import { useEffect, useState } from "react";

const emptyForm = {
  name: "",
  code: "",
  scope: "GLOBAL",
  valueType: "PERCENT",
  value: "",
  productId: "",
  categoryId: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
  usageLimit: "",
};

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const pad = (num) => String(num).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function EditDiscountModal({
  open,
  discount,
  products = [],
  categories = [],
  loading,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!discount || !Object.keys(discount).length) {
      setForm(emptyForm);
      return;
    }

    setForm({
      name: discount.name || "",
      code: discount.code || "",
      scope: discount.scope || "GLOBAL",
      valueType: discount.valueType || "PERCENT",
      value:
        discount.value !== undefined && discount.value !== null
          ? String(discount.value)
          : "",
      productId: discount.productId ? String(discount.productId) : "",
      categoryId: discount.categoryId ? String(discount.categoryId) : "",
      startsAt: toDateTimeLocal(discount.startsAt),
      endsAt: toDateTimeLocal(discount.endsAt),
      isActive:
        discount.isActive !== undefined ? Boolean(discount.isActive) : true,
      usageLimit:
        discount.usageLimit !== undefined && discount.usageLimit !== null
          ? String(discount.usageLimit)
          : "",
    });
  }, [discount]);

  if (!open) return null;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      scope: form.scope,
      valueType: form.valueType,
      value: Number(form.value),
      productId: form.scope === "PRODUCT" ? Number(form.productId) : null,
      categoryId: form.scope === "CATEGORY" ? Number(form.categoryId) : null,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      isActive: Boolean(form.isActive),
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
    };

    if (discount?.id) {
      await onSave(discount.id, payload);
    } else {
      await onSave(payload);
    }
  }

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2>{discount?.id ? "Edytuj rabat" : "Dodaj rabat"}</h2>
          <button type="button" className="admin-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="admin-field">
            <label>Nazwa rabatu</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="admin-field">
            <label>Kod rabatowy</label>
            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="Np. SUMMER10"
              required
            />
          </div>

          <div className="admin-field">
            <label>Zakres rabatu</label>
            <select name="scope" value={form.scope} onChange={handleChange}>
              <option value="GLOBAL">Wszystkie produkty</option>
              <option value="PRODUCT">Konkretny produkt</option>
              <option value="CATEGORY">Kategoria</option>
            </select>
          </div>

          {form.scope === "PRODUCT" ? (
            <div className="admin-field">
              <label>Produkt</label>
              <select
                name="productId"
                value={form.productId}
                onChange={handleChange}
                required
              >
                <option value="">Wybierz produkt</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {form.scope === "CATEGORY" ? (
            <div className="admin-field">
              <label>Kategoria</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
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
          ) : null}

          <div className="admin-field">
            <label>Typ wartości</label>
            <select
              name="valueType"
              value={form.valueType}
              onChange={handleChange}
            >
              <option value="PERCENT">Procent</option>
              <option value="FIXED">Kwota</option>
            </select>
          </div>

          <div className="admin-field">
            <label>Wartość</label>
            <input
              type="number"
              name="value"
              min="0"
              step="0.01"
              value={form.value}
              onChange={handleChange}
              required
            />
          </div>

          <div className="admin-field">
            <label>Data startu</label>
            <input
              type="datetime-local"
              name="startsAt"
              value={form.startsAt}
              onChange={handleChange}
            />
          </div>

          <div className="admin-field">
            <label>Data końca</label>
            <input
              type="datetime-local"
              name="endsAt"
              value={form.endsAt}
              onChange={handleChange}
            />
          </div>

          <div className="admin-field">
            <label>Limit użyć (opcjonalny)</label>
            <input
              type="number"
              name="usageLimit"
              min="1"
              value={form.usageLimit}
              onChange={handleChange}
              placeholder="np. 100"
            />
          </div>

          <div className="admin-field">
            <div className="admin-checkbox-row">
              <input
                id="discountIsActive"
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
              />
              <label htmlFor="discountIsActive">Rabat aktywny</label>
            </div>
          </div>

          <div className="admin-modal-actions">
            <button type="button" className="admin-btn ghost" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className="admin-btn primary" disabled={loading}>
              {loading ? "Zapisywanie..." : "Zapisz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}