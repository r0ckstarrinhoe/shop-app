import { formatPrice } from "../adminApi";

export default function OrdersPage({ orders, loading, endpointError }) {
  return (
    <div className="admin-content-card">
      <div className="admin-page-header">
        <div>
          <h1>Lista zamówień</h1>
          <p>Podgląd zamówień w sklepie.</p>
        </div>
      </div>

      {loading ? (
        <div className="admin-empty-state">Ładowanie zamówień...</div>
      ) : endpointError ? (
        <div className="admin-empty-state">{endpointError}</div>
      ) : !orders.length ? (
        <div className="admin-empty-state">Brak zamówień.</div>
      ) : (
        <div className="admin-orders-list">
          {orders.map((order) => (
            <div key={order.id} className="admin-order-card">
              <div className="admin-order-row">
                <strong>Zamówienie #{order.id}</strong>
                <span>{order.status || "Brak statusu"}</span>
              </div>

              <div className="admin-order-meta">
                <span>
                  Klient: {order.customerName || order.name || order.email || "-"}
                </span>
                <span>
                  Kwota: {formatPrice(order.total || order.totalPrice || 0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
