export default function DiscountsPage({
  discounts = [],
  products = [],
  categories = [],
  loading,
  error,
  onOpenCreate,
  onOpenEdit,
  onDelete,
}) {
  function getScopeLabel(discount) {
    if (discount.scope === "PRODUCT") {
      const product = products.find((p) => p.id === discount.productId);
      return product ? `Produkt: ${product.name}` : "Produkt";
    }

    if (discount.scope === "CATEGORY") {
      const category = categories.find((c) => c.id === discount.categoryId);
      return category ? `Kategoria: ${category.name}` : "Kategoria";
    }

    if (discount.scope === "GLOBAL") {
      return "Wszystkie produkty";
    }

    if (discount.scope === "CART") {
      return "Cały koszyk";
    }

    return "-";
  }

  function getValueLabel(discount) {
    if (discount.valueType === "PERCENT") {
      return `${Number(discount.value)}%`;
    }

    return `${Number(discount.value).toFixed(2)} zł`;
  }

  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("pl-PL");
  }

  function isDiscountInactive(discount) {
    const now = new Date();

    if (!discount.isActive) return true;

    if (discount.startsAt && new Date(discount.startsAt) > now) return true;
    if (discount.endsAt && new Date(discount.endsAt) < now) return true;

    if (
      discount.usageLimit !== null &&
      discount.usageLimit !== undefined &&
      Number(discount.usedCount) >= Number(discount.usageLimit)
    ) {
      return true;
    }

    return false;
  }

  return (
    <div className="admin-content-card">
      <div className="admin-page-header">
        <div>
          <h1>Rabaty</h1>
          <p>Tutaj możesz zarządzać kodami rabatowymi.</p>
        </div>

        <button type="button" className="admin-btn primary" onClick={onOpenCreate}>
          Dodaj rabat
        </button>
      </div>

      {error ? <div className="admin-error-box">{error}</div> : null}

      {loading ? (
        <div className="admin-empty-state">Ładowanie rabatów...</div>
      ) : !discounts.length ? (
        <div className="admin-empty-state">Brak rabatów.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Kod</th>
                <th>Zakres</th>
                <th>Typ</th>
                <th>Wartość</th>
                <th>Status</th>
                <th>Od</th>
                <th>Do</th>
                <th>Akcje</th>
                <th>Użycia</th>
              </tr>
            </thead>

            <tbody>
              {discounts.map((discount) => (
                <tr key={discount.id}>
                  <td>
                    <span className={isDiscountInactive(discount) ? "admin-text-strike" : ""}>
                      {discount.name}
                    </span>
                  </td>
                  <td>{discount.code || "-"}</td>
                  <td>{getScopeLabel(discount)}</td>
                  <td>{discount.valueType === "PERCENT" ? "Procent" : "Kwota"}</td>
                  <td>{getValueLabel(discount)}</td>
                  <td>
                    {discount.isActive ? (
                      <span className="admin-badge-success">Aktywny</span>
                    ) : (
                      <span className="admin-badge-muted">Nieaktywny</span>
                    )}
                  </td>
                  <td>{formatDate(discount.startsAt)}</td>
                  <td>{formatDate(discount.endsAt)}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        type="button"
                        className="admin-btn small"
                        onClick={() => onOpenEdit(discount)}
                      >
                        Edytuj
                      </button>

                      <button
                        type="button"
                        className="admin-btn danger small"
                        onClick={() => onDelete(discount.id)}
                      >
                        Usuń
                      </button>
                    </div>
                  </td>
                  <td>
                    {discount.usageLimit != null
                      ? `${discount.usedCount} / ${discount.usageLimit}`
                      : "bez limitu"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}