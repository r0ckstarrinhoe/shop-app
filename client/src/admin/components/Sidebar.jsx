export default function Sidebar({ currentSection, onChangeSection, onLogout }) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <h2>Shop App</h2>
        <p>Panel administratora</p>
      </div>

      <nav className="admin-sidebar-nav">
        <button
          type="button"
          className={`admin-sidebar-link ${
            currentSection === "products" ? "active" : ""
          }`}
          onClick={() => onChangeSection("products")}
        >
          Lista produktów
        </button>

        <button
          type="button"
          className={`admin-sidebar-link ${
            currentSection === "add-product" ? "active" : ""
          }`}
          onClick={() => onChangeSection("add-product")}
        >
          Dodawanie produktów
        </button>

        <button
          type="button"
          className={`admin-sidebar-link ${
            currentSection === "add-category" ? "active" : ""
          }`}
          onClick={() => onChangeSection("add-category")}
        >
          Dodawanie kategorii
        </button>

        <button
          type="button"
          className={`admin-sidebar-link ${
            currentSection === "orders" ? "active" : ""
          }`}
          onClick={() => onChangeSection("orders")}
        >
          Lista zamówień
        </button>
      </nav>

      <div className="admin-sidebar-footer">
        <a href="/" className="admin-btn ghost">
          Przejdź do sklepu
        </a>
        <button type="button" className="admin-btn danger" onClick={onLogout}>
          Wyloguj
        </button>
      </div>
    </aside>
  );
}
